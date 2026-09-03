"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { type Job } from "@/components/jobs/job-card";
import { LiveDashboardCard } from "@/components/jobs/live-dashboard-card";
import { JobFiltersPanel, type LiveDashboardFilters } from "@/components/jobs/job-filters-panel";
import { cn } from "@/lib/utils";
import { UrgencySegmented } from "@/components/jobs/urgency-segmented";
import type { LucideIcon } from "lucide-react";
import { Search, SearchX, SlidersHorizontal, ChevronLeft, ChevronRight, CheckCircle2, Lock } from "lucide-react";

const defaultFilters: LiveDashboardFilters = {
  category: "", shiftType: "", fundingType: "", isRecurring: "",
  postedWithin: "", dateFrom: "", dateTo: "", sortBy: "urgency",
};

// Legend for the card footers. These are the real states a card can be in —
// there is no access/lock level on a job — so each is shown only to the role
// that can actually encounter it.
type CardState = {
  icon: LucideIcon;
  roles: ("worker" | "poster")[];
  title: string;
  sub: string;
};

const CARD_STATES: CardState[] = [
  { icon: CheckCircle2,      roles: ["worker"], title: "Open for applications", sub: "Apply or accept the shift now." },
  { icon: CheckCircle2,      roles: ["worker"], title: "Application sent",      sub: "You have applied — awaiting a response." },
  { icon: SlidersHorizontal, roles: ["poster"], title: "Your request",          sub: "Open it to manage applications." },
  { icon: Lock,              roles: ["poster"], title: "View only",             sub: "Workers and providers can apply to this one." },
];

