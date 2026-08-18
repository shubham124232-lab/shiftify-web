"use client";

// Routine Support journey (O-01..O-13 input/review) + O-14 live — support
// needed more than 48 hours ahead, one-time or recurring. The most detailed
// journey. See [[participant-posting-journeys-spec]] memory for the source spec.

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  WizardScreen, RadioCards, PersonStep, CategoryPickerStep, MultiCategoryTasksStep, SafetyStep,
  FundingTypeStep, RateStep, RoutineWorkerStep, RoutinePreferencesStep,
  ReviewRow, LiveRequestScreen, CheckboxRow, inp, lbl,
  buildSafetyFlagsPayload, buildFundingPayload, buildRoutinePreferencesPayload,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  EMPTY_PERSON, EMPTY_MULTI_CATALOGUE, EMPTY_SAFETY, EMPTY_FUNDING, EMPTY_ROUTINE_PREFERENCES,
  type PersonReceivingSupport, type MultiCatalogueSelection, type SafetyChecklist, type FundingChoice,
  type RoutineWorkerChoice, type RoutinePreferences, type RoutinePreferenceKey,
} from "@/lib/types/posting";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const TOTAL_STEPS = 13; // O-01..O-12 input steps + O-13 review

type Pattern = "ONE_TIME" | "ONGOING" | "MULTIPLE_DATES";
type LocationType = "HOME" | "COMMUNITY" | "APPOINTMENT" | "PICKUP_DROPOFF" | "MULTIPLE" | "OTHER";
const RESPONSE_METHODS = ["Send availability and rate", "Send a short introduction", "Answer screening questions", "Message through Shiftify", "Request a call after shortlisting"];
const SCREENING_QUESTIONS = ["Experience", "Training", "Vehicle", "Availability", "Continuity"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface OneOffDate { date: string; startTime: string; durationHours: string }

export default function RoutineJourney() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean } | null>(null);

  const [pattern, setPattern] = useState<Pattern>("ONE_TIME");
  const [person, setPerson] = useState<PersonReceivingSupport>(EMPTY_PERSON);
  const [catalogue, setCatalogue] = useState<MultiCatalogueSelection>(EMPTY_MULTI_CATALOGUE);

  // Schedule — shape depends on `pattern`.
  const [oneTimeDate, setOneTimeDate] = useState("");
  const [oneTimeDuration, setOneTimeDuration] = useState("2");
  const [ongoingStartDate, setOngoingStartDate] = useState("");
  const [ongoingDays, setOngoingDays] = useState<string[]>([]);
  const [ongoingStartTime, setOngoingStartTime] = useState("");
  const [ongoingHoursPerVisit, setOngoingHoursPerVisit] = useState("2");
  const [ongoingFrequency, setOngoingFrequency] = useState("WEEKLY");
  const [ongoingEndDate, setOngoingEndDate] = useState("");
  const [multipleDates, setMultipleDates] = useState<OneOffDate[]>([{ date: "", startTime: "", durationHours: "2" }]);
  const [scheduleFlexible, setScheduleFlexible] = useState(false);

  const [locationType, setLocationType] = useState<LocationType>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [travelDetails, setTravelDetails] = useState("");
  const [routineWorker, setRoutineWorker] = useState<RoutineWorkerChoice>("");
  const [routinePrefs, setRoutinePrefs] = useState<RoutinePreferences>(EMPTY_ROUTINE_PREFERENCES);
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
  const [responseMethods, setResponseMethods] = useState<string[]>([]);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [agreeShare, setAgreeShare] = useState(false);

  function patch<T>(setter: (v: T) => void, current: T) {
    return (p: Partial<T>) => setter({ ...current, ...p });
  }
  function toggleDay(d: string) { setOngoingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])); }
  function toggleResponseMethod(m: string) { setResponseMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])); }
  function toggleScreeningQuestion(q: string) { setScreeningQuestions((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q])); }
  function toggleCategory(id: string) {
    setCatalogue((prev) => prev.categoryIds.includes(id)
      ? { ...prev, categoryIds: prev.categoryIds.filter((c) => c !== id) }
      : { ...prev, categoryIds: [...prev.categoryIds, id] });
  }
  function onRoutinePrefChange(key: RoutinePreferenceKey, v: Partial<RoutinePreferences[RoutinePreferenceKey]>) {
    setRoutinePrefs((prev) => ({ ...prev, [key]: { ...prev[key], ...v } }));
  }

  function validate(): string | null {
    if (step === 1 && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (step === 2 && catalogue.categoryIds.length === 0) return "Select at least one support service.";
    if (step === 3 && Object.values(catalogue.tasksByCategory).every((t) => t.length === 0)) return "Select at least one task.";
    if (step === 4) {
      if (pattern === "ONE_TIME" && !oneTimeDate) return "Choose a date and start time.";
      if (pattern === "ONGOING" && (!ongoingStartDate || ongoingDays.length === 0 || !ongoingStartTime)) return "Fill in the start date, days, and start time.";
      if (pattern === "MULTIPLE_DATES" && multipleDates.some((d) => !d.date || !d.startTime)) return "Fill in every date's start time.";
    }
    if (step === 5 && !suburb.trim()) return "Suburb/postcode is required.";
    if (step === 6 && !routineWorker) return "Choose who you're looking for.";
    if (step === 9 && !funding.fundingType) return "Choose how this support will be paid for.";
    if (step === 10 && !funding.rateChoice) return "Choose how you'd like to set the rate.";
    if (step === 11 && responseMethods.length === 0) return "Select at least one response method.";
    if (step === 12 && !agreeShare) return "Please confirm the information-sharing acknowledgement.";
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

  function firstStartEnd(): { start: Date; end: Date; totalHours?: number } {
    if (pattern === "ONE_TIME") {
      const start = new Date(oneTimeDate);
      const hours = parseFloat(oneTimeDuration || "1");
      return { start, end: new Date(start.getTime() + hours * 3600000), totalHours: hours };
    }
    if (pattern === "MULTIPLE_DATES") {
      const first = multipleDates[0];
      const start = new Date(`${first.date}T${first.startTime}`);
      const hours = parseFloat(first.durationHours || "1");
      return { start, end: new Date(start.getTime() + hours * 3600000), totalHours: hours };
    }
    const start = new Date(`${ongoingStartDate}T${ongoingStartTime}`);
    const hours = parseFloat(ongoingHoursPerVisit || "1");
    return { start, end: new Date(start.getTime() + hours * 3600000), totalHours: hours };
  }

  async function submitCommon(asDraft: boolean) {
    setSaving(true); setError(null);
    try {
      const { start, end, totalHours } = firstStartEnd();
      const primaryCategoryId = catalogue.categoryIds[0];
      const primaryCategory = getCatalogueCategory(primaryCategoryId);
      const recurrencePattern =
        pattern === "ONE_TIME" ? { type: "ONE_TIME", flexible: scheduleFlexible }
        : pattern === "MULTIPLE_DATES" ? { type: "MULTIPLE_DATES", dates: multipleDates, flexible: scheduleFlexible }
        : { type: "ONGOING", days: ongoingDays, frequency: ongoingFrequency, hoursPerVisit: ongoingHoursPerVisit, endDate: ongoingEndDate || undefined, flexible: scheduleFlexible };

      const selectedTasks = {
        primaryCategory: primaryCategoryId,
        categories: catalogue.categoryIds.map((id) => ({
          id,
          label: getCatalogueCategory(id)?.label,
          tasks: catalogue.tasksByCategory[id] ?? [],
          answers: catalogue.answersByCategory[id] ?? {},
        })),
        // Goals go here (not supportGoal) — that column caps at 80 characters
        // and several goals joined together can easily exceed it.
        goals: catalogue.goals.length ? catalogue.goals : undefined,
      };

      const workerPreferences = {
        workerOrProvider: routineWorker || undefined,
        matchPreferences: buildRoutinePreferencesPayload(routinePrefs),
      };

      const body: Record<string, unknown> = {
        title: `${primaryCategory?.label ?? "Support"} — Routine Support`,
        description: catalogue.description.trim() || `Routine support request: ${primaryCategory?.label ?? ""}`,
        supportGoal: catalogue.goals[0]?.slice(0, 80) || undefined,
        category: primaryCategoryId,
        urgency: "SCHEDULED",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours,
        isRecurring: pattern !== "ONE_TIME",
        recurrencePattern,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: travelDetails.trim() || undefined,
        selectedTasks,
        workerPreferences,
        visibilityTarget: routineWorker === "WORKER" || routineWorker === "ONE_REGULAR" || routineWorker === "SMALL_TEAM" ? "WORKERS_ONLY" : routineWorker === "PROVIDER" ? "PROVIDERS_ONLY" : "ALL",
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        responsePreferences: responseMethods.length ? { responseMethods, screeningQuestions: screeningQuestions.length ? screeningQuestions : undefined } : undefined,
        asDraft,
      };
      if (person.who === "SOMEONE_ELSE") {
        body.inlineParticipant = { name: person.someoneElseName.trim(), phone: person.someoneElsePhone.trim() || undefined, suburb: suburb.trim() || undefined };
      }
      const res = await api.post<{ job: { id: string } }>("/jobs", body);
      setSubmitted({ id: res.job.id, isDraft: asDraft });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to post request.");
    } finally { setSaving(false); }
  }
  async function submit() { return submitCommon(false); }

  if (submitted) return <LiveRequestScreen tier="ROUTINE" tierLabel="Routine Support" jobId={submitted.id} isDraft={submitted.isDraft} />;

  const primaryCategory = getCatalogueCategory(catalogue.categoryIds[0]);
  const titles = [
    "What type of Routine Support do you need?", "Who needs this Routine Support?", "What support is needed?", "What would you like support with?",
    "When is support needed?", "Where will support take place?", "Who are you looking for?", "What matters for a good match?",
    "What information is relevant to providing support safely?",
    "How will this support be paid for?", "How would you like to set the rate?", "How should professionals respond?", "Check your Routine Support request",
  ];

  return (
    <WizardScreen
      tierLabel="Routine Support" screenTitle={titles[step]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next}
      nextLabel={step === TOTAL_STEPS - 1 ? "Post Routine request — Free" : "Continue"}
      saving={saving}
    >
      {step === 0 && (
        <RadioCards value={pattern} onChange={setPattern} options={[
          { v: "ONE_TIME", l: "One-time support" }, { v: "ONGOING", l: "Ongoing regular support" }, { v: "MULTIPLE_DATES", l: "Several dates that do not repeat" },
        ]} />
      )}
      {step === 1 && <PersonStep value={person} onChange={patch(setPerson, person)} tierLabel="Routine Support" />}
      {step === 2 && (
        <CategoryPickerStep
          selectedIds={catalogue.categoryIds}
          onToggle={toggleCategory}
          multi
          questionLabel="What support is needed?"
        />
      )}
      {step === 3 && <MultiCategoryTasksStep value={catalogue} onChange={patch(setCatalogue, catalogue)} />}
      {step === 4 && (
        <div className="space-y-4">
          {pattern === "ONE_TIME" && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date &amp; start time *</label><input type="datetime-local" className={inp} value={oneTimeDate} onChange={(e) => setOneTimeDate(e.target.value)} /></div>
              <div><label className={lbl}>Duration (hours)</label><input type="number" min="0.5" step="0.5" className={inp} value={oneTimeDuration} onChange={(e) => setOneTimeDuration(e.target.value)} /></div>
            </div>
          )}
          {pattern === "ONGOING" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Start date *</label><input type="date" className={inp} value={ongoingStartDate} onChange={(e) => setOngoingStartDate(e.target.value)} /></div>
                <div><label className={lbl}>Start time / time window *</label><input type="time" className={inp} value={ongoingStartTime} onChange={(e) => setOngoingStartTime(e.target.value)} /></div>
              </div>
              <div>
                <label className={lbl}>Days of week *</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)} className={`h-9 w-12 rounded-lg border text-sm font-medium transition-colors ${ongoingDays.includes(d) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Hours per visit</label><input type="number" min="0.5" step="0.5" className={inp} value={ongoingHoursPerVisit} onChange={(e) => setOngoingHoursPerVisit(e.target.value)} /></div>
                <div>
                  <label className={lbl}>Frequency</label>
                  <select className={inp} value={ongoingFrequency} onChange={(e) => setOngoingFrequency(e.target.value)}>
                    <option value="WEEKLY">Weekly</option><option value="FORTNIGHTLY">Fortnightly</option><option value="MONTHLY">Monthly</option><option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div><label className={lbl}>End date (optional)</label><input type="date" className={inp} value={ongoingEndDate} onChange={(e) => setOngoingEndDate(e.target.value)} /></div>
              </div>
            </div>
          )}
          {pattern === "MULTIPLE_DATES" && (
            <div className="space-y-3">
              {multipleDates.map((d, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-end">
                  <div><label className={lbl}>Date</label><input type="date" className={inp} value={d.date} onChange={(e) => setMultipleDates((prev) => prev.map((x, xi) => xi === i ? { ...x, date: e.target.value } : x))} /></div>
                  <div><label className={lbl}>Start time</label><input type="time" className={inp} value={d.startTime} onChange={(e) => setMultipleDates((prev) => prev.map((x, xi) => xi === i ? { ...x, startTime: e.target.value } : x))} /></div>
                  <div><label className={lbl}>Duration (hrs)</label><input type="number" min="0.5" step="0.5" className={inp} value={d.durationHours} onChange={(e) => setMultipleDates((prev) => prev.map((x, xi) => xi === i ? { ...x, durationHours: e.target.value } : x))} /></div>
                </div>
              ))}
              <button type="button" onClick={() => setMultipleDates((prev) => [...prev, { date: "", startTime: "", durationHours: "2" }])} className="text-xs text-brand-700 underline">+ Add another date</button>
            </div>
          )}
          <CheckboxRow checked={scheduleFlexible} onChange={setScheduleFlexible} label="Flexible dates/times" />
        </div>
      )}
      {step === 5 && (
        <div className="space-y-4">
          <label className={lbl}>Where will support take place?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={[
            { v: "HOME", l: "Participant's home" }, { v: "COMMUNITY", l: "In the community" },
            { v: "APPOINTMENT", l: "Appointment/activity" }, { v: "PICKUP_DROPOFF", l: "Pick-up/drop-off" },
            { v: "MULTIPLE", l: "Multiple regular locations" }, { v: "OTHER", l: "Other" },
          ]} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb/postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          <div><label className={lbl}>Exact private address</label><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div><label className={lbl}>Destinations, usual travel distance, return trip, vehicle needs</label><input className={inp} value={travelDetails} onChange={(e) => setTravelDetails(e.target.value)} /></div>
        </div>
      )}
      {step === 6 && <RoutineWorkerStep value={routineWorker} onChange={setRoutineWorker} />}
      {step === 7 && <RoutinePreferencesStep value={routinePrefs} onChange={onRoutinePrefChange} />}
      {step === 8 && <SafetyStep value={safety} onChange={patch(setSafety, safety)} questionLabel="What information is relevant to providing support safely?" routineExtras />}
      {step === 9 && <FundingTypeStep value={funding} onChange={patch(setFunding, funding)} />}
      {step === 10 && <RateStep value={funding} onChange={patch(setFunding, funding)} />}
      {step === 11 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={lbl}>How should professionals respond?</label>
            {RESPONSE_METHODS.map((m) => (
              <CheckboxRow key={m} checked={responseMethods.includes(m)} onChange={() => toggleResponseMethod(m)} label={m} />
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <label className={lbl}>Optional screening questions</label>
            <div className="flex flex-wrap gap-2">
              {SCREENING_QUESTIONS.map((q) => (
                <button key={q} type="button" onClick={() => toggleScreeningQuestion(q)}
                  className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${screeningQuestions.includes(q) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{q}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 12 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            <ReviewRow label="Pattern and schedule" value={pattern.replace("_", " ")} />
            <ReviewRow label="Services/tasks/goals" value={`${catalogue.categoryIds.map((id) => getCatalogueCategory(id)?.label).join(", ")} — ${catalogue.goals.join(", ")}`} />
            <ReviewRow label="Locations/travel" value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} />
            <ReviewRow label="Worker/provider preferences" value={routineWorker || "Not specified"} />
            <ReviewRow label="Safety/support summary" value={safety.none ? "None" : "Selected"} />
            <ReviewRow label="Funding/rate" value={funding.fundingType || "Not specified"} />
            <ReviewRow label="Response method" value={responseMethods.join(", ")} />
          </div>
          <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="Information-sharing acknowledgement — I agree the shown details can be shared with suitable workers/providers" />
          <div className="flex justify-end">
            <button type="button" onClick={() => void submitCommon(true)} className="text-xs text-brand-700 underline">Save and finish later</button>
          </div>
        </div>
      )}
    </WizardScreen>
  );
}
