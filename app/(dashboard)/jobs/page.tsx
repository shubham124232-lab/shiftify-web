"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  category: string;
  urgency: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  postedAt: string;
  status: string;
  isRecurring?: boolean;
  shiftType?: string;
  fundingType?: string;
  workerPreferences?: {
    workerType?: string;
    requiredQualifications?: string[];
    experienceLevel?: string;
  };
  budget?: { type: string; amount?: number };
  ownApplication?: { status: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  EMERGENCY: { bg: "#fee2e2", color: "#b91c1c" },
  SAME_DAY:  { bg: "#ffedd5", color: "#c2410c" },
  SCHEDULED: { bg: "#f1f5f9", color: "#475569" },
};

const SHIFT_TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard", OVERNIGHT: "Overnight", SLEEPOVER: "Sleepover",
  "24_HOUR": "24-Hour", DROP_IN: "Drop-in",
};

const FUNDING_LABELS: Record<string, string> = {
  SELF: "Self-managed", PLAN: "Plan-managed", NDIA: "NDIA-managed",
};

const POSTED_WITHIN_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "urgency", label: "Urgency" },
  { value: "start_date", label: "Start date" },
];

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
  suburb: string;
  category: string;
  urgency: string;
  shiftType: string;
  fundingType: string;
  isRecurring: string;  // "true" | "false" | ""
  workerType: string;
  experienceLevel: string;
  postedWithin: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
}

const defaultFilters: Filters = {
  suburb: "", category: "", urgency: "", shiftType: "", fundingType: "",
  isRecurring: "", workerType: "", experienceLevel: "", postedWithin: "",
  dateFrom: "", dateTo: "", sortBy: "recent",
};

const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";

