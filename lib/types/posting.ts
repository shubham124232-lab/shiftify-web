// Shared types for the 4 participant posting journeys (Rapid/Urgent/Last-Minute/Routine).
// See Web/app/(dashboard)/jobs/post/* and Web/components/jobs/post/shared.tsx.

export type PostingTier = "RAPID" | "URGENT" | "LAST_MINUTE" | "ROUTINE";

export const TIER_META: Record<PostingTier, { label: string; timing: string; urgency: string; path: string }> = {
  RAPID:       { label: "Rapid Support",       timing: "Now – 60 minutes",              urgency: "RAPID",       path: "rapid" },
  URGENT:      { label: "Urgent Support",       timing: "Over 60 minutes, up to 4 hours", urgency: "URGENT",   path: "urgent" },
  LAST_MINUTE: { label: "Last-Minute Support",  timing: "Over 4 hours, up to 48 hours",   urgency: "LAST_MINUTE", path: "last-minute" },
  ROUTINE:     { label: "Routine Support",      timing: "More than 48 hours, or ongoing", urgency: "ROUTINE",  path: "routine" },
};

// "Who needs support" — every journey's step 2. Participants choose "Myself" or
// "Someone else" (mapped onto the existing inlineParticipant mechanism: name +
// phone + suburb). Coordinators never post for themselves — they choose
// "EXISTING_PARTICIPANT" (one of the participants they already manage, sent as
// forParticipantUserId) or "SOMEONE_ELSE" to create a new one inline.
export interface PersonReceivingSupport {
  who: "ME" | "SOMEONE_ELSE" | "EXISTING_PARTICIPANT";
  someoneElseName: string;
  someoneElsePhone: string;
  someoneElseAgeGroup: string;
  // Participant doc C-02 / O-02 — how the person posting relates to the person receiving support.
  someoneElseRelationship?: string;
  existingParticipantId: string;
  // Set by PersonStep when the selected participant is a *connection* (linked
  // via coordinator-connections, canPostRequests already true) rather than a
  // fully managed sub-account — drives the SC-P01 posting-authority prompt.
  existingParticipantIsConnection: boolean;
  existingParticipantName: string;
}

export const EMPTY_PERSON: PersonReceivingSupport = {
  who: "ME", someoneElseName: "", someoneElsePhone: "", someoneElseAgeGroup: "", existingParticipantId: "",
  existingParticipantIsConnection: false, existingParticipantName: "",
};

// Essential/preferred worker requirements — shared by all 4 journeys' "requirements" step.
export interface WorkerRequirements {
  none: boolean;
  genderRequired: boolean;
  genderValue: string;
  genderReason: string;
  driversLicence: boolean;
  vehicle: boolean;
  wheelchairVehicle: boolean;
  language: boolean;
  languageValue: string;
  qualification: boolean;
  qualificationValue: string;
  twoWorkers: boolean;
  // Live Shiftboard worker-requirement filters — shared by all 4 journeys.
  certIIIOrAbove: boolean;
  restrictivePractices: boolean;
  firstAid: boolean;
  alliedHealth: boolean;
  // Routine-only nuance: essential vs preferred tagging + worker/provider type.
  essentialVsPreferred?: Record<string, "ESSENTIAL" | "PREFERRED">;
  workerOrProvider?: "WORKER" | "PROVIDER" | "EITHER";
  teamPreference?: "ONE_REGULAR" | "SMALL_TEAM" | "NO_PREFERENCE";
}

// `none` starts false: every doc marks this question "Required — choose No additional
// requirement if none", so the user must make an active choice before continuing.
export const EMPTY_REQUIREMENTS: WorkerRequirements = {
  none: false, genderRequired: false, genderValue: "", genderReason: "",
  driversLicence: false, vehicle: false, wheelchairVehicle: false,
  language: false, languageValue: "", qualification: false, qualificationValue: "",
  twoWorkers: false,
  certIIIOrAbove: false, restrictivePractices: false, firstAid: false, alliedHealth: false,
};

