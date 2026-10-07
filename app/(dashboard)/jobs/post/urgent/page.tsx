"use client";

// Urgent Support journey — support needed over 60 minutes and up to 4 hours. Authoritative
// documents per role:
//   Participant → Participant Posting Journeys U-01..U-11
//   Coordinator → SC Journey SC-P00..P02 (participant + authority first) then SC-U01..U10
//   Provider    → Provider Journey PR-U01 ("Rapid structure" + broader window, optional alternative
//                 times, four-hour deadline) + PR-C01 confirmation

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import {
  WizardScreen, RadioCards, PersonStep, ProviderRateStep, ProviderLocationExtras, ProviderSafetyExtras, ProviderVisibilityPreview, applyProviderContext, providerRateSummary, CategoryPickerStep, TasksStep, SafetyStep, RequirementsStep, FundingStep,
  ReviewRow, LiveRequestScreen, CheckboxRow, AddressReleaseNotice, ShiftPassPrompt, inp, lbl,
  buildWorkerPreferencesPayload, buildSafetyFlagsPayload, buildFundingPayload, buildSelectedTasksPayload,
  audienceOf, locationOptions, applyPerson, requirementsSummary, safetySummary, fundingSummary,
  hasRequirementsChoice, hasSafetyChoice, fundingChoiceError, providerContextError, ProviderAuthorityConfirm, ProviderAlternativeTimesField,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  EMPTY_PERSON, EMPTY_CATALOGUE, EMPTY_REQUIREMENTS, EMPTY_SAFETY, EMPTY_FUNDING, EMPTY_PROVIDER_CONTEXT, type ProviderContext,
  type PersonReceivingSupport, type CatalogueSelection, type WorkerRequirements, type SafetyChecklist, type FundingChoice,
} from "@/lib/types/posting";
import { postFailureMessage } from "@/lib/guestDraftResume";
import { someoneElsePhoneError } from "@/components/jobs/post/shared";
import { saveGuestDraft, loadGuestDraft, loadResumableDraft, clearGuestDraft, getPostAttemptId, loadGuestRole, type GuestPostingRole } from "@/lib/store/guestJobDraft";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

type StepKey = "start" | "person" | "service" | "tasks" | "location" | "schedule" | "requirements" | "safety" | "funding" | "review";
const BASE_KEYS: StepKey[] = ["start", "person", "service", "tasks", "location", "schedule", "requirements", "safety", "funding", "review"];
const COORDINATOR_KEYS: StepKey[] = ["person", "start", "service", "tasks", "location", "schedule", "requirements", "safety", "funding", "review"];

type Duration = "30MIN" | "1HR" | "2HR" | "3HR" | "4HR" | "OTHER" | "NOT_KNOWN";
const DURATION_HOURS: Record<Duration, number | undefined> = { "30MIN": 0.5, "1HR": 1, "2HR": 2, "3HR": 3, "4HR": 4, OTHER: undefined, NOT_KNOWN: undefined };
const DURATION_LABELS: Record<Duration, string> = {
  "30MIN": "30 minutes", "1HR": "1 hour", "2HR": "2 hours", "3HR": "3 hours", "4HR": "4 hours", OTHER: "Other duration", NOT_KNOWN: "End time not known",
};

const SHORT_NOTICE_REASONS = [
  "Worker cancelled", "Unexpected need", "Appointment changed", "Family/carer unavailable", "Discharge/transition", "Other",
];

