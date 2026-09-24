"use client";

import "../../home.css";
import "../../shiftboard.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { type Job } from "@/components/jobs/job-card";
import { SORT_OPTIONS } from "@/lib/constants/job-filters";
import type { ShiftboardUrgency } from "@/lib/types/shiftboard";
import { ShiftboardTabs } from "@/components/landing/shiftboard/ShiftboardTabs";
import { PlatinumBusinesses } from "@/components/landing/shiftboard/PlatinumBusinesses";
import type { MapPinJob } from "@/components/landing/shiftboard/ShiftboardMap";
import {
  LiveFilterCard, DEFAULT_LIVE_FILTERS, countLiveFilters, type LiveDashboardFilters,
} from "@/components/jobs/live-dashboard/LiveFilterCard";
import { LiveShiftRow } from "@/components/jobs/live-dashboard/LiveShiftRow";

// Leaflet touches `window` at import time — keep it out of the server render.
const ShiftboardMap = dynamic(() => import("@/components/landing/shiftboard/ShiftboardMap"), {
  ssr: false,
  loading: () => <div className="sf-sb-map" aria-hidden="true" />,
});

const PAGE_SIZE = 20;
// The dashboard feed has no per-lane counts; the "All" tab shows the total instead.
const NO_COUNTS = { ALL: 0, RAPID: 0, URGENT: 0, LAST_MINUTE: 0, ROUTINE: 0 };
const SYDNEY = { lat: -33.8688, lng: 151.2093 };

// What each row's action means, shown only to the role that can meet it.
const ROW_STATES = {
  worker: [
    { title: "Open for applications", sub: "Apply or accept the shift now." },
    { title: "Application sent", sub: "You have applied — awaiting a response." },
    { title: "Saved and hidden", sub: "Star a shift to keep it, or hide it from your feed." },
  ],
  poster: [
    { title: "Your request", sub: "Open it to manage applications." },
    { title: "View only", sub: "Workers and providers can apply to these." },
    { title: "Details first", sub: "See timing, suburb and requirements before acting." },
  ],
};