// Critical safety information checklist — shared by all 4 journeys.
export interface SafetyChecklist {
  none: boolean;
  twoPersonSupport: boolean;
  manualTransfer: boolean;
  behaviourPlan: boolean;
  medicationMonitoring: boolean;
  accessIssues: boolean; // pets, smoking, stairs, access
  other: boolean;
  otherDetail: string;
  // Routine-only extras (O-09) — superset of the shared 6 items above.
  communicationInstructions?: boolean;
  mobilityInstructions?: boolean;
  mealtimePlan?: boolean;
  allergyInfo?: boolean;
  homeAccessInfo?: boolean;
  // Coordinator Routine extras (SC-O09).
  supportPlanAvailable?: boolean;
  privateDocsShareable?: boolean;
  privateDetailsSharing?: "AFTER_SHORTLIST" | "AFTER_CONFIRMATION" | "";
}

// `none` starts false for the same reason as EMPTY_REQUIREMENTS ("Required; choose No
// special safety information if none").
export const EMPTY_SAFETY: SafetyChecklist = {
  none: false, twoPersonSupport: false, manualTransfer: false, behaviourPlan: false,
  medicationMonitoring: false, accessIssues: false, other: false, otherDetail: "",
  communicationInstructions: false, mobilityInstructions: false, mealtimePlan: false,
  allergyInfo: false, homeAccessInfo: false, privateDetailsSharing: "",
};

// Funding + rate choice — shared by all 4 journeys.
export interface FundingChoice {
  fundingType: "SELF_MANAGED" | "PLAN_MANAGED" | "NDIA_MANAGED" | "PRIVATE" | "UNSURE" | "";
  planManagerName: string;
  rateChoice: "NDIS_RATE" | "OFFERED_RATE" | "ASK_WORKERS" | "DECIDE_LATER" | "";
  offeredRate: string;
  // Routine-only (O-10): sessions may use different funding arrangements.
  differentPartsManaged?: boolean;
  // Routine-only (O-11): optional notes about agreed travel/evening/weekend/
  // public-holiday/cancellation arrangements.
  rateNotes?: string;
  // Provider-only (PR-R04 "Rate and engagement") — folded into the existing
  // internalNote text by buildFundingPayload, no dedicated columns.
  engagement?: "EMPLOYEE" | "AGENCY" | "CONTRACTOR" | "";
  travelPayment?: string;
  minShift?: string;
  cancelConditions?: string;
}

// Provider-only extras from the Provider journey (PR-R01 delivery and travel radius,
// PR-R02 participant age group, PR-R05 emergency contact and escalation route).
// Sent in the existing workerPreferences / internalNote JSON-text fields — no new columns.
export interface ProviderContext {
  ageGroup: string;
  delivery: "IN_PERSON" | "REMOTE" | "";
  travelRadiusKm: string;
  emergencyName: string;
  emergencyPhone: string;
  escalationRoute: string;
  // PR-L01 / PR-O01 response deadline (datetime-local), PR-U01 alternative start times.
  responseDeadline: string;
  alternativeTimes: string;
}

export const EMPTY_PROVIDER_CONTEXT: ProviderContext = {
  ageGroup: "", delivery: "", travelRadiusKm: "", emergencyName: "", emergencyPhone: "", escalationRoute: "", responseDeadline: "", alternativeTimes: "",
};

export const EMPTY_FUNDING: FundingChoice = {
  fundingType: "", planManagerName: "", rateChoice: "", offeredRate: "",
  differentPartsManaged: false, rateNotes: "",
};

export interface CatalogueSelection {
  categoryId: string;
  tasks: string[];
  otherTask: string;
  answers: Record<string, string>;
}

export const EMPTY_CATALOGUE: CatalogueSelection = { categoryId: "", tasks: [], otherTask: "", answers: {} };

// Routine-only (O-03/O-04): multiple categories may be selected, each with its
// own tasks + follow-up answers, plus the shared goals/description block.
export interface MultiCatalogueSelection {
  categoryIds: string[];
  tasksByCategory: Record<string, string[]>;
  answersByCategory: Record<string, Record<string, string>>;
  goals: string[];
  description: string;
  // Coordinator-only (SC-O04) optional plan goal.
  planGoal?: string;
}

export const EMPTY_MULTI_CATALOGUE: MultiCatalogueSelection = {
  categoryIds: [], tasksByCategory: {}, answersByCategory: {}, goals: [], description: "",
};