function FilterSidebar({
  filters, onChange, onReset, onApply,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">Filters</span>
        <button onClick={onReset} className="text-xs text-brand-600 hover:underline">Reset all</button>
      </div>

      {/* Suburb */}
      <div>
        <label className={lbl}>Suburb</label>
        <input className={inp} placeholder="e.g. Parramatta" value={filters.suburb} onChange={e => onChange({ suburb: e.target.value })} />
      </div>

      {/* Sort */}
      <div>
        <label className={lbl}>Sort by</label>
        <select className={inp} value={filters.sortBy} onChange={e => onChange({ sortBy: e.target.value })}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className={lbl}>Category</label>
        <select className={inp} value={filters.category} onChange={e => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Urgency */}
      <div>
        <label className={lbl}>Urgency</label>
        <select className={inp} value={filters.urgency} onChange={e => onChange({ urgency: e.target.value })}>
          <option value="">Any urgency</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="SAME_DAY">Same day</option>
          <option value="SCHEDULED">Scheduled</option>
        </select>
      </div>

      {/* Recurring */}
      <div>
        <label className={lbl}>Frequency</label>
        <div className="flex flex-col gap-1.5">
          {([ ["", "All"], ["false", "One-time"], ["true", "Recurring / ongoing"] ] as [string, string][]).map(([v, l]) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer text-xs px-2.5 py-2 rounded-lg border transition-colors", filters.isRecurring === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={filters.isRecurring === v} onChange={() => onChange({ isRecurring: v })} />{l}
            </label>
          ))}
        </div>
      </div>

      {/* Shift type */}
      <div>
        <label className={lbl}>Shift type</label>
        <select className={inp} value={filters.shiftType} onChange={e => onChange({ shiftType: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(SHIFT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Funding type */}
      <div>
        <label className={lbl}>Funding type</label>
        <div className="flex flex-col gap-1.5">
          {([ ["", "Any"], ["SELF", "Self-managed"], ["PLAN", "Plan-managed"], ["NDIA", "NDIA-managed"] ] as [string, string][]).map(([v, l]) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer text-xs px-2.5 py-2 rounded-lg border transition-colors", filters.fundingType === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radiod" onChange={() => onChange({ fundingType: v })} />{l}
            </label>
          ))}
        </div>
      </div>

      {/* Worker type */}
      <div>
        <label className={lbl}>Looking for</label>
        <select className={inp} value={filters.workerType} onChange={e => onChange({ workerType: e.target.value })}>
          <option value="">Any applicant type</option>
          <option value="INDIVIDUAL">Individual worker</option>
          <option value="PROVIDER">Provider only</option>
          <option value="EITHER">Either</option>
        </select>
      </div>

      {/* Experience level */}
      <div>
        <label className={lbl}>Experience required</label>
        <select className={inp} value={filters.experienceLevel} onChange={e => onChange({ experienceLevel: e.target.value })}>
          <option value="">Any level</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="EXPERIENCED">Experienced</option>
          <option value="EXPERT">Expert / Specialist</option>
        </select>
      </div>

      {/* Date range */}
      <div>
        <label className={lbl}>Shift date from</label>
        <input type="date" className={inp} value={filters.dateFrom} onChange={e => onChange({ dateFrom: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Shift date to</label>
        <input type="date" className={inp} value={filters.dateTo} onChange={e => onChange({ dateTo: e.target.value })} />
      </div>

      {/* Posted within */}
      <div>
        <label className={lbl}>Posted within</label>
        <select className={inp} value={filters.postedWithin} onChange={e => onChange({ postedWithin: e.target.value })}>
          {POSTED_WITHIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Button className="w-full" onClick={onApply}>Apply Filters</Button>
    </aside>
  );
}

function JobCard({ job, canApply, applying, onApply, onView }: {
  job: Job;
  canApply: boolean;
  applying: boolean;
  onApply: () => void;
  onView: () => void;
}) {
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.SCHEDULED;
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
  const applied = !!job.ownApplication;
  const qualsCount = job.workerPreferences?.requiredQualifications?.length ?? 0;
  const budgetStr = job.budget?.type === "HOURLY" && job.budget.amount
    ? `$${job.budget.amount}/hr`
    : job.budget?.type === "TOTAL" && job.budget.amount
    ? `$${job.budget.amount} total`
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 transition-colors">
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: urg.bg, color: urg.color }}>
          {job.urgency.replace("_", " ")}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {catLabel}
        </span>
        {job.shiftType && job.shiftType !== "STANDARD" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            {SHIFT_TYPE_LABELS[job.shiftType] ?? job.shiftType}
          </span>
        )}
        {job.isRecurring && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Recurring
          </span>
        )}
        {job.fundingType && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {FUNDING_LABELS[job.fundingType] ?? job.fundingType}
          </span>
        )}
      </div>

      <Link href={`/jobs/${job.id}`} className="block text-base font-semibold text-slate-900 hover:text-brand-600 mb-1.5 leading-snug">
        {job.title}
      </Link>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        <span>{job.suburb}, {job.state}</span>
        {job.totalHours && <span>{job.totalHours}h</span>}
        <span>{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
        {budgetStr && <span className="font-semibold text-emerald-700">{budgetStr}</span>}
      </div>

      {qualsCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(job.workerPreferences?.requiredQualifications ?? []).slice(0, 3).map(q => (
            <span key={q} className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">{q}</span>
          ))}
          {qualsCount > 3 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">+{qualsCount - 3} more</span>}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-1">
        <Button size="sm" variant="ghost" onClick={onView}>View</Button>
        {canApply && (
          <Button size="sm" variant={applied ? "ghost" : "outline"} disabled={applied || applying} onClick={() => !applied && onApply()}>
            {applied ? `Applied (${job.ownApplication!.status})` : applying ? "Applying..." : "Quick Apply"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function JobsBrowsePage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [error,   setError]   = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);

  const canPost = ["PARTICIPANT", "COORDINATOR"].includes(activeRole ?? "");
  const canApply = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");

  const load = useCallback((f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ status: "OPEN", page: String(p), limit: "20" });
    if (f.suburb)   params.set("suburb", f.suburb);
    if (f.category) params.set("category", f.category);
    if (f.urgency)  params.set("urgency", f.urgency);
    if (f.isRecurring !== "") params.set("isRecurring", f.isRecurring);

    api.get<{ jobs: Job[]; total: number }>(`/jobs?${params}`)
      .then(r => {
        let result = r.jobs ?? [];
        if (f.shiftType)       result = result.filter(j => j.shiftType === f.shiftType);
        if (f.fundingType)     result = result.filter(j => j.fundingType === f.fundingType);
        if (f.workerType)      result = result.filter(j => j.workerPreferences?.workerType === f.workerType);
        if (f.experienceLevel) result = result.filter(j => j.workerPreferences?.experienceLevel === f.experienceLevel);
        if (f.dateFrom) result = result.filter(j => new Date(j.scheduledStartAt) >= new Date(f.dateFrom));
        if (f.dateTo)   result = result.filter(j => new Date(j.scheduledStartAt) <= new Date(f.dateTo + "T23:59:59"));
        if (f.postedWithin) {
          const cutoff = new Date(Date.now() - parseInt(f.postedWithin) * 24 * 60 * 60 * 1000);
          result = result.filter(j => new Date(j.postedAt) >= cutoff);
        }
        if (f.sortBy === "urgency") {
          const urgOrder: Record<string, number> = { EMERGENCY: 0, SAME_DAY: 1, SCHEDULED: 2 };
          result = [...result].sort((a, b) => (urgOrder[a.urgency] ?? 3) - (urgOrder[b.urgency] ?? 3));
        } else if (f.sortBy === "start_date") {
          result = [...result].sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());
        }
        setJobs(result);
        setTotal(r.total ?? result.length);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(appliedFilters, page); }, [appliedFilters, page, load]);

  function applyFilters() { setAppliedFilters({ ...filters }); setPage(1); setShowFilters(false); }
  function resetFilters()  { setFilters(defaultFilters); setAppliedFilters(defaultFilters); setPage(1); }

  async function handleApply(id: string) {
    setApplying(id);
    try {
      await api.post(`/jobs/${id}/apply`, {});
      load(appliedFilters, page);
    } catch (e: unknown) { setError((e as { message?: string })?.message ?? "Apply failed."); }
    finally { setApplying(null); }
  }

  const activeFilterCount = Object.entries(appliedFilters).filter(
    ([k, v]) => k !== "sortBy" && v !== "" && v !== defaultFilters[k as keyof Filters]
  ).length;

  return (
    <>
      <PageHeader
        title="Browse Jobs"
        description={`${total} open support request${total !== 1 ? "s" : ""}`}
        actions={canPost ? <Link href="/jobs/post"><Button>+ Post a Request</Button></Link> : undefined}
      />
      <div className="mx-auto max-w-6xl px-5 py-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-8">
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <Card>
                <CardContent className="py-4 px-4">
                  <FilterSidebar filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onReset={resetFilters} onApply={applyFilters} />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                {showFilters ? "Hide Filters" : `Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}`}
              </Button>
              {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline">Reset</button>}
            </div>
            {showFilters && (
              <Card className="mb-4 lg:hidden">
                <CardContent className="py-4 px-4">
                  <FilterSidebar filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onReset={resetFilters} onApply={applyFilters} />
                </CardContent>
              </Card>
            )}
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
                    <JobCard key={job.id} job={job} canApply={canApply} applying={applying === job.id}
                      onApply={() => handleApply(job.id)} onView={() => router.push(`/jobs/${job.id}`)} />
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
        </div>
      </div>
    </>
  );
}
     {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      canApply={canApply}
                      applying={applying === job.id}
                      onApply={() => handleApply(job.id)}
                      onView={() => router.push(`/jobs/${job.id}`)}
                    />
                  ))}
                </div>

                {/* Pagination */}
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
        </div>
      </div>
    </>
  );
}
