"use client";

// Dedicated Provider staffing-request journey (Provider Complete User Journey, Journeys 5–7), built as the approved
// 7-step demo: Timing and request, When and where, Support and safety, Worker requirements, Rates and engagement,
// Distribution and visibility, Review.
// It is deliberately NOT the Participant/Coordinator wizard: the Provider document defines five
// sections — PR-R01 When and where, PR-R02 Support required, PR-R03 Essential worker requirements,
// PR-R04 Rate and engagement, PR-R05 Safety, consent and review (+ PR-C01 confirmation) — and the
// documented differences for Urgent (PR-U01), Last-Minute (PR-L01) and Routine (PR-O01).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  WizardScreen, ModalShell, RadioCards, CheckboxRow, ReviewRow, LiveRequestScreen, ShiftPassPrompt, AddressReleaseNotice,
  CategoryPickerStep, TasksStep, RequirementsStep, SafetyStep, ProviderRateStep, ProviderSafetyExtras,
  ProviderVisibilityPreview, ProviderAuthorityConfirm, providerRateSummary, requirementsSummary, safetySummary,
  hasRequirementsChoice, hasSafetyChoice, providerContextError, applyProviderContext,
  buildWorkerPreferencesPayload, buildSafetyFlagsPayload, buildFundingPayload, buildSelectedTasksPayload,
  inp, lbl,
} from "@/components/jobs/post/shared";
import { getCatalogueCategory } from "@/lib/constants/support-catalogue";
import { ReusePostDialog } from "@/components/dashboard/ReusePostDialog";
import type { JobSummary } from "@/lib/api/dashboard";
import { getPostAttemptId, clearPostAttemptId } from "@/lib/store/guestJobDraft";
import { postFailureMessage } from "@/lib/guestDraftResume";
import {
  TIER_META, EMPTY_CATALOGUE, EMPTY_REQUIREMENTS, EMPTY_SAFETY, EMPTY_FUNDING, EMPTY_PROVIDER_CONTEXT,
  type PostingTier, type CatalogueSelection, type WorkerRequirements, type SafetyChecklist, type FundingChoice, type ProviderContext,
} from "@/lib/types/posting";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type SectionKey = "timing" | "when" | "support" | "requirements" | "rate" | "distribution" | "review";
const SECTIONS: SectionKey[] = ["timing", "when", "support", "requirements", "rate", "distribution", "review"];

const SECTION_TITLES: Record<SectionKey, string> = {
  timing: "Timing and request",
  when: "When and where",
  support: "Support and safety",
  requirements: "Worker requirements",
  rate: "Rates and engagement",
  distribution: "Distribution and visibility",
  review: "Review staffing request",
};

const REQUEST_TYPES = [
  { v: "ONE_OFF", l: "One-off shift" }, { v: "REPLACEMENT", l: "Replacement cover" }, { v: "RECURRING_ROSTER", l: "Recurring roster" },
  { v: "OVERNIGHT", l: "Overnight / sleepover" }, { v: "SPECIALIST", l: "Specialist support" }, { v: "BACKUP", l: "Backup worker" },
];
const SHIFT_TYPES = [
  { v: "STANDARD", l: "Standard shift" }, { v: "ACTIVE_OVERNIGHT", l: "Active overnight" }, { v: "SLEEPOVER", l: "Sleepover" },
  { v: "SPLIT", l: "Split shift" }, { v: "SHORT_VISIT", l: "Short visit" },
];
const EXPERIENCE = [
  { v: "TASK_COMPETENT", l: "Task-competent worker" }, { v: "EXPERIENCED", l: "Experienced preferred" }, { v: "SPECIALIST", l: "Specialist competency required" },
];
const CONTINUITY = [
  { v: "ONE_OFF", l: "One-off worker" }, { v: "SAME_WORKER", l: "Same worker preferred" }, { v: "SMALL_TEAM", l: "Small consistent team" }, { v: "BACKUP_POOL", l: "Backup pool" },
];
const ONBOARDING = [
  { v: "INDUCTION", l: "Participant-specific induction" }, { v: "MEET_GREET", l: "Meet-and-greet" }, { v: "SHADOW", l: "Shadow shift" },
  { v: "PAPERWORK", l: "Paperwork first" }, { v: "INDUCTED", l: "Already inducted" },
];
const DISTRIBUTION_MODES = [
  { v: "EXTERNAL_NOW", l: "External now" }, { v: "INTERNAL_FIRST", l: "Internal first" }, { v: "INTERNAL_THEN_EXTERNAL", l: "Internal then external" },
];
const ESCALATIONS = [
  { v: "MANUAL_REVIEW", l: "Manual review before external publish" }, { v: "NOTIFY_NO_RESPONSE", l: "Notify me if no internal response" },
];
const AUDIENCES = [{ v: "VERIFIED", l: "Verified workers" }, { v: "INDEPENDENT", l: "Eligible independent workers" }];
const MATCHING = [{ v: "NOTIFY_MATCHES", l: "Notify eligible matches" }, { v: "MANUAL_ONLY", l: "Manual review only" }];
const optLabel = (list: { v: string; l: string }[], v: string) => list.find((o) => o.v === v)?.l ?? v;

