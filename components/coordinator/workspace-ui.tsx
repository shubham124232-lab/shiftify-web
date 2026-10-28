"use client";

// Building blocks for the Support Coordinator workspace (flat cards, pink accent, DM-style
// headings). Every coordinator sidebar page is laid out with these so the pages match.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Users } from "lucide-react";
import { api } from "@/lib/api";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";

export const BORDER = "border-[#e4e6ed]";

// ── Participant view ─────────────────────────────────────────────────────────

/** `meta` is the second line in the participant switcher, e.g. "Parramatta · Connected". */
export interface WorkspaceParticipant { id: string; name: string; meta?: string }

interface ManagedRow { id: string; name: string; suburb?: string | null }
interface ConnectionRow { status: string; participant: { id: string; name: string; defaultSuburb?: string | null } }

// Everyone this coordinator manages or is connected to (accepted or pending), de-duplicated.
export function useCoordinatorParticipants() {
  const [managed, setManaged] = useState<ManagedRow[]>([]);
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  useEffect(() => {
    api.get<{ users: ManagedRow[] }>("/linking/participants").then((r) => setManaged(r.users ?? [])).catch(() => {});
    api.get<{ connections: ConnectionRow[] }>("/coordinator-connections")
      .then((r) => setConnections((r.connections ?? []).filter((c) => c.status === "ACCEPTED" || c.status === "PENDING")))
      .catch(() => {});
  }, []);
  return useMemo(() => {
    const map = new Map<string, WorkspaceParticipant>();
    const meta = (suburb: string | null | undefined, label: string) => [suburb, label].filter(Boolean).join(" · ");
    managed.forEach((p) => map.set(p.id, { id: p.id, name: p.name, meta: meta(p.suburb, "Managed") }));
    connections.forEach((c) => {
      if (map.has(c.participant.id)) return;
      map.set(c.participant.id, { id: c.participant.id, name: c.participant.name, meta: meta(c.participant.defaultSuburb, c.status === "ACCEPTED" ? "Connected" : "Pending") });
    });
    return [...map.values()];
  }, [managed, connections]);
}

// The selected participant view is shared by every coordinator page, so it survives navigation.
let scope = "ALL";
const scopeListeners = new Set<() => void>();
function setScope(v: string) { scope = v; scopeListeners.forEach((l) => l()); }
function subscribeScope(l: () => void) { scopeListeners.add(l); return () => { scopeListeners.delete(l); }; }

/** "ALL" or a participant id; same value on every coordinator page. */
export function useParticipantScope(): [string, (v: string) => void] {
  return [useSyncExternalStore(subscribeScope, () => scope, () => "ALL"), setScope];
}

