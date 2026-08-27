// Matches the backend's JobUrgency enum (EMERGENCY | SAME_DAY | SCHEDULED | REPLACEMENT | RAPID | LAST_MINUTE).
export const URGENCY_TABS: { value: string; label: string }[] = [
  { value: "",            label: "All" },
  { value: "RAPID",       label: "Rapid" },
  { value: "EMERGENCY",   label: "Emergency" },
  { value: "SAME_DAY",    label: "Same day" },
  { value: "LAST_MINUTE", label: "Last-minute" },
  { value: "REPLACEMENT", label: "Replacement" },
  { value: "SCHEDULED",   label: "Scheduled" },
];

export const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  EMERGENCY:   { bg: "#fee2e2", color: "#ff0000" },
  REPLACEMENT: { bg: "#fee2e2", color: "#a0144f" },
  RAPID:       { bg: "#fee2e2", color: "#dc2626" },
  SAME_DAY:    { bg: "#e0e3fb", color: "#5562d4" },
  LAST_MINUTE: { bg: "#ffedd5", color: "#c2410c" },
  SCHEDULED:   { bg: "#f1f5f9", color: "#475569" },
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

export const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
export const lbl = "block text-xs font-semibold text-slate-600 mb-1";
