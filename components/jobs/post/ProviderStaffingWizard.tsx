"use client";

// Dedicated Provider staffing-request journey (Provider Complete User Journey, Journeys 5–7).
// It is deliberately NOT the Participant/Coordinator wizard: the Provider document defines five
// sections — PR-R01 When and where, PR-R02 Support required, PR-R03 Essential worker requirements,
// PR-R04 Rate and engagement, PR-R05 Safety, consent and review (+ PR-C01 confirmation) — and the
// documented differences for Urgent (PR-U01), Last-Minute (PR-L01) and Routine (PR-O01).

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  WizardScreen, RadioCards, CheckboxRow, ReviewRow, LiveRequestScreen, ShiftPassPrompt, AddressReleaseNotice,
  CategoryPickerStep, TasksStep, RequirementsStep, SafetyStep, ProviderRateStep, ProviderSafetyExtras,
  ProviderVisibilityPreview, ProviderAuthorityConfirm, providerRateSummary, requirementsSummary, safetySummary,
  hasRequirementsChoice, hasSafetyChoice, providerContextError, applyProviderContext,
  buildWorkerPreferencesPayload, buildSafetyFlagsPayload, buildFundingPayload, buildSelectedTasksPayload,
  inp, lbl,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  TIER_META, EMPTY_CATALOGUE, EMPTY_REQUIREMENTS, EMPTY_SAFETY, EMPTY_FUNDING, EMPTY_PROVIDER_CONTEXT,
  type PostingTier, type CatalogueSelection, type WorkerRequirements, type SafetyChecklist, type FundingChoice, type ProviderContext,
} from "@/lib/types/posting";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type SectionKey = "when" | "support" | "requirements" | "rate" | "review";
const SECTIONS: SectionKey[] = ["when", "support", "requirements", "rate", "review"];

const SECTION_TITLES: Record<SectionKey, string> = {
  when: "When and where",
  support: "Support required",
  requirements: "Essential worker requirements",
  rate: "Rate and engagement",
  review: "Safety, consent and review",
};

const DURATION_OPTIONS = [
  { v: "0.5", l: "30 minutes" }, { v: "1", l: "1 hour" }, { v: "2", l: "2 hours" }, { v: "3", l: "3 hours" },
  { v: "4", l: "4 hours" }, { v: "6", l: "6 hours" }, { v: "8", l: "8 hours" }, { v: "OTHER", l: "Other" },
];

const SUPPORT_NEEDS = [
  { v: "PERSONAL_CARE", l: "Personal care" },
  { v: "MOBILITY_MANUAL_HANDLING", l: "Mobility / manual handling" },
  { v: "MEDICATION", l: "Medication assistance" },
];
const LOGISTICS_NEEDS = [
  { v: "TRANSPORT", l: "Transport" },
  { v: "OVERNIGHT", l: "Overnight" },
  { v: "ACTIVE_NIGHT", l: "Active night" },
  { v: "SLEEPOVER", l: "Sleepover" },
];
const AGE_GROUPS = [
  { v: "CHILD", l: "Child" }, { v: "TEENAGER", l: "Teenager" }, { v: "ADULT", l: "Adult" }, { v: "OLDER_ADULT", l: "Older adult" },
];
const SCREENING_CHECKS = ["NDIS Worker Screening Check", "Working With Children Check", "Police check"];
const INTRO_STEPS = ["Phone introduction", "Meet and greet", "Interview", "Trial shift"];

const ARRIVAL_WINDOWS: Record<"RAPID" | "URGENT", { v: string; l: string }[]> = {
  RAPID: [{ v: "15", l: "Within 15 minutes of start" }, { v: "30", l: "Within 30 minutes of start" }, { v: "60", l: "Within 60 minutes of start" }],
  URGENT: [{ v: "30", l: "Within 30 minutes of start" }, { v: "60", l: "Within 1 hour of start" }, { v: "120", l: "Within 2 hours of start" }, { v: "240", l: "Anytime within the 4-hour window" }],
};

const COVER_REASONS = [
  { v: "SICK_LEAVE", l: "Sick leave" }, { v: "ANNUAL_LEAVE", l: "Annual leave" }, { v: "WORKER_CANCELLED", l: "Worker cancelled" },
  { v: "ROSTER_GAP", l: "Roster gap" }, { v: "ADDITIONAL_DEMAND", l: "Additional participant demand" }, { v: "OTHER", l: "Other" },
];

