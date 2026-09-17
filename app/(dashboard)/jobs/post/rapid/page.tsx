"use client";

// Rapid Support journey (R-01..R-10 input/review) + R-11 live — support needed
// now or within 60 minutes. Shortest journey: no mandatory long-form writing.
// See [[participant-posting-journeys-spec]] memory for the source spec.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  WizardScreen, RadioCards, PersonStep, CategoryPickerStep, TasksStep, SafetyStep, RequirementsStep, FundingStep,
  ReviewRow, LiveRequestScreen, CheckboxRow, AddressReleaseNotice, ShiftPassPrompt, inp, lbl,
  buildWorkerPreferencesPayload, buildSafetyFlagsPayload, buildFundingPayload,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  EMPTY_PERSON, EMPTY_CATALOGUE, EMPTY_REQUIREMENTS, EMPTY_SAFETY, EMPTY_FUNDING,
  type PersonReceivingSupport, type CatalogueSelection, type WorkerRequirements, type SafetyChecklist, type FundingChoice,
} from "@/lib/types/posting";
import { saveGuestDraft, loadGuestDraft, clearGuestDraft, loadGuestRole, type GuestPostingRole } from "@/lib/store/guestJobDraft";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const TOTAL_STEPS = 10; // R-01..R-09 input steps + R-10 review

type Timing = "ASAP" | "CHOOSE_TIME";
type LocationType = "HOME" | "COMMUNITY" | "APPOINTMENT" | "PICKUP_DROPOFF" | "OTHER";
type Duration = "30MIN" | "1HR" | "2HR" | "3HR" | "4HR_PLUS" | "NOT_SURE";

const DURATION_HOURS: Record<Duration, number | undefined> = {
  "30MIN": 0.5, "1HR": 1, "2HR": 2, "3HR": 3, "4HR_PLUS": 4, NOT_SURE: undefined,
};