interface BranchOpt { id: string; name: string; isActive?: boolean }
interface AdminOpt { id: string; status: string; user: { id: string; name: string } }
interface MemberOpt { key: string; name: string; status: string }

const DURATION_OPTIONS = [
  { v: "0.5", l: "30 minutes" }, { v: "1", l: "1 hour" }, { v: "2", l: "2 hours" }, { v: "3", l: "3 hours" },
  { v: "4", l: "4 hours" }, { v: "6", l: "6 hours" }, { v: "8", l: "8 hours" }, { v: "OTHER", l: "Other" },
];

const SUPPORT_NEEDS = [
  { v: "PERSONAL_CARE", l: "Personal care" },
  { v: "MOBILITY_MANUAL_HANDLING", l: "Mobility / manual handling" },
  { v: "MEDICATION", l: "Medication assistance" },
  { v: "CLINICAL", l: "Clinical or complex-support tasks" },
  { v: "TWO_PERSON", l: "Two-person transfer or support" },
  { v: "LONE_WORKER", l: "Lone-worker arrangements apply" },
  { v: "HANDOVER", l: "Handover required" },
  { v: "PROGRESS_NOTES", l: "Progress notes required" },
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
  RAPID: [{ v: "15", l: "Within 15 minutes of start" }, { v: "30", l: "Within 30 minutes of start" }, { v: "60", l: "Within 60 minutes of start" }, { v: "120", l: "Anytime within the 2-hour window" }],
  URGENT: [{ v: "30", l: "Within 30 minutes of start" }, { v: "60", l: "Within 1 hour of start" }, { v: "120", l: "Within 2 hours of start" }, { v: "360", l: "Anytime within the 6-hour window" }],
};

const COVER_REASONS = [
  { v: "SICK_LEAVE", l: "Sick leave" }, { v: "ANNUAL_LEAVE", l: "Annual leave" }, { v: "WORKER_CANCELLED", l: "Worker cancelled" },
  { v: "ROSTER_GAP", l: "Roster gap" }, { v: "ADDITIONAL_DEMAND", l: "Additional participant demand" }, { v: "OTHER", l: "Other" },
];

const TIER_NAME: Record<PostingTier, string> = { RAPID: "Last Min", URGENT: "Urgent", LAST_MINUTE: "Short Notice", ROUTINE: "Routine" };

// Minutes from now → [min, max] the start must fall in for each tier (PR-P01).
const START_WINDOW: Record<PostingTier, { min: number; max: number; msg: string }> = {
  RAPID: { min: -1, max: 120, msg: "Last Min must start within 2 hours. For a later start choose Urgent, Short Notice or Routine." },
  URGENT: { min: 120, max: 360, msg: "Urgent starts after 2 hours and within 6 hours. Choose Last Min for sooner or Short Notice for later." },
  LAST_MINUTE: { min: 360, max: 48 * 60, msg: "Short Notice starts after 6 hours and within 48 hours. Choose Urgent for sooner or Routine for later." },
  ROUTINE: { min: 48 * 60, max: Number.POSITIVE_INFINITY, msg: "Routine starts more than 48 hours from now. Choose Short Notice for sooner." },
};

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function localInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Step names shown on the popup tabs (Provider demo wording, doc fields unchanged).
const TAB_NAMES = SECTIONS.map((k) => SECTION_TITLES[k]);

