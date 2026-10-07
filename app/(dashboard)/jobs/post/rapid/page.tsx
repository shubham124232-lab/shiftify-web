"use client";

// Rapid Support journey — support needed now or within 60 minutes. Shortest journey: no
// mandatory long-form writing. Authoritative documents per role:
//   Participant → Participant Posting Journeys R-01..R-11
//   Coordinator → SC Journey SC-P00..P02 (participant + authority first) then SC-R01..R10
//   Provider    → Provider Journey PR-R01..R06 (+ PR-C01 confirmation)

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
  hasRequirementsChoice, hasSafetyChoice, fundingChoiceError, providerContextError, ProviderAuthorityConfirm,
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

// Coordinators select the participant and confirm authority before anything else (SC-P00/P01).
type StepKey = "timing" | "person" | "service" | "tasks" | "location" | "duration" | "requirements" | "safety" | "funding" | "review";
const BASE_KEYS: StepKey[] = ["timing", "person", "service", "tasks", "location", "duration", "requirements", "safety", "funding", "review"];
const COORDINATOR_KEYS: StepKey[] = ["person", "timing", "service", "tasks", "location", "duration", "requirements", "safety", "funding", "review"];

type Timing = "ASAP" | "CHOOSE_TIME";
type Duration = "30MIN" | "1HR" | "2HR" | "3HR" | "4HR_PLUS" | "NOT_SURE";

const DURATION_HOURS: Record<Duration, number | undefined> = {
  "30MIN": 0.5, "1HR": 1, "2HR": 2, "3HR": 3, "4HR_PLUS": 4, NOT_SURE: undefined,
};
const DURATION_LABELS: Record<Duration, string> = {
  "30MIN": "30 minutes", "1HR": "1 hour", "2HR": "2 hours", "3HR": "3 hours", "4HR_PLUS": "4+ hours", NOT_SURE: "Not sure",
};

