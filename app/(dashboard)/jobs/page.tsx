"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createSavedSearch, type SavedSearchFilters } from "@/lib/api/saved-searches";
import { JobCard, type Job } from "@/components/jobs/job-card";
import {
  URGENCY_TABS, URGENCY_STYLE, SHIFT_TYPE_LABELS, FUNDING_LABELS,
  POSTED_WITHIN_OPTIONS, SORT_OPTIONS, inp, lbl,
} from "@/lib/constants/job-filters";

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
  // Provider opportunity board (PR-OA01)
  postedBy: string;      // PARTICIPANT | COORDINATOR | ""
  duration: string;      // SHORT | MEDIUM | LONG | ""
  deadline: string;      // hours until response deadline | ""
  openTo: string;        // PROVIDERS_ONLY | ""
}

const defaultFilters: Filters = {
  suburb: "", category: "", urgency: "", shiftType: "", fundingType: "",
  isRecurring: "", workerType: "", experienceLevel: "", postedWithin: "",
  dateFrom: "", dateTo: "", sortBy: "urgency",
  postedBy: "", duration: "", deadline: "", openTo: "",
};

function toSavedSearchFilters(f: Filters): SavedSearchFilters {
  const out: SavedSearchFilters = {};
  if (f.suburb)      out.suburb = f.suburb;
  if (f.category)    out.category = f.category;
  if (f.urgency)     out.urgency = f.urgency;
  if (f.shiftType)   out.shiftType = f.shiftType;
  if (f.fundingType) out.fundingType = f.fundingType;
  if (f.isRecurring !== "") out.isRecurring = f.isRecurring === "true";
  return out;
}

function FilterSidebar({
  filters, onChange, onReset, onApply, onSave, saving, isProvider,
}: {
  isProvider?: boolean;
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  onApply: () => void;
  onSave?: () => void;
  saving?: boolean;
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
        <div className="flex flex-wrap gap-2">
          {URGENCY_TABS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => onChange({ urgency: value })}
              className={cn("h-8 px-4 rounded-full border text-sm font-semibold transition-colors",
                filters.urgency === value ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {label}
            </button>
          ))}
        </div>
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
          {([ ["", "Any"], ["SELF_MANAGED", "Self-managed"], ["PLAN_MANAGED", "Plan-managed"], ["NDIA_MANAGED", "NDIA-managed"] ] as [string, string][]).map(([v, l]) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer text-xs px-2.5 py-2 rounded-lg border transition-colors", filters.fundingType === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={filters.fundingType === v} onChange={() => onChange({ fundingType: v })} />{l}
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

      {isProvider && (
        <>
          <div>
            <label className={lbl}>Posted by</label>
            <select className={inp} value={filters.postedBy} onChange={e => onChange({ postedBy: e.target.value })}>
              <option value="">Participants and Coordinators</option>
              <option value="PARTICIPANT">Participant</option>
              <option value="COORDINATOR">Support Coordinator</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Open to</label>
            <select className={inp} value={filters.openTo} onChange={e => onChange({ openTo: e.target.value })}>
              <option value="">Providers and workers</option>
              <option value="PROVIDERS_ONLY">Providers only</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Duration</label>
            <select className={inp} value={filters.duration} onChange={e => onChange({ duration: e.target.value })}>
              <option value="">Any duration</option>
              <option value="SHORT">Up to 2 hours</option>
              <option value="MEDIUM">2 to 6 hours</option>
              <option value="LONG">Over 6 hours</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Response deadline</label>
            <select className={inp} value={filters.deadline} onChange={e => onChange({ deadline: e.target.value })}>
              <option value="">Any time</option>
              <option value="2">Within 2 hours</option>
              <option value="24">Within 24 hours</option>
              <option value="72">Within 3 days</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 m-0">Funding above shows the registration needed: NDIA-managed work requires an NDIS Registered Provider.</p>
        </>
      )}

      <Button className="w-full" onClick={onApply}>Apply Filters</Button>
      {onSave && (
        <Button className="w-full" variant="outline" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "🔔 Save this search"}
        </Button>
      )}
    </aside>
  );
}

function urgencyFiltersFromParams(searchParams: URLSearchParams): Filters {
  const urgencyParam = searchParams.get("urgency");
  return urgencyParam && Object.prototype.hasOwnProperty.call(URGENCY_STYLE, urgencyParam)
    ? { ...defaultFilters, urgency: urgencyParam, sortBy: "urgency" }
    : defaultFilters;
}

