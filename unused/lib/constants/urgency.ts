// Three-tier urgency model (matches Prisma JobUrgency enum).
export const URGENCY_TIERS = [
  { value: "SCHEDULED", label: "Scheduled (2–3 days)", tone: "slate" },
  { value: "SAME_DAY", label: "Same Day", tone: "amber" },
  { value: "EMERGENCY", label: "Emergency", tone: "red" },
] as const;

export type UrgencyValue = (typeof URGENCY_TIERS)[number]["value"];
