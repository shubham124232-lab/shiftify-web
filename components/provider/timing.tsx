"use client";

import { Zap, Clock, Timer, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// Provider timing categories (approved demo names and windows; stored tiers keep their keys):
// RAPID 0–2 h → "Last Min", URGENT 2–6 h, LAST_MINUTE 6–48 h → "Short Notice", ROUTINE 48 h+.
export const PROVIDER_TIERS = [
  { key: "RAPID",       label: "Last Min",     hint: "Now–2 hours",     icon: Zap,          badge: "pd-badge-rapid" },
  { key: "URGENT",      label: "Urgent",       hint: "Over 2–6 hours",  icon: Clock,        badge: "pd-badge-urgent" },
  { key: "LAST_MINUTE", label: "Short Notice", hint: "Over 6–48 hours", icon: Timer,        badge: "pd-badge-last-minute" },
  { key: "ROUTINE",     label: "Routine",      hint: "Over 48 hours",   icon: CalendarDays, badge: "pd-badge-routine" },
] as const;

export type ProviderTier = (typeof PROVIDER_TIERS)[number];

export const tierFor = (urgency: string | null | undefined): ProviderTier =>
  PROVIDER_TIERS.find((t) => t.key === urgency) ?? PROVIDER_TIERS[3];

export const tierLabel = (urgency: string | null | undefined) => tierFor(urgency).label;

/** `data-lane` / `data-urgency` value used by the lane colours in provider-demo.css. */
export const laneSlug = (urgency: string) => urgency.toLowerCase().replace("_", "-");

/** Timing badge: icon + category name, coloured by tier. */
export function TierBadge({ urgency, className }: { urgency: string | null | undefined; className?: string }) {
  const t = tierFor(urgency);
  return <span className={cn("pd-badge", t.badge, className)}><t.icon />{t.label}</span>;
}

/** Five timing cards (All + the four categories) with counts. `value` "" means All. */
export function TimingCards({ value, onChange, count, label = "Timing" }: {
  value: string; onChange: (key: string) => void; count: (key: string) => number; label?: string;
}) {
  return (
    <div className="pd-timing" role="tablist" aria-label={label}>
      <button type="button" role="tab" aria-selected={value === ""} onClick={() => onChange("")} className={cn("pd-timing-card", value === "" && "active")}>
        <span>All</span><small>All timings</small><b>{count("")}</b>
      </button>
      {PROVIDER_TIERS.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={value === t.key} data-lane={laneSlug(t.key)} title={t.hint}
          onClick={() => onChange(t.key)} className={cn("pd-timing-card", value === t.key && "active")}>
          <span>{t.label}</span><small>{t.hint}</small><b>{count(t.key)}</b>
        </button>
      ))}
    </div>
  );
}
