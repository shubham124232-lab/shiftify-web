"use client";

// Routine Support journey — support needed more than 48 hours ahead, one-time or recurring. The most
// detailed journey. Authoritative documents per role:
//   Participant → Participant Posting Journeys O-01..O-14
//   Coordinator → SC Journey SC-P00..P02 (participant + authority first) then SC-O01..O14
//                 (adds the request-purpose screen, five support patterns, coordinator wording/options,
//                 multi-select response routes, preview)
//   Provider    → Provider Journey PR-O01 (one-off or recurring, consistency preference, goals/tasks/
//                 locations/travel, longer response window, introductory-step options) + PR-C01

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import {
  WizardScreen, RadioCards, PersonStep, ProviderRateStep, ProviderLocationExtras, ProviderSafetyExtras, ProviderVisibilityPreview, applyProviderContext, providerRateSummary, CategoryPickerStep, MultiCategoryTasksStep, SafetyStep,
  FundingTypeStep, RateStep, RoutineWorkerStep, RoutinePreferencesStep, hasRoutinePreferenceChoice,
  ReviewRow, LiveRequestScreen, CheckboxRow, AddressReleaseNotice, ShiftPassPrompt, inp, lbl,
  buildSafetyFlagsPayload, buildFundingPayload, buildRoutinePreferencesPayload,
  audienceOf, locationOptions, applyPerson, safetySummary, fundingSummary, hasSafetyChoice, providerContextError, ProviderAuthorityConfirm, ProviderDeadlineField,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import {
  EMPTY_PERSON, EMPTY_MULTI_CATALOGUE, EMPTY_SAFETY, EMPTY_FUNDING, EMPTY_PROVIDER_CONTEXT, type ProviderContext, EMPTY_ROUTINE_PREFERENCES,
  type PersonReceivingSupport, type MultiCatalogueSelection, type SafetyChecklist, type FundingChoice,
  type RoutineWorkerChoice, type RoutinePreferences, type RoutinePreferenceKey,
} from "@/lib/types/posting";
import { postFailureMessage } from "@/lib/guestDraftResume";
import { someoneElsePhoneError } from "@/components/jobs/post/shared";
import { saveGuestDraft, loadGuestDraft, loadResumableDraft, clearGuestDraft, getPostAttemptId, loadGuestRole, type GuestPostingRole } from "@/lib/store/guestJobDraft";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

type StepKey = "pattern" | "person" | "purpose" | "service" | "tasks" | "schedule" | "location" | "worker" | "prefs" | "safety" | "fundingType" | "rate" | "responses" | "review";
const PARTICIPANT_KEYS: StepKey[] = ["pattern", "person", "service", "tasks", "schedule", "location", "worker", "prefs", "safety", "fundingType", "rate", "responses", "review"];
// SC-P00/P01 first, then SC-O01 pattern and SC-O02 request purpose.
const COORDINATOR_KEYS: StepKey[] = ["person", "pattern", "purpose", "service", "tasks", "schedule", "location", "worker", "prefs", "safety", "fundingType", "rate", "responses", "review"];
// Provider: rate and engagement is one screen (PR-R04), so there is no separate rate screen.
const PROVIDER_KEYS: StepKey[] = ["pattern", "person", "service", "tasks", "schedule", "location", "worker", "prefs", "safety", "fundingType", "responses", "review"];

// ONGOING = Participant "Ongoing regular support"; RECURRING / OPEN_ENDED / TRIAL are the Coordinator (SC-O01) and
// Provider (PR-O01 "recurring schedule") wordings. All recurring patterns share one schedule form.
type Pattern = "ONE_TIME" | "ONGOING" | "MULTIPLE_DATES" | "RECURRING" | "OPEN_ENDED" | "TRIAL";
const isRecurringPattern = (p: Pattern) => p !== "ONE_TIME" && p !== "MULTIPLE_DATES";

const PATTERN_OPTIONS: Record<"PARTICIPANT" | "COORDINATOR" | "PROVIDER", { v: Pattern; l: string }[]> = {
  PARTICIPANT: [{ v: "ONE_TIME", l: "One-time support" }, { v: "ONGOING", l: "Ongoing regular support" }, { v: "MULTIPLE_DATES", l: "Several dates that do not repeat" }],
  COORDINATOR: [
    { v: "ONE_TIME", l: "One-time" }, { v: "RECURRING", l: "Recurring" }, { v: "MULTIPLE_DATES", l: "Several non-repeating dates" },
    { v: "OPEN_ENDED", l: "Ongoing need without a fixed end date" }, { v: "TRIAL", l: "Trial or interim arrangement" },
  ],
  PROVIDER: [{ v: "ONE_TIME", l: "One-off future shift" }, { v: "RECURRING", l: "Recurring schedule" }],
};
const PATTERN_LABELS: Record<Pattern, string> = {
  ONE_TIME: "One-time", ONGOING: "Ongoing regular support", MULTIPLE_DATES: "Several dates", RECURRING: "Recurring", OPEN_ENDED: "Ongoing, no fixed end date", TRIAL: "Trial or interim arrangement",
};
const PURPOSES = [
  "New support", "Replace existing support", "Ongoing service gap", "Planned transition/discharge", "Carer relief", "Provider change", "Build a longer-term support team", "Other",
];

const RESPONSE_METHODS = ["Send availability and rate", "Send a short introduction", "Answer screening questions", "Message through Shiftify", "Request a call after shortlisting"];
const SCREENING_QUESTIONS = ["Experience", "Training", "Vehicle", "Availability", "Continuity"];
const COORDINATOR_ROUTES: { v: string; l: string }[] = [
  { v: "APPLY", l: "Apply through Shiftify" },
  { v: "SEND_AVAILABILITY", l: "Send availability and rate" },
  { v: "ANSWER_QUESTIONS", l: "Answer one or more coordinator questions" },
  { v: "MEET_AND_GREET", l: "Offer a meet and greet" },
  { v: "INVITE_ONLY", l: "Invite only selected professionals" },
  { v: "PUBLIC", l: "Public to suitable matches" },
];
const PROVIDER_INTRO_STEPS = ["Interview", "Introductory meet-and-greet"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface OneOffDate { date: string; startTime: string; durationHours: string }

function RoutineJourneyBase() {
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

  const [pattern, setPattern] = useState<Pattern>("ONE_TIME");
  const [purpose, setPurpose] = useState("");
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

  const [locationType, setLocationType] = useState<string>("HOME");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [travelDetails, setTravelDetails] = useState("");
  const [routineWorker, setRoutineWorker] = useState<RoutineWorkerChoice>("");
  const [routinePrefs, setRoutinePrefs] = useState<RoutinePreferences>(EMPTY_ROUTINE_PREFERENCES);
  const [safety, setSafety] = useState<SafetyChecklist>(EMPTY_SAFETY);
  const [funding, setFunding] = useState<FundingChoice>(EMPTY_FUNDING);
  const [providerCtx, setProviderCtx] = useState<ProviderContext>(EMPTY_PROVIDER_CONTEXT);
  const patchProviderCtx = (p: Partial<ProviderContext>) => setProviderCtx((c) => ({ ...c, ...p }));
  const [responseMethods, setResponseMethods] = useState<string[]>([]);
  const [responseRoutes, setResponseRoutes] = useState<string[]>([]);
  const [introSteps, setIntroSteps] = useState<string[]>([]);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [agreeShare, setAgreeShare] = useState(false);
  const [postingAuthorityConfirmed, setPostingAuthorityConfirmed] = useState(false);

  function patch<T>(setter: (v: T) => void, current: T) {
    return (p: Partial<T>) => setter({ ...current, ...p });
  }
  const toggleIn = (setter: (fn: (prev: string[]) => string[]) => void, v: string) => setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  function toggleCategory(id: string) {
    setCatalogue((prev) => prev.categoryIds.includes(id)
      ? { ...prev, categoryIds: prev.categoryIds.filter((c) => c !== id) }
      : { ...prev, categoryIds: [...prev.categoryIds, id] });
  }
  function onRoutinePrefChange(k: RoutinePreferenceKey, v: Partial<RoutinePreferences[RoutinePreferenceKey]>) {
    setRoutinePrefs((prev) => ({ ...prev, [k]: { ...prev[k], ...v } }));
  }

  useEffect(() => {
    if (!isAuth) setGuestRole(loadGuestRole());
    const d = (isAuth ? loadResumableDraft("ROUTINE", activeRole) : loadGuestDraft("ROUTINE")) as Record<string, unknown> | null;
    if (!d) return;
    if (d.pattern) setPattern(d.pattern as Pattern);
    if (typeof d.purpose === "string") setPurpose(d.purpose);
    if (d.person) setPerson(d.person as PersonReceivingSupport);
    if (d.catalogue) setCatalogue(d.catalogue as MultiCatalogueSelection);
    if (typeof d.oneTimeDate === "string") setOneTimeDate(d.oneTimeDate);
    if (typeof d.oneTimeDuration === "string") setOneTimeDuration(d.oneTimeDuration);
    if (typeof d.ongoingStartDate === "string") setOngoingStartDate(d.ongoingStartDate);
    if (Array.isArray(d.ongoingDays)) setOngoingDays(d.ongoingDays as string[]);
    if (typeof d.ongoingStartTime === "string") setOngoingStartTime(d.ongoingStartTime);
    if (typeof d.ongoingHoursPerVisit === "string") setOngoingHoursPerVisit(d.ongoingHoursPerVisit);
    if (typeof d.ongoingFrequency === "string") setOngoingFrequency(d.ongoingFrequency);
    if (typeof d.ongoingEndDate === "string") setOngoingEndDate(d.ongoingEndDate);
    if (Array.isArray(d.multipleDates)) setMultipleDates(d.multipleDates as OneOffDate[]);
    if (typeof d.scheduleFlexible === "boolean") setScheduleFlexible(d.scheduleFlexible);
    if (typeof d.locationType === "string") setLocationType(d.locationType);
    if (typeof d.suburb === "string") setSuburb(d.suburb);
    if (typeof d.state === "string") setState(d.state);
    if (typeof d.postcode === "string") setPostcode(d.postcode);
    if (typeof d.addressLine === "string") setAddressLine(d.addressLine);
    if (typeof d.travelDetails === "string") setTravelDetails(d.travelDetails);
    if (d.routineWorker) setRoutineWorker(d.routineWorker as RoutineWorkerChoice);
    if (d.routinePrefs) setRoutinePrefs(d.routinePrefs as RoutinePreferences);
    if (d.safety) setSafety(d.safety as SafetyChecklist);
    if (d.funding) setFunding(d.funding as FundingChoice);
    if (Array.isArray(d.responseMethods)) setResponseMethods(d.responseMethods as string[]);
    if (Array.isArray(d.responseRoutes)) setResponseRoutes(d.responseRoutes as string[]);
    if (Array.isArray(d.introSteps)) setIntroSteps(d.introSteps as string[]);
    if (Array.isArray(d.screeningQuestions)) setScreeningQuestions(d.screeningQuestions as string[]);
    if (typeof d.agreeShare === "boolean") setAgreeShare(d.agreeShare);
    if (typeof d.postingAuthorityConfirmed === "boolean") setPostingAuthorityConfirmed(d.postingAuthorityConfirmed);
    if (typeof d.step === "number") setStep(d.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

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

  function scheduleError(): string | null {
    if (pattern === "ONE_TIME" && !oneTimeDate) return "Choose a date and start time.";
    if (isRecurringPattern(pattern) && (!ongoingStartDate || ongoingDays.length === 0 || !ongoingStartTime)) return "Fill in the start date, days, and start time.";
    if (pattern === "MULTIPLE_DATES" && multipleDates.some((d) => !d.date || !d.startTime)) return "Fill in every date's start time.";
    if (pattern === "ONE_TIME" && !(parseFloat(oneTimeDuration) > 0)) return "Enter the duration.";
    if (isRecurringPattern(pattern) && !(parseFloat(ongoingHoursPerVisit) > 0)) return "Enter the hours per visit.";
    if (ongoingEndDate && isRecurringPattern(pattern) && new Date(ongoingEndDate) < new Date(ongoingStartDate)) return "The end date must be after the start date.";
    const m = (firstStartEnd().start.getTime() - Date.now()) / 60000;
    if (m <= 48 * 60) return "Routine Support starts more than 48 hours from now. For sooner support, post a Last-Minute, Urgent or Rapid request.";
    return null;
  }

  function validate(): string | null {
    if (key === "person" && isCoordinator && person.who !== "SOMEONE_ELSE" && person.who !== "EXISTING_PARTICIPANT") return "Select who this request is for.";
    if (key === "person" && person.who === "EXISTING_PARTICIPANT" && !person.existingParticipantId) return "Select a participant.";
    if (key === "person" && person.who === "SOMEONE_ELSE" && !person.someoneElseName.trim()) return "Enter a preferred name.";
    if (key === "person" && isCoordinator && person.who === "SOMEONE_ELSE") { const e = someoneElsePhoneError(person); if (e) return e; }
    if (key === "person" && isCoordinator && person.who === "EXISTING_PARTICIPANT" && person.existingParticipantIsConnection && !postingAuthorityConfirmed) return "Confirm you're authorised to post for this participant.";
    if (key === "purpose" && !purpose) return "Choose why support is being arranged.";
    if (key === "service" && catalogue.categoryIds.length === 0) return "Select at least one support service.";
    if (key === "tasks" && Object.values(catalogue.tasksByCategory).every((t) => t.length === 0)) return "Select at least one task.";
    if (key === "schedule") return scheduleError();
    if (key === "location" && !suburb.trim()) return "Suburb/postcode is required.";
    if (key === "worker" && !routineWorker) return "Choose who you're looking for.";
    if (key === "prefs" && isCoordinator && !hasRoutinePreferenceChoice(routinePrefs)) return "Select what matters for a good match, or choose No additional preference.";
    if (key === "safety" && audience !== "PROVIDER" && !hasSafetyChoice(safety)) return "Select any relevant safety information, or choose No special safety information.";
    if (key === "fundingType" && audience !== "PROVIDER" && !funding.fundingType) return "Choose how this support will be paid for (\"I'm not sure\" is allowed).";
    if (key === "fundingType" && audience === "PROVIDER" && funding.rateChoice === "OFFERED_RATE" && !(parseFloat(funding.offeredRate) > 0)) return "Enter the offered hourly rate.";
    if (key === "rate" && !funding.rateChoice) return "Choose how you'd like to set the rate.";
    if (key === "rate" && funding.rateChoice === "OFFERED_RATE" && !(parseFloat(funding.offeredRate) > 0)) return "Enter the offered hourly rate.";
    if (key === "responses" && audience === "PARTICIPANT" && responseMethods.length === 0) return "Select at least one response method.";
    if (key === "responses" && isCoordinator && responseRoutes.length === 0) return "Select at least one response route.";
    if (key === "responses" && isCoordinator && responseRoutes.includes("INVITE_ONLY") && responseRoutes.includes("PUBLIC")) return "Choose either invite-only or public — not both.";
    if (key === "responses" && isProvider) { const e = providerContextError(providerCtx, scheduleError() === null ? firstStartEnd().start.toISOString() : null); if (e) return e; }
    if (key === "review" && isProvider && !postingAuthorityConfirmed) return "Confirm you're authorised to post this request for your organisation.";
    if (key === "review" && !agreeShare) return "Please confirm the information-sharing acknowledgement.";
    return null;
  }

  function draftState(atStep: number) {
    return {
      pattern, purpose, person, catalogue, oneTimeDate, oneTimeDuration, ongoingStartDate, ongoingDays, ongoingStartTime,
      ongoingHoursPerVisit, ongoingFrequency, ongoingEndDate, multipleDates, scheduleFlexible, locationType,
      suburb, state, postcode, addressLine, travelDetails, routineWorker, routinePrefs, safety, funding,
      responseMethods, responseRoutes, introSteps, screeningQuestions, agreeShare, postingAuthorityConfirmed, step: atStep,
    };
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === TOTAL_STEPS - 1) {
      // A request saved before signing up may have waited past the time it asked for.
      const stale = scheduleError();
      if (stale) { goTo("schedule"); setError(stale); return; }
      void submitCommon(false); return;
    }
    const nextStep = step + 1;
    if (!isAuth) saveGuestDraft("ROUTINE", guestRole ?? "PARTICIPANT", draftState(nextStep));
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    const prevStep = Math.max(0, step - 1);
    if (!isAuth) saveGuestDraft("ROUTINE", guestRole ?? "PARTICIPANT", draftState(prevStep));
    setStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitCommon(asDraft: boolean) {
    if (!isAuth) {
      saveGuestDraft("ROUTINE", guestRole ?? "PARTICIPANT", draftState(step));
      router.push("/register");
      return;
    }
    setSaving(true); setError(null); setShiftPassBlocked(false);
    try {
      const { start, end, totalHours } = firstStartEnd();
      const primaryCategoryId = catalogue.categoryIds[0];
      const primaryCategory = getCatalogueCategory(primaryCategoryId);
      const recurrencePattern =
        pattern === "ONE_TIME" ? { type: "ONE_TIME", flexible: scheduleFlexible }
        : pattern === "MULTIPLE_DATES" ? { type: "MULTIPLE_DATES", dates: multipleDates, flexible: scheduleFlexible }
        : {
            type: "ONGOING", arrangement: pattern, days: ongoingDays, frequency: ongoingFrequency, hoursPerVisit: ongoingHoursPerVisit,
            endDate: pattern === "OPEN_ENDED" ? undefined : ongoingEndDate || undefined, openEnded: pattern === "OPEN_ENDED" || undefined, flexible: scheduleFlexible,
          };

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
        planGoal: catalogue.planGoal?.trim() || undefined,
      };

      const workerPreferences = {
        workerOrProvider: routineWorker || undefined,
        twoWorkers: routineWorker === "TWO_WORKERS" || undefined,
        matchPreferences: buildRoutinePreferencesPayload(routinePrefs),
      };

      const inviteOnly = isCoordinator && responseRoutes.includes("INVITE_ONLY");
      const primaryRoute = responseRoutes.includes("INVITE_ONLY") ? "INVITE_ONLY" : responseRoutes.includes("PUBLIC") ? "PUBLIC" : responseRoutes[0];
      const responsePreferences =
        isCoordinator ? (responseRoutes.length ? { responseRoutes, responseRoute: primaryRoute, screeningQuestions: screeningQuestions.length ? screeningQuestions : undefined } : undefined)
        : isProvider ? (introSteps.length ? { introductorySteps: introSteps } : undefined)
        : (responseMethods.length ? { responseMethods, screeningQuestions: screeningQuestions.length ? screeningQuestions : undefined } : undefined);

      const body: Record<string, unknown> = {
        title: `${primaryCategory?.label ?? "Support"} — Routine Support`,
        description: catalogue.description.trim() || `Routine support request: ${primaryCategory?.label ?? ""}`,
        supportGoal: (catalogue.planGoal?.trim() || catalogue.goals[0])?.slice(0, 80) || undefined,
        category: primaryCategoryId,
        urgency: "ROUTINE",
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalHours,
        isRecurring: pattern !== "ONE_TIME",
        recurrencePattern,
        requestPurposeCategory: isCoordinator ? purpose || undefined : undefined,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        serviceDeliveryMode: locationType,
        addressLine: addressLine.trim() || undefined,
        locationNotes: travelDetails.trim() || undefined,
        selectedTasks,
        workerPreferences,
        visibilityTarget: inviteOnly
          ? "INVITE_ONLY"
          : routineWorker === "WORKER" || routineWorker === "SINGLE_WORKER" || routineWorker === "ONE_REGULAR" || routineWorker === "SMALL_TEAM" ? "WORKERS_ONLY" : routineWorker === "PROVIDER" ? "PROVIDERS_ONLY" : "ALL",
        safetyFlags: buildSafetyFlagsPayload(safety),
        ...buildFundingPayload(funding),
        responsePreferences,
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

  if (submitted) return <LiveRequestScreen tier="ROUTINE" tierLabel="Routine Support" jobId={submitted.id} isDraft={submitted.isDraft} verificationRequired={submitted.verificationRequired} audience={isProvider ? "PROVIDER" : isCoordinator ? "COORDINATOR" : undefined} />;

  const primaryCategory = getCatalogueCategory(catalogue.categoryIds[0]);
  const titles: Record<StepKey, string> = {
    pattern: "What type of Routine Support do you need?",
    person: isCoordinator ? "Who is this support request for?" : isProvider ? "Staffing request for your organisation" : "Who needs this Routine Support?",
    purpose: "Why is support being arranged?",
    service: "What support is needed?",
    tasks: isCoordinator ? "What would the participant like support with?" : "What would you like support with?",
    schedule: "When is support needed?",
    location: "Where will support take place?",
    worker: "Who are you looking for?",
    prefs: "What matters for a good match?",
    safety: "What information is relevant to providing support safely?",
    fundingType: isProvider ? "Rate and engagement" : isCoordinator ? "How will this support be funded?" : "How will this support be paid for?",
    rate: "How would you like to set the rate?",
    responses: "How should professionals respond?",
    review: isCoordinator ? "Check the Routine Support request" : "Check your Routine Support request",
  };
  const nextLabel = key === "review" ? (isAuth ? (isProvider ? "Publish request" : "Post Routine request" + (isCoordinator ? "" : " — Free")) : "Sign up to post this request") : "Continue";
  const scheduleSummary =
    pattern === "ONE_TIME" ? (oneTimeDate ? `${new Date(oneTimeDate).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} · ${oneTimeDuration} hours` : "")
    : pattern === "MULTIPLE_DATES" ? `${multipleDates.length} date${multipleDates.length === 1 ? "" : "s"}, from ${multipleDates[0]?.date ?? ""}`
    : `${ongoingDays.join(", ")} from ${ongoingStartDate} ${ongoingStartTime} · ${ongoingHoursPerVisit} hours · ${ongoingFrequency.toLowerCase().replace("_", " ")}${pattern === "OPEN_ENDED" ? " · no end date" : ongoingEndDate ? ` · until ${ongoingEndDate}` : ""}`;
  const frequencyOptions = isCoordinator
    ? [["DAILY", "Daily"], ["WEEKLY", "Weekly"], ["MULTIPLE_WEEKLY", "Multiple times weekly"], ["FORTNIGHTLY", "Fortnightly"], ["MONTHLY", "Monthly"], ["CUSTOM", "Custom dates"]]
    : [["WEEKLY", "Weekly"], ["FORTNIGHTLY", "Fortnightly"], ["MONTHLY", "Monthly"], ["CUSTOM", "Custom"]];
  const ROUTINE_WORKER_LABELS: Record<string, string> = {
    WORKER: "Independent support worker", PROVIDER: "Provider organisation", EITHER: "Either",
    ONE_REGULAR: "One regular worker", SMALL_TEAM: "A small consistent team", NO_PREFERENCE: "No preference",
    SINGLE_WORKER: "Single worker", TEAM_ROSTER: "Team/roster of workers", TWO_WORKERS: "Two workers for selected supports",
  };
  const workerLabel = routineWorker ? (ROUTINE_WORKER_LABELS[routineWorker] ?? routineWorker) : "Not specified";
  const responseSummary = isCoordinator
    ? responseRoutes.map((r) => COORDINATOR_ROUTES.find((x) => x.v === r)?.l ?? r).join(", ")
    : isProvider ? [providerCtx.responseDeadline ? `Respond by ${new Date(providerCtx.responseDeadline).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}` : "", ...introSteps].filter(Boolean).join(", ")
    : responseMethods.join(", ");
  const personLabel = isProvider ? "Your organisation" : (person.who === "EXISTING_PARTICIPANT" ? person.existingParticipantName : person.someoneElseName) || "Not selected";

  return (
    <WizardScreen
      tierLabel="Routine Support" screenTitle={titles[key]} step={step} total={TOTAL_STEPS}
      error={error} onBack={back} onNext={next}
      belowError={shiftPassBlocked ? (
        <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); void submitCommon(false); }} onDismiss={() => setShiftPassBlocked(false)} />
      ) : undefined}
      nextLabel={nextLabel}
      saving={saving}
    >
      {key === "pattern" && (
        <RadioCards value={pattern} onChange={setPattern} options={PATTERN_OPTIONS[audience]} />
      )}
      {key === "person" && (
        <PersonStep
          value={person} onChange={patch(setPerson, person)} tierLabel="Routine Support" isCoordinator={isCoordinator} isProvider={isProvider} providerContext={providerCtx} onProviderContextChange={patchProviderCtx}
          authorityConfirmed={postingAuthorityConfirmed} onAuthorityChange={setPostingAuthorityConfirmed}
        />
      )}
      {key === "purpose" && (
        <RadioCards value={purpose} onChange={setPurpose} options={PURPOSES.map((p) => ({ v: p, l: p }))} />
      )}
      {key === "service" && (
        <CategoryPickerStep
          selectedIds={catalogue.categoryIds}
          onToggle={toggleCategory}
          multi
          questionLabel="What support is needed?"
        />
      )}
      {key === "tasks" && <MultiCategoryTasksStep value={catalogue} onChange={patch(setCatalogue, catalogue)} audience={audience} />}
      {key === "schedule" && (
        <div className="space-y-4">
          {pattern === "ONE_TIME" && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date &amp; start time *</label><input type="datetime-local" className={inp} value={oneTimeDate} onChange={(e) => setOneTimeDate(e.target.value)} /></div>
              <div><label className={lbl}>Duration (hours)</label><input type="number" min="0.5" step="0.5" className={inp} value={oneTimeDuration} onChange={(e) => setOneTimeDuration(e.target.value)} /></div>
            </div>
          )}
          {isRecurringPattern(pattern) && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Start date *</label><input type="date" className={inp} value={ongoingStartDate} onChange={(e) => setOngoingStartDate(e.target.value)} /></div>
                <div><label className={lbl}>Start time / time window *</label><input type="time" className={inp} value={ongoingStartTime} onChange={(e) => setOngoingStartTime(e.target.value)} /></div>
              </div>
              <div>
                <label className={lbl}>Days of week *</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleIn(setOngoingDays, d)} className={`h-9 w-12 rounded-lg border text-sm font-medium transition-colors ${ongoingDays.includes(d) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Hours per visit</label><input type="number" min="0.5" step="0.5" className={inp} value={ongoingHoursPerVisit} onChange={(e) => setOngoingHoursPerVisit(e.target.value)} /></div>
                <div>
                  <label className={lbl}>Frequency</label>
                  <select className={inp} value={ongoingFrequency} onChange={(e) => setOngoingFrequency(e.target.value)}>
                    {frequencyOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                {pattern === "OPEN_ENDED"
                  ? <div className="flex items-end pb-2 text-xs text-slate-500">Ongoing — no end date</div>
                  : <div><label className={lbl}>End date (optional)</label><input type="date" className={inp} value={ongoingEndDate} onChange={(e) => setOngoingEndDate(e.target.value)} /></div>}
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
          <CheckboxRow checked={scheduleFlexible} onChange={setScheduleFlexible} label={isCoordinator ? "Flexible dates/times (otherwise exact)" : "Flexible dates/times"} />
          {isProvider && <ProviderDeadlineField value={providerCtx} onChange={patchProviderCtx} label="Expected commencement — respond by (optional)" />}
        </div>
      )}
      {key === "location" && (
        <div className="space-y-4">
          <label className={lbl}>Where will support take place?</label>
          <RadioCards value={locationType} onChange={setLocationType} options={locationOptions(audience, "ROUTINE")} />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Suburb/postcode *</label><input className={inp} value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
            <div><label className={lbl}>State</label><select className={inp} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="w-32"><label className={lbl}>Postcode</label><input className={inp} value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={4} /></div>
          {isProvider && <ProviderLocationExtras value={providerCtx} onChange={patchProviderCtx} />}
          <div><label className={lbl}>Exact private address</label><input className={inp} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div><label className={lbl}>{isCoordinator ? "Meeting points, destinations, vehicle and accessibility needs" : "Destinations, usual travel distance, return trip, vehicle needs"}</label><input className={inp} value={travelDetails} onChange={(e) => setTravelDetails(e.target.value)} /></div>
        </div>
      )}
      {key === "worker" && <RoutineWorkerStep value={routineWorker} onChange={setRoutineWorker} audience={audience} />}
      {key === "prefs" && <RoutinePreferencesStep value={routinePrefs} onChange={onRoutinePrefChange} audience={audience} />}
      {key === "safety" && (<><SafetyStep value={safety} onChange={patch(setSafety, safety)} questionLabel="What information is relevant to providing support safely?" routineExtras={!isProvider} audience={audience} />{isProvider && <ProviderSafetyExtras value={providerCtx} onChange={patchProviderCtx} />}</>)}
      {key === "fundingType" && (isProvider
        ? <ProviderRateStep value={funding} onChange={patch(setFunding, funding)} />
        : <FundingTypeStep value={funding} onChange={patch(setFunding, funding)} audience={audience} />)}
      {key === "rate" && <RateStep value={funding} onChange={patch(setFunding, funding)} />}
      {key === "responses" && audience === "PARTICIPANT" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={lbl}>How should professionals respond?</label>
            {RESPONSE_METHODS.map((m) => (
              <CheckboxRow key={m} checked={responseMethods.includes(m)} onChange={() => toggleIn(setResponseMethods, m)} label={m} />
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <label className={lbl}>Optional screening questions</label>
            <ScreeningChips selected={screeningQuestions} onToggle={(q) => toggleIn(setScreeningQuestions, q)} />
          </div>
        </div>
      )}
      {key === "responses" && isCoordinator && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={lbl}>How should professionals respond? (choose at least one)</label>
            {COORDINATOR_ROUTES.map((r) => (
              <CheckboxRow key={r.v} checked={responseRoutes.includes(r.v)} onChange={() => toggleIn(setResponseRoutes, r.v)} label={r.l} />
            ))}
          </div>
          {responseRoutes.includes("ANSWER_QUESTIONS") && (
            <div className="border-t border-slate-100 pt-4">
              <label className={lbl}>Coordinator questions</label>
              <ScreeningChips selected={screeningQuestions} onToggle={(q) => toggleIn(setScreeningQuestions, q)} />
            </div>
          )}
        </div>
      )}
      {key === "responses" && isProvider && (
        <div className="space-y-4">
          <ProviderDeadlineField value={providerCtx} onChange={patchProviderCtx} label="Response window — respond by (optional)" />
          <div className="space-y-2">
            <label className={lbl}>Introductory step (optional)</label>
            {PROVIDER_INTRO_STEPS.map((m) => (
              <CheckboxRow key={m} checked={introSteps.includes(m)} onChange={() => toggleIn(setIntroSteps, m)} label={m} />
            ))}
          </div>
        </div>
      )}
      {key === "review" && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
            {(isCoordinator || isProvider) && (
              <ReviewRow label={isProvider ? "Organisation and authority" : "Participant and authority"} value={personLabel} onEdit={() => goTo("person")} />
            )}
            <ReviewRow label="Pattern and schedule" value={`${PATTERN_LABELS[pattern]}${scheduleSummary ? " — " + scheduleSummary : ""}`} onEdit={() => goTo("schedule")} />
            <ReviewRow label="Services/tasks/goals" value={`${catalogue.categoryIds.map((id) => getCatalogueCategory(id)?.label).join(", ") || primaryCategory?.label || ""}${Object.values(catalogue.tasksByCategory).flat().length ? " — " + Object.values(catalogue.tasksByCategory).flat().join(", ") : ""}${catalogue.goals.length ? " · Goals: " + catalogue.goals.join(", ") : ""}`} onEdit={() => goTo("tasks")} />
            <ReviewRow label={isCoordinator ? "Location/travel" : "Locations/travel"} value={`${suburb}, ${state}${postcode ? " " + postcode : ""}`} onEdit={() => goTo("location")} />
            <ReviewRow label="Worker/provider preferences" value={workerLabel} onEdit={() => goTo("worker")} />
            <ReviewRow label={isCoordinator ? "Safety information" : "Safety/support summary"} value={safetySummary(safety)} onEdit={() => goTo("safety")} />
            <ReviewRow label={isProvider ? "Rate and engagement" : "Funding/rate"} value={isProvider ? providerRateSummary(funding) : fundingSummary(funding)} onEdit={() => goTo(isProvider ? "fundingType" : "fundingType")} />
            <ReviewRow label={isCoordinator ? "Response choice" : "Response method"} value={responseSummary} onEdit={() => goTo("responses")} />
          </div>
          {isProvider && <ProviderVisibilityPreview visible={["Service and essential tasks", "General location (suburb and state)", "Start time and duration", "Participant age group", "Rate and engagement", "Your organisation as the poster"]} />}
          {isCoordinator && (
            <ProviderVisibilityPreview
              visible={["Service, tasks and goals", "General location (suburb and state)", "Pattern and schedule", "Worker/provider preferences", "Funding and rate"]}
              hidden={["Exact address", "Participant name and contact details", "Private notes and documents"]}
            />
          )}
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

function ScreeningChips({ selected, onToggle }: { selected: string[]; onToggle: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SCREENING_QUESTIONS.map((q) => (
        <button key={q} type="button" onClick={() => onToggle(q)}
          className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${selected.includes(q) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{q}</button>
      ))}
    </div>
  );
}

// Providers have their own staffing-request journey (Provider doc PR-R01–R05); every other role uses this one.
export default function RoutineJourney() {
  const { activeRole } = useAuth();
  if (activeRole === "PROVIDER") return <ProviderStaffingWizard tier="ROUTINE" />;
  return <RoutineJourneyBase />;
}
