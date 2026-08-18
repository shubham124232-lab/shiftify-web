"use client";

// Urgent Support journey (U-01..U-10 input/review) + U-11 live — support
// needed over 60 minutes, up to 4 hours. See
// [[participant-posting-journeys-spec]] memory for the source spec.

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  WizardScreen, RadioCards, PersonStep, CategoryPickerStep, TasksStep, SafetyStep, RequirementsStep, FundingStep,
  ReviewRow, LiveRequestScreen, CheckboxRow, inp, lbl,
  buildWorkerPreferencesPayload, buildSafetyFlagsPayload, buildFundingPayload,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  EMPTY_PERSON, EMPTY_CATALOGUE, EMPTY_REQUIREMENTS, EMPTY_SAFETY, EMPTY_FUNDING,
  type PersonReceivingSupport, type CatalogueSelection, type WorkerRequirements, type SafetyChecklist, type FundingChoice,
} from "@/lib/types/posting";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const TOTAL_STEPS = 10;

type LocationType = "HOME" | "COMMUNITY" | "APPOINTMENT" | "PICKUP_DROPOFF" | "OTHER";
type Duration = "30MIN" | "1HR" | "2HR" | "3HR" | "4HR" | "OTHER";
const DURATION_HOURS: Record<Duration, number | undefined> = { "30MIN": 0.5, "1HR": 1, "2HR": 2, "3HR": 3, "4HR": 4, OTHER: undefined };

const SHORT_NOTICE_REASONS = [
  "Worker cancelled", "Unexpected need", "Appointment changed", "Family/carer unavailable", "Discharge/transition", "Other",
];

export default function UrgentJourney() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean } | null>(null);

  const [startTime, setStartTime] = useState("");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
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

  function patch<T>(setter: (v: T) => void, current: T) {
    return (p: Partial<T>) => setter({ ...current, ...p });
  }

  function validate(): string | null {
    if (step === 0 && !startTime) return "Choose a start time (more than 60 minutes and within 4 hours from now).";
    if (step === 1 && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (step === 2 && !catalogue.categoryId) return "Select a support category.";
    if (step === 3 && catalogue.tasks.length === 0) return "Select at least one task.";
    if (step === 4 && !suburb.trim()) return "Suburb is required.";
    if (step === 9 && !agreeShare) return "Please confirm the information-sharing acknowledgement.";
    return null;
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === TOTAL_STEPS - 1) { void submit(); return; }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() { setError(null); setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit() {
    setSaving(true); setError(null);
    try {
      const start = new Date(startTime);
      const durationHours = DURATION_HOURS[duration] ?? 1;
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      const category = getCatalogueCategory(catalogue.categoryId);

      const body: Record<string, unknown> = {
        title: `${category?.label ?? "Support"} — Urgent Support`,
        description: note.trim() || `Urgent support request: ${category?.label ?? ""}`,
        category: catalogue.categoryId,
        urgency: "SAME_DAY",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours: DURATION_HOURS[duration],
        requestPurposeCategory: reason || undefined,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: meetingDetails.trim() || undefined,
        selectedTasks: catalogue.tasks,
        workerPreferences: buildWorkerPreferencesPayload(requirements),
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        asDraft: false,
      };
      if (person.who === "SOMEONE_ELSE") {
        body.inlineParticipant = { name: person.someoneElseName.trim(), phone: person.someoneElsePhone.trim() || undefined, suburb: suburb.trim() || undefined };
      }
      const res = await api.post<{ job: { id: string } }>("/jobs", body);
      setSubmitted({ id: res.job.id, isDraft: false });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to post request.");
    } finally { setSaving(false); }
  }

  if (submitted) return <LiveRequestScreen tier="URGENT" tierLabel="Urgent Support" jobId={submitted.id} isDraft={submitted.isDraft} />;

  const category = getCatalogueCategory(catalogue.categoryId);
  const titles = [
    "When should support start?", "Who needs this Urgent Support?", "What support is needed?", "What help is needed during this support?",
    "Where is the support needed?", "Confirm the time and length", "Which requirements are essential?",
    "What must a worker know before responding?", "How will this support be paid for?", "Check your Urgent Support request",
  ];
  return (
    <WizardScreen
      tierLabel="Urgent Support" screenTitle={titles[step]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next}
      nextLabel={step === TOTAL_STEPS - 2 ? "Review Urgent request" : step === TOTAL_STEPS - 1 ? "Post Urgent request — Free" : "Continue"}
      saving={saving}
    >
      {step === 0 && (
        <div>
          <label className={lbl}>Today — choose a time more than 60 minutes and within 4 hours</label>
          <input type="datetime-local" className={inp} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
      )}
      {step === 1 && <PersonStep value={person} onChange={patch(setPerson, person)} tierLabel="Urgent Support" />}
      {step === 2 && (
        <CategoryPickerStep
          selectedIds={catalogue.categoryId ? [catalogue.categoryId] : []}
          onToggle={(id) => setCatalogue({ categoryId: id, tasks: [], otherTask: "", answers: {} })}
        />
      )}
      {step === 3 && (
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
      {step === 4 && (
        <div className="space-y-4">
          <label className={lbl}>Where is the support needed?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={[
            { v: "HOME", l: "Participant's home" }, { v: "COMMUNITY", l: "In the community" },
            { v: "APPOINTMENT", l: "Appointment or activity" }, { v: "PICKUP_DROPOFF", l: "Pick-up/drop-off" }, { v: "OTHER", l: "Other" },
          ]} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb/postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          <div><label className={lbl}>Exact private address</label><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div><label className={lbl}>Meeting point, destination or return-trip details</label><input className={inp} value={meetingDetails} onChange={(e) => setMeetingDetails(e.target.value)} /></div>
        </div>
      )}
      {step === 5 && (
        <div className="space-y-4">
          <div><label className={lbl}>Start time (confirmed above)</label><input type="datetime-local" className={inp} value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
          <RadioCards value={duration} onChange={setDuration} options={[
            { v: "30MIN", l: "30 minutes" }, { v: "1HR", l: "1 hour" }, { v: "2HR", l: "2 hours" },
            { v: "3HR", l: "3 hours" }, { v: "4HR", l: "4 hours" }, { v: "OTHER", l: "Other duration / end time not known" },
          ]} />
        </div>
      )}
      {step === 6 && (
        <RequirementsStep value={requirements} onChange={patch(setRequirements, requirements)}
          questionLabel="Which requirements are essential?" genderLabel="Worker gender required"
          languageLabel="Language/Auslan" qualificationLabel="Qualification or participant-specific training" />
      )}
      {step === 7 && <SafetyStep value={safety} onChange={patch(setSafety, safety)} questionLabel="What must a worker know before responding?" />}
      {step === 8 && <FundingStep value={funding} onChange={patch(setFunding, funding)} />}
      {step === 9 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            <ReviewRow label="Date, start time and duration" value={startTime ? new Date(startTime).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : ""} />
            <ReviewRow label="Service, subcategory and tasks" value={`${category?.label ?? ""} — ${catalogue.tasks.join(", ")}`} />
            <ReviewRow label="Location" value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} />
            <ReviewRow label="Essential requirements" value={requirements.none ? "None" : "Selected"} />
            <ReviewRow label="Safety summary" value={safety.none ? "None" : "Selected"} />
            <ReviewRow label="Funding and rate" value={funding.fundingType || "Not specified"} />
          </div>
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="Information-sharing acknowledgement — I agree the shown details can be shared with suitable workers/providers" />
        </div>
      )}
    </WizardScreen>
  );
}