/** "Participant view" switcher; opens a menu of participants like the reference workspace. */
export function ParticipantViewSelect({ value, onChange, participants }: { value: string; onChange: (v: string) => void; participants: WorkspaceParticipant[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false; };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const current = participants.find((p) => p.id === value);
  const pick = (id: string) => { onChange(id); if (ref.current) ref.current.open = false; };
  const portfolio = `${participants.length} participant${participants.length === 1 ? "" : "s"} · Whole portfolio`;
  return (
    <details ref={ref} className="sc-switcher">
      <summary aria-label={`Participant view: ${current?.name ?? "All participants"}`}>
        <span className="sc-switcher-symbol"><Users /></span>
        <span className="sc-switcher-copy"><small>Participant view</small><strong>{current ? shortName(current.name) : "All participants"}</strong></span>
        <ChevronDown className="sc-switcher-chevron" />
      </summary>
      <div className="sc-switcher-menu">
        <div className="sc-switcher-heading">Switch participant view</div>
        <button type="button" className={`sc-choice ${value === "ALL" ? "selected" : ""}`} aria-pressed={value === "ALL"} onClick={() => pick("ALL")}>
          <span className="sc-choice-avatar portfolio"><Users /></span>
          <span><strong>All participants</strong><small>{portfolio}</small></span>
          <span className="sc-choice-check" aria-hidden="true">{value === "ALL" ? "✓" : ""}</span>
        </button>
        {participants.length > 0 && <div className="sc-choice-divider" />}
        {participants.map((p) => (
          <button key={p.id} type="button" className={`sc-choice ${value === p.id ? "selected" : ""}`} aria-pressed={value === p.id} onClick={() => pick(p.id)}>
            <span className="sc-choice-avatar">{p.name.trim()[0]?.toUpperCase() ?? "?"}</span>
            <span><strong>{shortName(p.name)}</strong>{p.meta && <small>{p.meta}</small>}</span>
            <span className="sc-choice-check" aria-hidden="true">{value === p.id ? "✓" : ""}</span>
          </button>
        ))}
        <Link href="/participants" className="sc-manage-link" onClick={() => { if (ref.current) ref.current.open = false; }}>
          Manage participants <ArrowRight />
        </Link>
      </div>
    </details>
  );
}

// Pages that don't filter by participant still show the switcher, bound to the shared view.
function SharedParticipantView() {
  const participants = useCoordinatorParticipants();
  const [value, onChange] = useParticipantScope();
  return <ParticipantViewSelect value={value} onChange={onChange} participants={participants} />;
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
          <p className="mt-1 text-[13px] text-[#69707e]">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {participantView ? <ParticipantViewSelect {...participantView} /> : <SharedParticipantView />}
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
        <header className={`flex min-h-[64px] items-center justify-between gap-3 border-b ${BORDER} px-5 py-4`}>
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

const outline = `inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border ${BORDER} bg-white px-[14px] py-[9px] text-[13px] font-semibold text-[#17181d] hover:border-[#bfc3ce] hover:bg-[#f5f6f9] disabled:opacity-50`;
const primary = "inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-[#c91355] bg-[#c91355] px-[14px] py-[9px] text-[13px] font-semibold text-white hover:bg-[#a10e43] disabled:opacity-50";

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
        const cls = `rounded-lg border px-3 py-2 text-[13px] font-semibold ${t.active ? "border-brand-100 bg-brand-50 text-brand-600" : `${BORDER} bg-white text-slate-900 hover:bg-slate-50`}`;
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

/** Number card: small muted label above a large figure. */
export function StatCard({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-[#69707e]">{label}</p>
      <p className="mt-2 font-display text-[30px] font-extrabold leading-none text-[#17181d]">{value}</p>
    </>
  );
  const cls = `block rounded-xl border ${BORDER} bg-white p-6`;
  return href ? <Link href={href} className={`${cls} hover:border-[#dca3ba]`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Bordered table with small uppercase-free muted headings, as used in Reports and Team access. */
export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className={`overflow-x-auto rounded-lg border ${BORDER}`}>
      <table className="w-full border-collapse text-left text-xs text-[#17181d]">
        <thead className="bg-[#f8f9fb]">
          <tr>{head.map((h) => <th key={h} className="p-[14px] text-[11px] font-bold text-[#69707e]">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-t ${BORDER}`}>{r.map((c, j) => <td key={j} className="p-[14px] align-middle">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Muted note box inside a panel. */
export function Note({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-[#f5f6f9] px-4 py-3 text-xs leading-relaxed text-[#69707e]">{children}</div>;
}

/** Label / value line ("Organisation   Harbour Support Coordination"). */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={`grid grid-cols-[160px_minmax(0,1fr)] gap-4 border-b ${BORDER} py-3 text-[13px] last:border-b-0`}>
      <span className="text-[#69707e]">{label}</span>
      <span className="font-semibold text-[#17181d]">{children}</span>
    </div>
  );
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
  { key: "RAPID",       label: "Rapid",       range: "Within 2 hours" },
  { key: "URGENT",      label: "Urgent",      range: "Within 6 hours" },
  { key: "LAST_MINUTE", label: "Last-Minute", range: "6–48 hours" },
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