function UrgentJourneyBase() {
  const router = useRouter();
  const { activeRole, isAuth } = useAuth();
  const [guestRole, setGuestRole] = useState<GuestPostingRole | null>(null);
  const isCoordinator = activeRole === "COORDINATOR" || (!isAuth && guestRole === "COORDINATOR");
  const isProvider = activeRole === "PROVIDER";
  const audience = audienceOf(isCoordinator, isProvider);
  const keys = isCoordinator ? COORDINATOR_KEYS : BASE_KEYS;
  const TOTAL_STEPS = keys.length;
  const [step, setStep] = useState(0);
  const key = keys[Math.min(step, keys.length - 1)];
  const goTo = (k: StepKey) => setStep(keys.indexOf(k));
  const [error, setError] = useState<string | null>(null);
  const [shiftPassBlocked, setShiftPassBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean; verificationRequired?: boolean } | null>(null);

  const [startTime, setStartTime] = useState("");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [locationType, setLocationType] = useState<string>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [meetingDetails, setMeetingDetails] = useState("");
  const [duration, setDuration] = useState<Duration>("1HR");
  const [otherHours, setOtherHours] = useState("");
  const [requirements, setRequirements] = useState<WorkerRequirements>(EMPTY_REQUIREMENTS);
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
  const [providerCtx, setProviderCtx] = useState<ProviderContext>(EMPTY_PROVIDER_CONTEXT);
  const patchProviderCtx = (p: Partial<ProviderContext>) => setProviderCtx((c) => ({ ...c, ...p }));
  const [agreeShare, setAgreeShare] = useState(false);
  const [postingAuthorityConfirmed, setPostingAuthorityConfirmed] = useState(false);

  function patch<T>(setter: (v: T) => void, current: T) {
    return (p: Partial<T>) => setter({ ...current, ...p });
  }

  useEffect(() => {
    if (!isAuth) setGuestRole(loadGuestRole());
    const d = (isAuth ? loadResumableDraft("URGENT", activeRole) : loadGuestDraft("URGENT")) as Record<string, unknown> | null;
    if (!d) return;
    if (typeof d.startTime === "string") setStartTime(d.startTime);
    if (d.person) setPerson(d.person as PersonReceivingSupport);
    if (d.catalogue) setCatalogue(d.catalogue as CatalogueSelection);
    if (typeof d.reason === "string") setReason(d.reason);
    if (typeof d.note === "string") setNote(d.note);
    if (typeof d.locationType === "string") setLocationType(d.locationType);
    if (typeof d.suburb === "string") setSuburb(d.suburb);
    if (typeof d.state === "string") setState(d.state);
    if (typeof d.postcode === "string") setPostcode(d.postcode);
    if (typeof d.addressLine === "string") setAddressLine(d.addressLine);
    if (typeof d.meetingDetails === "string") setMeetingDetails(d.meetingDetails);
    if (d.duration) setDuration(d.duration as Duration);
    if (typeof d.otherHours === "string") setOtherHours(d.otherHours);
    if (d.requirements) setRequirements(d.requirements as WorkerRequirements);
    if (d.safety) setSafety(d.safety as SafetyChecklist);
    if (d.funding) setFunding(d.funding as FundingChoice);
    if (typeof d.agreeShare === "boolean") setAgreeShare(d.agreeShare);
    if (typeof d.postingAuthorityConfirmed === "boolean") setPostingAuthorityConfirmed(d.postingAuthorityConfirmed);
    if (typeof d.step === "number") setStep(d.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  function validate(): string | null {
    if ((key === "start" || key === "schedule") && !startTime) return "Choose a start time (more than 60 minutes and within 4 hours from now).";
    if (key === "start" || key === "schedule") {
      const m = (new Date(startTime).getTime() - Date.now()) / 60000;
      if (m <= 60) return "Urgent Support starts more than 60 minutes from now. For sooner support, post a Rapid request.";
      if (m > 240) return "Urgent Support must start within 4 hours. For a later start, post a Last-Minute or Routine request.";
    }
    if (key === "schedule" && duration === "OTHER" && !(parseFloat(otherHours) > 0)) return "Enter how long support is needed (in hours).";
    if (key === "person" && isCoordinator && person.who !== "SOMEONE_ELSE" && person.who !== "EXISTING_PARTICIPANT") return "Select who this request is for.";
    if (key === "person" && person.who === "EXISTING_PARTICIPANT" && !person.existingParticipantId) return "Select a participant.";
    if (key === "person" && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (key === "person" && isCoordinator && person.who === "SOMEONE_ELSE") { const e = someoneElsePhoneError(person); if (e) return e; }
    if (key === "person" && isCoordinator && person.who === "EXISTING_PARTICIPANT" && person.existingParticipantIsConnection && !postingAuthorityConfirmed) return "Confirm you're authorised to post for this participant.";
    if (key === "service" && !catalogue.categoryId) return "Select a support category.";
    if (key === "tasks" && catalogue.tasks.length === 0) return "Select at least one task.";
    if (key === "location" && !suburb.trim()) return "Suburb/postcode is required.";
    if (key === "requirements" && audience !== "PROVIDER" && !hasRequirementsChoice(requirements)) return "Select what is essential, or choose No additional requirement.";
    if (key === "safety" && audience !== "PROVIDER" && !hasSafetyChoice(safety)) return "Select any essential safety information, or choose No special safety information.";
    if (key === "funding" && audience !== "PROVIDER") { const e = fundingChoiceError(funding); if (e) return e; }
    if (key === "funding" && audience === "PROVIDER" && funding.rateChoice === "OFFERED_RATE" && !(parseFloat(funding.offeredRate) > 0)) return "Enter the offered hourly rate.";
    if (key === "review" && isProvider && !postingAuthorityConfirmed) return "Confirm you're authorised to post this request for your organisation.";
    if (key === "review" && isProvider) { const e = providerContextError(providerCtx, null); if (e) return e; }
    if (key === "review" && !agreeShare) return "Please confirm the information-sharing acknowledgement.";
    return null;
  }

  function draftState(atStep: number) {
    return {
      startTime, person, catalogue, reason, note, locationType, suburb, state, postcode, addressLine,
      meetingDetails, duration, otherHours, requirements, safety, funding, agreeShare, postingAuthorityConfirmed, step: atStep,
    };
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === TOTAL_STEPS - 1) {
      // A request saved before signing up may have waited past the time it asked for.
      const m = (new Date(startTime).getTime() - Date.now()) / 60000;
      if (!startTime || m <= 60 || m > 240) { goTo("start"); setError("Your start time no longer fits an Urgent request (more than 60 minutes and within 4 hours from now). Choose a new start time."); return; }
      void submitCommon(false); return;
    }
    const nextStep = step + 1;
    if (!isAuth) saveGuestDraft("URGENT", guestRole ?? "PARTICIPANT", draftState(nextStep));
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    const prevStep = Math.max(0, step - 1);
    if (!isAuth) saveGuestDraft("URGENT", guestRole ?? "PARTICIPANT", draftState(prevStep));
    setStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitCommon(asDraft: boolean) {
    if (!isAuth) {
      saveGuestDraft("URGENT", guestRole ?? "PARTICIPANT", draftState(step));
      router.push("/register");
      return;
    }
    setSaving(true); setError(null); setShiftPassBlocked(false);
    try {
      const start = startTime ? new Date(startTime) : new Date();
      const hours = duration === "OTHER" ? parseFloat(otherHours) : DURATION_HOURS[duration];
      const end = new Date(start.getTime() + (hours ?? 1) * 60 * 60 * 1000);
      const category = getCatalogueCategory(catalogue.categoryId);

      const body: Record<string, unknown> = {
        title: `${category?.label ?? "Support"} — Urgent Support`,
        description: note.trim() || `Urgent support request: ${category?.label ?? ""}`,
        category: catalogue.categoryId,
        urgency: "URGENT",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours: hours,
        requestPurposeCategory: reason || undefined,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: meetingDetails.trim() || undefined,
        selectedTasks: buildSelectedTasksPayload(catalogue),
        workerPreferences: buildWorkerPreferencesPayload(requirements),
        visibilityTarget: requirements.workerOrProvider === "WORKER" ? "WORKERS_ONLY" : requirements.workerOrProvider === "PROVIDER" ? "PROVIDERS_ONLY" : "ALL",
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        clientRequestId: asDraft ? undefined : getPostAttemptId(),
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
        setError(postFailureMessage(err));
      }
    } finally { setSaving(false); }
  }

  if (submitted) return <LiveRequestScreen tier="URGENT" tierLabel="Urgent Support" jobId={submitted.id} isDraft={submitted.isDraft} verificationRequired={submitted.verificationRequired} audience={isProvider ? "PROVIDER" : isCoordinator ? "COORDINATOR" : undefined} />;

  const category = getCatalogueCategory(catalogue.categoryId);
  const titles: Record<StepKey, string> = {
    start: "When should support start?",
    person: isCoordinator ? "Who is this support request for?" : isProvider ? "Staffing request for your organisation" : "Who needs this Urgent Support?",
    service: "What support is needed?",
    tasks: "What help is needed during this support?",
    location: "Where is the support needed?",
    schedule: "Confirm the time and length",
    requirements: "Which requirements are essential?",
    safety: isCoordinator ? "What must a worker know before responding?" : "What must a worker know before responding?",
    funding: isProvider ? "Rate and engagement" : "How will this support be paid for?",
    review: isCoordinator ? "Check the Urgent Support request" : "Check your Urgent Support request",
  };
  const nextLabel =
    key === "funding" ? "Review Urgent request"
    : key === "review" ? (isAuth ? (isProvider ? "Verify and Post Urgent Request" : "Post Urgent request" + (isCoordinator ? "" : " — Free")) : "Sign up to post this request")
    : "Continue";
  const durationLabel = duration === "OTHER" && otherHours ? `${otherHours} hours` : DURATION_LABELS[duration];

  return (
    <WizardScreen
      tierLabel="Urgent Support" screenTitle={titles[key]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next}
      belowError={shiftPassBlocked ? (
        <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); void submitCommon(false); }} onDismiss={() => setShiftPassBlocked(false)} />
      ) : undefined}
      nextLabel={nextLabel}
      saving={saving}
    >
      {key === "start" && (
        <div className="space-y-4">
          <div>
            <label className={lbl}>Today — choose a time more than 60 minutes and within 4 hours</label>
            <input type="datetime-local" className={inp} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          {isProvider && <ProviderAlternativeTimesField value={providerCtx} onChange={patchProviderCtx} />}
        </div>
      )}
      {key === "person" && (
        <PersonStep
          value={person} onChange={patch(setPerson, person)} tierLabel="Urgent Support" isCoordinator={isCoordinator} isProvider={isProvider} providerContext={providerCtx} onProviderContextChange={patchProviderCtx}
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
            <label className={lbl}>Reason for short notice (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SHORT_NOTICE_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${reason === r ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{r}</button>
              ))}
            </div>
            <textarea className={`${inp} h-auto py-2`} rows={2} maxLength={250} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional short note (max 250 characters)" />
          </div>
        </div>
      )}
      {key === "location" && (
        <div className="space-y-4">
          <label className={lbl}>Where is the support needed?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={locationOptions(audience, "URGENT")} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb/postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          {isProvider && <ProviderLocationExtras value={providerCtx} onChange={patchProviderCtx} />}
          <div><label className={lbl}>Exact private address</label><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div><label className={lbl}>Meeting point, destination or return-trip details</label><input className={inp} value={meetingDetails} onChange={(e) => setMeetingDetails(e.target.value)} /></div>
        </div>
      )}
      {key === "schedule" && (
        <div className="space-y-4">
          <div><label className={lbl}>Start time *</label><input type="datetime-local" className={inp} value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
          <RadioCards value={duration} onChange={setDuration} options={[
            { v: "30MIN", l: "30 minutes" }, { v: "1HR", l: "1 hour" }, { v: "2HR", l: "2 hours" },
            { v: "3HR", l: "3 hours" }, { v: "4HR", l: "4 hours" }, { v: "OTHER", l: "Other duration" }, { v: "NOT_KNOWN", l: "End time not known" },
          ]} />
          {duration === "OTHER" && (
            <div className="w-40"><label className={lbl}>Duration (hours) *</label><input type="number" min="0.5" step="0.5" className={inp} value={otherHours} onChange={(e) => setOtherHours(e.target.value)} /></div>
          )}
        </div>
      )}
      {key === "requirements" && (
        <RequirementsStep value={requirements} onChange={patch(setRequirements, requirements)} showWorkerChoice={isProvider} audience={audience}
          questionLabel="Which requirements are essential?" genderLabel="Worker gender required"
          languageLabel="Language/Auslan" qualificationLabel="Qualification or participant-specific training" />
      )}
      {key === "safety" && (<><SafetyStep value={safety} onChange={patch(setSafety, safety)} questionLabel="What must a worker know before responding?" audience={audience} />{isProvider && <ProviderSafetyExtras value={providerCtx} onChange={patchProviderCtx} />}</>)}
      {key === "funding" && (isProvider
        ? <ProviderRateStep value={funding} onChange={patch(setFunding, funding)} />
        : <FundingStep value={funding} onChange={patch(setFunding, funding)} audience={audience} />)}
      {key === "review" && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            {(isCoordinator || isProvider) && (
              <ReviewRow label={isProvider ? "Organisation and authority" : "Participant and authority"} value={isProvider ? "Your organisation" : (person.who === "EXISTING_PARTICIPANT" ? person.existingParticipantName : person.someoneElseName) || "Not selected"} onEdit={() => goTo("person")} />
            )}
            <ReviewRow label={isCoordinator ? "Start time and duration" : "Date, start time and duration"} value={`${startTime ? new Date(startTime).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : ""} · ${durationLabel}`} onEdit={() => goTo("schedule")} />
            <ReviewRow label={isCoordinator ? "Service and tasks" : "Service, subcategory and tasks"} value={`${category?.label ?? ""} — ${catalogue.tasks.join(", ")}`} onEdit={() => goTo("tasks")} />
            <ReviewRow label={isCoordinator ? "General location" : "Location"} value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} onEdit={() => goTo("location")} />
            <ReviewRow label={isCoordinator ? "Requirements" : "Essential requirements"} value={requirementsSummary(requirements, audience)} onEdit={() => goTo("requirements")} />
            <ReviewRow label={isCoordinator ? "Safety" : "Safety summary"} value={safetySummary(safety)} onEdit={() => goTo("safety")} />
            <ReviewRow label={isProvider ? "Rate and engagement" : "Funding and rate"} value={isProvider ? providerRateSummary(funding) : fundingSummary(funding)} onEdit={() => goTo("funding")} />
          </div>
          {isProvider && <ProviderVisibilityPreview visible={["Service and essential tasks", "General location (suburb and state)", "Start time and duration", "Participant age group", "Rate and engagement", "Your organisation as the poster"]} />}
          <AddressReleaseNotice />
          {isProvider && <ProviderAuthorityConfirm checked={postingAuthorityConfirmed} onChange={setPostingAuthorityConfirmed} />}
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="Information-sharing acknowledgement — I agree the shown details can be shared with suitable workers/providers" />
          {isProvider && (
            <div className="flex justify-end">
              <button type="button" onClick={() => void submitCommon(true)} className="text-xs text-brand-700 underline">Save draft</button>
            </div>
          )}
        </div>
      )}
    </WizardScreen>
  );
}

// Providers have their own staffing-request journey (Provider doc PR-R01–R05); every other role uses this one.
export default function UrgentJourney() {
  const { activeRole } = useAuth();
  if (activeRole === "PROVIDER") return <ProviderStaffingWizard tier="URGENT" />;
  return <UrgentJourneyBase />;
}