// Routine-only (O-07): single flat-list choice of who the participant is
// looking for — merges worker/provider type and continuity preference into
// one question per the spec (unlike the other 3 journeys' plain requirements step).
export type RoutineWorkerChoice = "" | "WORKER" | "PROVIDER" | "EITHER" | "ONE_REGULAR" | "SMALL_TEAM" | "NO_PREFERENCE"
  // Coordinator wording (SC-O07 / SC-L06).
  | "SINGLE_WORKER" | "TEAM_ROSTER" | "TWO_WORKERS";

// Routine-only (O-08): each match-preference item can be selected and tagged
// Essential/Preferred; some items also take a short free-text follow-up.
export type RoutinePreferenceKey =
  | "genderPreference" | "language" | "culturalUnderstanding" | "driversLicence" | "vehicle"
  | "wheelchairVehicle" | "qualification" | "experience" | "training" | "nonSmoker" | "pets"
  | "twoWorkers" | "certIIIOrAbove" | "restrictivePractices" | "firstAid" | "alliedHealth" | "other"
  // Coordinator-only (SC-O08).
  | "availabilityPattern" | "sharedInterests" | "communicationStyle" | "noAdditional";

export interface RoutinePreferenceItem {
  selected: boolean;
  tier: "ESSENTIAL" | "PREFERRED";
  detail: string;
}

export type RoutinePreferences = Record<RoutinePreferenceKey, RoutinePreferenceItem>;

export const ROUTINE_PREFERENCE_LABELS: Record<RoutinePreferenceKey, string> = {
  genderPreference: "Gender preference",
  language: "Language/Auslan",
  culturalUnderstanding: "Cultural understanding",
  driversLicence: "Driver's licence",
  vehicle: "Worker vehicle",
  wheelchairVehicle: "Wheelchair-accessible vehicle",
  qualification: "Qualification",
  experience: "Specific experience",
  training: "Participant-specific training",
  nonSmoker: "Non-smoker",
  pets: "Comfortable with pets",
  twoWorkers: "Two workers required",
  certIIIOrAbove: "Cert III or above",
  restrictivePractices: "Restrictive practices",
  firstAid: "First aid",
  alliedHealth: "Allied health background",
  other: "Other",
  availabilityPattern: "Availability pattern",
  sharedInterests: "Shared interests",
  communicationStyle: "Preferred communication style",
  noAdditional: "No additional preference",
};

// Which preference items each audience sees (Participant doc O-08, SC-O08, and the
// Provider screening/qualification checks). Order = display order.
export const PARTICIPANT_ROUTINE_PREFERENCE_KEYS: RoutinePreferenceKey[] = [
  "genderPreference", "language", "culturalUnderstanding", "driversLicence", "vehicle", "wheelchairVehicle",
  "qualification", "experience", "training", "nonSmoker", "pets", "twoWorkers", "other",
];
export const PROVIDER_ROUTINE_PREFERENCE_KEYS: RoutinePreferenceKey[] = [
  ...PARTICIPANT_ROUTINE_PREFERENCE_KEYS.slice(0, 12), "certIIIOrAbove", "restrictivePractices", "firstAid", "alliedHealth", "other",
];
// SC-O08. "Driver/vehicle" is one coordinator checkbox that sets both driversLicence and vehicle.
export const COORDINATOR_ROUTINE_PREFERENCE_KEYS: RoutinePreferenceKey[] = [
  "experience", "qualification", "genderPreference", "language", "driversLicence", "wheelchairVehicle",
  "availabilityPattern", "sharedInterests", "communicationStyle", "noAdditional",
];

// Items that take a short free-text follow-up when selected.
export const ROUTINE_PREFERENCE_DETAIL_KEYS: RoutinePreferenceKey[] = ["language", "qualification", "experience", "training", "other", "sharedInterests", "communicationStyle"];

export const EMPTY_ROUTINE_PREFERENCES: RoutinePreferences = (Object.keys(ROUTINE_PREFERENCE_LABELS) as RoutinePreferenceKey[])
  .reduce((acc, k) => { acc[k] = { selected: false, tier: "PREFERRED", detail: "" }; return acc; }, {} as RoutinePreferences);
