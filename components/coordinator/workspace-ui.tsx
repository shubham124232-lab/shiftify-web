"use client";

// Building blocks for the Support Coordinator workspace (flat cards, pink accent, DM-style
// headings). Every coordinator sidebar page is laid out with these so the pages match.

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Users } from "lucide-react";
import { api } from "@/lib/api";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";

export const BORDER = "border-[#e4e6ed]";

// ── Participant view ─────────────────────────────────────────────────────────

export interface WorkspaceParticipant { id: string; name: string }

// Everyone this coordinator manages or is connected to (accepted), de-duplicated.
export function useCoordinatorParticipants() {
  const [managed, setManaged] = useState<WorkspaceParticipant[]>([]);
  const [connected, setConnected] = useState<WorkspaceParticipant[]>([]);
  useEffect(() => {
    api.get<{ users: WorkspaceParticipant[] }>("/linking/participants").then((r) => setManaged(r.users ?? [])).catch(() => {});
    api.get<{ connections: { status: string; participant: WorkspaceParticipant }[] }>("/coordinator-connections")
      .then((r) => setConnected((r.connections ?? []).filter((c) => c.status === "ACCEPTED").map((c) => c.participant)))
      .catch(() => {});
  }, []);
  return useMemo(() => {
    const map = new Map<string, string>();
    [...managed, ...connected].forEach((p) => map.set(p.id, p.name));
    return [...map].map(([id, name]) => ({ id, name }));
  }, [managed, connected]);
}