export default function LiveDashboardPage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [suburbInput, setSuburbInput] = useState("");
  const [suburb, setSuburb] = useState("");
  const [urgency, setUrgency] = useState<ShiftboardUrgency | "">("");
  const [sortBy, setSortBy] = useState("urgency");
  const [filters, setFilters] = useState<LiveDashboardFilters>(DEFAULT_LIVE_FILTERS);
  const [mapExpanded, setMapExpanded] = useState(false);
  const canApply = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSuburb(suburbInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [suburbInput]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sortBy });
    if (suburb)              params.set("suburb", suburb);
    if (urgency)             params.set("urgency", urgency);
    if (filters.category)    params.set("category", filters.category);
    if (filters.isRecurring) params.set("isRecurring", filters.isRecurring);
    if (filters.shiftType)   params.set("shiftType", filters.shiftType);
    if (filters.fundingType) params.set("fundingType", filters.fundingType);
    if (filters.dateFrom)    params.set("startFrom", new Date(filters.dateFrom + "T00:00:00").toISOString());
    if (filters.dateTo)      params.set("startTo", new Date(filters.dateTo + "T23:59:59").toISOString());
    if (filters.postedWithin) params.set("postedWithinHours", String(parseInt(filters.postedWithin) * 24));

    api.get<{ jobs: Job[]; total: number }>(`/jobs/live-dashboard?${params}`)
      .then(r => {
        setJobs(r.jobs ?? []);
        setTotal(r.total ?? (r.jobs ?? []).length);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, sortBy, suburb, urgency, filters]);

  useEffect(() => { load(); }, [load]);

  function patchFilters(patch: Partial<LiveDashboardFilters>) { setFilters(f => ({ ...f, ...patch })); setPage(1); }
  function resetFilters() { setFilters(DEFAULT_LIVE_FILTERS); setSuburbInput(""); setSuburb(""); setUrgency(""); setPage(1); }

  async function handleApply(id: string) {
    setApplying(id);
    setUpgradeMessage(null);
    try {
      await api.post(`/jobs/${id}/apply`, {});
      load();
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
      load();
    }
  }

  const hasActiveSearch = countLiveFilters(filters) > 0 || suburb !== "" || urgency !== "";
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Pins only for jobs the feed gives coordinates for.
  const pins = useMemo<MapPinJob[]>(() => jobs
    .filter(j => j.lat != null && j.lng != null)
    .map(j => ({ id: j.id, title: j.title, suburb: j.suburb, urgency: j.urgency as ShiftboardUrgency, lat: j.lat as number, lng: j.lng as number })),
  [jobs]);
  const mapCenter = pins[0] ? { lat: pins[0].lat as number, lng: pins[0].lng as number } : SYDNEY;

  return (
    <div className="sf-home sf-sb-app">
      <section className="sf-sb sf-sb--app">
        <div className="sf-sb-layout">
          <header className="sf-sb-intro">
            <h1>Live Dashboard</h1>
            <p>Real-time support requests from across the platform. Find the right shift, when it suits you.</p>
          </header>

          {/* Platinum strip sits directly on top of the results card. */}
          <div className="sf-sb-col">
            <div className="sf-sb-top">
              <PlatinumBusinesses />
            </div>

            <div className="sf-sb-main">
              {upgradeMessage && <div className="sf-sb-banner"><UpgradePrompt message={upgradeMessage} /></div>}
              {error && <p className="sf-sb-error" role="alert">{error}</p>}

              <div className="sf-sb-toolbar">
                <label className="sf-sb-search">
                  <input
                    type="search"
                    placeholder="Search suburb or postcode"
                    aria-label="Search suburb or postcode"
                    value={suburbInput}
                    onChange={e => setSuburbInput(e.target.value)}
                  />
                </label>
                <label className="sf-sb-sort">
                  <span className="sf-sb-sr">Sort shifts</span>
                  <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" strokeWidth={2} />
                </label>
              </div>

              <ShiftboardTabs
                active={urgency}
                onChange={v => { setUrgency(v); setPage(1); }}
                counts={NO_COUNTS}
                allSub={loading ? "Loading…" : urgency === "" ? `${total} available` : "Every timing"}
              />

              <div className="sf-sb-list-head" id="sf-sb-shifts">
                <h2>Open requests</h2>
                <p aria-live="polite">
                  {loading ? "Loading…" : `${total} ${total === 1 ? "result" : "results"}${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`}
                </p>
              </div>

              {loading ? (
                <div className="sf-sb-list" aria-busy="true">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="sf-sb-row-skeleton" />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="sf-sb-empty">
                  <p>
                    {hasActiveSearch
                      ? "Nothing matches these filters right now. Try widening your search or clearing them."
                      : "There are no open support requests on the platform right now. Check back shortly."}
                  </p>
                  {hasActiveSearch && (
                    <button type="button" className="sf-sb-outline-btn" onClick={resetFilters}>Clear all filters</button>
                  )}
                </div>
              ) : (
                <div className="sf-sb-shifts">
                  <div className="sf-sb-list sf-sb-list--grid">
                    {jobs.map((job, i) => (
                      <LiveShiftRow
                        key={job.id}
                        job={job}
                        index={i}
                        canApply={canApply}
                        applying={applying === job.id}
                        onApply={() => handleApply(job.id)}
                        onView={() => router.push(`/jobs/${job.id}`)}
                        onToggleSave={() => handleToggleSave(job)}
                        onToggleHide={() => handleToggleHide(job)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {totalPages > 1 && !loading && (
                <nav className="sf-sb-pager" aria-label="Pages">
                  <button type="button" className="sf-sb-outline-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft aria-hidden="true" /> Previous
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button type="button" className="sf-sb-outline-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight aria-hidden="true" />
                  </button>
                </nav>
              )}

              <ul className="sf-sb-trust">
                {ROW_STATES[canApply ? "worker" : "poster"].map(s => (
                  <li key={s.title}><strong>{s.title}</strong>{s.sub}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right rail: filters (closed until clicked) above the map. */}
          <div className="sf-sb-rail">
            <LiveFilterCard filters={filters} onChange={patchFilters} onReset={resetFilters} />

            <div className="sf-sb-card sf-sb-map-card" id="sf-sb-map-card">
              <div className="sf-sb-card-head">
                <h2>Shifts near you</h2>
                <button type="button" className="sf-sb-link" onClick={() => setMapExpanded(v => !v)} aria-expanded={mapExpanded}>
                  {mapExpanded ? "Collapse map" : "Expand map"}
                </button>
              </div>
              <ShiftboardMap jobs={pins} center={mapCenter} hasLocation={false} radiusKm={25} expanded={mapExpanded} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
