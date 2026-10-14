"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Search, Zap, Clock, CalendarDays, ShieldCheck, RefreshCw, Check } from "lucide-react";
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
  RAPID:       { label: "Rapid",       cls: "bg-red-50 text-red-700",       icon: <Zap className="h-3 w-3" /> },
  URGENT:      { label: "Urgent",      cls: "bg-amber-50 text-amber-700",   icon: <Clock className="h-3 w-3" /> },
  LAST_MINUTE: { label: "Last Minute", cls: "bg-orange-50 text-orange-700", icon: <Clock className="h-3 w-3" /> },
  ROUTINE:     { label: "Routine",     cls: "bg-blue-50 text-blue-700",     icon: <CalendarDays className="h-3 w-3" /> },
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

export function OpportunityBoard({ mode, crumb, title, description, headerExtra }: { mode: BoardMode; crumb: string; title: string; description: string; headerExtra?: React.ReactNode }) {
  const params = useSearchParams();
  const [rows, setRows] = useState<ProviderRequestRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
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
    <div className="space-y-5 px-8 py-6">
      <p className="m-0 text-xs text-slate-400">{crumb}</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="m-0 mt-1.5 text-[15px] text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMapOpen(true)}><MapPin className="mr-1.5 h-4 w-4" />Map view</Button>
          {headerExtra}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${field} w-full pl-9`} placeholder="Search by title, suburb or service" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={field} value={poster} onChange={(e) => setPoster(e.target.value)} aria-label="Posted by">
          <option value="">All posters</option><option value="Participant">Participant</option><option value="Support Coordinator">Support Coordinator</option>
        </select>
        <select className={field} value={urgency} onChange={(e) => setUrgency(e.target.value)} aria-label="Urgency">
          <option value="">All urgency</option><option value="RAPID">Rapid</option><option value="URGENT">Urgent</option><option value="LAST_MINUTE">Last Minute</option><option value="ROUTINE">Routine</option>
        </select>
        <select className={field} value={service} onChange={(e) => setService(e.target.value)} aria-label="Service">
          <option value="">All services</option>
          {JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Button variant="outline" size="sm" className="ml-auto" onClick={clear}><RefreshCw className="mr-1.5 h-4 w-4" />Clear filters</Button>
        <div className="flex w-full flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <select className={field} value={funding} onChange={(e) => setFunding(e.target.value)} aria-label="Funding">
            <option value="">Any funding</option>{Object.entries(FUNDING).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className={field} value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
            <option value="">All regions</option>{["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => <option key={s} value={s}>{s}</option>)}
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
        </div>
      </div>

      <p className="m-0 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-500">
        <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
        Participant identifiers, exact addresses and sensitive details are protected. Payment cannot unlock private information.
      </p>
      {mode !== "saved" && hidden.length > 0 && (
        <button type="button" onClick={() => setShowHidden((v) => !v)} className="self-start text-sm font-semibold text-brand-600 hover:underline">
          {showHidden ? "Hide" : "Show"} {hidden.length} hidden request{hidden.length === 1 ? "" : "s"}
        </button>
      )}
      {notice && <p className="m-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {rows === null ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="m-0 text-base font-bold text-slate-900">{filtered ? "No requests found" : EMPTY[mode].title}</p>
          <p className="m-0 mt-1 text-sm text-slate-500">{filtered ? "Change your filters to see more requests." : EMPTY[mode].body}</p>
          {mode === "matched" && !filtered && <Link href="/provider/services" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">Post your services</Link>}
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const u = URGENCY[r.urgency] ?? URGENCY.ROUTINE;
            const isOpen = r.open !== false;
            const saved = mode === "saved" || r.saved !== false;
            return (
              <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.icon}{u.label}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{r.posterKind}</span>
                  {!isOpen && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">No longer open</span>}
                  {r.responseStatus && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{RESPONSE[r.responseStatus] ?? r.responseStatus}</span>}
                </div>
                <h3 className="m-0 mt-3 text-lg font-bold text-slate-900">{r.title}</h3>
                <p className="m-0 mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />{r.suburb}{r.state ? "" : ""}{r.fundingType ? <span className="ml-1">{FUNDING[r.fundingType] ?? r.fundingType}</span> : null}
                </p>
                <p className="m-0 mt-2 text-base text-slate-600">{when(r.scheduledStartAt)}{r.totalHours ? ` · ${r.totalHours} hours` : ""}</p>
                <p className="m-0 mt-2 flex items-center gap-1.5 text-sm text-emerald-700"><Check className="h-4 w-4 shrink-0" />{r.reasons?.[0] ?? "Review service area, capacity and eligibility"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setWhy(r)}>Why this match</Button>
                  <Button variant="outline" size="sm" onClick={() => setViewId(r.id)}>View request</Button>
                  {mode !== "saved" && <Button variant="ghost" size="sm" onClick={() => hide(r.id, !hidden.includes(r.id))}>{hidden.includes(r.id) ? "Unhide" : mode === "matched" ? "Not suitable" : "Hide"}</Button>}
                  {mode === "saved" && <Button variant="ghost" size="sm" disabled={busyId === r.id} onClick={() => void toggleSave(r)}>{saved ? "Unsave" : "Save"}</Button>}
                </div>
                {isOpen && !r.responseStatus && (
                  <div className="mt-2 flex justify-end"><Button size="sm" onClick={() => setRespondId(r.id)}>Respond as Provider</Button></div>
                )}
              </li>
            );
          })}
        </ul>
      )}

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
              {u && <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.icon}{u.label}</span>}
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