export function ProviderStaffingWizard({ tier: startTier, onClose, onBackToLanes, editJobId, onSaved, onViewRequest }: { tier: PostingTier; onClose?: () => void; onBackToLanes?: () => void; editJobId?: string; onSaved?: () => void; onViewRequest?: (id: string) => void }) {
  const [tier, setTierState] = useState<PostingTier>(startTier);
  const name = TIER_NAME[tier];
  const tierLabel = `${TIER_NAME[tier]} Support`;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const key = SECTIONS[step];
  const goTo = (k: SectionKey) => setStep(SECTIONS.indexOf(k));
  const [error, setError] = useState<string | null>(null);
  // A draft can be resumed in place from the "Draft saved" screen, so the record being edited can change after mount.
  const [resumeId, setResumeId] = useState<string | null>(null);
  const editId = editJobId ?? resumeId;
  const [draftEdit, setDraftEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(!!editJobId);
  const [saving, setSaving] = useState(false);
  const [shiftPassBlocked, setShiftPassBlocked] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; isDraft: boolean; verificationRequired: boolean; scheduledFor?: string | null } | null>(null);
  const [allowance, setAllowance] = useState<{ applies: boolean; remaining: number; limit: number } | null>(null);

  // PR-R01 — when
  const [timing, setTiming] = useState<"ASAP" | "CHOOSE">("ASAP");
  const [startAt, setStartAt] = useState("");
  const [arrivalWindow, setArrivalWindow] = useState(startTier === "RAPID" ? "30" : "60");
  function setTier(t: PostingTier) {
    setTierState(t);
    setArrivalWindow(t === "RAPID" ? "30" : "60");
    setError(null);
  }

  // Step 1 — timing and request
  const [title, setTitle] = useState("");
  const [branchId, setBranchId] = useState("");
  const [requestType, setRequestType] = useState("ONE_OFF");
  const [adminId, setAdminId] = useState("");
  const [workersRequired, setWorkersRequired] = useState("1");
  const [branches, setBranches] = useState<BranchOpt[]>([]);
  const [admins, setAdmins] = useState<AdminOpt[]>([]);
  const [owner, setOwner] = useState<string>("");
  const [members, setMembers] = useState<MemberOpt[]>([]);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [pastPosts, setPastPosts] = useState<JobSummary[]>([]);
  // Step 2/4 extras
  const [shiftType, setShiftType] = useState("STANDARD");
  const [continuity, setContinuity] = useState("ONE_OFF");
  const [experience, setExperience] = useState("TASK_COMPETENT");
  const [onboarding, setOnboarding] = useState("INDUCTION");
  // Step 6 — distribution and visibility
  const [distMode, setDistMode] = useState("EXTERNAL_NOW");
  const [internalTeam, setInternalTeam] = useState<string[]>([]);
  const [escalation, setEscalation] = useState("MANUAL_REVIEW");
  const [audience, setAudience] = useState("VERIFIED");
  const [matching, setMatching] = useState("NOTIFY_MATCHES");
  const [internalNotes, setInternalNotes] = useState("");
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

  useEffect(() => {
    api.get<{ branches: BranchOpt[] }>("/provider-org/branches").then((r) => {
      const active = (r.branches ?? []).filter((b) => b.isActive !== false);
      setBranches(active);
      setBranchId((cur) => cur || active[0]?.id || "");
    }).catch(() => undefined);
    api.get<{ administrators: AdminOpt[]; owner?: { name: string } }>("/provider-org/administrators").then((r) => {
      setAdmins((r.administrators ?? []).filter((a) => a.status === "ACTIVE"));
      setOwner(r.owner?.name ?? "");
    }).catch(() => undefined);
    api.get<{ members: MemberOpt[] }>("/provider-workspace/team-availability").then((r) => setMembers((r.members ?? []).filter((m) => m.status !== "INVITED"))).catch(() => undefined);
    api.get<{ jobs: JobSummary[] }>("/jobs/my").then((r) => setPastPosts(r.jobs ?? [])).catch(() => undefined);
  }, []);


  // Edit mode: load the saved request and fill every step from it (the inverse of what submit() sends).
  useEffect(() => {
    if (!editId) return;
    type Rec = Record<string, unknown>;
    const rec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    setEditLoading(true);
    api.get<{ job: Rec }>(`/jobs/${editId}`).then(({ job }) => {
      setDraftEdit(str(job.status) === "DRAFT");
      const prefs = rec(job.workerPreferences);
      const dist = rec(job.distribution);
      const flags = rec(job.safetyFlags);
      const resp = rec(job.responsePreferences);
      const rp = rec(job.recurrencePattern);
      const startD = new Date(str(job.scheduledStartAt));
      const hrs = Number(job.totalHours);

      setTitle(str(job.title)); setBranchId(str(job.branchId)); setRequestType(str(job.requestType) || "ONE_OFF");
      setAdminId(str(job.responsibleAdminUserId)); setWorkersRequired(String(job.workersRequired ?? 1)); setShiftType(str(job.shiftType) || "STANDARD");
      setTiming("CHOOSE"); setStartAt(Number.isNaN(startD.getTime()) ? "" : localInput(startD));
      if (DURATION_OPTIONS.some((o) => o.v === String(hrs))) setDuration(String(hrs)); else if (hrs > 0) { setDuration("OTHER"); setOtherHours(String(hrs)); }
      const tf = str(job.timeFlexibility);
      if (tf && tf !== "EXACT") { setFlexible("FLEXIBLE"); setFlexNote(tf === "FLEXIBLE_SLIGHT" ? "" : tf); }
      setReason(str(job.requestPurposeCategory));
      if (tier === "ROUTINE") {
        if (rp.type === "ONGOING") {
          setPattern("RECURRING"); setDays(arr(rp.days)); setFrequency(str(rp.frequency) || "WEEKLY");
          setOpenEnded(rp.arrangement === "OPEN_ENDED"); setEndDate(str(rp.endDate));
        } else { setPattern("ONE_OFF"); setFlexible(rp.flexible ? "FLEXIBLE" : "EXACT"); }
        setIntroSteps(arr(resp.introductorySteps));
      }
      setLocationType(str(job.serviceDeliveryMode) || "HOME"); setSuburb(str(job.suburb)); setState(str(job.state) || "NSW");
      setPostcode(str(job.postcode)); setAddressLine(str(job.addressLine)); setMeetingDetails(str(job.locationNotes));

      // Support: catalogue tasks (flat list, or the richer object when follow-up answers were given).
      const st = job.selectedTasks;
      const first = Array.isArray(rec(st).categories) ? rec((rec(st).categories as unknown[])[0]) : {};
      const description = str(job.description);
      setCatalogue({
        categoryId: str(job.category),
        tasks: Array.isArray(st) ? arr(st) : arr(first.tasks),
        otherTask: tier !== "ROUTINE" && !description.includes(" staffing request:") ? description : "",
        answers: Object.fromEntries(Object.entries(rec(first.answers)).filter(([, v]) => typeof v === "string")) as Record<string, string>,
      });
      if (tier === "ROUTINE") setServiceGoals(description);
      setAgeGroup(str(prefs.participantAgeGroup)); setDelivery(prefs.deliveryMode === "REMOTE" ? "REMOTE" : "IN_PERSON");
      const needLabels = arr(prefs.supportNeeds);
      setNeeds(SUPPORT_NEEDS.filter((n) => needLabels.includes(n.l)).map((n) => n.v));
      setLogistics(LOGISTICS_NEEDS.filter((n) => needLabels.includes(n.l)).map((n) => n.v));
      const beh = needLabels.find((n) => n.startsWith("Behaviour-related / complex support: "));
      setBehaviour(!!beh); setBehaviourDetail(beh ? beh.replace("Behaviour-related / complex support: ", "") : "");
      setTravelRadiusKm(prefs.travelRadiusKm ? String(prefs.travelRadiusKm) : "");
      setAltTimes(str(prefs.alternativeTimes));

      // Requirements
      const bool = (k: string) => prefs[k] === true;
      const anyReq = ["genderRequired", "driversLicence", "vehicle", "wheelchairVehicle", "twoWorkers", "certIIIOrAbove", "restrictivePractices", "firstAid", "alliedHealth"].some(bool) || !!prefs.language || !!prefs.qualification;
      setRequirements({
        ...EMPTY_REQUIREMENTS, none: !anyReq && !prefs.participantSpecificTraining && arr(prefs.screeningChecks).length === 0,
        genderRequired: bool("genderRequired"), genderValue: str(prefs.genderValue), genderReason: str(prefs.genderReason),
        driversLicence: bool("driversLicence"), vehicle: bool("vehicle"), wheelchairVehicle: bool("wheelchairVehicle"),
        language: !!prefs.language, languageValue: typeof prefs.language === "string" ? prefs.language : "",
        qualification: !!prefs.qualification, qualificationValue: typeof prefs.qualification === "string" ? prefs.qualification : "",
        twoWorkers: bool("twoWorkers"), certIIIOrAbove: bool("certIIIOrAbove"), restrictivePractices: bool("restrictivePractices"),
        firstAid: bool("firstAid"), alliedHealth: bool("alliedHealth"),
      });
      setTraining(!!prefs.participantSpecificTraining); setTrainingDetail(str(prefs.participantSpecificTraining));
      setScreening(arr(prefs.screeningChecks));
      if (prefs.continuityPreference) setContinuity(str(prefs.continuityPreference));
      if (prefs.minimumExperience) setExperience(str(prefs.minimumExperience));
      if (prefs.onboardingRequirement) setOnboarding(str(prefs.onboardingRequirement));
      if (prefs.consistencyPreference === "ONE_REGULAR" || prefs.consistencyPreference === "SMALL_TEAM") setConsistency(prefs.consistencyPreference);
      const aw = tier === "RAPID" || tier === "URGENT" ? ARRIVAL_WINDOWS[tier].find((a) => a.l === prefs.arrivalWindow) : undefined;
      if (aw) setArrivalWindow(aw.v);

      // Safety
      const fl = (k: string) => flags[k] === true;
      setSafety({
        ...EMPTY_SAFETY, none: Object.keys(flags).filter((k) => k !== "environmentalInfo").length === 0,
        twoPersonSupport: fl("twoPersonSupport"), manualTransfer: fl("manualTransfer"), behaviourPlan: fl("behaviourPlan"),
        medicationMonitoring: fl("medicationMonitoring"), accessIssues: fl("accessIssues"),
        other: !!flags.other, otherDetail: typeof flags.other === "string" ? flags.other : "",
        communicationInstructions: fl("communicationInstructions"), mobilityInstructions: fl("mobilityInstructions"),
        mealtimePlan: fl("mealtimePlan"), allergyInfo: fl("allergyInfo"), homeAccessInfo: fl("homeAccessInfo"),
      });
      setEnvironmental(str(flags.environmentalInfo));
      const deadline = job.applicationDeadlineAt ? new Date(str(job.applicationDeadlineAt)) : null;
      setSafetyCtx({
        ageGroup: str(prefs.participantAgeGroup), delivery: prefs.deliveryMode === "REMOTE" ? "REMOTE" : "IN_PERSON",
        travelRadiusKm: prefs.travelRadiusKm ? String(prefs.travelRadiusKm) : "",
        emergencyName: str(job.emergencyContactName), emergencyPhone: str(job.emergencyContactPhone),
        escalationRoute: str(job.riskSafetyNotes).replace(/^Escalation route: /, ""),
        responseDeadline: deadline && !Number.isNaN(deadline.getTime()) ? localInput(deadline) : "", alternativeTimes: str(prefs.alternativeTimes),
      });
      if (deadline && !Number.isNaN(deadline.getTime())) setResponseDeadline(localInput(deadline));

      // Rate: the inverse of buildFundingPayload.
      const bt = str(job.budgetType);
      const note = str(job.internalNote).split("; ").filter(Boolean);
      const pick = (p: string) => note.find((n) => n.startsWith(p))?.slice(p.length) ?? "";
      const ft = str(job.fundingType);
      const engagement = pick("Engagement: ").toUpperCase();
      setFunding({
        ...EMPTY_FUNDING,
        fundingType: ft === "DISCUSS" ? "UNSURE" : ft === "MIXED" ? "" : (ft as FundingChoice["fundingType"]),
        differentPartsManaged: ft === "MIXED", planManagerName: str(job.planManagerName),
        rateChoice: bt === "NDIS" ? "NDIS_RATE" : bt === "FIXED_HOURLY" ? "OFFERED_RATE" : bt === "OPEN" ? "ASK_WORKERS" : bt === "DISCUSS" ? "DECIDE_LATER" : "",
        offeredRate: job.budgetPerHour != null ? String(job.budgetPerHour) : "",
        engagement: (["EMPLOYEE", "AGENCY", "CONTRACTOR"].includes(engagement) ? engagement : "") as FundingChoice["engagement"],
        travelPayment: pick("Travel payment: "), minShift: pick("Minimum shift: "), cancelConditions: pick("Cancellation: "),
        rateNotes: note.filter((n) => !/^(Engagement|Travel payment|Minimum shift|Cancellation): /.test(n)).join("; "),
      });

      // Distribution
      setDistMode(str(dist.mode) || "EXTERNAL_NOW"); setInternalTeam(arr(dist.internalTeam)); setEscalation(str(dist.escalation) || "MANUAL_REVIEW");
      setAudience(str(dist.audience) || "VERIFIED"); setMatching(str(dist.matching) || "NOTIFY_MATCHES"); setInternalNotes(str(dist.internalNotes));
      setAuthority(true); setAgreeShare(true);
    }).catch((e) => setError(e instanceof Error ? e.message : "Could not load the request to edit.")).finally(() => setEditLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const hours = duration === "OTHER" ? parseFloat(otherHours) : parseFloat(duration);
  const effectiveStart = (): Date | null => {
    if (tier === "RAPID" && timing === "ASAP") return new Date();
    return startAt ? new Date(startAt) : null;
  };

  function validate(): string | null {
    if (key === "timing") {
      if (!title.trim()) return "Enter a request title.";
      if (branches.length > 0 && !branchId) return "Choose the operational Branch.";
      if (!(parseInt(workersRequired, 10) >= 1)) return "Enter how many workers are required.";
    }
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
      if (!hasSafetyChoice(safety)) return "Select any essential safety information, or choose No special safety information.";
      const e = providerContextError(safetyCtx, null);
      if (e) return e;
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
    if (key === "distribution") {
      if (distMode !== "EXTERNAL_NOW" && internalTeam.length === 0) return "Choose at least one internal team member to contact first.";
    }
    if (key === "review") {
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
    if (step === 0) { if (!onClose) router.push("/jobs/post"); return; }
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const [scheduleAt, setScheduleAt] = useState("");
  async function submit(asDraft: boolean, publishAt?: Date) {
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
        continuityPreference: continuity,
        minimumExperience: experience,
        onboardingRequirement: onboarding,
        externalAudience: audience,
        matchingMode: matching,
      };
      const recurrencePattern = tier === "ROUTINE"
        ? (pattern === "ONE_OFF"
          ? { type: "ONE_TIME", flexible: flexible === "FLEXIBLE" }
          : { type: "ONGOING", arrangement: openEnded ? "OPEN_ENDED" : "FIXED_END", days, frequency, hoursPerVisit: total, endDate: openEnded ? undefined : endDate || undefined, openEnded: openEnded || undefined })
        : undefined;
      const body: Record<string, unknown> = {
        title: title.trim() || `${category?.label ?? "Support"} — ${name} staffing request`,
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
        shiftType,
        branchId: branchId || undefined,
        requestType,
        responsibleAdminUserId: adminId || undefined,
        workersRequired: Math.max(1, parseInt(workersRequired, 10) || 1),
        distribution: { mode: distMode, internalTeam, escalation, audience, matching, internalNotes: internalNotes.trim() || undefined },
        safetyFlags: { ...(buildSafetyFlagsPayload(safety) ?? {}), environmentalInfo: environmental.trim() || undefined },
        responsePreferences: (tier === "ROUTINE" && introSteps.length) || publishAt
          ? { ...(tier === "ROUTINE" && introSteps.length ? { introductorySteps: introSteps } : {}), ...(publishAt ? { scheduledPublishAtMs: publishAt.getTime(), scheduledPublishRole: "PROVIDER" } : {}) }
          : undefined,
        ...buildFundingPayload(funding),
        clientRequestId: asDraft ? undefined : getPostAttemptId(),
        asDraft,
      };
      // Emergency contact + escalation route (private until confirmation) and the response deadline.
      const payload = applyProviderContext(body, { ...safetyCtx, responseDeadline });
      if (editId) {
        // Editing keeps the request's lane and publication state; only the saved details change.
        const { urgency: _u, asDraft: _d, clientRequestId: _c, ...patch } = payload;
        void _u; void _d; void _c;
        await api.patch(`/jobs/${editId}`, patch, { timeout: 45_000 });
        if (draftEdit && !asDraft) {
          // Resuming a saved draft: post it like a new request (external now) or ask the internal team first.
          if (distMode !== "EXTERNAL_NOW") {
            if (internalTeam.length > 0) await api.post("/provider-workspace/team-availability/requests", { jobId: editId, memberKeys: internalTeam }).catch(() => undefined);
            setSubmitted({ id: editId, isDraft: true, verificationRequired: false, scheduledFor: null });
            return;
          }
          const pub = await api.patch<{ job: { status?: string } }>(`/jobs/${editId}/publish`, {}, { timeout: 45_000 });
          setSubmitted({ id: editId, isDraft: pub.job.status === "DRAFT", verificationRequired: false, scheduledFor: null });
          return;
        }
        onSaved?.();
        return;
      }
      const internalFirst = distMode !== "EXTERNAL_NOW";
      const res = await api.post<{ job: { id: string; status?: string } }>("/jobs", { ...payload, ...(internalFirst ? { asDraft: true, clientRequestId: undefined } : {}) }, { timeout: 45_000 });
      clearPostAttemptId();
      // Internal first: nothing is published externally yet (so no action is used); the chosen people are asked now.
      if (internalFirst && !asDraft && internalTeam.length > 0) {
        await api.post("/provider-workspace/team-availability/requests", { jobId: res.job.id, memberKeys: internalTeam }).catch(() => undefined);
      }
      // PR-R06 — incomplete minimum verification: the server keeps the request as a draft to resume.
      const held = !asDraft && !internalFirst && res.job.status === "DRAFT";
      setSubmitted({ id: res.job.id, isDraft: asDraft || held || internalFirst, verificationRequired: held, scheduledFor: publishAt ? publishAt.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : null });
    } catch (e) {
      if (e instanceof ApiError && e.code === "SUBSCRIPTION_LIMIT") setShiftPassBlocked(true);
      else setError(postFailureMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    const live = <LiveRequestScreen tier={tier} tierLabel={tierLabel} jobId={submitted.id} isDraft={submitted.isDraft} verificationRequired={submitted.verificationRequired} scheduledFor={submitted.scheduledFor} audience="PROVIDER"
      onOpenJob={(id, draft) => { if (draft) { setSubmitted(null); setResumeId(id); } else if (onViewRequest) onViewRequest(id); else onClose?.(); }} />;
    return onClose ? <ModalShell title="Post a staffing request" onClose={onClose}><div className="min-h-0 flex-1 overflow-y-auto">{live}</div></ModalShell> : live;
  }

  const category = getCatalogueCategory(catalogue.categoryId);
  const nextLabel = key === "review" ? (editId && !draftEdit ? "Save changes" : distMode !== "EXTERNAL_NOW" ? "Save and ask internal team" : tier === "RAPID" || tier === "URGENT" ? `Verify and Post ${name} Request` : "Publish request")
    : "Continue";
  const startWindow = START_WINDOW[tier];

  return (
    <WizardScreen
      tierLabel={`${name} staffing request`} screenTitle={SECTION_TITLES[key]} step={step} total={SECTIONS.length}
      error={error} onBack={back} onNext={next} nextLabel={nextLabel} saving={saving}
      backAtStart={!onClose}
      modal={onClose ? { onClose, title: editId && !draftEdit ? "Edit staffing request" : "Post a staffing request", subtitle: editId && !draftEdit ? "Edit existing record" : `${name} · ${TIER_META[tier].timing}`, tabs: TAB_NAMES, firstBack: onBackToLanes } : undefined}
      belowError={shiftPassBlocked ? <ShiftPassPrompt onPurchased={() => { setShiftPassBlocked(false); void submit(false); }} onDismiss={() => setShiftPassBlocked(false)} /> : undefined}
    >
      {key === "timing" && (
        <div className="space-y-5">
          {editLoading && <p className="m-0 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">Loading the saved request…</p>}
          <p className="m-0 text-sm text-slate-500">Choose the operational Branch and the genuine timing of the work.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lbl}>Request title *</label><input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className={lbl}>Branch *</label>
              <select className={inp} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.length === 0 ? <option value="">No branches yet</option> : branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select></div>
            <div><label className={lbl}>Request type *</label>
              <select className={inp} value={requestType} onChange={(e) => setRequestType(e.target.value)}>{REQUEST_TYPES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div><label className={lbl}>Timing lane *</label>
              <select className={inp} value={tier} disabled={!!editId} onChange={(e) => setTier(e.target.value as PostingTier)}>
                {(["RAPID", "URGENT", "LAST_MINUTE", "ROUTINE"] as PostingTier[]).map((t) => <option key={t} value={t}>{TIER_NAME[t]}</option>)}
              </select></div>
            <div><label className={lbl}>Responsible administrator *</label>
              <select className={inp} value={adminId} onChange={(e) => setAdminId(e.target.value)}>
                <option value="">{owner || "Organisation owner"}</option>
                {admins.map((a) => <option key={a.id} value={a.user.id}>{a.user.name}</option>)}
              </select></div>
            <div><label className={lbl}>Workers required *</label><input type="number" min={1} className={inp} value={workersRequired} onChange={(e) => setWorkersRequired(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Reuse your own previous posts to reduce repetitive entry.</span>
            <button type="button" onClick={() => setReuseOpen(true)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Find similar previous posts</button>
          </div>
          {reuseOpen && (
            <ReusePostDialog posts={pastPosts} busyId={null} error={null} onClose={() => setReuseOpen(false)}
              onPick={(id) => { const p = pastPosts.find((x) => x.id === id); if (p) { setTitle(p.title); setSuburb(p.suburb); if (p.state) setState(p.state); } setReuseOpen(false); }} />
          )}
        </div>
      )}

      {key === "when" && (
        <div className="space-y-5">
          <p className="text-xs text-slate-500 m-0">
            {tier === "RAPID" && "Last Min: within 2 hours. Live countdown and immediate matching start when you post."}
            {tier === "URGENT" && "Urgent: after 2 hours and within 6 hours. A four-hour response deadline applies. Speed is never required to publish."}
            {tier === "LAST_MINUTE" && "Short Notice: after 6 hours and within 48 hours. Recurring needs belong in a Routine request."}
            {tier === "ROUTINE" && "Routine: more than 48 hours away, or ongoing."}
          </p>

          {tier === "RAPID" && (
            <div>
              <label className={lbl}>Start time</label>
              <RadioCards value={timing} onChange={setTiming} options={[{ v: "ASAP", l: "As soon as possible" }, { v: "CHOOSE", l: "Choose a time within the next 2 hours" }]} />
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
            <div className="w-64"><label className={lbl}>Shift type</label>
              <select className={inp} value={shiftType} onChange={(e) => setShiftType(e.target.value)}>{SHIFT_TYPES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
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
          <div className="space-y-5 border-t border-slate-100 pt-5">
          <SafetyStep value={safety} onChange={(p) => setSafety({ ...safety, ...p })} audience="PROVIDER" questionLabel="Essential safety and environmental information" />
          <div>
            <label className={lbl}>Environmental information (optional)</label>
            <textarea className={inp} rows={2} value={environmental} onChange={(e) => setEnvironmental(e.target.value)} placeholder="Access, parking, pets, smoking, stairs or other hazards" />
          </div>
          <ProviderSafetyExtras value={safetyCtx} onChange={(p) => setSafetyCtx({ ...safetyCtx, ...p })} />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lbl}>Experience</label>
              <select className={inp} value={experience} onChange={(e) => setExperience(e.target.value)}>{EXPERIENCE.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div><label className={lbl}>Continuity preference</label>
              <select className={inp} value={continuity} onChange={(e) => setContinuity(e.target.value)}>{CONTINUITY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div><label className={lbl}>Onboarding requirement</label>
              <select className={inp} value={onboarding} onChange={(e) => setOnboarding(e.target.value)}>{ONBOARDING.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
          </div>
          <div className="space-y-2">
            <CheckboxRow checked={training} onChange={setTraining} label="Participant-specific training required" />
            {training && <input className={`${inp} ml-6 w-80`} value={trainingDetail} onChange={(e) => setTrainingDetail(e.target.value)} placeholder="Which training?" />}
          </div>
        </div>
      )}

      {key === "rate" && <ProviderRateStep value={funding} onChange={(p) => setFunding({ ...funding, ...p })} />}

      {key === "distribution" && (
        <div className="space-y-5">
          <p className="m-0 text-sm text-slate-500">Internal checks are free. Only a new external publication uses an action.</p>
          <div><label className={lbl}>Distribution *</label>
            <select className={inp} value={distMode} onChange={(e) => setDistMode(e.target.value)}>{DISTRIBUTION_MODES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
          <div className="space-y-2">
            <label className={lbl}>Internal team to contact</label>
            {members.length === 0 ? <p className="m-0 text-sm text-slate-500">No internal team members yet. Add them from Internal Team.</p>
              : members.map((m) => <CheckboxRow key={m.key} checked={internalTeam.includes(m.key)} onChange={() => setInternalTeam(toggle(internalTeam, m.key))} label={m.name} />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lbl}>External escalation</label>
              <select className={inp} value={escalation} onChange={(e) => setEscalation(e.target.value)}>{ESCALATIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div><label className={lbl}>External audience</label>
              <select className={inp} value={audience} onChange={(e) => setAudience(e.target.value)}>{AUDIENCES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            <div><label className={lbl}>Matching</label>
              <select className={inp} value={matching} onChange={(e) => setMatching(e.target.value)}>{MATCHING.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
          </div>
          <div><label className={lbl}>Internal Provider notes</label>
            <textarea className={inp} rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            <p className="m-0 mt-1 text-xs text-slate-400">Not shown to workers.</p></div>
        </div>
      )}

      {key === "review" && (
        <div className="space-y-5">

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <p className="text-sm font-semibold text-slate-800 m-0">Confirm your {name} request</p>
            <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
              <ReviewRow label="Request" value={`${title.trim() || "Untitled"} · ${branches.find((b) => b.id === branchId)?.name ?? "No branch"} · ${optLabel(REQUEST_TYPES, requestType)} · ${name} · ${workersRequired} worker${workersRequired === "1" ? "" : "s"}`} onEdit={() => goTo("timing")} />
              <ReviewRow label="When" value={`${tier === "RAPID" && timing === "ASAP" ? "As soon as possible" : startAt ? new Date(startAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" }) : ""} · ${Number.isFinite(hours) ? hours : "?"} h`} onEdit={() => goTo("when")} />
              <ReviewRow label="Where" value={`${suburb}, ${state}${postcode ? " " + postcode : ""} · ${delivery === "REMOTE" ? "Remote" : "In person"}`} onEdit={() => goTo("when")} />
              <ReviewRow label="Support required" value={`${category?.label ?? ""} — ${[...catalogue.tasks, catalogue.otherTask.trim()].filter(Boolean).join(", ")}`} onEdit={() => goTo("support")} />
              <ReviewRow label="Worker requirements" value={[optLabel(EXPERIENCE, experience), optLabel(CONTINUITY, continuity), requirementsSummary(requirements, "PROVIDER"), screening.join(", ")].filter((x) => x && x !== "Not specified").join(", ") + (training ? `, training: ${trainingDetail}` : "")} onEdit={() => goTo("requirements")} />
              <ReviewRow label="Rate and engagement" value={providerRateSummary(funding)} onEdit={() => goTo("rate")} />
              <ReviewRow label="Safety summary" value={safetySummary(safety)} onEdit={() => goTo("support")} />
              <ReviewRow label="Distribution" value={`${optLabel(DISTRIBUTION_MODES, distMode)}${internalTeam.length ? ` · ${internalTeam.length} internal contacted` : ""} · ${optLabel(AUDIENCES, audience)} · ${optLabel(MATCHING, matching)}`} onEdit={() => goTo("distribution")} />
            </div>
            <ProviderVisibilityPreview visible={["Service and essential tasks", "General location (suburb and state)", "Start time and duration", "Participant age group", "Rate and engagement", "Your organisation as the poster"]} />
            <AddressReleaseNotice />
            <p className="m-0 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2.5 text-xs text-slate-700">
              {distMode === "EXTERNAL_NOW"
                ? "Publication trigger: pressing the publish button sends this request to external workers now and uses one action, pass or plan entitlement."
                : "Publication trigger: nothing is published externally when you save. The selected team members are asked first. This request goes to external workers, and uses one action, only when you publish the saved draft yourself."}
            </p>
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 m-0">
              {allowance?.applies
                ? `Publishing uses one of your once-only Provider Actions (${allowance.remaining} of ${allowance.limit} remaining). Urgency never costs extra and drafts are free.`
                : "Publishing is included in your plan. Drafts are free and no action is consumed until you publish."}
            </p>
            <ProviderAuthorityConfirm checked={authority} onChange={setAuthority} />
            <CheckboxRow checked={agreeShare} onChange={setAgreeShare} label="I agree the shown request details can be shared with suitable workers" />
            <p className="text-xs text-slate-500 m-0">Optional: once published you can add a Featured Shift ($19.99) from your request page. Urgency never changes what you pay.</p>
            {(tier === "ROUTINE" || tier === "LAST_MINUTE") && (
              <div className="rounded-lg border border-slate-200 px-3 py-2.5 space-y-2">
                <p className="text-xs font-semibold text-slate-700 m-0">Schedule instead of publishing now</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="datetime-local" className={`${inp} w-60`} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                  <button
                    type="button"
                    disabled={saving || !scheduleAt || !authority || !agreeShare}
                    onClick={() => {
                      const at = new Date(scheduleAt);
                      if (!(at.getTime() > Date.now() + 60_000)) { setError("Choose a publish time in the future."); return; }
                      const start = effectiveStart();
                      if (start && at.getTime() >= start.getTime()) { setError("The publish time must be before the shift starts."); return; }
                      if (tier === "LAST_MINUTE" && start && start.getTime() - at.getTime() > 48 * 3600000) { setError("A Short Notice request can be published at most 48 hours before it starts."); return; }
                      void submit(true, at);
                    }}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >Schedule publish</button>
                </div>
                <p className="text-xs text-slate-500 m-0">Nothing is used until it publishes. If it cannot publish (for example your allowance has run out) it stays a draft and you are told.</p>
              </div>
            )}
            <div className="flex justify-end">
              <button type="button" onClick={() => void submit(true)} className="text-xs text-brand-700 underline">Save draft</button>
            </div>
          </div>
        </div>
      )}
    </WizardScreen>
  );
}
