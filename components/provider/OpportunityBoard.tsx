"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Zap, Clock, CalendarDays, Timer, ShieldCheck, RefreshCw, Check, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { requirementLabels } from "@/lib/constants/job-filters";
import { ProviderRespondModal } from "@/components/jobs/ProviderRespondModal";
import { NearbyRequestsDialog } from "@/components/provider/RequestDialogs";
import type { ProviderRequestRow } from "@/components/provider/RequestCard";

// Provider opportunity lists (Browse / Matched / Saved Requests). One card layout and one set of popups, three data sources.
export type BoardMode = "browse" | "matched" | "saved";

const ENDPOINT: Record<BoardMode, string> = { browse: "/provider-workspace/browse-requests", matched: "/provider-workspace/matched-requests", saved: "/provider-workspace/saved-requests" };
const EMPTY: Record<BoardMode, { title: string; body: string }> = {
  browse: { title: "No requests found", body: "Change your filters or check back when more Participants and Coordinators post." },
  matched: { title: "No matching requests right now", body: "New matches appear as Participants and Coordinators post. Matching uses your live service listings." },
  saved: { title: "No requests found", body: "Save opportunities from Browse Requests or Matched Requests to keep them here." },
};
const URGENCY: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  RAPID:       { label: "Rapid",       cls: "pd-badge-rapid",       icon: <Zap /> },
  URGENT:      { label: "Urgent",      cls: "pd-badge-urgent",   icon: <Clock /> },
  LAST_MINUTE: { label: "Last Minute", cls: "pd-badge-last-minute", icon: <Timer /> },
  ROUTINE:     { label: "Routine",     cls: "pd-badge-routine",     icon: <CalendarDays /> },
};
const FUNDING: Record<string, string> = { SELF_MANAGED: "Self-managed", PLAN_MANAGED: "Plan-managed", NDIA_MANAGED: "NDIA-managed", PRIVATE: "Private", MIXED: "Mixed", DISCUSS: "To discuss" };
const RESPONSE: Record<string, string> = { INTERESTED: "Responded", SHORTLISTED: "Shortlisted", SELECTED: "Accepted", DECLINED: "Unsuccessful", WITHDRAWN: "Withdrawn", REQUEST_FILLED: "Closed" };
const URGENCY_RANK = ["RAPID", "URGENT", "LAST_MINUTE", "ROUTINE"];
const catLabel = (v: string) => JOB_CATEGORIES.find((c) => c.value === v)?.label ?? v;
const when = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

interface Detail {
  id: string; title: string; description: string | null; category: string; urgency: string; status: string;
  suburb: string; state: string; scheduledStartAt: string; scheduledEndAt: string | null;
  fundingType?: string | null; budgetPerHour?: number | string | null; postedByRoleLabel?: string;
  workerPreferences?: Record<string, unknown> | null;
}

// Hidden: the demo and the Final handoff show one search, one dropdown and Clear filters only. The extra filters stay in the code; set true to bring them back.
const SHOW_EXTRA_FILTERS = false;

