"use client";

import { useRef } from "react";
import { URGENCY_TABS, URGENCY_STYLE } from "@/lib/constants/job-filters";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

/**
 * Urgency filter tabs. Exposed as a radiogroup with a roving tabindex so the
 * whole set is one stop in the tab order and arrow keys move between tiers,
 * rather than five separate toggle buttons.
 */
export function UrgencySegmented({ value, onChange, className }: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const i = URGENCY_TABS.findIndex(t => t.value === value);
    const last = URGENCY_TABS.length - 1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i >= last ? 0 : i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i <= 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === -1) return;
    e.preventDefault();
    const target = URGENCY_TABS[next];
    onChange(target.value);
    tabRefs.current[target.value]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Filter by urgency"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex min-w-0 items-center gap-2.5 overflow-x-auto pb-0.5",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {URGENCY_TABS.map(({ value: tab, label }) => {
        const active = value === tab;
        const tierColor = URGENCY_STYLE[tab]?.solid;
        return (
          <button
            key={tab}
            ref={el => { tabRefs.current[tab] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl border px-5",
              "text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
              active
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-700 shadow-card hover:border-slate-300 hover:text-slate-900",
            )}
          >
            {tab ? (
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: tierColor }}
              />
            ) : (
              <LayoutGrid aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