export default function JobsBrowsePage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [error,   setError]   = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => urgencyFiltersFromParams(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => urgencyFiltersFromParams(searchParams));
  const [savingSearch, setSavingSearch] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);

  const canPost = ["PARTICIPANT", "COORDINATOR", "PROVIDER"].includes(activeRole ?? "");
  const canApply = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");

  const load = useCallback((f: Filters, p: number, saved: boolean) => {
    setLoading(true);
    const params = new URLSearchParams({ status: "OPEN", page: String(p), limit: "20" });
    if (saved)         params.set("savedOnly", "true");
    if (f.suburb)      params.set("suburb", f.suburb);
    if (f.category)    params.set("category", f.category);
    if (f.urgency)     params.set("urgency", f.urgency);
    if (f.isRecurring !== "") params.set("isRecurring", f.isRecurring);
    if (f.shiftType)   params.set("shiftType", f.shiftType);
    if (f.fundingType) params.set("fundingType", f.fundingType);
    if (f.dateFrom)    params.set("startFrom", new Date(f.dateFrom).toISOString());
    if (f.dateTo)      params.set("startTo", new Date(f.dateTo + "T23:59:59").toISOString());
    if (f.postedWithin) params.set("postedWithinHours", String(parseInt(f.postedWithin) * 24));
    if (f.sortBy)      params.set("sortBy", f.sortBy);
    if (f.postedBy)    params.set("postedByRole", f.postedBy);
    if (f.openTo)      params.set("visibilityTarget", f.openTo);

    api.get<{ jobs: Job[]; total: number }>(`/jobs?${params}`)
      .then(r => {
        let result = r.jobs ?? [];
        // workerType / experienceLevel aren't backend-filterable (live in a JSON blob) — filtered client-side only.
        if (f.workerType)      result = result.filter(j => j.workerPreferences?.workerType === f.workerType);
        if (f.experienceLevel) result = result.filter(j => j.workerPreferences?.experienceLevel === f.experienceLevel);
        // Duration and response deadline are derived from schedule/deadline timestamps, so they filter client-side.
        if (f.duration) {
          result = result.filter(j => {
            if (!j.scheduledEndAt) return false;
            const hrs = (new Date(j.scheduledEndAt).getTime() - new Date(j.scheduledStartAt).getTime()) / 3_600_000;
            return f.duration === "SHORT" ? hrs <= 2 : f.duration === "MEDIUM" ? hrs > 2 && hrs <= 6 : hrs > 6;
          });
        }
        if (f.deadline) {
          const limit = Date.now() + parseInt(f.deadline) * 3_600_000;
          result = result.filter(j => j.applicationDeadlineAt && new Date(j.applicationDeadlineAt).getTime() <= limit);
        }
        setJobs(result);
        setTotal(r.total ?? result.length);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(appliedFilters, page, savedOnly); }, [appliedFilters, page, savedOnly, load]);

  function applyFilters() { setAppliedFilters({ ...filters }); setPage(1); setShowFilters(false); }
  function resetFilters()  { setFilters(defaultFilters); setAppliedFilters(defaultFilters); setPage(1); }

  async function handleSaveSearch() {
    setSavingSearch(true);
    setSaveMessage(null);
    try {
      await createSavedSearch(undefined, toSavedSearchFilters(appliedFilters));
      setSaveMessage("Saved — we'll notify you when a matching job is posted.");
    } catch (e: unknown) {
      setSaveMessage((e as { message?: string })?.message ?? "Could not save this search.");
    } finally {
      setSavingSearch(false);
    }
  }

  // Connecting needs the single acknowledgement (SW v3.0 Window 1), which lives on the request page.
  function handleApply(id: string) {
    router.push(`/jobs/${id}`);
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
      load(appliedFilters, page, savedOnly);
    }
  }

  const activeFilterCount = Object.entries(appliedFilters).filter(
    ([k, v]) => k !== "sortBy" && v !== "" && v !== defaultFilters[k as keyof Filters]
  ).length;

  return (
    <>
      <PageHeader
        title={activeRole === "SUPPORT_WORKER" ? "Find Shifts" : activeRole === "PROVIDER" ? "Find Support Opportunities" : "Browse Jobs"}
        description={`${total} open support request${total !== 1 ? "s" : ""}`}
        actions={
          <div className="flex gap-2">
            {canApply && <Link href="/jobs/alerts"><Button variant="outline">🔔 My Alerts</Button></Link>}
            {canPost && <Link href="/jobs/post"><Button>{activeRole === "PROVIDER" ? "+ Post Staffing Request" : "+ Post a Request"}</Button></Link>}
          </div>
        }
      />
      <div className="mx-auto max-w-6xl px-5 py-6">
        {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
        {saveMessage && <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{saveMessage}</div>}
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {canApply && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {([["", "Best matches"], ["RAPID", "Rapid"], ["URGENT", "Urgent"], ["LAST_MINUTE", "Last-Minute"], ["ROUTINE", "Routine"], ["SAVED", "Saved"]] as [string, string][]).map(([v, l]) => {
              const active = v === "SAVED" ? savedOnly : !savedOnly && appliedFilters.urgency === v;
              return (
                <button key={v} type="button"
                  onClick={() => {
                    setSavedOnly(v === "SAVED");
                    const urgency = v === "SAVED" ? "" : v;
                    setFilters(p => ({ ...p, urgency }));
                    setAppliedFilters(p => ({ ...p, urgency }));
                    setPage(1);
                  }}
                  className={cn("h-8 px-4 rounded-full border text-sm font-semibold transition-colors",
                    active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                  {l}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-8">
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <Card>
                <CardContent className="py-4 px-4">
                  <FilterSidebar isProvider={activeRole === "PROVIDER"} filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onReset={resetFilters} onApply={applyFilters}
                    onSave={canApply ? handleSaveSearch : undefined} saving={savingSearch} />
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
                  <FilterSidebar isProvider={activeRole === "PROVIDER"} filters={filters} onChange={f => setFilters(p => ({ ...p, ...f }))} onReset={resetFilters} onApply={applyFilters}
                    onSave={canApply ? handleSaveSearch : undefined} saving={savingSearch} />
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
                <p className="text-base font-semibold text-slate-700">{canApply ? "No open requests found" : "No open jobs found"}</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or check back later.</p>
                {activeFilterCount > 0 && <Button className="mt-4" variant="outline" onClick={resetFilters}>Clear Filters</Button>}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map(job => (
                    <JobCard key={job.id} job={job} canApply={canApply} applying={applying === job.id}
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
        </div>
      </div>
    </>
  );
}
