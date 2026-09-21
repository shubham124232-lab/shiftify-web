"use client";

import "@/app/home.css";
import "@/app/shiftboard.css";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { SHIFTBOARD_URGENCY } from "@/components/landing/shiftboard/urgency";
import { formatDay, formatHours, formatStartsIn, formatTime } from "@/components/landing/shiftboard/format";
import type { ShiftboardUrgency } from "@/lib/types/shiftboard";

// One row's worth of data — the dashboard feeds (open jobs, shifts, drafts)
// carry different fields, so each tab maps its own into this shape.
export interface RequestRowItem {
  id: string;
  href: string;
  heading: string;         // "Parramatta, NSW"
  sub: string;             // what the support is
  urgency?: string;        // lane colour + icon; neutral when unknown
  startAt?: string | null;
  hours?: number | null;
  showStartsIn?: boolean;  // off for drafts, which have no real start yet
  meta?: string;           // extra line item, e.g. "Saved 12 Sep"
  cta: string;
}

export interface RequestTab {
  key: string;
  label: string;
  items: RequestRowItem[] | null; // null while loading
  empty: string;
}

export function categoryLabel(value: string): string {
  return JOB_CATEGORIES.find(c => c.value === value)?.label ?? value;
}

function RequestRow({ item, index }: { item: RequestRowItem; index: number }) {
  const urg = item.urgency ? SHIFTBOARD_URGENCY[item.urgency as ShiftboardUrgency] : undefined;
  const Icon = urg?.Icon ?? ClipboardList;

  return (
    <article className="sf-sb-row" style={{ "--lane": urg?.color ?? "var(--sf-soft)", "--i": index } as CSSProperties}>
      <span className="sf-sb-row-icon" role="img" aria-label={urg ? `${urg.label} request` : "Request"} title={urg?.label}>
        <Icon aria-hidden="true" strokeWidth={2} fill={urg?.filled ? "currentColor" : "none"} />
      </span>

      <div className="sf-sb-row-body">
        <h3>{item.heading}</h3>
        <p className="sf-sb-row-cat">{item.sub}</p>
        <ul className="sf-sb-row-meta">
          {item.startAt && <li>{formatDay(item.startAt)}, {formatTime(item.startAt)}</li>}
          {item.hours != null && item.hours > 0 && <li>{formatHours(item.hours)}</li>}
          {item.meta && <li>{item.meta}</li>}
          {item.startAt && item.showStartsIn !== false && (
            <li className="sf-sb-row-starts">{formatStartsIn(item.startAt)}</li>
          )}
        </ul>
      </div>

      <Link href={item.href} className="sf-sb-row-cta">{item.cta}</Link>
    </article>
  );
}

export function MyRequestsCard({ title, tabs }: { title: string; tabs: RequestTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find(t => t.key === active) ?? tabs[0];

  return (
    <div className="sf-home sf-sb-embed">
      <section className="sf-sb sf-sb--embed" aria-labelledby="sf-myreq-title">
        <div className="sf-sb-list-head">
          <h2 id="sf-myreq-title">{title}</h2>
          <p aria-live="polite">
            {tab.items == null ? "Loading…" : `${tab.items.length} ${tab.items.length === 1 ? "result" : "results"}`}
          </p>
        </div>

        <div className="sf-sb-tabs" role="tablist" aria-label={title} style={{ "--tab-cols": tabs.length } as CSSProperties}>
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === tab.key}
              className={`sf-sb-tab${t.key === tab.key ? " active" : ""}`}
              onClick={() => setActive(t.key)}
            >
              <span className="sf-sb-tab-label">{t.label}</span>
              <span className="sf-sb-tab-window">{t.items == null ? "…" : `${t.items.length} ${t.items.length === 1 ? "request" : "requests"}`}</span>
            </button>
          ))}
        </div>

        {tab.items == null ? (
          <div className="sf-sb-list" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="sf-sb-row-skeleton" />)}
          </div>
        ) : tab.items.length === 0 ? (
          <div className="sf-sb-empty"><p>{tab.empty}</p></div>
        ) : (
          <div className="sf-sb-list">
            {tab.items.map((item, i) => <RequestRow key={item.id} item={item} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}