const TIER_NAME: Record<PostingTier, string> = { RAPID: "Rapid", URGENT: "Urgent", LAST_MINUTE: "Last-Minute", ROUTINE: "Routine" };

// Minutes from now → [min, max] the start must fall in for each tier (PR-P01).
const START_WINDOW: Record<PostingTier, { min: number; max: number; msg: string }> = {
  RAPID: { min: -1, max: 60, msg: "Rapid must start within 60 minutes. For a later start choose Urgent, Last-Minute or Routine." },
  URGENT: { min: 60, max: 240, msg: "Urgent starts after 60 minutes and within 4 hours. Choose Rapid for sooner or Last-Minute for later." },
  LAST_MINUTE: { min: 240, max: 48 * 60, msg: "Last-Minute starts after 4 hours and within 48 hours. Choose Urgent for sooner or Routine for later." },
  ROUTINE: { min: 48 * 60, max: Number.POSITIVE_INFINITY, msg: "Routine starts more than 48 hours from now. Choose Last-Minute for sooner." },
};

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function localInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ProviderStaffingWizard({ tier }: { tier: PostingTier }) {
  const name = TIER_NAME[tier];
  const tierLabel = TIER_META[tier].label;
  const [step, setStep] = useState(0);
  const key = SECTIONS[step];
  const goTo = (k: SectionKey) => setStep(SECTIONS.indexOf(k));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shiftPassBlocked, setShiftPassBlocked] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean; verificationRequired: boolean } | null>(null);
  const [allowance, setAllowance] = useState<{ applies: boolean; remaining: number; limit: number } | null>(null);

  // PR-R01 — when
  const [timing, setTiming] = useState<"ASAP" | "CHOOSE">("ASAP");
  const [startAt, setStartAt] = useState("");
  const [arrivalWindow, setArrivalWindow] = useState(tier === "RAPID" ? "30" : "60");
  const [duration, setDuration] = useState("2");
  const [otherHours, setOtherHours] = useState("");
  const [altTimes, setAltTimes] = useState("");
  const [reason, setReason] = useState("");
  const [flexible, setFlexible] = useState<"EXACT" | "FLEXIBLE">("EXACT");
  const [flexNote, setFlexNote] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  // PR-O01 — routine
  const [pattern, setPattern] = useState<"ONE_OFF" | "RECURRING">("ONE_OFF");
  const [days, setDays] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [endDate, setEndDate] = useState("");
  const [openEnded, setOpenEnded] = useState(false);
  const [consistency, setConsistency] = useState<"ONE_REGULAR" | "SMALL_TEAM" | "NO_PREFERENCE">("NO_PREFERENCE");
  const [serviceGoals, setServiceGoals] = useState("");
  const [introSteps, setIntroSteps] = useState<string[]>([]);
  // PR-R01 — where
  const [locationType, setLocationType] = useState("HOME");
  const [delivery, setDelivery] = useState<"IN_PERSON" | "REMOTE">("IN_PERSON");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [travelRadiusKm, setTravelRadiusKm] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [meetingDetails, setMeetingDetails] = useState("");
  // PR-R02 — support
  const [catalogue, setCatalogue] = useState<CatalogueSelection>(EMPTY_CATALOGUE);
  const [ageGroup, setAgeGroup] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [behaviour, setBehaviour] = useState(false);
  const [behaviourDetail, setBehaviourDetail] = useState("");
  const [logistics, setLogistics] = useState<string[]>([]);
  // PR-R03 — requirements
  const [requirements, setRequirements] = useState<WorkerRequirements>(EMPTY_REQUIREMENTS);
  const [training, setTraining] = useState(false);
  const [trainingDetail, setTrainingDetail] = useState("");
  const [screening, setScreening] = useState<string[]>([]);
  // PR-R04 — rate
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
  // PR-R05 — safety, consent
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [environmental, setEnvironmental] = useState("");
  const [safetyCtx, setSafetyCtx] = useState<ProviderContext>(EMPTY_PROVIDER_CONTEXT);
  const [authority, setAuthority] = useState(false);
  const [agreeShare, setAgreeShare] = useState(false);

  useEffect(() => {
    // A paid organisation plan has unlimited core actions, so the once-only counter only applies without one.
    Promise.all([
      api.get<{ allowance: { applies: boolean; remaining: number; limit: number } }>("/subscriptions/me/allowance"),
      api.get<{ capacity: unknown | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
    ])
      .then(([r, cap]) => setAllowance(cap.capacity ? null : r.allowance))
      .catch(() => setAllowance(null));
  }, []);

  const hours = duration === "OTHER" ? parseFloat(otherHours) : parseFloat(duration);
  const effectiveStart = (): Date | null => {
    if (tier === "RAPID" && timing === "ASAP") return new Date();
    return startAt ? new Date(startAt) : null;
  };

  function validate(): string | null {
    if (key === "when") {
      const start = effectiveStart();
      if (!start || Number.isNaN(start.getTime())) return tier === "ROUTINE" ? "Choose the expected commencement date and time." : "Choose when the support starts.";
      const mins = (start.getTime() - Date.now()) / 60000;
      const w = START_WINDOW[tier];
      if (mins < w.min - (tier === "RAPID" ? 0 : 0) || mins > w.max) return w.msg;
      if (!(hours > 0)) return tier === "ROUTINE" && pattern === "RECURRING" ? "Enter the hours per visit." : "Enter the expected duration.";
      if (tier === "LAST_MINUTE" && !reason) return "Select the reason for cover.";
      if (tier === "ROUTINE" && pattern === "RECURRING" && days.length === 0) return "Select the days of the recurring schedule.";
      if (!suburb.trim()) return "Enter the general suburb.";
      if (responseDeadline) {
        const d = new Date(responseDeadline).getTime();
        if (Number.isNaN(d) || d < Date.now()) return "The response deadline must be in the future.";
        if (d > start.getTime()) return "The response deadline must be before the support starts.";
      }
    }
    if (key === "support") {
      if (!catalogue.categoryId) return "Select the support category.";
      if (catalogue.tasks.length === 0 && !catalogue.otherTask.trim()) return "Select at least one essential task.";
      if (!ageGroup) return "Select the participant age group.";
      if (behaviour && !behaviourDetail.trim()) return "Describe the behaviour-related or complex-support experience needed.";
    }
    if (key === "requirements") {
      if (!hasRequirementsChoice(requirements) && !training && screening.length === 0) return "Select what is essential, or choose No additional requirement.";
      if (training && !trainingDetail.trim()) return "Describe the participant-specific training required.";
    }
    if (key === "rate") {
      if (!funding.rateChoice) return "Choose how the rate is set.";
      if (funding.rateChoice === "OFFERED_RATE" && !(parseFloat(funding.offeredRate) > 0)) return "Enter the offered hourly rate.";
      if (!funding.engagement) return "Choose the engagement arrangement (employee, agency or contractor).";
    }
    if (key === "review") {
      if (!hasSafetyChoice(safety)) return "Select any essential safety information, or choose No special safety information.";
      const e = providerContextError(safetyCtx, null);
      if (e) return e;
      if (!authority) return "Confirm you're authorised to post this request for your organisation.";
      if (!agreeShare) return "Please confirm the information-sharing acknowledgement.";
    }
    return null;
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === SECTIONS.length - 1) { void submit(false); return; }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    setStep(Math.max(0, step - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(asDraft: boolean) {
    const start = effectiveStart() ?? new Date();
    const total = Number.isFinite(hours) && hours > 0 ? hours : 1;
    const end = new Date(start.getTime() + total * 3600000);
    const category = getCatalogueCategory(catalogue.categoryId);
    setSaving(true); setError(null); setShiftPassBlocked(false);
    try {
      const supportNeeds = [
        ...needs.map((n) => SUPPORT_NEEDS.find((s) => s.v === n)?.l ?? n),
        ...(behaviour ? [`Behaviour-related / complex support: ${behaviourDetail.trim()}`] : []),
        ...logistics.map((n) => LOGISTICS_NEEDS.find((s) => s.v === n)?.l ?? n),
      ];
      const reqPrefs = (buildWorkerPreferencesPayload(requirements) ?? {}) as Record<string, unknown>;
      const workerPreferences: Record<string, unknown> = {
        ...reqPrefs,
        workerOrProvider: "WORKER",
        participantAgeGroup: ageGroup || undefined,
        deliveryMode: delivery,
        travelRadiusKm: travelRadiusKm ? Number(travelRadiusKm) : undefined,
        supportNeeds: supportNeeds.length ? supportNeeds : undefined,
        participantSpecificTraining: training ? trainingDetail.trim() : undefined,
        screeningChecks: screening.length ? screening : undefined,
        arrivalWindow: tier === "RAPID" || tier === "URGENT" ? ARRIVAL_WINDOWS[tier].find((a) => a.v === arrivalWindow)?.l : undefined,
        alternativeTimes: tier === "URGENT" && altTimes.trim() ? altTimes.trim() : undefined,
        consistencyPreference: tier === "ROUTINE" ? consistency : undefined,
      };
      const recurrencePattern = tier === "ROUTINE"
        ? (pattern === "ONE_OFF"
          ? { type: "ONE_TIME", flexible: flexible === "FLEXIBLE" }
          : { type: "ONGOING", arrangement: openEnded ? "OPEN_ENDED" : "FIXED_END", days, frequency, hoursPerVisit: total, endDate: openEnded ? undefined : endDate || undefined, openEnded: openEnded || undefined })
        : undefined;
      const body: Record<string, unknown> = {
        title: `${category?.label ?? "Support"} — ${name} staffing request`,
        description: serviceGoals.trim() || catalogue.otherTask.trim() || `${name} staffing request: ${category?.label ?? ""}`,
        category: catalogue.categoryId,
        urgency: TIER_META[tier].urgency,
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours: total,
        isRecurring: tier === "ROUTINE" && pattern === "RECURRING",
        recurrencePattern,
        timeFlexibility: tier === "LAST_MINUTE" ? (flexible === "FLEXIBLE" ? (flexNote.trim() || "FLEXIBLE_SLIGHT") : "EXACT") : undefined,
        requestPurposeCategory: tier === "LAST_MINUTE" ? reason : undefined,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: meetingDetails.trim() || undefined,
        selectedTasks: buildSelectedTasksPayload(catalogue),
        workerPreferences,
        visibilityTarget: "WORKERS_ONLY",
        safetyFlags: { ...(buildSafetyFlagsPayload(safety) ?? {}), environmentalInfo: environmental.trim() || undefined },
        responsePreferences: tier === "ROUTINE" && introSteps.length ? { introductorySteps: introSteps } : undefined,
        ...buildFundingPayload(funding),
        asDraft,
      };
      // Emergency contact + escalation route (private until confirmation) and the response deadline.
      const payload = applyProviderContext(body, { ...safetyCtx, responseDeadline });
      const res = await api.post<{ job: { id: string; status?: string } }>("/jobs", payload, { timeout: 45_000 });
      // PR-R06 — incomplete minimum verification: the server keeps the request as a draft to resume.
      const held = !asDraft && res.job.status === "DRAFT";
      setSubmitted({ id: res.job.id, isDraft: asDraft || held, verificationRequired: held });
    } catch (e) {
      if (e instanceof ApiError && e.code === "SUBSCRIPTION_LIMIT") setShiftPassBlocked(true);
      else setError(e instanceof ApiError ? e.message : "Failed to post request.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return <LiveRequestScreen tier={tier} tierLabel={tierLabel} jobId={submitted.id} isDraft={submitted.isDraft} verificationRequired={submitted.verificationRequired} audience="PROVIDER" />;
  }

  const category = getCatalogueCategory(catalogue.categoryId);
  const nextLabel = key === "rate" ? "Continue to safety and review"
    : key === "review" ? (tier === "RAPID" || tier === "URGENT" ? `Verify and Post ${name} Request` : "Publish request")
    : "Continue";
  const startWindow = START_WINDOW[tier];

  return (
    <WizardScreen
      tierLabel={`${name} staffing request`} screenTitle={SECTION_TITLES[key]} step={step} total={SECTIONS.length}
      error={error} onBack={back} onNext={next} nextLabel={nextLabel} saving={saving}
      belowError={shiftPassBlocked ? <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); void submit(false); }} onDismiss={() => setShiftPassBlocked(false)} /> : undefined}
    >
      {key === "when" && (
        <div className="space-y-5">
          <p className="text-xs text-slate-500 m-0">
            {tier === "RAPID" && "Rapid: within 60 minutes. Live countdown and immediate matching start when you post."}
            {tier === "URGENT" && "Urgent: after 60 minutes and within 4 hours. A four-hour response deadline applies. Speed is never required to publish."}
            {tier === "LAST_MINUTE" && "Last-Minute: after 4 hours and within 48 hours. Recurring needs belong in a Routine request."}
            {tier === "ROUTINE" && "Routine: more than 48 hours away, or ongoing."}
          </p>

          {tier === "RAPID" && (
            <div>
              <label className={lbl}>Start time</label>
              <RadioCards value={timing} onChange={setTiming} options={[{ v: "ASAP", l: "As soon as possible" }, { v: "CHOOSE", l: "Choose a time within the next 60 minutes" }]} />
              {timing === "CHOOSE" && <input type="datetime-local" className={`${inp} mt-3`} value={startAt} onChange={(e) => setStartAt(e.target.value)} />}
            </div>
          )}
          {tier !== "RAPID" && (
            <div>
              <label className={lbl}>{tier === "ROUTINE" ? (pattern === "ONE_OFF" ? "Shift date and start time" : "Expected commencement (first session)") : "Shift date and start time"}</label>
              <input type="datetime-local" className={inp} value={startAt} onChange={(e) => setStartAt(e.target.value)}
                min={localInput(new Date(Date.now() + Math.max(startWindow.min, 0) * 60000))} />
            </div>
          )}

          {tier === "ROUTINE" && (
            <div>
              <label className={lbl}>One-off future shift or recurring schedule?</label>
              <RadioCards value={pattern} onChange={setPattern} options={[{ v: "ONE_OFF", l: "One-off future shift" }, { v: "RECURRING", l: "Recurring schedule" }]} />
            </div>
          )}

          {(tier === "RAPID" || tier === "URGENT") && (
            <div>
              <label className={lbl}>Required arrival window</label>
              <RadioCards value={arrivalWindow} onChange={setArrivalWindow} options={ARRIVAL_WINDOWS[tier]} />
            </div>
          )}

          {tier === "URGENT" && (
            <div>
              <label className={lbl}>Alternative start times (optional)</label>
              <input className={inp} value={altTimes} onChange={(e) => setAltTimes(e.target.value)} placeholder="e.g. 2pm or 3pm also works" />
            </div>
          )}

          {tier === "LAST_MINUTE" && (
            <>
              <div>
                <label className={lbl}>Reason for cover *</label>
                <RadioCards value={reason} onChange={setReason} columns={2} options={COVER_REASONS} />
              </div>
              <div>
                <label className={lbl}>Is the time flexible?</label>
                <RadioCards value={flexible} onChange={setFlexible} options={[{ v: "EXACT", l: "No — exact time" }, { v: "FLEXIBLE", l: "Yes — slightly flexible" }]} />
                {flexible === "FLEXIBLE" && <input className={`${inp} mt-3`} value={flexNote} onChange={(e) => setFlexNote(e.target.value)} placeholder="How flexible? e.g. up to 1 hour either side" />}
              </div>
            </>
          )}

          {tier === "ROUTINE" && pattern === "RECURRING" && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Days *</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => (
                    <button key={d} type="button" onClick={() => setDays(toggle(days, d))}
                      className={`h-8 px-3 rounded-full border text-xs font-medium ${days.includes(d) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Pattern</label>
                <select className={inp} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="WEEKLY">Every week</option><option value="FORTNIGHTLY">Every fortnight</option><option value="MONTHLY">Every month</option>
                </select>
              </div>
              <CheckboxRow checked={openEnded} onChange={setOpenEnded} label="Ongoing — no end date" />
              {!openEnded && (
                <div className="w-56"><label className={lbl}>End date</label><input type="date" className={inp} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              )}
            </div>
          )}

          <div>
            <label className={lbl}>{tier === "ROUTINE" && pattern === "RECURRING" ? "Hours per visit *" : "Expected duration *"}</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((o) => (
                <button key={o.v} type="button" onClick={() => setDuration(o.v)}
                  className={`h-8 px-3 rounded-full border text-xs font-medium ${duration === o.v ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{o.l}</button>
              ))}
            </div>
            {duration === "OTHER" && <input className={`${inp} mt-3 w-40`} inputMode="decimal" value={otherHours} onChange={(e) => setOtherHours(e.target.value)} placeholder="Hours" />}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <label className={lbl}>Where will the support take place?</label>
              <RadioCards value={locationType} onChange={setLocationType} options={[
                { v: "HOME", l: "Participant's home" }, { v: "PROVIDER", l: "Provider setting" }, { v: "OTHER", l: "Other approved location" },
              ]} />
            </div>
            <div>
              <label className={lbl}>In person or remote?</label>
              <RadioCards value={delivery} onChange={setDelivery} columns={2} options={[{ v: "IN_PERSON", l: "In person" }, { v: "REMOTE", l: "Remote" }]} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className={lbl}>General suburb *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Parramatta" /></div>
              <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
              <div><label className={lbl}>Travel radius (km)</label><input className={inp} inputMode="numeric" value={travelRadiusKm} onChange={(e) => setTravelRadiusKm(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 20" /></div>
            </div>
            {delivery === "IN_PERSON" && (
              <div>
                <label className={lbl}>Exact private address (when relevant)</label>
                <p className="text-xs text-slate-400 mb-1 mt-0">Kept private until the worker is confirmed.</p>
                <input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
              </div>
            )}
            {locationType !== "HOME" && (
              <div><label className={lbl}>Meeting point or location details</label><input className={inp} value={meetingDetails} onChange={(e) => setMeetingDetails(e.target.value)} /></div>
            )}
          </div>

          {(tier === "URGENT" || tier === "LAST_MINUTE" || tier === "ROUTINE") && (
            <div>
              <label className={lbl}>{tier === "ROUTINE" ? "Response window (optional) — workers have until" : "Response deadline (optional)"}</label>
              <input type="datetime-local" className={inp} value={responseDeadline} onChange={(e) => setResponseDeadline(e.target.value)} />
            </div>
          )}

          {tier === "ROUTINE" && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <label className={lbl}>Consistency preference</label>
                <RadioCards value={consistency} onChange={setConsistency} options={[
                  { v: "ONE_REGULAR", l: "One regular worker" }, { v: "SMALL_TEAM", l: "A small team" }, { v: "NO_PREFERENCE", l: "No preference" },
                ]} />
              </div>
              <div>
                <label className={lbl}>Service goals (optional)</label>
                <textarea className={inp} rows={2} value={serviceGoals} onChange={(e) => setServiceGoals(e.target.value)} placeholder="What should this support achieve?" />
              </div>
              <div>
                <label className={lbl}>Interview / introductory steps (optional)</label>
                <div className="space-y-2">{INTRO_STEPS.map((s) => <CheckboxRow key={s} checked={introSteps.includes(s)} onChange={() => setIntroSteps(toggle(introSteps, s))} label={s} />)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {key === "support" && (
        <div className="space-y-6">
          <CategoryPickerStep selectedIds={catalogue.categoryId ? [catalogue.categoryId] : []}
            onToggle={(id) => setCatalogue({ categoryId: id, tasks: [], otherTask: "", answers: {} })} questionLabel="Support category" />
          {catalogue.categoryId && <TasksStep value={catalogue} onChange={(p) => setCatalogue({ ...catalogue, ...p })} showOtherTask otherTaskLabel="Other essential task (optional)" />}
          <div>
            <label className={lbl}>Participant age group *</label>
            <select className={inp} value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              <option value="">Select…</option>
              {AGE_GROUPS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={lbl}>Care needs</label>
            {SUPPORT_NEEDS.map((n) => <CheckboxRow key={n.v} checked={needs.includes(n.v)} onChange={() => setNeeds(toggle(needs, n.v))} label={n.l} />)}
            <CheckboxRow checked={behaviour} onChange={setBehaviour} label="Behaviour-related or complex-support experience needed" />
            {behaviour && <input className={`${inp} ml-6 w-80`} value={behaviourDetail} onChange={(e) => setBehaviourDetail(e.target.value)} placeholder="What experience is needed?" />}
          </div>
          <div className="space-y-2">
            <label className={lbl}>Transport and overnight requirements</label>
            {LOGISTICS_NEEDS.map((n) => <CheckboxRow key={n.v} checked={logistics.includes(n.v)} onChange={() => setLogistics(toggle(logistics, n.v))} label={n.l} />)}
          </div>
        </div>
      )}

      {key === "requirements" && (
        <div className="space-y-5">
          <RequirementsStep value={requirements} onChange={(p) => setRequirements({ ...requirements, ...p })} audience="PROVIDER"
            questionLabel="Required screening checks, qualifications and capabilities"
            genderLabel="Gender preference — only where lawful and genuinely necessary"
            languageLabel="Language, Auslan or communication needs"
            qualificationLabel="Required qualification" />
          <div className="space-y-2">
            <label className={lbl}>Required screening checks</label>
            {SCREENING_CHECKS.map((c) => <CheckboxRow key={c} checked={screening.includes(c)} onChange={() => setScreening(toggle(screening, c))} label={c} />)}
          </div>
          <div className="space-y-2">
            <CheckboxRow checked={training} onChange={setTraining} label="Participant-specific training required" />
            {training && <input className={`${inp} ml-6 w-80`} value={trainingDetail} onChange={(e) => setTrainingDetail(e.target.value)} placeholder="Which training?" />}
          </div>
        </div>
      )}

      {key === "rate" && <ProviderRateStep value={funding} onChange={(p) => setFunding({ ...funding, ...p })} />}

      {key === "review" && (
        <div className="space-y-5">
          <SafetyStep value={safety} onChange={(p) => setSafety({ ...safety, ...p })} audience="PROVIDER" questionLabel="Essential safety and environmental information" />
          <div>
            <label className={lbl}>Environmental information (optional)</label>
            <textarea className={inp} rows={2} value={environmental} onChange={(e) => setEnvironmental(e.target.value)} placeholder="Access, parking, pets, smoking, stairs or other hazards" />
          </div>
          <ProviderSafetyExtras value={safetyCtx} onChange={(p) => setSafetyCtx({ ...safetyCtx, ...p })} />

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <p className="text-sm font-semibold text-slate-800 m-0">Confirm your {name} request</p>
            <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
              <ReviewRow label="Request type" value={`${name} — ${TIER_META[tier].timing}`} />
              <ReviewRow label="When" value={`${tier === "RAPID" && timing === "ASAP" ? "As soon as possible" : startAt ? new Date(startAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" }) : ""} · ${Number.isFinite(hours) ? hours : "?"} h`} onEdit={() => goTo("when")} />
              <ReviewRow label="Where" value={`${suburb}, ${state}${postcode ? " " + postcode : ""} · ${delivery === "REMOTE" ? "Remote" : "In person"}`} onEdit={() => goTo("when")} />
              <ReviewRow label="Support required" value={`${category?.label ?? ""} — ${[...catalogue.tasks, catalogue.otherTask.trim()].filter(Boolean).join(", ")}`} onEdit={() => goTo("support")} />
              <ReviewRow label="Worker requirements" value={[requirementsSummary(requirements, "PROVIDER"), screening.join(", ")].filter((x) => x && x !== "Not specified").join(", ") + (training ? `, training: ${trainingDetail}` : "")} onEdit={() => goTo("requirements")} />
              <ReviewRow label="Rate and engagement" value={providerRateSummary(funding)} onEdit={() => goTo("rate")} />
              <ReviewRow label="Safety summary" value={safetySummary(safety)} onEdit={() => goTo("review")} />
            </div>
            <ProviderVisibilityPreview visible={["Service and essential tasks", "General location (suburb and state)", "Start time and duration", "Participant age group", "Rate and engagement", "Your organisation as the poster"]} />
            <AddressReleaseNotice />
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 m-0">
              {allowance?.applies
                ? `Publishing uses one of your once-only Provider Actions (${allowance.remaining} of ${allowance.limit} remaining). Urgency never costs extra and drafts are free.`
                : "Publishing is included in your plan. Drafts are free and no action is consumed until you publish."}
            </p>
            <ProviderAuthorityConfirm checked={authority} onChange={setAuthority} />
            <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="I agree the shown request details can be shared with suitable workers" />
            <div className="flex justify-end">
              <button type="button" onClick={() => void submit(true)} className="text-xs text-brand-700 underline">Save draft</button>
            </div>
          </div>
        </div>
      )}
    </WizardScreen>
  );
}
