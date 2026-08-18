// Shared types for the 4 participant posting journeys (Rapid/Urgent/Last-Minute/Routine).
// See Web/app/(dashboard)/jobs/post/* and Web/components/jobs/post/shared.tsx.

export type PostingTier = "RAPID" | "URGENT" | "LAST_MINUTE" | "ROUTINE";

export const TIER_META: Record<PostingTier, { label: string; timing: string; urgency: string; path: string }> = {
  RAPID:       { label: "Rapid Support",       timing: "Now – 60 minutes",              urgency: "RAPID",       path: "rapid" },
  URGENT:      { label: "Urgent Support",       timing: "Over 60 minutes, up to 4 hours", urgency: "SAME_DAY",   path: "urgent" },
  LAST_MINUTE: { label: "Last-Minute Support",  timing: "Over 4 hours, up to 48 hours",   urgency: "LAST_MINUTE", path: "last-minute" },
  ROUTINE:     { label: "Routine Support",      timing: "More than 48 hours, or ongoing", urgency: "SCHEDULED",  path: "routine" },
};

// "Who needs support" — every journey's step 2. Only "Myself" and "Someone else"
// are wired to the backend today (there's no saved-dependents feature yet — see
// [[participant-posting-journeys-spec]] memory); "Someone else" maps onto the
// existing inlineParticipant mechanism (name + phone + suburb).
export interface PersonReceivingSupport {
  who: "ME" | "SOMEONE_ELSE";
  someoneElseName: string;
  someoneElsePhone: string;
  someoneElseAgeGroup: string;
}

export const EMPTY_PERSON: PersonReceivingSupport = {
  who: "ME", someoneElseName: "", someoneElsePhone: "", someoneElseAgeGroup: "",
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
  // Routine-only nuance: essential vs preferred tagging + worker/provider type.
  essentialVsPreferred?: Record<string, "ESSENTIAL" | "PREFERRED">;
  workerOrProvider?: "WORKER" | "PROVIDER" | "EITHER";
  teamPreference?: "ONE_REGULAR" | "SMALL_TEAM" | "NO_PREFERENCE";
}

export const EMPTY_REQUIREMENTS: WorkerRequirements = {
  none: true, genderRequired: false, genderValue: "", genderReason: "",
  driversLicence: false, vehicle: false, wheelchairVehicle: false,
  language: false, languageValue: "", qualification: false, qualificationValue: "",
  twoWorkers: false,
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
  privateDetailsSharing?: "AFTER_SHORTLIST" | "AFTER_CONFIRMATION" | "";
}

export const EMPTY_SAFETY: SafetyChecklist = {
  none: true, twoPersonSupport: false, manualTransfer: false, behaviourPlan: false,
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
}

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
}

export const EMPTY_MULTI_CATALOGUE: MultiCatalogueSelection = {
  categoryIds: [], tasksByCategory: {}, answersByCategory: {}, goals: [], description: "",
};

// Routine-only (O-07): single flat-list choice of who the participant is
// looking for — merges worker/provider type and continuity preference into
// one question per the spec (unlike the other 3 journeys' plain requirements step).
export type RoutineWorkerChoice = "" | "WORKER" | "PROVIDER" | "EITHER" | "ONE_REGULAR" | "SMALL_TEAM" | "NO_PREFERENCE";

// Routine-only (O-08): each match-preference item can be selected and tagged
// Essential/Preferred; some items also take a short free-text follow-up.
export type RoutinePreferenceKey =
  | "genderPreference" | "language" | "culturalUnderstanding" | "driversLicence" | "vehicle"
  | "wheelchairVehicle" | "qualification" | "experience" | "training" | "nonSmoker" | "pets"
  | "twoWorkers" | "other";

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
  other: "Other",
};

// Items that take a short free-text follow-up when selected.
export const ROUTINE_PREFERENCE_DETAIL_KEYS: RoutinePreferenceKey[] = ["language", "qualification", "experience", "training", "other"];

export const EMPTY_ROUTINE_PREFERENCES: RoutinePreferences = (Object.keys(ROUTINE_PREFERENCE_LABELS) as RoutinePreferenceKey[])
  .reduce((acc, k) => { acc[k] = { selected: false, tier: "PREFERRED", detail: "" }; return acc; }, {} as RoutinePreferences);