export default function RapidJourney() {
  const router = useRouter();
  const { activeRole, isAuth } = useAuth();
  const [guestRole, setGuestRole] = useState<GuestPostingRole | null>(null);
  const isCoordinator = activeRole === "COORDINATOR" || (!isAuth && guestRole === "COORDINATOR");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shiftPassBlocked, setShiftPassBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean } | null>(null);

  const [timing, setTiming] = useState<Timing>("ASAP");
  const [chosenTime, setChosenTime] = useState("");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [locationType, setLocationType] = useState<LocationType>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [meetingDetails, setMeetingDetails] = useState("");
  const [duration, setDuration] = useState<Duration>("1HR");
  const [requirements, setRequirements] = useState<WorkerRequirements>(EMPTY_REQUIREMENTS);
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
  const [agreeShare, setAgreeShare] = useState(false);
  const [postingAuthorityConfirmed, setPostingAuthorityConfirmed] = useState(false);

  function patch<T>(setter: (v: T) => void, current: T) {
    return (p: Partial<T>) => setter({ ...current, ...p });
  }

  // Guest: pick up role + any in-progress draft saved before login.
  useEffect(() => {
    if (isAuth) return;
    setGuestRole(loadGuestRole());
    const d = loadGuestDraft("RAPID") as Record<string, unknown> | null;
    if (!d) return;
    if (d.timing) setTiming(d.timing as Timing);
    if (typeof d.chosenTime === "string") setChosenTime(d.chosenTime);
    if (d.person) setPerson(d.person as PersonReceivingSupport);
    if (d.catalogue) setCatalogue(d.catalogue as CatalogueSelection);
    if (d.locationType) setLocationType(d.locationType as LocationType);
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
    if (step === 0 && timing === "CHOOSE_TIME" && !chosenTime) return "Choose a time within the next 60 minutes.";
    if (step === 1 && isCoordinator && person.who !== "SOMEONE_ELSE" && person.who !== "EXISTING_PARTICIPANT") return "Select who this request is for.";
    if (step === 1 && isCoordinator && person.who === "EXISTING_PARTICIPANT" && !person.existingParticipantId) return "Select a participant.";
    if (step === 1 && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (step === 1 && isCoordinator && person.who === "EXISTING_PARTICIPANT" && person.existingParticipantIsConnection && !postingAuthorityConfirmed) return "Confirm you're authorised to post for this participant.";
    if (step === 2 && !catalogue.categoryId) return "Select the support that is needed right now.";
    if (step === 3 && catalogue.tasks.length === 0 && !catalogue.otherTask.trim()) return "Select at least one task, or describe the other essential task.";
    if (step === 4 && !suburb.trim()) return "Suburb/postcode is required.";
    if (step === 9 && !agreeShare) return "Please confirm the information can be shared with suitable workers/providers.";
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
    if (step === TOTAL_STEPS - 1) { void submit(); return; }
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

  async function submit() {
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
        selectedTasks: catalogue.tasks.length ? catalogue.tasks : undefined,
        workerPreferences: buildWorkerPreferencesPayload(requirements),
        visibilityTarget: requirements.workerOrProvider === "WORKER" ? "WORKERS_ONLY" : requirements.workerOrProvider === "PROVIDER" ? "PROVIDERS_ONLY" : "ALL",
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        asDraft: false,
      };
      if (person.who === "SOMEONE_ELSE") {
        body.inlineParticipant = {
          name: person.someoneElseName.trim(),
          phone: person.someoneElsePhone.trim() || undefined,
          suburb: suburb.trim() || undefined,
        };
      } else if (person.who === "EXISTING_PARTICIPANT") {
        body.forParticipantUserId = person.existingParticipantId;
      }
      const res = await api.post<{ job: { id: string } }>("/jobs", body);
      clearGuestDraft();
      setSubmitted({ id: res.job.id, isDraft: false });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_LIMIT") {
        setShiftPassBlocked(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to post request.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (submitted) return <LiveRequestScreen tier="RAPID" tierLabel="Rapid Support" jobId={submitted.id} isDraft={submitted.isDraft} />;

  const category = getCatalogueCategory(catalogue.categoryId);
  const screens = [
    { title: "When do you need the worker to arrive?", label: "Continue" },
    { title: "Who needs this Rapid Support?", label: "Continue" },
    { title: "What support is needed right now?", label: "Continue" },
    { title: "What must the worker help with?", label: "Continue" },
    { title: "Where is the support needed?", label: "Continue" },
    { title: "How long is support needed?", label: "Continue" },
    { title: "What is essential for this request?", label: "Continue" },
    { title: "Is there anything essential a worker must know before accepting?", label: "Continue" },
    { title: "How will this support be paid for?", label: "Review Rapid request" },
    { title: "Check your Rapid Support request", label: isAuth ? "Post Rapid request — Free" : "Sign up to post this request" },
  ];

  return (
    <WizardScreen
      tierLabel="Rapid Support" screenTitle={screens[step].title} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next} nextLabel={screens[step].label} saving={saving}
      belowError={shiftPassBlocked ? (
        <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); submit(); }} onDismiss={() => setShiftPassBlocked(false)} />
      ) : undefined}
    >
      {step === 0 && (
        <div className="space-y-4">
          <label className={lbl}>When do you need the worker to arrive?</label>
          <RadioCards value={timing} onChange={setTiming} options={[
            { v: "ASAP", l: "As soon as possible" },
            { v: "CHOOSE_TIME", l: "Choose a time within the next 60 minutes" },
          ]} />
          {timing === "CHOOSE_TIME" && (
            <input type="datetime-local" className={inp} value={chosenTime} onChange={(e) => setChosenTime(e.target.value)} />
          )}
        </div>
      )}

      {step === 1 && (
        <PersonStep
          value={person} onChange={patch(setPerson, person)} tierLabel="Rapid Support" isCoordinator={isCoordinator}
          authorityConfirmed={postingAuthorityConfirmed} onAuthorityChange={setPostingAuthorityConfirmed}
        />
      )}

      {step === 2 && (
        <CategoryPickerStep
          selectedIds={catalogue.categoryId ? [catalogue.categoryId] : []}
          onToggle={(id) => setCatalogue({ categoryId: id, tasks: [], otherTask: "", answers: {} })}
          questionLabel="What support is needed right now?"
        />
      )}

      {step === 3 && <TasksStep value={catalogue} onChange={patch(setCatalogue, catalogue)} showOtherTask />}

      {step === 4 && (
        <div className="space-y-4">
          <label className={lbl}>Where is the support needed?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={[
            { v: "HOME", l: "Participant's home" }, { v: "COMMUNITY", l: "In the community" },
            { v: "APPOINTMENT", l: "Appointment or activity" }, { v: "PICKUP_DROPOFF", l: "Pick-up/drop-off" }, { v: "OTHER", l: "Other" },
          ]} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb / postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Parramatta" /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          <div><label className={lbl}>Exact address *</label><p className="text-xs text-slate-400 mb-1">Kept private until confirmation.</p><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          {locationType !== "HOME" && (
            <div><label className={lbl}>Meeting or destination details</label><input className={inp} value={meetingDetails} onChange={(e) => setMeetingDetails(e.target.value)} /></div>
          )}
        </div>
      )}

      {step === 5 && (
        <RadioCards value={duration} onChange={setDuration} options={[
          { v: "30MIN", l: "30 minutes" }, { v: "1HR", l: "1 hour" }, { v: "2HR", l: "2 hours" },
          { v: "3HR", l: "3 hours" }, { v: "4HR_PLUS", l: "4+ hours" }, { v: "NOT_SURE", l: "Not sure" },
        ]} />
      )}

      {step === 6 && <RequirementsStep value={requirements} onChange={patch(setRequirements, requirements)} showWorkerChoice />}

      {step === 7 && <SafetyStep value={safety} onChange={patch(setSafety, safety)} />}

      {step === 8 && <FundingStep value={funding} onChange={patch(setFunding, funding)} />}

      {step === 9 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            <ReviewRow label="Arrival time and duration" value={`${timing === "ASAP" ? "As soon as possible" : new Date(chosenTime).toLocaleString("en-AU", { timeStyle: "short" })} · ${duration.replace("_", " ")}`} onEdit={() => setStep(5)} />
            <ReviewRow label="Service and essential tasks" value={`${category?.label ?? ""} — ${catalogue.tasks.join(", ") || catalogue.otherTask}`} onEdit={() => setStep(3)} />
            <ReviewRow label="General location" value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} onEdit={() => setStep(4)} />
            <ReviewRow label="Essential requirements" value={requirements.none ? "None" : "Selected"} onEdit={() => setStep(6)} />
            <ReviewRow label="Safety summary" value={safety.none ? "None" : "Selected"} onEdit={() => setStep(7)} />
            <ReviewRow label="Funding and rate" value={funding.fundingType || "Not specified"} onEdit={() => setStep(8)} />
          </div>
          <AddressReleaseNotice />
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="I agree the shown request details can be shared with suitable workers/providers" />
        </div>
      )}
    </WizardScreen>
  );
}
