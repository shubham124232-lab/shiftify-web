"use client";

// Last-Minute Support journey — support needed over 4 hours and up to 48 hours. Authoritative
// documents per role:
//   Participant → Participant Posting Journeys L-01..L-12
//   Coordinator → SC Journey SC-P00..P02 (participant + authority first) then SC-L01..L12
//                 (separate "Worker or provider" screen, coordinator notification choices)
//   Provider    → Provider Journey PR-L01 (shift date/time, reason for cover, flexible time,
//                 essential requirements, response deadline) + PR-C01 confirmation

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  WizardScreen, RadioCards, PersonStep, ProviderRateStep, ProviderLocationExtras, ProviderSafetyExtras, ProviderVisibilityPreview, applyProviderContext, providerRateSummary, CategoryPickerStep, TasksStep, SafetyStep, RequirementsStep, FundingStep,
  ReviewRow, LiveRequestScreen, CheckboxRow, AddressReleaseNotice, ShiftPassPrompt, inp, lbl,
  buildWorkerPreferencesPayload, buildSafetyFlagsPayload, buildFundingPayload, buildSelectedTasksPayload,
  audienceOf, locationOptions, applyPerson, requirementsSummary, safetySummary, fundingSummary,
  hasRequirementsChoice, hasSafetyChoice, fundingChoiceError, providerContextError, ProviderAuthorityConfirm, ProviderDeadlineField,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  EMPTY_PERSON, EMPTY_CATALOGUE, EMPTY_REQUIREMENTS, EMPTY_SAFETY, EMPTY_FUNDING, EMPTY_PROVIDER_CONTEXT, type ProviderContext,
  type PersonReceivingSupport, type CatalogueSelection, type WorkerRequirements, type SafetyChecklist, type FundingChoice,
} from "@/lib/types/posting";
import { saveGuestDraft, loadGuestDraft, loadResumableDraft, clearGuestDraft, loadGuestRole, type GuestPostingRole } from "@/lib/store/guestJobDraft";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

type StepKey = "when" | "person" | "service" | "tasks" | "location" | "schedule" | "worker" | "requirements" | "safety" | "funding" | "updates" | "review";
const PARTICIPANT_KEYS: StepKey[] = ["when", "person", "service", "tasks", "location", "schedule", "requirements", "safety", "funding", "updates", "review"];
// SC-P00/P01 first; SC-L06 is its own "Worker or provider" screen; Provider PR-L01 has no contact-updates screen.
const COORDINATOR_KEYS: StepKey[] = ["person", "when", "service", "tasks", "location", "schedule", "worker", "requirements", "safety", "funding", "updates", "review"];
const PROVIDER_KEYS: StepKey[] = ["when", "person", "service", "tasks", "location", "schedule", "requirements", "safety", "funding", "review"];

type TimingOption = "TODAY" | "TOMORROW" | "WITHIN_48H" | "CHOOSE";
type FlexMode = "EXACT" | "SLIGHT" | "PROPOSE";
const SHORT_NOTICE_REASONS = ["Cancellation", "Roster gap", "Appointment/change", "Family/carer unavailable", "Discharge/transition", "New need", "Other"];
const PARTICIPANT_UPDATE_METHODS = ["Shiftify notifications", "SMS", "Email", "Contact the person posting this request", "Contact an authorised representative"];
const COORDINATOR_UPDATE_METHODS = ["In-app notification", "SMS", "Email", "Notify participant as well", "Notify authorised representative"];
const COORDINATOR_OWN_METHODS = ["In-app notification", "SMS", "Email"];
const REP_METHODS = ["Contact an authorised representative", "Notify authorised representative"];

function localDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function LastMinuteJourney() {
  const router = useRouter();
  const { activeRole, isAuth } = useAuth();
  const [guestRole, setGuestRole] = useState<GuestPostingRole | null>(null);
  const isCoordinator = activeRole === "COORDINATOR" || (!isAuth && guestRole === "COORDINATOR");
  const isProvider = activeRole === "PROVIDER";
  const audience = audienceOf(isCoordinator, isProvider);
  const keys = isCoordinator ? COORDINATOR_KEYS : isProvider ? PROVIDER_KEYS : PARTICIPANT_KEYS;
  const TOTAL_STEPS = keys.length;
  const [step, setStep] = useState(0);
  const key = keys[Math.min(step, keys.length - 1)];
  const goTo = (k: StepKey) => setStep(keys.indexOf(k));
  const [error, setError] = useState<string | null>(null);
  const [shiftPassBlocked, setShiftPassBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean; verificationRequired?: boolean } | null>(null);

  const [timingOption, setTimingOption] = useState<TimingOption>("TODAY");
  const [startDateTime, setStartDateTime] = useState("");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [locationType, setLocationType] = useState<string>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [travelDetails, setTravelDetails] = useState("");
  const [durationHours, setDurationHours] = useState("2");
  const [endTime, setEndTime] = useState("");
  const [flexible, setFlexible] = useState(false);
  const [flexWindow, setFlexWindow] = useState("");
  const [flexMode, setFlexMode] = useState<FlexMode>("EXACT");
  const [requirements, setRequirements] = useState<WorkerRequirements>(EMPTY_REQUIREMENTS);
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
  const [providerCtx, setProviderCtx] = useState<ProviderContext>(EMPTY_PROVIDER_CONTEXT);
  const patchProviderCtx = (p: Partial<ProviderContext>) => setProviderCtx((c) => ({ ...c, ...p }));
  const [updateMethods, setUpdateMethods] = useState<string[]>([]);
  const [repName, setRepName] = useState("");
  const [repContact, setRepContact] = useState("");
  const [agreeShare, setAgreeShare] = useState(false);
  const [postingAuthorityConfirmed, setPostingAuthorityConfirmed] = useState(false);

  function patch<T>(setter: (v: T) => void, current: T) {
    return (p: Partial<T>) => setter({ ...current, ...p });
  }
  function toggleUpdateMethod(m: string) {
    setUpdateMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }
  function chooseTiming(o: TimingOption) {
    setTimingOption(o);
    // Today / Tomorrow fix the date; only the time of day is then chosen.
    if (o === "TODAY" || o === "TOMORROW") {
      const time = startDateTime.slice(11, 16);
      setStartDateTime(time ? `${localDate(o === "TODAY" ? 0 : 1)}T${time}` : "");
    }
  }

  useEffect(() => {
    if (!isAuth) setGuestRole(loadGuestRole());
    const d = (isAuth ? loadResumableDraft("LAST_MINUTE", activeRole) : loadGuestDraft("LAST_MINUTE")) as Record<string, unknown> | null;
    if (!d) return;
    if (d.timingOption) setTimingOption(d.timingOption as TimingOption);
    if (typeof d.startDateTime === "string") setStartDateTime(d.startDateTime);
    if (d.person) setPerson(d.person as PersonReceivingSupport);
    if (d.catalogue) setCatalogue(d.catalogue as CatalogueSelection);
    if (typeof d.reason === "string") setReason(d.reason);
    if (typeof d.note === "string") setNote(d.note);
    if (typeof d.locationType === "string") setLocationType(d.locationType);
    if (typeof d.suburb === "string") setSuburb(d.suburb);
    if (typeof d.state === "string") setState(d.state);
    if (typeof d.postcode === "string") setPostcode(d.postcode);
    if (typeof d.addressLine === "string") setAddressLine(d.addressLine);
    if (typeof d.travelDetails === "string") setTravelDetails(d.travelDetails);
    if (typeof d.durationHours === "string") setDurationHours(d.durationHours);
    if (typeof d.endTime === "string") setEndTime(d.endTime);
    if (typeof d.flexible === "boolean") setFlexible(d.flexible);
    if (typeof d.flexWindow === "string") setFlexWindow(d.flexWindow);
    if (d.flexMode) setFlexMode(d.flexMode as FlexMode);
    if (d.requirements) setRequirements(d.requirements as WorkerRequirements);
    if (d.safety) setSafety(d.safety as SafetyChecklist);
    if (d.funding) setFunding(d.funding as FundingChoice);
    if (Array.isArray(d.updateMethods)) setUpdateMethods(d.updateMethods as string[]);
    if (typeof d.repName === "string") setRepName(d.repName);
    if (typeof d.repContact === "string") setRepContact(d.repContact);
    if (typeof d.agreeShare === "boolean") setAgreeShare(d.agreeShare);
    if (typeof d.postingAuthorityConfirmed === "boolean") setPostingAuthorityConfirmed(d.postingAuthorityConfirmed);
    if (typeof d.step === "number") setStep(d.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  // End time (SC-L05 "End time or duration") overrides the duration when given.
  function resolveEnd(): { end: Date; hours: number } {
    const start = new Date(startDateTime);
    if (isCoordinator && endTime) {
      const end = new Date(`${startDateTime.slice(0, 10)}T${endTime}`);
      if (end.getTime() > start.getTime()) return { end, hours: Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100 };
    }
    const hours = parseFloat(durationHours || "1");
    return { end: new Date(start.getTime() + hours * 3600000), hours };
  }

  function validate(): string | null {
    if (key === "when" && !startDateTime) return "Choose a date and start time within the next 48 hours.";
    if (key === "when" || key === "schedule") {
      const m = (new Date(startDateTime).getTime() - Date.now()) / 60000;
      if (!startDateTime) return "Date, start time and duration are required.";
      if (m < -1) return "Choose a start time from now onwards.";
      if (m <= 240) return "Last-Minute Support starts more than 4 hours from now. For sooner support, post an Urgent or Rapid request.";
      if (m > 48 * 60) return "Last-Minute Support must start within 48 hours. For a later start, post a Routine request.";
    }
    if (key === "schedule" && !(isCoordinator && endTime) && !(parseFloat(durationHours) > 0)) return isCoordinator ? "Enter an end time or a duration." : "Date, start time and duration are required.";
    if (key === "schedule" && isCoordinator && endTime && new Date(`${startDateTime.slice(0, 10)}T${endTime}`).getTime() <= new Date(startDateTime).getTime()) return "The end time must be after the start time.";
    if (key === "person" && isCoordinator && person.who !== "SOMEONE_ELSE" && person.who !== "EXISTING_PARTICIPANT") return "Select who this request is for.";
    if (key === "person" && isCoordinator && person.who === "EXISTING_PARTICIPANT" && !person.existingParticipantId) return "Select a participant.";
    if (key === "person" && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (key === "person" && isCoordinator && person.who === "EXISTING_PARTICIPANT" && person.existingParticipantIsConnection && !postingAuthorityConfirmed) return "Confirm you're authorised to post for this participant.";
    if (key === "service" && !catalogue.categoryId) return "Select a support category.";
    if (key === "tasks" && catalogue.tasks.length === 0) return "Select at least one task.";
    if (key === "location" && !suburb.trim()) return "Suburb/postcode is required.";
    if (key === "worker" && !requirements.workerOrProvider) return "Choose whether a support worker, a provider organisation, or either would be suitable.";
    if (key === "requirements" && audience === "PARTICIPANT" && !requirements.workerOrProvider) return "Choose whether you'd like an independent worker, a provider, or either.";
    if (key === "requirements" && audience === "COORDINATOR" && !hasRequirementsChoice(requirements)) return "Select what is essential, or choose No additional requirement.";
    if (key === "safety" && audience !== "PROVIDER" && !hasSafetyChoice(safety)) return "Select any essential safety information, or choose No special safety information.";
    if (key === "funding" && audience !== "PROVIDER") { const e = fundingChoiceError(funding); if (e) return e; }
    if (key === "funding" && audience === "PROVIDER" && funding.rateChoice === "OFFERED_RATE" && !(parseFloat(funding.offeredRate) > 0)) return "Enter the offered hourly rate.";
    if (key === "updates" && isCoordinator && !updateMethods.some((m) => COORDINATOR_OWN_METHODS.includes(m))) return "Select at least one way for you to receive updates (in-app, SMS or email).";
    if (key === "updates" && !isCoordinator && updateMethods.length === 0) return "Select at least one update method.";
    if (key === "review" && isProvider && !postingAuthorityConfirmed) return "Confirm you're authorised to post this request for your organisation.";
    if (key === "review" && isProvider) { const e = providerContextError(providerCtx, startDateTime ? new Date(startDateTime).toISOString() : null); if (e) return e; }
    if (key === "review" && !agreeShare) return "Please confirm the information-sharing acknowledgement.";
    return null;
  }

  function draftState(atStep: number) {
    return {
      timingOption, startDateTime, person, catalogue, reason, note, locationType, suburb, state, postcode,
      addressLine, travelDetails, durationHours, endTime, flexible, flexWindow, flexMode, requirements, safety, funding,
      updateMethods, repName, repContact, agreeShare, postingAuthorityConfirmed, step: atStep,
    };
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === TOTAL_STEPS - 1) { void submitCommon(false); return; }
    const nextStep = step + 1;
    if (!isAuth) saveGuestDraft("LAST_MINUTE", guestRole ?? "PARTICIPANT", draftState(nextStep));
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    const prevStep = Math.max(0, step - 1);
    if (!isAuth) saveGuestDraft("LAST_MINUTE", guestRole ?? "PARTICIPANT", draftState(prevStep));
    setStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitCommon(asDraft: boolean) {
    if (!isAuth) {
      saveGuestDraft("LAST_MINUTE", guestRole ?? "PARTICIPANT", draftState(step));
      router.push("/register");
      return;
    }
    setSaving(true); setError(null); setShiftPassBlocked(false);
    try {
      const start = new Date(startDateTime);
      const { end, hours } = resolveEnd();
      const category = getCatalogueCategory(catalogue.categoryId);
      const timeFlexibility = isCoordinator
        ? (flexMode === "SLIGHT" ? "FLEXIBLE_SLIGHT" : flexMode === "PROPOSE" ? "DISCUSS" : "EXACT")
        : (flexible ? (flexWindow || "FLEXIBLE_SLIGHT") : "EXACT");

      const body: Record<string, unknown> = {
        title: `${category?.label ?? "Support"} — Last-Minute Support`,
        description: note.trim() || `Last-Minute support request: ${category?.label ?? ""}`,
        category: catalogue.categoryId,
        urgency: "LAST_MINUTE",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours: hours,
        timeFlexibility,
        requestPurposeCategory: reason || undefined,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: travelDetails.trim() || undefined,
        selectedTasks: buildSelectedTasksPayload(catalogue),
        workerPreferences: buildWorkerPreferencesPayload(requirements),
        visibilityTarget: requirements.workerOrProvider === "WORKER" ? "WORKERS_ONLY" : requirements.workerOrProvider === "PROVIDER" ? "PROVIDERS_ONLY" : "ALL",
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        contactPreferences: !isProvider && updateMethods.length ? { updateMethods, repName: repName || undefined, repContact: repContact || undefined } : undefined,
        asDraft,
      };
      applyPerson(body, person, suburb, audience);
      const res = await api.post<{ job: { id: string; status?: string } }>("/jobs", isProvider ? applyProviderContext(body, providerCtx) : body, { timeout: 45_000 });
      clearGuestDraft();
      // PR-R06 — the server saves a Provider request as a draft when minimum verification is incomplete.
      const heldForVerification = !asDraft && res.job.status === "DRAFT";
      setSubmitted({ id: res.job.id, isDraft: asDraft || heldForVerification, verificationRequired: heldForVerification });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_LIMIT") {
        setShiftPassBlocked(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to post request.");
      }
    } finally { setSaving(false); }
  }

  if (submitted) return <LiveRequestScreen tier="LAST_MINUTE" tierLabel="Last-Minute Support" jobId={submitted.id} isDraft={submitted.isDraft} verificationRequired={submitted.verificationRequired} audience={isProvider ? "PROVIDER" : isCoordinator ? "COORDINATOR" : undefined} />;

  const category = getCatalogueCategory(catalogue.categoryId);
  const titles: Record<StepKey, string> = {
    when: "When is support needed?",
    person: isCoordinator ? "Who is this support request for?" : isProvider ? "Staffing request for your organisation" : "Who needs this Last-Minute Support?",
    service: "What support is needed?",
    tasks: "What help is needed?",
    location: isCoordinator ? "Where will support take place?" : "Where will support take place?",
    schedule: "Confirm the schedule",
    worker: "Who would be suitable?",
    requirements: isCoordinator ? "What is essential for a suitable match?" : "Who would be suitable?",
    safety: "What should suitable workers/providers know?",
    funding: isProvider ? "Rate and engagement" : "How will this support be paid for?",
    updates: isCoordinator ? "How would you like to receive updates?" : "How would you like updates?",
    review: isCoordinator ? "Check the Last-Minute Support request" : "Check your Last-Minute Support request",
  };
  const nextLabel =
    key === "updates" ? "Review Last-Minute request"
    : key === "funding" && isProvider ? "Review Last-Minute request"
    : key === "review" ? (isAuth ? (isProvider ? "Publish request" : "Post Last-Minute request" + (isCoordinator ? "" : " — Free")) : "Sign up to post this request")
    : "Continue";
  const updateMethodList = isCoordinator ? COORDINATOR_UPDATE_METHODS : PARTICIPANT_UPDATE_METHODS;
  const timingOptions: { v: TimingOption; l: string }[] = isCoordinator
    ? [{ v: "TODAY", l: "Today — more than 4 hours away" }, { v: "TOMORROW", l: "Tomorrow" }, { v: "WITHIN_48H", l: "Within the next 48 hours" }, { v: "CHOOSE", l: "Select date and start time" }]
    : [{ v: "TODAY", l: "Today" }, { v: "TOMORROW", l: "Tomorrow" }, { v: "CHOOSE", l: "Choose date/time within the next 48 hours" }];
  const fixedDate = timingOption === "TODAY" || timingOption === "TOMORROW";
  const scheduleSummary = startDateTime
    ? `${new Date(startDateTime).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} · ${isCoordinator && endTime ? `until ${endTime}` : `${durationHours} hours`}`
    : "";
  const personLabel = isProvider ? "Your organisation" : (person.who === "EXISTING_PARTICIPANT" ? person.existingParticipantName : person.someoneElseName) || "Not selected";
  const workerTypeLabel = requirements.workerOrProvider === "WORKER" ? "Support worker" : requirements.workerOrProvider === "PROVIDER" ? "Provider organisation" : requirements.workerOrProvider === "EITHER" ? "Either" : "Not specified";

  return (
    <WizardScreen
      tierLabel="Last-Minute Support" screenTitle={titles[key]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next}
      belowError={shiftPassBlocked ? (
        <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); void submitCommon(false); }} onDismiss={() => setShiftPassBlocked(false)} />
      ) : undefined}
      nextLabel={nextLabel}
      saving={saving}
    >
      {key === "when" && (
        <div className="space-y-4">
          <label className={lbl}>When is support needed?</label>
          <RadioCards value={timingOption} onChange={chooseTiming} options={timingOptions} />
          {fixedDate ? (
            <div>
              <label className={lbl}>Start time</label>
              <input type="time" className={inp} value={startDateTime.slice(11, 16)}
                onChange={(e) => setStartDateTime(e.target.value ? `${localDate(timingOption === "TODAY" ? 0 : 1)}T${e.target.value}` : "")} />
            </div>
          ) : (
            <div>
              <label className={lbl}>Start time</label>
              <input type="datetime-local" className={inp} value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} />
            </div>
          )}
        </div>
      )}
      {key === "person" && (
        <PersonStep
          value={person} onChange={patch(setPerson, person)} tierLabel="Last-Minute Support" isCoordinator={isCoordinator} isProvider={isProvider} providerContext={providerCtx} onProviderContextChange={patchProviderCtx}
          authorityConfirmed={postingAuthorityConfirmed} onAuthorityChange={setPostingAuthorityConfirmed}
        />
      )}
      {key === "service" && (
        <CategoryPickerStep
          selectedIds={catalogue.categoryId ? [catalogue.categoryId] : []}
          onToggle={(id) => setCatalogue({ categoryId: id, tasks: [], otherTask: "", answers: {} })}
        />
      )}
      {key === "tasks" && (
        <div className="space-y-5">
          <TasksStep value={catalogue} onChange={patch(setCatalogue, catalogue)} />
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className={lbl}>{isProvider ? "Reason for cover (optional)" : isCoordinator ? "Reason for short notice (optional)" : "Reason (optional)"}</label>
            <div className="flex flex-wrap gap-2">
              {SHORT_NOTICE_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${reason === r ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{r}</button>
              ))}
            </div>
            <textarea className={`${inp} h-auto py-2`} rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={isCoordinator ? "What a suitable worker/provider should know — optional short description" : "Optional participant note (max 400 characters)"} />
          </div>
        </div>
      )}
      {key === "location" && (
        <div className="space-y-4">
          <label className={lbl}>Where will support take place?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={locationOptions(audience, "LAST_MINUTE")} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb/postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          {isProvider && <ProviderLocationExtras value={providerCtx} onChange={patchProviderCtx} />}
          <div><label className={lbl}>Private exact address</label><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div><label className={lbl}>{isCoordinator ? "Destination, one-way/return, vehicle or accessibility needs" : "Destination, travel distance, return trip or vehicle requirement"}</label><input className={inp} value={travelDetails} onChange={(e) => setTravelDetails(e.target.value)} /></div>
        </div>
      )}
      {key === "schedule" && (
        <div className="space-y-4">
          <div><label className={lbl}>Date *</label><input type="date" className={inp} value={startDateTime.slice(0, 10)} onChange={(e) => setStartDateTime(`${e.target.value}T${startDateTime.slice(11, 16) || "09:00"}`)} /></div>
          <div><label className={lbl}>Start time *</label><input type="time" className={inp} value={startDateTime.slice(11, 16)} onChange={(e) => setStartDateTime(`${startDateTime.slice(0, 10) || localDate(0)}T${e.target.value}`)} /></div>
          {isCoordinator && <div className="w-40"><label className={lbl}>End time</label><input type="time" className={inp} value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>}
          <div className="w-40">
            <label className={lbl}>{isCoordinator ? "Or duration (hours)" : "Duration (hours) *"}</label>
            <input type="number" min="0.5" step="0.5" className={inp} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} disabled={isCoordinator && !!endTime} />
          </div>
          {isCoordinator ? (
            <RadioCards value={flexMode} onChange={setFlexMode} options={[
              { v: "EXACT", l: "Exact time" }, { v: "SLIGHT", l: "Slightly flexible" }, { v: "PROPOSE", l: "Worker/provider may propose a nearby time" },
            ]} />
          ) : (
            <>
              <CheckboxRow checked={flexible} onChange={setFlexible} label={isProvider ? "Time is flexible" : "Flexible start time"} />
              {flexible && <div><label className={lbl}>Acceptable time window</label><input className={inp} value={flexWindow} onChange={(e) => setFlexWindow(e.target.value)} placeholder="e.g. 9am–11am" /></div>}
            </>
          )}
          {isProvider && <ProviderDeadlineField value={providerCtx} onChange={patchProviderCtx} label="Response deadline (optional)" />}
        </div>
      )}
      {key === "worker" && (
        <div className="space-y-5">
          <div>
            <label className={lbl}>Who would be suitable? *</label>
            <RadioCards value={requirements.workerOrProvider ?? undefined} onChange={(v) => setRequirements({ ...requirements, workerOrProvider: v })} options={[
              { v: "WORKER", l: "Support worker" }, { v: "PROVIDER", l: "Provider organisation" }, { v: "EITHER", l: "Either" },
            ]} />
          </div>
          <div>
            <RadioCards value={requirements.twoWorkers ? "TWO" : "ONE"} onChange={(v) => setRequirements({ ...requirements, twoWorkers: v === "TWO", ...(v === "TWO" ? { none: false } : {}) })} options={[
              { v: "ONE", l: "One person" }, { v: "TWO", l: "Two workers" },
            ]} />
          </div>
        </div>
      )}
      {key === "requirements" && (
        <RequirementsStep value={requirements} onChange={patch(setRequirements, requirements)} showWorkerChoice={!isCoordinator} audience={audience} keepWorkerType
          questionLabel={isCoordinator ? "What is essential for a suitable match?" : "Who would be suitable?"} genderLabel="Worker gender preference"
          languageLabel="Language/Auslan" qualificationLabel="Qualifications/training" />
      )}
      {key === "safety" && (<><SafetyStep value={safety} onChange={patch(setSafety, safety)} questionLabel="What should suitable workers/providers know?" audience={audience} />{isProvider && <ProviderSafetyExtras value={providerCtx} onChange={patchProviderCtx} />}</>)}
      {key === "funding" && (isProvider
        ? <ProviderRateStep value={funding} onChange={patch(setFunding, funding)} />
        : <FundingStep value={funding} onChange={patch(setFunding, funding)} audience={audience} />)}
      {key === "updates" && (
        <div className="space-y-4">
          <label className={lbl}>{titles.updates}</label>
          <div className="space-y-2">
            {updateMethodList.map((m) => (
              <CheckboxRow key={m} checked={updateMethods.includes(m)} onChange={() => toggleUpdateMethod(m)} label={m} />
            ))}
          </div>
          {updateMethods.some((m) => REP_METHODS.includes(m)) && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <input className={inp} value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Representative name" />
              <input className={inp} value={repContact} onChange={(e) => setRepContact(e.target.value)} placeholder="Mobile or email" />
            </div>
          )}
        </div>
      )}
      {key === "review" && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            {(isCoordinator || isProvider) && (
              <ReviewRow label={isProvider ? "Organisation and authority" : "Participant and authority"} value={personLabel} onEdit={() => goTo("person")} />
            )}
            <ReviewRow label="Schedule" value={scheduleSummary} onEdit={() => goTo("schedule")} />
            <ReviewRow label={isCoordinator ? "Service/tasks/context" : "Service/tasks"} value={`${category?.label ?? ""} — ${catalogue.tasks.join(", ")}`} onEdit={() => goTo("tasks")} />
            <ReviewRow label="Location/travel" value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} onEdit={() => goTo("location")} />
            {isCoordinator && <ReviewRow label="Worker or provider" value={`${workerTypeLabel}${requirements.twoWorkers ? " · two workers" : ""}`} onEdit={() => goTo("worker")} />}
            {isCoordinator ? (
              <ReviewRow label="Requirements/safety" value={`${requirementsSummary(requirements, audience)} | ${safetySummary(safety)}`} onEdit={() => goTo("requirements")} />
            ) : (
              <>
                <ReviewRow label="Worker requirements" value={requirementsSummary(requirements, audience)} onEdit={() => goTo("requirements")} />
                <ReviewRow label="Safety/support summary" value={safetySummary(safety)} onEdit={() => goTo("safety")} />
              </>
            )}
            <ReviewRow label={isProvider ? "Rate and engagement" : "Funding/rate"} value={isProvider ? providerRateSummary(funding) : fundingSummary(funding)} onEdit={() => goTo("funding")} />
            {!isProvider && <ReviewRow label={isCoordinator ? "Notification choices" : "Contact method"} value={updateMethods.join(", ")} onEdit={() => goTo("updates")} />}
          </div>
          {isProvider && <ProviderVisibilityPreview visible={["Service and essential tasks", "General location (suburb and state)", "Start time and duration", "Participant age group", "Rate and engagement", "Your organisation as the poster"]} />}
          <AddressReleaseNotice />
          {isProvider && <ProviderAuthorityConfirm checked={postingAuthorityConfirmed} onChange={setPostingAuthorityConfirmed} />}
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="Information-sharing acknowledgement — I agree the shown details can be shared with suitable workers/providers" />
          <div className="flex justify-end">
            <button type="button" onClick={() => void submitCommon(true)} className="text-xs text-brand-700 underline">{audience === "PARTICIPANT" ? "Save and finish later" : "Save draft"}</button>
          </div>
        </div>
      )}
    </WizardScreen>
  );
}