function RapidJourneyBase() {
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

  const [timing, setTiming] = useState<Timing>("ASAP");
  const [chosenTime, setChosenTime] = useState("");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [locationType, setLocationType] = useState<string>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [meetingDetails, setMeetingDetails] = useState("");
  const [duration, setDuration] = useState<Duration>("1HR");
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

  // Guest: pick up role + any in-progress draft saved before login.
  useEffect(() => {
    if (!isAuth) setGuestRole(loadGuestRole());
    const d = (isAuth ? loadResumableDraft("RAPID", activeRole) : loadGuestDraft("RAPID")) as Record<string, unknown> | null;
    if (!d) return;
    if (d.timing) setTiming(d.timing as Timing);
    if (typeof d.chosenTime === "string") setChosenTime(d.chosenTime);
    if (d.person) setPerson(d.person as PersonReceivingSupport);
    if (d.catalogue) setCatalogue(d.catalogue as CatalogueSelection);
    if (typeof d.locationType === "string") setLocationType(d.locationType);
    if (typeof d.suburb === "string") setSuburb(d.suburb);
    if (typeof d.state === "string") setState(d.state);
    if (typeof d.postcode === "string") setPostcode(d.postcode);
    if (typeof d.addressLine === "string") setAddressLine(d.addressLine);
    if (typeof d.meetingDetails === "string") setMeetingDetails(d.meetingDetails);
    if (d.duration) setDuration(d.duration as Duration);
    if (d.requirements) setRequirements(d.requirements as WorkerRequirements);
    if (d.safety) setSafety(d.safety as SafetyChecklist);
    if (d.funding) setFunding(d.funding as FundingChoice);
    if (typeof d.agreeShare === "boolean") setAgreeShare(d.agreeShare);
    if (typeof d.postingAuthorityConfirmed === "boolean") setPostingAuthorityConfirmed(d.postingAuthorityConfirmed);
    if (typeof d.step === "number") setStep(d.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  function validate(): string | null {
    if (key === "timing" && timing === "CHOOSE_TIME" && !chosenTime) return "Choose a time within the next 60 minutes.";
    if (key === "timing" && timing === "CHOOSE_TIME") {
      const m = (new Date(chosenTime).getTime() - Date.now()) / 60000;
      if (m < -1) return "Choose a time from now onwards.";
      if (m > 60) return "Rapid Support must start within 60 minutes. For a later start, post an Urgent, Last-Minute or Routine request.";
    }
    if (key === "person" && isCoordinator && person.who !== "SOMEONE_ELSE" && person.who !== "EXISTING_PARTICIPANT") return "Select who this request is for.";
    if (key === "person" && person.who === "EXISTING_PARTICIPANT" && !person.existingParticipantId) return "Select a participant.";
    if (key === "person" && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (key === "person" && isCoordinator && person.who === "SOMEONE_ELSE") { const e = someoneElsePhoneError(person); if (e) return e; }
    if (key === "person" && isCoordinator && person.who === "EXISTING_PARTICIPANT" && person.existingParticipantIsConnection && !postingAuthorityConfirmed) return "Confirm you're authorised to post for this participant.";
    if (key === "service" && !catalogue.categoryId) return "Select the support that is needed right now.";
    if (key === "tasks" && catalogue.tasks.length === 0 && !catalogue.otherTask.trim()) return "Select at least one task, or describe the other essential task.";
    if (key === "location" && !suburb.trim()) return "Suburb/postcode is required.";
    // R-05: exact address is required for Participant requests; the Coordinator and Provider documents list it as "when relevant".
    if (key === "location" && audience === "PARTICIPANT" && !addressLine.trim()) return "Exact address is required to complete matching. It stays private until confirmation.";
    if (key === "requirements" && audience !== "PROVIDER" && !hasRequirementsChoice(requirements)) return "Select what is essential, or choose No additional requirement.";
    if (key === "safety" && audience !== "PROVIDER" && !hasSafetyChoice(safety)) return "Select any essential safety information, or choose No special safety information.";
    if (key === "funding" && audience !== "PROVIDER") { const e = fundingChoiceError(funding); if (e) return e; }
    if (key === "funding" && audience === "PROVIDER" && funding.rateChoice === "OFFERED_RATE" && !(parseFloat(funding.offeredRate) > 0)) return "Enter the offered hourly rate.";
    if (key === "review" && isProvider && !postingAuthorityConfirmed) return "Confirm you're authorised to post this request for your organisation.";
    if (key === "review" && isProvider) { const e = providerContextError(providerCtx, null); if (e) return e; }
    if (key === "review" && !agreeShare) return "Please confirm the information can be shared with suitable workers/providers.";
    return null;
  }

  function draftState(atStep: number) {
    return {
      timing, chosenTime, person, catalogue, locationType, suburb, state, postcode, addressLine,
      meetingDetails, duration, requirements, safety, funding, agreeShare, postingAuthorityConfirmed, step: atStep,
    };
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === TOTAL_STEPS - 1) {
      // A request saved before signing up may have waited past the time it asked for.
      if (timing === "CHOOSE_TIME") {
        const m = (new Date(chosenTime).getTime() - Date.now()) / 60000;
        if (!chosenTime || m < -1 || m > 60) { goTo("timing"); setError("The arrival time you chose is no longer within the next 60 minutes. Choose a new time, or pick As soon as possible."); return; }
      }
      void submitCommon(false); return;
    }
    const nextStep = step + 1;
    if (!isAuth) saveGuestDraft("RAPID", guestRole ?? "PARTICIPANT", draftState(nextStep));
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    const prevStep = Math.max(0, step - 1);
    if (!isAuth) saveGuestDraft("RAPID", guestRole ?? "PARTICIPANT", draftState(prevStep));
    setStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitCommon(asDraft: boolean) {
    if (!isAuth) {
      saveGuestDraft("RAPID", guestRole ?? "PARTICIPANT", draftState(step));
      router.push("/register");
      return;
    }
    setSaving(true); setError(null); setShiftPassBlocked(false);
    try {
      const start = timing === "ASAP" ? new Date() : new Date(chosenTime);
      const durationHours = DURATION_HOURS[duration] ?? 1;
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      const category = getCatalogueCategory(catalogue.categoryId);

      const body: Record<string, unknown> = {
        title: `${category?.label ?? "Support"} — Rapid Support`,
        description: catalogue.otherTask || `Rapid support request: ${category?.label ?? ""}`,
        category: catalogue.categoryId,
        urgency: "RAPID",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours: DURATION_HOURS[duration],
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
    } finally {
      setSaving(false);
    }
  }

  if (submitted) return <LiveRequestScreen tier="RAPID" tierLabel="Rapid Support" jobId={submitted.id} isDraft={submitted.isDraft} verificationRequired={submitted.verificationRequired} audience={isProvider ? "PROVIDER" : isCoordinator ? "COORDINATOR" : undefined} />;

  const category = getCatalogueCategory(catalogue.categoryId);
  const titles: Record<StepKey, string> = {
    timing: isCoordinator ? "When should the worker arrive?" : "When do you need the worker to arrive?",
    person: isCoordinator ? "Who is this support request for?" : isProvider ? "Staffing request for your organisation" : "Who needs this Rapid Support?",
    service: "What support is needed right now?",
    tasks: "What must the worker help with?",
    location: "Where is the support needed?",
    duration: "How long is support needed?",
    requirements: "What is essential for this request?",
    safety: "Is there anything essential a worker must know before accepting?",
    funding: isProvider ? "Rate and engagement" : "How will this support be paid for?",
    review: isCoordinator ? "Check the Rapid Support request" : "Check your Rapid Support request",
  };
  const nextLabel =
    key === "funding" ? "Review Rapid request"
    : key === "review" ? (isAuth ? (isProvider ? "Verify and Post Rapid Request" : "Post Rapid request" + (isCoordinator ? "" : " — Free")) : "Sign up to post this request")
    : "Continue";

  return (
    <WizardScreen
      tierLabel="Rapid Support" screenTitle={titles[key]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next} nextLabel={nextLabel} saving={saving}
      belowError={shiftPassBlocked ? (
        <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); void submitCommon(false); }} onDismiss={() => setShiftPassBlocked(false)} />
      ) : undefined}
    >
      {key === "timing" && (
        <div className="space-y-4">
          <label className={lbl}>{titles.timing}</label>
          <RadioCards value={timing} onChange={setTiming} options={[
            { v: "ASAP", l: "As soon as possible" },
            { v: "CHOOSE_TIME", l: "Choose a time within the next 60 minutes" },
          ]} />
          {timing === "CHOOSE_TIME" && (
            <input type="datetime-local" className={inp} value={chosenTime} onChange={(e) => setChosenTime(e.target.value)} />
          )}
        </div>
      )}

      {key === "person" && (
        <PersonStep
          value={person} onChange={patch(setPerson, person)} tierLabel="Rapid Support" isCoordinator={isCoordinator} isProvider={isProvider} providerContext={providerCtx} onProviderContextChange={patchProviderCtx}
          authorityConfirmed={postingAuthorityConfirmed} onAuthorityChange={setPostingAuthorityConfirmed}
        />
      )}

      {key === "service" && (
        <CategoryPickerStep
          selectedIds={catalogue.categoryId ? [catalogue.categoryId] : []}
          onToggle={(id) => setCatalogue({ categoryId: id, tasks: [], otherTask: "", answers: {} })}
          questionLabel="What support is needed right now?"
        />
      )}

      {key === "tasks" && <TasksStep value={catalogue} onChange={patch(setCatalogue, catalogue)} showOtherTask />}

      {key === "location" && (
        <div className="space-y-4">
          <label className={lbl}>Where is the support needed?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={locationOptions(audience, "RAPID")} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb / postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Parramatta" /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          {isProvider && <ProviderLocationExtras value={providerCtx} onChange={patchProviderCtx} />}
          <div>
            <label className={lbl}>{audience === "PARTICIPANT" ? "Exact address *" : "Exact private address"}</label>
            <p className="text-xs text-slate-400 mb-1">Kept private until confirmation.</p>
            <input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
          </div>
          {locationType !== "HOME" && (
            <div><label className={lbl}>Meeting point or destination details</label><input className={inp} value={meetingDetails} onChange={(e) => setMeetingDetails(e.target.value)} /></div>
          )}
        </div>
      )}

      {key === "duration" && (
        <RadioCards value={duration} onChange={setDuration} options={[
          { v: "30MIN", l: "30 minutes" }, { v: "1HR", l: "1 hour" }, { v: "2HR", l: "2 hours" },
          { v: "3HR", l: "3 hours" }, { v: "4HR_PLUS", l: "4+ hours" }, { v: "NOT_SURE", l: "Not sure" },
        ]} />
      )}

      {key === "requirements" && <RequirementsStep value={requirements} onChange={patch(setRequirements, requirements)} showWorkerChoice={isProvider} audience={audience} />}

      {key === "safety" && (<><SafetyStep value={safety} onChange={patch(setSafety, safety)} audience={audience} />{isProvider && <ProviderSafetyExtras value={providerCtx} onChange={patchProviderCtx} />}</>)}

      {key === "funding" && (isProvider
        ? <ProviderRateStep value={funding} onChange={patch(setFunding, funding)} />
        : <FundingStep value={funding} onChange={patch(setFunding, funding)} audience={audience} />)}

      {key === "review" && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            {(isCoordinator || isProvider) && (
              <ReviewRow label={isProvider ? "Organisation and authority" : "Participant and authority"} value={isProvider ? "Your organisation" : (person.who === "EXISTING_PARTICIPANT" ? person.existingParticipantName : person.someoneElseName) || "Not selected"} onEdit={() => goTo("person")} />
            )}
            <ReviewRow label="Arrival time and duration" value={`${timing === "ASAP" ? "As soon as possible" : new Date(chosenTime).toLocaleString("en-AU", { timeStyle: "short" })} · ${DURATION_LABELS[duration]}`} onEdit={() => goTo("timing")} />
            <ReviewRow label={isCoordinator ? "Service and tasks" : "Service and essential tasks"} value={`${category?.label ?? ""} — ${[...catalogue.tasks, catalogue.otherTask.trim()].filter(Boolean).join(", ")}`} onEdit={() => goTo("tasks")} />
            <ReviewRow label="General location" value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} onEdit={() => goTo("location")} />
            <ReviewRow label={isCoordinator ? "Requirements" : "Essential requirements"} value={requirementsSummary(requirements, audience)} onEdit={() => goTo("requirements")} />
            <ReviewRow label="Safety summary" value={safetySummary(safety)} onEdit={() => goTo("safety")} />
            <ReviewRow label={isProvider ? "Rate and engagement" : "Funding and rate"} value={isProvider ? providerRateSummary(funding) : fundingSummary(funding)} onEdit={() => goTo("funding")} />
          </div>
          {isProvider && <ProviderVisibilityPreview visible={["Service and essential tasks", "General location (suburb and state)", "Start time and duration", "Participant age group", "Rate and engagement", "Your organisation as the poster"]} />}
          <AddressReleaseNotice />
          {isProvider && <ProviderAuthorityConfirm checked={postingAuthorityConfirmed} onChange={setPostingAuthorityConfirmed} />}
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="I agree the shown request details can be shared with suitable workers/providers" />
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
export default function RapidJourney() {
  const { activeRole } = useAuth();
  if (activeRole === "PROVIDER") return <ProviderStaffingWizard tier="RAPID" />;
  return <RapidJourneyBase />;
}