export function ParticipantViewSelect({ value, onChange, participants }: { value: string; onChange: (v: string) => void; participants: WorkspaceParticipant[] }) {
  return (
    <label className={`relative flex items-center gap-3 rounded-xl border ${BORDER} bg-white py-2 pl-3 pr-9`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600"><Users className="h-4 w-4" /></span>
      <span className="flex flex-col">
        <span className="text-[10px] text-slate-500">Participant view</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cursor-pointer appearance-none bg-transparent text-sm font-semibold text-slate-900 outline-none"
        >
          <option value="ALL">All participants</option>
          {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </span>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
    </label>
  );
}

// ── Page frame ───────────────────────────────────────────────────────────────

export function WorkspacePage({ title, description, actions, participantView, children }: {
  title: string; description: string; actions?: ReactNode;
  /** Pass to show the Participant view selector next to the actions. */
  participantView?: { value: string; onChange: (v: string) => void; participants: WorkspaceParticipant[] };
  children: ReactNode;
}) {
  return (
    <div className="container-page space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {participantView && <ParticipantViewSelect {...participantView} />}
          {actions}
          <Link href="/help-safety" aria-label="Help" className="px-2 text-sm font-semibold text-slate-500 hover:text-slate-900">?</Link>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, action, children, bodyClassName = "p-5" }: { title?: string; action?: ReactNode; children: ReactNode; bodyClassName?: string }) {
  return (
    <section className={`rounded-xl border ${BORDER} bg-white`}>
      {title && (
        <header className={`flex min-h-[70px] items-center justify-between gap-3 border-b ${BORDER} px-5 py-3`}>
          <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** White strip that holds search inputs and filters above a list. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={`flex flex-wrap items-center gap-3 rounded-xl border ${BORDER} bg-white p-4`}>{children}</div>;
}

export const fieldClass = `h-10 rounded-lg border ${BORDER} bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600`;

// ── Buttons and links ────────────────────────────────────────────────────────

export function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="px-2 text-sm font-semibold text-slate-500 hover:text-slate-900">{children}</Link>;
}

const outline = `inline-flex items-center justify-center rounded-lg border ${BORDER} bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50`;
const primary = "inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50";

export function OutlineButton({ href, onClick, children, className = "", disabled }: { href?: string; onClick?: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  if (href) return <Link href={href} className={`${outline} ${className}`}>{children}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} className={`${outline} ${className}`}>{children}</button>;
}

export function PrimaryButton({ href, onClick, children, className = "", disabled, type = "button" }: { href?: string; onClick?: () => void; children: ReactNode; className?: string; disabled?: boolean; type?: "button" | "submit" }) {
  if (href) return <Link href={href} className={`${primary} ${className}`}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${primary} ${className}`}>{children}</button>;
}

/** Pill-style section tabs ("All requests · Responses · Post support request"). */
export function SubTabs({ items }: { items: { label: string; href?: string; onClick?: () => void; active?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => {
        const cls = `rounded-lg border px-3 py-2 text-sm font-semibold ${t.active ? "border-brand-100 bg-brand-50 text-brand-600" : `${BORDER} bg-white text-slate-900 hover:bg-slate-50`}`;
        return t.href
          ? <Link key={t.label} href={t.href} className={cls}>{t.label}</Link>
          : <button key={t.label} type="button" onClick={t.onClick} className={cls}>{t.label}</button>;
      })}
    </div>
  );
}

// ── Chips and empty states ───────────────────────────────────────────────────

export type ChipTone = "green" | "red" | "blue" | "amber" | "slate" | { bg: string; color: string };

export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  const cls = typeof tone === "string"
    ? { green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", slate: "bg-slate-100 text-slate-600" }[tone]
    : "";
  const style = typeof tone === "string" ? undefined : { background: tone.bg, color: tone.color };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`} style={style}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-slate-500">{children}</p>;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>;
}

export function Avatar({ name, tone = "pink" }: { name: string; tone?: "pink" | "blue" }) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone === "pink" ? "bg-brand-50 text-brand-600" : "bg-blue-50 text-blue-700"}`}>
      {letters || "?"}
    </span>
  );
}

// ── Request timing ───────────────────────────────────────────────────────────

export const TIERS: { key: string; label: string; range: string }[] = [
  { key: "RAPID",       label: "Rapid",       range: "Within 60 minutes" },
  { key: "URGENT",      label: "Urgent",      range: "Within 4 hours" },
  { key: "LAST_MINUTE", label: "Last-Minute", range: "4–48 hours" },
  { key: "ROUTINE",     label: "Routine",     range: "Over 48 hours" },
];
export const TIER_LABEL: Record<string, string> = Object.fromEntries(TIERS.map((t) => [t.key, t.label]));
export const tierStyle = (urgency?: string) => URGENCY_STYLE[urgency || "ROUTINE"] ?? URGENCY_STYLE.ROUTINE;

/** The five timing cards with a coloured top edge and a count. */
export function TierTabs({ value, onChange, count, loading }: { value: string; onChange: (k: string) => void; count: (k: string) => number; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {[{ key: "ALL", label: "All", range: "All timings" }, ...TIERS].map((t) => {
        const active = value === t.key;
        const solid = t.key === "ALL" ? "var(--td-pink)" : URGENCY_STYLE[t.key]?.solid;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left ${active ? "border-brand-600 bg-brand-50" : `${BORDER} bg-white hover:bg-slate-50`}`}
            style={{ borderTopColor: solid, borderTopWidth: 2 }}
          >
            <span>
              <span className={`block text-[13px] font-semibold ${active ? "text-brand-600" : "text-slate-900"}`}>{t.label}</span>
              <span className="block text-[11px] text-slate-500">{t.range}</span>
            </span>
            <span className={`text-sm font-bold ${active ? "text-brand-600" : "text-slate-900"}`}>{loading ? "…" : count(t.key)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A request row with a coloured left edge, chips, title, meta lines and actions on the right. */
export function RequestRow({ urgency, chips, title, meta, detail, actions }: { urgency?: string; chips: ReactNode; title: string; meta?: string; detail?: string; actions: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border-l-2 bg-slate-50 px-3.5 py-3.5" style={{ borderLeftColor: tierStyle(urgency).solid }}>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5">{chips}</div>
        <p className="mt-2 truncate text-sm font-bold text-slate-900">{title}</p>
        {meta && <p className="mt-1 text-xs text-slate-500">{meta}</p>}
        {detail && <p className="mt-1.5 text-xs text-slate-500">{detail}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div>
    </div>
  );
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function shortName(name: string): string {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

export function when(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
