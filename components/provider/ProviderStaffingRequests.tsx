"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardFilterBanner, useDashboardFilter } from "@/components/provider/DashboardFilterBanner";
import { MapPin, Users, Plus, Send, CalendarDays, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { ApplicationsFlow } from "@/components/provider/ApplicationsFlow";
import { RequestDetailDialog, NearbyRequestsDialog } from "@/components/provider/RequestDialogs";
import { PostShiftDialog } from "@/components/provider/DashboardDialogs";
import type { JobSummary } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { TimingCards, TierBadge, tierFor, laneSlug } from "@/components/provider/timing";

export interface StaffingRow extends JobSummary {
  scheduledEndAt?: string | null;
  budgetPerHour?: number | string | null;
  _count?: { applications: number };
}


// Demo status list -> our stored job statuses (there is no stored Paused/Expired state yet, so those two show nothing).
const STATUS_OPTIONS: { value: string; label: string; match: (s: string) => boolean }[] = [
  { value: "",          label: "All",       match: () => true },
  { value: "LIVE",      label: "Live",      match: (s) => s === "OPEN" },
  { value: "DRAFT",     label: "Draft",     match: (s) => s === "DRAFT" },
  { value: "CONFIRMED", label: "Confirmed", match: (s) => ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(s) },
  { value: "PAUSED",    label: "Paused",    match: () => false },
  { value: "FILLED",    label: "Filled",    match: (s) => s === "COMPLETED" },
  { value: "CANCELLED", label: "Cancelled", match: (s) => s === "CANCELLED" },
  { value: "EXPIRED",   label: "Expired",   match: () => false },
];

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();

// Provider "Staffing requests" (approved demo): every request the Provider posted, with timing tabs, search and a status filter.
export function ProviderStaffingRequests() {
  // "open" | "applications" — set by the dashboard number tiles.
  const [dashFilter, clearDashFilter] = useDashboardFilter();
  const [jobs, setJobs] = useState<StaffingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string>("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [review, setReview] = useState<StaffingRow | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.get<{ jobs: StaffingRow[] }>("/jobs/my")
      .then((r) => setJobs(r.jobs ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load staffing requests"); setJobs([]); });
  }, []);

  const base = useMemo(() => {
    const all = jobs ?? [];
    if (dashFilter === "open") return all.filter((j) => j.status === "OPEN");
    if (dashFilter === "applications") return all.filter((j) => j.status === "OPEN" && (j._count?.applications ?? 0) > 0);
    return all;
  }, [jobs, dashFilter]);

  const count = (key: string) => base.filter((j) => !key || j.urgency === key).length;
  const matchStatus = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  const needle = q.trim().toLowerCase();
  const rows = base
    .filter((j) => !tier || j.urgency === tier)
    .filter((j) => matchStatus.match(j.status))
    .filter((j) => !needle || `${j.title} ${j.suburb} ${j.category}`.toLowerCase().includes(needle));

  const bannerText = dashFilter === "open" ? "open internal and external staffing requests"
    : dashFilter === "applications" ? "open requests with applications" : null;

  return (
    <div className="pd-workspace">
      <div className="pd-content">
      <div className="pd-breadcrumb">Provider / Staffing</div>

      {bannerText && <DashboardFilterBanner text={bannerText} onClear={clearDashFilter} />}

      <div className="pd-page-head">
        <ProviderAreaTabs />
        <div>
          <h1>Staffing requests</h1>
          <p>Manage internal cover and external applications in one place.</p>
        </div>
        <div className="pd-buttons">
          <Link href="/provider/shift-blast" className="pd-btn"><Send />Shift Blast — SMS</Link>
          <button type="button" className="pd-btn" onClick={() => setMapOpen(true)}><MapPin />Map view</button>
          <button type="button" className="pd-btn pd-btn-primary" onClick={() => setPosting(true)}><Plus />Post a Shift</button>
        </div>
      </div>

      <section className="pd-panel">
        <div className="pd-panel-head"><h2>Your staffing requests</h2></div>

        <TimingCards value={tier} onChange={setTier} count={count} label="Staffing request timing" />

        <div className="pd-toolbar" style={{ border: 0, borderRadius: 0, marginBottom: 0 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, suburb or service…" aria-label="Search staffing" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Request status">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {jobs === null ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : error ? (
          <p className="pd-quiet-empty m-0 text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <div className="pd-quiet-empty">No staffing requests match these filters.</div>
        ) : rows.map((j) => (
          <StaffingRequestRow key={j.id} job={j} onView={() => setDetail(j.id)} onManage={() => setReview(j)} />
        ))}
        <div style={{ height: 8 }} />
        <p className="pd-privacy m-0"><ShieldCheck />Applications and confirmations remain accessible after a plan or introductory allowance ends.</p>
      </section>

      {review && <ApplicationsFlow job={review} start="manage" onClose={() => setReview(null)} onViewDetails={() => { const id = review.id; setReview(null); setDetail(id); }} />}
      {detail && <RequestDetailDialog jobId={detail} own onClose={() => setDetail(null)} />}
      {posting && <PostShiftDialog onClose={() => { setPosting(false); api.get<{ jobs: StaffingRow[] }>("/jobs/my").then((r) => setJobs(r.jobs ?? [])).catch(() => undefined); }} />}
      {mapOpen && <NearbyRequestsDialog requests={rows} onClose={() => setMapOpen(false)} onOpen={(id) => { setMapOpen(false); setDetail(id); }} />}
      </div>
    </div>
  );
}

// One staffing request row (timing bar, badge, place, time, applications, rate) — shared with the dashboard board.
export function StaffingRequestRow({ job: j, onView, onManage }: { job: StaffingRow; onView: () => void; onManage: () => void }) {
  const t = tierFor(j.urgency);
  const confirmed = ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(j.status);
  const apps = j._count?.applications ?? 0;
  const rate = j.budgetPerHour != null && j.budgetPerHour !== "" ? Number(j.budgetPerHour) : null;
  return (
    <article className="pd-request-row" data-urgency={laneSlug(t.key)}>
      <div>
        <div className="pd-row-title">
          <TierBadge urgency={t.key} />
          <strong>{j.title}</strong>
          {confirmed && <span className="pd-badge pd-badge-last-minute">Confirmed</span>}
          {j.status === "DRAFT" && <span className="pd-badge">Draft</span>}
        </div>
        <div className="pd-row-meta">
          <span><MapPin />{j.suburb}</span>
          <span><CalendarDays />{fmtDay(j.scheduledStartAt)} · {fmtTime(j.scheduledStartAt)}{j.scheduledEndAt ? `–${fmtTime(j.scheduledEndAt)}` : ""}</span>
          <span><Users />{apps} application{apps === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="pd-row-end">
        {rate !== null && <strong>${rate.toFixed(2)}/hr</strong>}
        <div className="pd-buttons">
          <button type="button" className="pd-btn pd-btn-md" onClick={onView}>View request</button>
          {!confirmed && <button type="button" className="pd-btn pd-btn-md pd-btn-primary" onClick={onManage}>Manage</button>}
        </div>
      </div>
    </article>
  );
}