export default function LiveDashboardPage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [error,   setError]   = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [suburb, setSuburb] = useState("");
  const [suburbInput, setSuburbInput] = useState("");
  const [urgency, setUrgency] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LiveDashboardFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<LiveDashboardFilters>(defaultFilters);
  const canApply = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");

  const load = useCallback((f: LiveDashboardFilters, sub: string, urg: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (sub)           params.set("suburb", sub);
    if (urg)           params.set("urgency", urg);
    if (f.category)    params.set("category", f.category);
    if (f.isRecurring !== "") params.set("isRecurring", f.isRecurring);
    if (f.shiftType)   params.set("shiftType", f.shiftType);
    if (f.fundingType) params.set("fundingType", f.fundingType);
    if (f.dateFrom)    params.set("startFrom", new Date(f.dateFrom).toISOString());
    if (f.dateTo)      params.set("startTo", new Date(f.dateTo + "T23:59:59").toISOString());
    if (f.postedWithin) params.set("postedWithinHours", String(parseInt(f.postedWithin) * 24));
    if (f.sortBy)      params.set("sortBy", f.sortBy);

    api.get<{ jobs: Job[]; total: number }>(`/jobs/live-dashboard?${params}`)
      .then(r => {
        setJobs(r.jobs ?? []);
        setTotal(r.total ?? (r.jobs ?? []).length);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(appliedFilters, suburb, urgency, page); }, [appliedFilters, suburb, urgency, page, load]);

  function applyFilters() { setAppliedFilters({ ...filters }); setPage(1); setShowFilters(false); }
  function resetFilters()  { setFilters(defaultFilters); setAppliedFilters(defaultFilters); setSuburb(""); setSuburbInput(""); setUrgency(""); setPage(1); }

  async function handleApply(id: string) {
    setApplying(id);
    setUpgradeMessage(null);
    try {
      await api.post(`/jobs/${id}/apply`, {});
      load(appliedFilters, suburb, urgency, page);
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) {
        setUpgradeMessage(e.message);
      } else {
        setError((e as { message?: string })?.message ?? "Apply failed.");
      }
    }
    finally { setApplying(null); }
  }

  async function handleToggleSave(job: Job) {
    const nextSaved = !job.saved;
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, saved: nextSaved } : j));
    try {
      if (nextSaved) await api.patch(`/jobs/${job.id}/save`, { saved: true });
      else if (!job.hidden) await api.delete(`/jobs/${job.id}/save`);
      else await api.patch(`/jobs/${job.id}/save`, { saved: false });
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Could not update saved state.");
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, saved: job.saved } : j));
    }
  }

  async function handleToggleHide(job: Job) {
    const nextHidden = !job.hidden;
    if (nextHidden) setJobs(prev => prev.filter(j => j.id !== job.id));
    else setJobs(prev => prev.map(j => j.id === job.id ? { ...j, hidden: false } : j));
    try {
      if (nextHidden) await api.patch(`/jobs/${job.id}/save`, { hidden: true });
      else if (!job.saved) await api.delete(`/jobs/${job.id}/save`);
      else await api.patch(`/jobs/${job.id}/save`, { hidden: false });
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Could not update hidden state.");
      load(appliedFilters, suburb, urgency, page);
    }
  }

  const activeFilterCount = Object.entries(appliedFilters).filter(
    ([k, v]) => k !== "sortBy" && v !== "" && v !== defaultFilters[k as keyof LiveDashboardFilters]
  ).length;
  // Suburb and urgency live outside `appliedFilters`, but the empty state has
  // to offer "clear" whenever any of the three is narrowing the results.
  const hasActiveSearch = activeFilterCount > 0 || suburb !== "" || urgency !== "";
  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <div className="mx-auto px-6 py-7 space-y-6">
        {/* Header: title, standing description, suburb search */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600 ring-4 ring-brand-100" />
              <h1 className="text-[28px] font-bold leading-none tracking-tight text-slate-900">Live Dashboard</h1>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
              Real-time support requests from across the platform.<br />
              Find the right shift, when it suits you.
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSuburb(suburbInput.trim()); setPage(1); }}
            className="flex w-full gap-3 lg:w-auto"
          >
            <div className="relative w-full lg:w-[380px]">
              <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-card transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Search by suburb…"
                value={suburbInput}
                onChange={(e) => setSuburbInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-card transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              Search
            </button>
          </form>
        </div>

        {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* Urgency tabs + advanced filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <UrgencySegmented
            value={urgency}
            onChange={v => { setUrgency(v); setPage(1); }}
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="px-1 text-xs font-medium text-slate-500 transition-colors hover:text-brand-700">
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors",
                showFilters || activeFilterCount > 0
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-700 shadow-card hover:border-slate-300 hover:text-slate-900",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold tabular-nums text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <JobFiltersPanel filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onReset={resetFilters} onApply={applyFilters} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <div className="space-y-3 p-4">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
                </div>
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="h-8 w-full animate-pulse rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <SearchX className="h-6 w-6" />
            </span>
            <p className="text-base font-semibold text-slate-900">No open requests found</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasActiveSearch
                ? "Nothing matches these filters right now. Try widening your search or clearing them."
                : "There are no open support requests on the platform right now. Check back shortly."}
            </p>
            {hasActiveSearch && (
              <Button className="mt-5" variant="outline" onClick={resetFilters}>Clear all filters</Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] text-slate-500">
                Showing <span className="font-semibold tabular-nums text-slate-900">{jobs.length}</span> of{" "}
                <span className="font-semibold tabular-nums text-slate-900">{total}</span> open request{total !== 1 ? "s" : ""}
              </p>
              {totalPages > 1 && (
                <p className="shrink-0 text-[13px] tabular-nums text-slate-400">Page {page} of {totalPages}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {jobs.map(job => (
                <LiveDashboardCard key={job.id} job={job} canApply={canApply} applying={applying === job.id}
                  onApply={() => handleApply(job.id)} onView={() => router.push(`/jobs/${job.id}`)}
                  onToggleSave={() => handleToggleSave(job)} onToggleHide={() => handleToggleHide(job)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="secondary" size="sm" className="h-9" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="px-3 text-[13px] font-medium tabular-nums text-slate-500">
                  {page} / {totalPages}
                </span>
                <Button variant="secondary" size="sm" className="h-9" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {!loading && jobs.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-card">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <h2 className="w-40 shrink-0 text-base font-bold leading-snug text-slate-900">
                What the card<br />footer means
              </h2>
              <div className="grid flex-1 gap-6 sm:grid-cols-2">
                {CARD_STATES.filter(s => s.roles.includes(canApply ? "worker" : "poster")).map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.title} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 ring-1 ring-brand-100"
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{s.title}</p>
                        <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{s.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
