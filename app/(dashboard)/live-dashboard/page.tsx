"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionTilesCard, type ActionTile } from "@/components/dashboard/action-tiles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { JobCard, type Job } from "@/components/jobs/job-card";
import { JobFiltersPanel, type LiveDashboardFilters } from "@/components/jobs/job-filters-panel";
import { URGENCY_TABS, inp } from "@/lib/constants/job-filters";
import { cn } from "@/lib/utils";
import { Zap, Clock, CalendarClock, CalendarDays } from "lucide-react";

const defaultFilters: LiveDashboardFilters = {
  category: "", shiftType: "", fundingType: "", isRecurring: "",
  postedWithin: "", dateFrom: "", dateTo: "", sortBy: "urgency",
};

const POST_TILES: ActionTile[] = [
  { key: "rapid",       icon: Zap,          title: "Rapid",       subtitle: "Within 60 minutes", ctaLabel: "Post Rapid request",       href: "/jobs/post?urgency=EMERGENCY",   highlighted: true },
  { key: "urgent",      icon: Clock,        title: "Urgent",      subtitle: "Within 4 hours",     ctaLabel: "Post Urgent request",      href: "/jobs/post?urgency=SAME_DAY" },
  { key: "last-minute", icon: CalendarClock,title: "Last-Minute", subtitle: "4–48 hours",         ctaLabel: "Post Last-Minute request", href: "/jobs/post?urgency=REPLACEMENT" },
  { key: "routine",     icon: CalendarDays, title: "Routine",     subtitle: "Plan ahead",         ctaLabel: "Post Routine request",     href: "/jobs/post" },
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

  const canPost = ["PARTICIPANT", "COORDINATOR"].includes(activeRole ?? "");
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

  return (
    <>
      <PageHeader
        title="Live Dashboard"
        description={`${total} open support request${total !== 1 ? "s" : ""} across the platform`}
      />
      <div className="mx-auto max-w-6xl px-5 py-6 space-y-6">
        {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {canPost && (
          <ActionTilesCard
            title="Post a support request"
            tiles={POST_TILES}
            note="Shiftify is not an emergency service. If there is immediate danger, call 000."
          />
        )}

        {/* Top bar: urgency pills + search + filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {URGENCY_TABS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => { setUrgency(value); setPage(1); }}
                className={cn("h-8 px-4 rounded-full border text-sm font-semibold transition-colors",
                  urgency === value ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form
              onSubmit={(e) => { e.preventDefault(); setSuburb(suburbInput.trim()); setPage(1); }}
              className="flex gap-2 flex-1 min-w-[220px]"
            >
              <input
                className={cn(inp, "flex-1")}
                placeholder="Search by suburb…"
                value={suburbInput}
                onChange={(e) => setSuburbInput(e.target.value)}
              />
              <Button type="submit" variant="outline" size="sm">Search</Button>
            </form>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
              {showFilters ? "Hide Filters" : `Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}`}
            </Button>
            {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline">Reset</button>}
          </div>
          {showFilters && (
            <Card>
              <CardContent className="py-4 px-4">
                <JobFiltersPanel filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onReset={resetFilters} onApply={applyFilters} />
              </CardContent>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No open jobs found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or check back later.</p>
            {activeFilterCount > 0 && <Button className="mt-4" variant="outline" onClick={resetFilters}>Clear Filters</Button>}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} canApply={canApply} applying={applying === job.id} showOwnerBadge
                  onApply={() => handleApply(job.id)} onView={() => router.push(`/jobs/${job.id}`)}
                  onToggleSave={() => handleToggleSave(job)} onToggleHide={() => handleToggleHide(job)} />
              ))}
            </div>
            {total > 20 && (
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="flex items-center text-sm text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
                <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
