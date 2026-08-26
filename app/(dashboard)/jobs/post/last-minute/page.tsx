"use client";

// Last-Minute Support journey (L-01..L-11 input/review) + L-12 live — support
// needed over 4 hours, up to 48 hours. See
// [[participant-posting-journeys-spec]] memory for the source spec.

import { useState } from "react";
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

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const TOTAL_STEPS = 11;

type TimingOption = "TODAY" | "TOMORROW" | "CHOOSE";
type LocationType = "HOME" | "COMMUNITY" | "APPOINTMENT" | "PICKUP_DROPOFF" | "MULTIPLE" | "OTHER";
const SHORT_NOTICE_REASONS = ["Cancellation", "Roster gap", "Appointment/change", "Family/carer unavailable", "Discharge/transition", "New need", "Other"];
const UPDATE_METHODS = ["Shiftify notifications", "SMS", "Email", "Contact the person posting this request", "Contact an authorised representative"];

export default function LastMinuteJourney() {
  const { activeRole } = useAuth();
  const isCoordinator = activeRole === "COORDINATOR";
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shiftPassBlocked, setShiftPassBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean } | null>(null);

  const [timingOption, setTimingOption] = useState<TimingOption>("TODAY");
  const [startDateTime, setStartDateTime] = useState("");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [locationType, setLocationType] = useState<LocationType>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [travelDetails, setTravelDetails] = useState("");
  const [durationHours, setDurationHours] = useState("2");
  const [flexible, setFlexible] = useState(false);
  const [flexWindow, setFlexWindow] = useState("");
  const [requirements, setRequirements] = useState<WorkerRequirements>(EMPTY_REQUIREMENTS);
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
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

  function validate(): string | null {
    if (step === 0 && !startDateTime) return "Choose a date/time within the next 48 hours.";
    if (step === 1 && isCoordinator && person.who !== "SOMEONE_ELSE" && person.who !== "EXISTING_PARTICIPANT") return "Select who this request is for.";
    if (step === 1 && isCoordinator && person.who === "EXISTING_PARTICIPANT" && !person.existingParticipantId) return "Select a participant.";
    if (step === 1 && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (step === 1 && isCoordinator && person.who === "EXISTING_PARTICIPANT" && person.existingParticipantIsConnection && !postingAuthorityConfirmed) return "Confirm you're authorised to post for this participant.";
    if (step === 2 && !catalogue.categoryId) return "Select a support category.";
    if (step === 3 && catalogue.tasks.length === 0) return "Select at least one task.";
    if (step === 4 && !suburb.trim()) return "Suburb/postcode is required.";
    if (step === 5 && (!startDateTime || !durationHours)) return "Date, start time and duration are required.";
    if (step === 6 && !requirements.workerOrProvider) return "Choose whether you'd like an independent worker, a provider, or either.";
    if (step === 9 && updateMethods.length === 0) return "Select at least one update method.";
    if (step === 10 && !agreeShare) return "Please confirm the information-sharing acknowledgement.";
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

  async function submitCommon(asDraft: boolean) {
    setSaving(true); setError(null); setShiftPassBlocked(false);
    try {
      const start = new Date(startDateTime);
      const end = new Date(start.getTime() + parseFloat(durationHours || "1") * 60 * 60 * 1000);
      const category = getCatalogueCategory(catalogue.categoryId);

      const body: Record<string, unknown> = {
        title: `${category?.label ?? "Support"} — Last-Minute Support`,
        description: note.trim() || `Last-Minute support request: ${category?.label ?? ""}`,
        category: catalogue.categoryId,
        urgency: "LAST_MINUTE",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours: parseFloat(durationHours || "1"),
        timeFlexibility: flexible ? (flexWindow || "FLEXIBLE_SLIGHT") : "EXACT",
        requestPurposeCategory: reason || undefined,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: travelDetails.trim() || undefined,
        selectedTasks: catalogue.tasks,
        workerPreferences: buildWorkerPreferencesPayload(requirements),
        visibilityTarget: requirements.workerOrProvider === "WORKER" ? "WORKERS_ONLY" : requirements.workerOrProvider === "PROVIDER" ? "PROVIDERS_ONLY" : "ALL",
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        contactPreferences: updateMethods.length ? { updateMethods, repName: repName || undefined, repContact: repContact || undefined } : undefined,
        asDraft,
      };
      if (person.who === "SOMEONE_ELSE") {
        body.inlineParticipant = { name: person.someoneElseName.trim(), phone: person.someoneElsePhone.trim() || undefined, suburb: suburb.trim() || undefined };
      } else if (person.who === "EXISTING_PARTICIPANT") {
        body.forParticipantUserId = person.existingParticipantId;
      }
      const res = await api.post<{ job: { id: string } }>("/jobs", body);
      setSubmitted({ id: res.job.id, isDraft: asDraft });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_LIMIT") {
        setShiftPassBlocked(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to post request.");
      }
    } finally { setSaving(false); }
  }

  async function submit() { return submitCommon(false); }

  if (submitted) return <LiveRequestScreen tier="LAST_MINUTE" tierLabel="Last-Minute Support" jobId={submitted.id} isDraft={submitted.isDraft} />;

  const category = getCatalogueCategory(catalogue.categoryId);
  const titles = [
    "When is support needed?", "Who needs this Last-Minute Support?", "What support is needed?", "What help is needed?",
    "Where will support take place?", "Confirm the schedule", "Who would be suitable?",
    "What should suitable workers/providers know?", "How will this support be paid for?",
    "How would you like updates?", "Check your Last-Minute Support request",
  ];

  return (
    <WizardScreen
      tierLabel="Last-Minute Support" screenTitle={titles[step]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next}
      belowError={shiftPassBlocked ? (
        <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); submit(); }} onDismiss={() => setShiftPassBlocked(false)} />
      ) : undefined}
      nextLabel={step === TOTAL_STEPS - 2 ? "Review Last-Minute request" : step === TOTAL_STEPS - 1 ? "Post Last-Minute request — Free" : "Continue"}
      saving={saving}
    >
      {step === 0 && (
        <div className="space-y-4">
          <label className={lbl}>When is support needed?</label>
          <RadioCards value={timingOption} onChange={setTimingOption} options={[
            { v: "TODAY", l: "Today" }, { v: "TOMORROW", l: "Tomorrow" }, { v: "CHOOSE", l: "Choose date/time within the next 48 hours" },
          ]} />
          <div>
            <label className={lbl}>Start time</label>
            <input type="datetime-local" className={inp} value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} />
          </div>
        </div>
      )}
      {step === 1 && (
        <PersonStep
          value={person} onChange={patch(setPerson, person)} tierLabel="Last-Minute Support" isCoordinator={isCoordinator}
          authorityConfirmed={postingAuthorityConfirmed} onAuthorityChange={setPostingAuthorityConfirmed}
        />
      )}
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
            <label className={lbl}>Reason (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SHORT_NOTICE_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${reason === r ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{r}</button>
              ))}
            </div>
            <textarea className={`${inp} h-auto py-2`} rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional participant note (max 400 characters)" />
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <label className={lbl}>Where will support take place?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={[
            { v: "HOME", l: "Participant's home" }, { v: "COMMUNITY", l: "In the community" },
            { v: "APPOINTMENT", l: "Appointment or activity" }, { v: "PICKUP_DROPOFF", l: "Pick-up/drop-off" },
            { v: "MULTIPLE", l: "Multiple locations" }, { v: "OTHER", l: "Other" },
          ]} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb/postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          <div><label className={lbl}>Private exact address</label><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div><label className={lbl}>Destination, travel distance, return trip or vehicle requirement</label><input className={inp} value={travelDetails} onChange={(e) => setTravelDetails(e.target.value)} /></div>
        </div>
      )}
      {step === 5 && (
        <div className="space-y-4">
          <div><label className={lbl}>Date *</label><input type="date" className={inp} value={startDateTime.slice(0, 10)} onChange={(e) => setStartDateTime(`${e.target.value}T${startDateTime.slice(11, 16) || "09:00"}`)} /></div>
          <div><label className={lbl}>Start time *</label><input type="time" className={inp} value={startDateTime.slice(11, 16)} onChange={(e) => setStartDateTime(`${startDateTime.slice(0, 10) || new Date().toISOString().slice(0, 10)}T${e.target.value}`)} /></div>
          <div className="w-40"><label className={lbl}>Duration (hours) *</label><input type="number" min="0.5" step="0.5" className={inp} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} /></div>
          <CheckboxRow checked={flexible} onChange={setFlexible} label="Flexible start time" />
          {flexible && <div><label className={lbl}>Acceptable time window</label><input className={inp} value={flexWindow} onChange={(e) => setFlexWindow(e.target.value)} placeholder="e.g. 9am–11am" /></div>}
        </div>
      )}
      {step === 6 && (
        <RequirementsStep value={requirements} onChange={patch(setRequirements, requirements)} showWorkerChoice
          questionLabel="Who would be suitable?" genderLabel="Worker gender preference"
          languageLabel="Language/Auslan" qualificationLabel="Qualifications/training" />
      )}
      {step === 7 && <SafetyStep value={safety} onChange={patch(setSafety, safety)} questionLabel="What should suitable workers/providers know?" />}
      {step === 8 && <FundingStep value={funding} onChange={patch(setFunding, funding)} />}
      {step === 9 && (
        <div className="space-y-4">
          <label className={lbl}>How would you like updates?</label>
          <div className="space-y-2">
            {UPDATE_METHODS.map((m) => (
              <CheckboxRow key={m} checked={updateMethods.includes(m)} onChange={() => toggleUpdateMethod(m)} label={m} />
            ))}
          </div>
          {updateMethods.includes("Contact an authorised representative") && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <input className={inp} value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Representative name" />
              <input className={inp} value={repContact} onChange={(e) => setRepContact(e.target.value)} placeholder="Mobile or email" />
            </div>
          )}
        </div>
      )}
      {step === 10 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            <ReviewRow label="Schedule" value={startDateTime ? `${new Date(startDateTime).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} · ${durationHours} hours` : ""} onEdit={() => setStep(5)} />
            <ReviewRow label="Service/tasks" value={`${category?.label ?? ""} — ${catalogue.tasks.join(", ")}`} onEdit={() => setStep(3)} />
            <ReviewRow label="Location/travel" value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} onEdit={() => setStep(4)} />
            <ReviewRow label="Worker requirements" value={requirements.workerOrProvider ?? "Not specified"} onEdit={() => setStep(6)} />
            <ReviewRow label="Safety/support summary" value={safety.none ? "None" : "Selected"} onEdit={() => setStep(7)} />
            <ReviewRow label="Funding/rate" value={funding.fundingType || "Not specified"} onEdit={() => setStep(8)} />
            <ReviewRow label="Contact method" value={updateMethods.join(", ")} onEdit={() => setStep(9)} />
          </div>
          <AddressReleaseNotice />
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="Information-sharing acknowledgement — I agree the shown details can be shared with suitable workers/providers" />
          <div className="flex justify-end">
            <button type="button" onClick={() => void submitCommon(true)} className="text-xs text-brand-700 underline">Save and finish later</button>
          </div>
        </div>
      )}
    </WizardScreen>
  );
}
