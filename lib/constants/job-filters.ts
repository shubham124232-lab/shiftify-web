// Matches the backend's JobUrgency enum (RAPID | URGENT | LAST_MINUTE | ROUTINE).
export const URGENCY_TABS: { value: string; label: string }[] = [
  { value: "",            label: "All" },
  { value: "RAPID",       label: "Rapid" },
  { value: "URGENT",      label: "Urgent" },
  { value: "LAST_MINUTE", label: "Last-minute" },
  { value: "ROUTINE",     label: "Routine" },
];

// `bg`/`color` are a soft chip pair (tinted background + readable ink on it).
// `solid` is the same tier as a filled surface — use it wherever the urgency
// colour becomes a background, rail or dot carrying white text, since `color`
// is an ink value there and can be indistinguishable from the card.
export interface UrgencyStyle { bg: string; color: string; solid: string }

export const URGENCY_STYLE: Record<string, UrgencyStyle> = {
  RAPID:        { bg: "var(--td-rapid-soft)",   color: "var(--td-rapid)",   solid: "var(--td-rapid)" },
  URGENT:       { bg: "var(--td-urgent-soft)",  color: "var(--td-urgent)",  solid: "var(--td-urgent)" },
  LAST_MINUTE:  { bg: "var(--td-lastmin-soft)", color: "var(--td-lastmin)", solid: "var(--td-lastmin)" },
  ROUTINE:      { bg: "var(--td-routine-soft)", color: "var(--td-routine)", solid: "var(--td-routine)" },
};

export const SHIFT_TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard", ACTIVE_OVERNIGHT: "Overnight", SLEEPOVER: "Sleepover",
  TWENTY_FOUR_HOUR: "24-Hour", DROP_IN: "Drop-in",
};

// Values must match Prisma's FundingType enum (SELF_MANAGED | PLAN_MANAGED | NDIA_MANAGED | ...)
export const FUNDING_LABELS: Record<string, string> = {
  SELF_MANAGED: "Self-managed", PLAN_MANAGED: "Plan-managed", NDIA_MANAGED: "NDIA-managed",
};

export const POSTED_WITHIN_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

// Values must match the backend's jobFiltersSchema sortBy enum (newest | urgency | startDate | bestMatch)
export const SORT_OPTIONS = [
  { value: "newest", label: "Most recent" },
  { value: "urgency", label: "Urgency" },
  { value: "startDate", label: "Start date" },
];

// ─── Public Live Shiftboard only (GET /public/shiftboard) ──────────────────
// Kept separate from SORT_OPTIONS/URGENCY_STYLE above — those are the
// authenticated dashboard's taxonomy and "nearest" only makes sense once a
// visitor's location is known, which the dashboard feed never has.

export const PUBLIC_SORT_OPTIONS = [
  { value: "urgency", label: "Urgency" },
  { value: "nearest", label: "Nearest" },
  { value: "newest", label: "Most recent" },
  { value: "startDate", label: "Start date" },
];

export const TIME_OF_DAY_OPTIONS: { value: "MORNING" | "AFTERNOON" | "EVENING" | "OVERNIGHT"; label: string }[] = [
  { value: "MORNING",   label: "Morning (6am – 12pm)" },
  { value: "AFTERNOON", label: "Afternoon (12pm – 6pm)" },
  { value: "EVENING",   label: "Evening (6pm – 12am)" },
  { value: "OVERNIGHT", label: "Overnight (12am – 6am)" },
];

// Matches the workerPreferences JSON keys the posting flow writes (see
// Web/components/jobs/post/shared.tsx buildWorkerPreferencesPayload and
// Web/lib/types/posting.ts ROUTINE_PREFERENCE_LABELS) — this is a job-side
// "this shift requires X" filter, not a worker-profile filter.
export const WORKER_REQUIREMENT_FILTERS: { value: string; label: string }[] = [
  { value: "driversLicence",       label: "Driver's licence" },
  { value: "vehicle",              label: "Own vehicle" },
  { value: "certIIIOrAbove",       label: "Cert III or above" },
  { value: "restrictivePractices", label: "Restrictive practices" },
  { value: "firstAid",             label: "First aid" },
  { value: "alliedHealth",         label: "Allied health background" },
];

export const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
export const lbl = "block text-xs font-semibold text-slate-600 mb-1";
