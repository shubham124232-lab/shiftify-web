"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardFilterBanner, useDashboardFilter } from "@/components/provider/DashboardFilterBanner";
import { Zap, Clock, Timer, CalendarDays, LayoutGrid, MapPin, Users, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ApplicationsFlow } from "@/components/provider/ApplicationsFlow";
import { RequestDetailDialog, NearbyRequestsDialog } from "@/components/provider/RequestDialogs";
import { PostShiftDialog } from "@/components/provider/DashboardDialogs";
import type { JobSummary } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";

interface Row extends JobSummary {
  scheduledEndAt?: string | null;
  budgetPerHour?: number | string | null;
  _count?: { applications: number };
}

const TIERS = [
  { key: "RAPID",       label: "Rapid",       icon: Zap,          badge: "bg-red-50 text-red-700",         bar: "border-l-red-500", hex: "#ef4444" },
  { key: "URGENT",      label: "Urgent",      icon: Clock,        badge: "bg-amber-50 text-amber-700",     bar: "border-l-amber-500", hex: "#f59e0b" },
  { key: "LAST_MINUTE", label: "Last Minute", icon: Timer,        badge: "bg-emerald-50 text-emerald-700", bar: "border-l-emerald-500", hex: "#10b981" },
  { key: "ROUTINE",     label: "Routine",     icon: CalendarDays, badge: "bg-blue-50 text-blue-700",       bar: "border-l-blue-500", hex: "#3b82f6" },
] as const;

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
  const [jobs, setJobs] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string>("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [review, setReview] = useState<Row | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.get<{ jobs: Row[] }>("/jobs/my")
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
    <div className="space-y-5 px-8 py-6">
      <p className="m-0 text-xs text-slate-400">Provider / Staffing</p>

      {bannerText && <DashboardFilterBanner text={bannerText} onClear={clearDashFilter} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Staffing requests</h1>
          <p className="m-0 mt-1.5 text-[15px] text-slate-500">Manage internal cover and external applications in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMapOpen(true)}><MapPin className="mr-1.5 h-4 w-4" /> Map view</Button>
          <Button size="sm" onClick={() => setPosting(true)}><Plus className="mr-1 h-4 w-4" /> Post a Shift</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Your staffing requests</h2>

        <div className="space-y-4 border-b border-slate-100 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTier("")}
              className={cn("inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors", tier === "" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>
              <LayoutGrid className="h-4 w-4" /> All shifts
              <span className={cn("rounded px-1.5 text-xs font-semibold", tier === "" ? "bg-white/25" : "bg-slate-100 text-slate-600")}>{count("")}</span>
            </button>
            {TIERS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTier(tier === t.key ? "" : t.key)}
                className={cn("inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors", tier === t.key ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>
                <t.icon className="h-4 w-4" /> {t.label}
                <span className={cn("rounded px-1.5 text-xs font-semibold", tier === t.key ? "bg-white/25" : "bg-slate-100 text-slate-600")}>{count(t.key)}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, suburb or service…"
              className="h-11 w-full max-w-sm rounded-lg border border-slate-200 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"
              className="h-11 w-full max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {jobs === null ? (
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ) : error ? (
            <p className="m-0 py-6 text-center text-sm text-red-600">{error}</p>
          ) : rows.length === 0 ? (
            <p className="m-0 py-10 text-center text-sm text-slate-500">No staffing requests match these filters.</p>
          ) : rows.map((j) => {
            const t = TIERS.find((x) => x.key === j.urgency) ?? TIERS[3];
            const confirmed = ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(j.status);
            const apps = j._count?.applications ?? 0;
            const rate = j.budgetPerHour != null && j.budgetPerHour !== "" ? Number(j.budgetPerHour) : null;
            return (
              <div key={j.id} style={{ borderLeftColor: t.hex }} className={cn("flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 border-l-[4px] bg-white px-5 py-4", t.bar)}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", t.badge)}><t.icon className="h-3 w-3" />{t.label}</span>
                    <span className="text-base font-bold text-slate-900">{j.title}</span>
                    {confirmed && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Confirmed</span>}
                    {j.status === "DRAFT" && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Draft</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.suburb}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />
                      {fmtDay(j.scheduledStartAt)} · {fmtTime(j.scheduledStartAt)}{j.scheduledEndAt ? `–${fmtTime(j.scheduledEndAt)}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{apps} application{apps === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {rate !== null && <span className="text-sm font-bold text-slate-900">${rate.toFixed(2)}/hr</span>}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetail(j.id)}>View request</Button>
                    {!confirmed && <Button size="sm" onClick={() => setReview(j)}>Manage</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="m-0 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-500">
        Applications and confirmations remain accessible after a plan or introductory allowance ends.
      </p>

      {review && <ApplicationsFlow job={review} start="manage" onClose={() => setReview(null)} onViewDetails={() => { const id = review.id; setReview(null); setDetail(id); }} />}
      {detail && <RequestDetailDialog jobId={detail} own onClose={() => setDetail(null)} />}
      {posting && <PostShiftDialog onClose={() => { setPosting(false); api.get<{ jobs: Row[] }>("/jobs/my").then((r) => setJobs(r.jobs ?? [])).catch(() => undefined); }} />}
      {mapOpen && <NearbyRequestsDialog requests={rows} onClose={() => setMapOpen(false)} onOpen={(id) => { setMapOpen(false); setDetail(id); }} />}
    </div>
  );
}