export function OpportunityBoard({ mode, crumb, title, description, headerExtra }: { mode: BoardMode; crumb: string; title: string; description: string; headerExtra?: React.ReactNode }) {
  const params = useSearchParams();
  const [rows, setRows] = useState<ProviderRequestRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [poster, setPoster] = useState("");
  const [urgency, setUrgency] = useState(params.get("urgency") ?? "");
  const [service, setService] = useState("");
  // Provider doc P40: funding, region, one-off/recurring, date, duration and response-deadline filters, plus sorting.
  const [funding, setFunding] = useState("");
  const [region, setRegion] = useState("");
  const [schedule, setSchedule] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sort, setSort] = useState("match");
  const [moreFilters, setMoreFilters] = useState(false);
  // Hide / Not suitable is remembered on this device only (no server record yet).
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [why, setWhy] = useState<ProviderRequestRow | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [respondId, setRespondId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => api.get<{ requests: ProviderRequestRow[] }>(ENDPOINT[mode])
    .then((r) => setRows(r.requests ?? []))
    .catch((e) => { setError(e instanceof Error ? e.message : "Could not load requests"); setRows([]); });
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);
  useEffect(() => { try { setHidden(JSON.parse(localStorage.getItem("provider-hidden-requests") ?? "[]")); } catch { /* storage unavailable */ } }, []);
  const hide = (id: string, on: boolean) => setHidden((cur) => {
    const next = on ? Array.from(new Set([...cur, id])) : cur.filter((x) => x !== id);
    try { localStorage.setItem("provider-hidden-requests", JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  });

  const needle = q.trim().toLowerCase();
  const list = useMemo(() => (rows ?? [])
    .filter((r) => !poster || r.posterKind === poster)
    .filter((r) => !urgency || r.urgency === urgency)
    .filter((r) => !service || r.category === service)
    .filter((r) => !needle || `${r.title} ${r.suburb} ${r.categoryLabel}`.toLowerCase().includes(needle))
    .filter((r) => !funding || r.fundingType === funding)
    .filter((r) => !region || r.state === region)
    .filter((r) => !schedule || (schedule === "RECURRING") === !!r.isRecurring)
    .filter((r) => !fromDate || new Date(r.scheduledStartAt) >= new Date(fromDate))
    .filter((r) => !duration || (duration === "SHORT" ? (r.totalHours ?? 0) <= 2 : duration === "MEDIUM" ? (r.totalHours ?? 0) > 2 && (r.totalHours ?? 0) <= 6 : (r.totalHours ?? 0) > 6))
    .filter((r) => !deadline || (r.applicationDeadlineAt && new Date(r.applicationDeadlineAt).getTime() - Date.now() <= Number(deadline) * 86_400_000 && new Date(r.applicationDeadlineAt).getTime() > Date.now()))
    .filter((r) => showHidden || !hidden.includes(r.id))
    .sort((a, b) => sort === "newest" ? +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)
      : sort === "urgency" ? URGENCY_RANK.indexOf(a.urgency) - URGENCY_RANK.indexOf(b.urgency) : 0),
  [rows, poster, urgency, service, needle, funding, region, schedule, fromDate, duration, deadline, sort, hidden, showHidden]);
  const filtered = !!(q || poster || urgency || service || funding || region || schedule || fromDate || duration || deadline);
  const clear = () => { setQ(""); setPoster(""); setUrgency(""); setService(""); setFunding(""); setRegion(""); setSchedule(""); setFromDate(""); setDuration(""); setDeadline(""); setSort("match"); };

  async function toggleSave(r: ProviderRequestRow) {
    setBusyId(r.id); setError(null);
    const wasSaved = mode === "saved" || r.saved !== false;
    try {
      if (wasSaved) await api.delete(`/jobs/${r.id}/save`); else await api.patch(`/jobs/${r.id}/save`, { saved: true });
      setRows((cur) => (cur ?? []).flatMap((x) => (x.id !== r.id ? [x] : mode === "saved" && wasSaved ? [] : [{ ...x, saved: !wasSaved }])));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update your saved requests"); }
    finally { setBusyId(null); }
  }

  const respondRow = rows?.find((r) => r.id === respondId) ?? null;
  const field = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900";

  return (
    <div className="pd-workspace">
      <div className="pd-content">
      <div className="pd-breadcrumb">{crumb}</div>
      <div className="pd-page-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="pd-buttons">
          <button type="button" className="pd-btn" onClick={() => setMapOpen(true)}><MapPin />Map view</button>
          {headerExtra}
        </div>
      </div>
      <div className="pd-toolbar" style={SHOW_EXTRA_FILTERS && moreFilters ? { marginBottom: 12 } : undefined}>
        <input placeholder="Search service, suburb or request" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search requests" />
        <select value={urgency} onChange={(e) => setUrgency(e.target.value)} aria-label="Urgency">
          <option value="">All urgency</option><option value="RAPID">Rapid</option><option value="URGENT">Urgent</option><option value="LAST_MINUTE">Last Minute</option><option value="ROUTINE">Routine</option>
        </select>
        <button type="button" className="pd-btn" onClick={clear}><RefreshCw />Clear filters</button>
        {SHOW_EXTRA_FILTERS && <button type="button" onClick={() => setMoreFilters((v) => !v)} className="text-sm font-semibold text-slate-600 hover:text-slate-900">{moreFilters ? "Fewer filters" : "More filters"}</button>}
        {SHOW_EXTRA_FILTERS && moreFilters && <div className="flex w-full flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <select className={field} value={poster} onChange={(e) => setPoster(e.target.value)} aria-label="Posted by">
            <option value="">All posters</option><option value="Participant">Participant</option><option value="Support Coordinator">Support Coordinator</option>
        </select>
          <select className={field} value={service} onChange={(e) => setService(e.target.value)} aria-label="Service">
            <option value="">All services</option>
            {JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
          <select className={field} value={funding} onChange={(e) => setFunding(e.target.value)} aria-label="Funding">
            <option value="">Any funding</option>{Object.entries(FUNDING).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className={field} value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
            <option value="">All regions</option>{["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
          <select className={field} value={schedule} onChange={(e) => setSchedule(e.target.value)} aria-label="One-off or recurring">
            <option value="">One-off or recurring</option><option value="ONE_OFF">One-off</option><option value="RECURRING">Recurring</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-500">Starts from
            <input type="date" className={field} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
          <select className={field} value={duration} onChange={(e) => setDuration(e.target.value)} aria-label="Duration">
            <option value="">Any duration</option><option value="SHORT">Up to 2 hours</option><option value="MEDIUM">2 to 6 hours</option><option value="LONG">Over 6 hours</option>
          </select>
          <select className={field} value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="Response deadline">
            <option value="">Any response deadline</option><option value="1">Closes within 1 day</option><option value="3">Closes within 3 days</option><option value="7">Closes within 7 days</option>
          </select>
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-500">Sort by
            <select className={field} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="match">Relevant match</option><option value="newest">Newest</option><option value="urgency">Urgency</option>
            </select></label>
        </div>}
      </div>

      <div className="pd-info-banner">
        <ShieldCheck width={18} height={18} className="shrink-0" />
        Participant identifiers, exact addresses and sensitive details are protected. Payment cannot unlock private information.
      </div>
      {mode !== "saved" && hidden.length > 0 && (
        <button type="button" onClick={() => setShowHidden((v) => !v)} className="pd-textbtn mb-4">
          {showHidden ? "Hide" : "Show"} {hidden.length} hidden request{hidden.length === 1 ? "" : "s"}
        </button>
      )}
      {notice && <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {rows === null ? (
        <div className="pd-quiet-empty">Loading…</div>
      ) : list.length === 0 ? (
        <section className="pd-panel">
          <div className="pd-empty">
            <LayoutGrid />
            <h3>{filtered ? "No requests found" : EMPTY[mode].title}</h3>
            <p>{filtered ? "Change your filters to see more requests." : EMPTY[mode].body}</p>
            {mode === "matched" && !filtered && <Link href="/provider/services" className="pd-btn pd-btn-primary">Post your services</Link>}
          </div>
        </section>
      ) : (
        <div className="pd-grid3">
          {list.map((r) => {
            const u = URGENCY[r.urgency] ?? URGENCY.ROUTINE;
            const isOpen = r.open !== false;
            const saved = mode === "saved" || r.saved !== false;
            return (
              <article key={r.id} className="pd-record-card">
                <div className="pd-tags">
                  <span className={`pd-badge ${u.cls}`}>{u.icon}{u.label}</span>
                  <span className="pd-badge pd-badge-blue">{r.posterKind}</span>
                  {!isOpen && <span className="pd-badge">No longer open</span>}
                  {r.responseStatus && <span className="pd-badge pd-badge-green">{RESPONSE[r.responseStatus] ?? r.responseStatus}</span>}
                </div>
                <h3>{r.title}</h3>
                <div className="pd-row-meta">
                  <span><MapPin />{r.suburb}</span>
                  {r.fundingType ? <span>{FUNDING[r.fundingType] ?? r.fundingType}</span> : null}
                </div>
                <div className="pd-card-body">{when(r.scheduledStartAt)}{r.totalHours ? ` · ${r.totalHours} hours` : ""}</div>
                <div className="pd-small" style={{ color: "var(--pd-green)", display: "flex", gap: 6, alignItems: "flex-start" }}><Check width={18} height={18} className="shrink-0" />{r.reasons?.[0] ?? "Review service area, capacity and eligibility"}</div>
                <div className="pd-buttons">
                  <button type="button" className="pd-btn pd-btn-sm" onClick={() => setWhy(r)}>Why this match</button>
                  <button type="button" className="pd-btn pd-btn-sm" onClick={() => setViewId(r.id)}>View request</button>
                  {mode !== "saved" && <button type="button" className="pd-btn pd-btn-sm pd-btn-ghost" onClick={() => hide(r.id, !hidden.includes(r.id))}>{hidden.includes(r.id) ? "Unhide" : mode === "matched" ? "Not suitable" : "Hide"}</button>}
                  {mode === "saved" && <button type="button" className="pd-btn pd-btn-sm pd-btn-ghost" disabled={busyId === r.id} onClick={() => void toggleSave(r)}>{saved ? "Unsave" : "Save"}</button>}
                  {isOpen && !r.responseStatus && <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => setRespondId(r.id)}>Respond as Provider</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>

      {mapOpen && (
        <NearbyRequestsDialog
          mode="opportunity"
          requests={list.filter((r) => r.open !== false)}
          onClose={() => setMapOpen(false)}
          onOpen={(id) => { setMapOpen(false); setViewId(id); }}
          onRespond={(id) => { setMapOpen(false); setRespondId(id); }}
        />
      )}
      {why && <WhyThisMatch row={why} onClose={() => setWhy(null)} onRespond={() => { const id = why.id; setWhy(null); setRespondId(id); }} />}
      {viewId && (
        <OpportunityDetail
          id={viewId}
          row={rows?.find((r) => r.id === viewId) ?? null}
          reasons={rows?.find((r) => r.id === viewId)?.reasons ?? []}
          saved={mode === "saved" || rows?.find((r) => r.id === viewId)?.saved !== false}
          onToggleSave={() => { const r = rows?.find((x) => x.id === viewId); if (r) void toggleSave(r); }}
          onClose={() => setViewId(null)}
          onRespond={() => { const id = viewId; setViewId(null); setRespondId(id); }}
        />
      )}
      {respondRow && (
        <ProviderRespondModal
          job={{ id: respondRow.id, title: respondRow.title, suburb: respondRow.suburb, state: respondRow.state ?? "", scheduledStartAt: respondRow.scheduledStartAt }}
          onClose={() => setRespondId(null)}
          onSuccess={() => { setRespondId(null); setNotice("Provider response submitted. Your organisation proposal is tracked in My Responses."); void load(); }}
        />
      )}
    </div>
  );
}

function WhyThisMatch({ row, onClose, onRespond }: { row: ProviderRequestRow; onClose: () => void; onRespond: () => void }) {
  const reasons = row.reasons ?? [];
  return (
    <ModalShell title="Why this suggestion" subtitle={row.title} onClose={onClose}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
        {reasons.length > 0 ? (
          <ul className="m-0 list-none space-y-1.5 p-0 text-sm text-slate-700">{reasons.map((x) => <li key={x}>✓ {x}</li>)}</ul>
        ) : (
          <p className="m-0 text-sm text-slate-700">None of your live service listings or areas match this request yet. Review service area, capacity and eligibility before responding.</p>
        )}
        <p className="m-0 text-xs text-slate-500">Matching uses your recorded services, Branch areas and capacity. It is not a probability of successful support. Verify requirements before responding.</p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {row.open !== false && !row.responseStatus && <Button onClick={onRespond}>Respond as Provider</Button>}
      </div>
    </ModalShell>
  );
}

function OpportunityDetail({ id, row, reasons, saved, onToggleSave, onClose, onRespond }: {
  id: string; row: ProviderRequestRow | null; reasons: string[]; saved: boolean; onToggleSave: () => void; onClose: () => void; onRespond: () => void;
}) {
  const [job, setJob] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    api.get<{ job: Detail }>(`/jobs/${id}`).then((r) => setJob(r.job)).catch((e) => setError(e instanceof Error ? e.message : "Could not load request"));
  }, [id]);
  const skills = job ? requirementLabels(job.workerPreferences) : [];
  const u = job ? (URGENCY[job.urgency] ?? URGENCY.ROUTINE) : null;

  async function ask() {
    setBusy(true); setError(null);
    try { await api.post(`/jobs/${id}/messages`, { body: question.trim() }); setSent(true); setAsking(false); setQuestion(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send your question"); }
    finally { setBusy(false); }
  }

  if (asking) {
    return (
      <ModalShell title="Ask a permitted clarification" subtitle={job?.title} onClose={onClose}>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          <p className="m-0 text-sm text-slate-600">Do not include private Participant identifiers. A question does not submit a Provider proposal.</p>
          <textarea className="min-h-[110px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} />
          {error && <p className="m-0 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Button variant="outline" onClick={() => setAsking(false)}>Back</Button>
          <Button disabled={busy || question.trim().length < 3} onClick={() => void ask()}>{busy ? "Sending…" : "Send question"}</Button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Support opportunity" subtitle={`Request · ${id.slice(0, 8)}`} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {error && !job ? <p className="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : !job ? <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> : (
          <>
            <div className="flex flex-wrap gap-2">
              {u && <span className={`pd-badge ${u.cls}`}>{u.icon}{u.label}</span>}
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{job.postedByRoleLabel ?? row?.posterKind ?? "Poster"}</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{job.status === "OPEN" ? "Open" : job.status}</span>
            </div>
            <h3 className="m-0 mt-3 text-2xl font-bold text-slate-900">{job.title}</h3>
            {job.description ? <p className="m-0 mt-2 text-sm text-slate-600">{job.description}</p> : null}
            <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">General location</dt><dd className="m-0 font-semibold text-slate-900">{job.suburb}{job.state ? `, ${job.state}` : ""}</dd></div>
              <div><dt className="text-xs text-slate-500">Funding</dt><dd className="m-0 font-semibold text-slate-900">{job.fundingType ? (FUNDING[job.fundingType] ?? job.fundingType) : "—"}</dd></div>
              <div><dt className="text-xs text-slate-500">Schedule</dt><dd className="m-0 font-semibold text-slate-900">{when(job.scheduledStartAt)}</dd></div>
              <div><dt className="text-xs text-slate-500">Indicative rate</dt><dd className="m-0 font-semibold text-slate-900">{job.budgetPerHour ? `$${Number(job.budgetPerHour).toFixed(2)} / hr` : "—"}</dd></div>
            </dl>
            {skills.length > 0 && (
              <section className="mt-4 border-t border-slate-100 pt-4"><h4 className="m-0 text-sm font-bold text-slate-900">Suitability and prerequisites</h4>
                <div className="mt-2 flex flex-wrap gap-2">{skills.map((k) => <span key={k} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{k}</span>)}</div></section>
            )}
            {reasons.length > 0 && (
              <section className="mt-4 border-t border-slate-100 pt-4"><h4 className="m-0 text-sm font-bold text-slate-900">Why this matches</h4>
                <ul className="m-0 mt-2 list-none space-y-1 p-0 text-sm text-emerald-700">{reasons.map((x) => <li key={x}>✓ {x}</li>)}</ul></section>
            )}
            <p className="m-0 mt-4 text-xs text-slate-500">The poster is represented by role only. Participant identity, exact location and protected notes are not public. Match suggestions are not a guarantee of suitability.</p>
            {sent && <p className="m-0 mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Question sent. The reply appears in Messages.</p>}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onToggleSave}>{saved ? "Unsave request" : "Save request"}</Button>
          <Button variant="outline" onClick={() => { setSent(false); setAsking(true); }}>Ask a question</Button>
          {row?.open !== false && !row?.responseStatus && <Button onClick={onRespond}>Respond as Provider</Button>}
        </div>
      </div>
    </ModalShell>
  );
}
