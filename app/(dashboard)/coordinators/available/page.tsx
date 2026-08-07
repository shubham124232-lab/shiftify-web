"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoordinatorListing {
  id: string;
  userId: string;
  organisationName: string | null;
  roleType: string | null;
  bio: string | null;
  profilePhoto: string | null;
  hourlyRate: number | null;
  travelCharges: string | null;
  serviceAreas: string[] | null;
  serviceRadius: number | null;
  serviceMode: string | null;
  currentCapacityStatus: string | null;
  availabilityType: string | null;
  supportCoordinationLevel: string[] | null;
  servicesOfferedBeyondCoordination: string[] | null;
  seekingPlanManager: boolean;
  averageRating: number;
  totalRatings: number;
  user: { id: string; name: string; avatarUrl: string | null };
}

const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";
const PAGE_SIZE = 20;

interface Filters { search: string; }
const EMPTY_FILTERS: Filters = { search: "" };

function CoordinatorCard({ coordinator }: { coordinator: CoordinatorListing }) {
  const rate = coordinator.hourlyRate != null ? `$${coordinator.hourlyRate}/hr` : null;
  const services = coordinator.servicesOfferedBeyondCoordination ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-semibold text-slate-900">
          {coordinator.organisationName ?? coordinator.user.name}
        </span>
        {coordinator.currentCapacityStatus && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            {coordinator.currentCapacityStatus}
          </span>
        )}
      </div>

      {coordinator.bio && (
        <p className="text-sm text-slate-700 mb-2">{coordinator.bio}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        {coordinator.serviceAreas && coordinator.serviceAreas.length > 0 && (
          <span>{coordinator.serviceAreas.join(", ")}</span>
        )}
        {coordinator.totalRatings > 0 && <span>★ {coordinator.averageRating.toFixed(1)} ({coordinator.totalRatings})</span>}
        {rate && <span className="font-semibold text-emerald-700">{rate}</span>}
        {coordinator.roleType && <span>{coordinator.roleType}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-1">
        {services.slice(0, 4).map(s => (
          <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">{s}</span>
        ))}
        {coordinator.availabilityType && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">{coordinator.availabilityType}</span>
        )}
        {coordinator.seekingPlanManager && (
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-xs text-violet-700">Seeking Plan Manager</span>
        )}
      </div>
    </div>
  );
}

export default function BrowseCoordinatorsPage() {
  const [coordinators, setCoordinators] = useState<CoordinatorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);

  const load = useCallback((f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (f.search) params.set("search", f.search);

    api.get<{ items: CoordinatorListing[]; total: number }>(`/coordinators/available?${params}`)
      .then(r => {
        setCoordinators(r.items ?? []);
        setTotal(r.total ?? 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(appliedFilters, page); }, [appliedFilters, page, load]);

  function applyFilters() { setAppliedFilters({ ...filters }); setPage(1); }
  function resetFilters() { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setPage(1); }

  return (
    <>
      <PageHeader
        title="Browse Coordinators"
        description={`${total} coordinator${total !== 1 ? "s" : ""} available`}
      />
      <div className="mx-auto max-w-6xl px-5 py-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Card className="mb-4">
          <CardContent className="py-4 px-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-64">
                <label className={lbl}>Search</label>
                <input className={inp} placeholder="Organisation name" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              </div>
              <Button size="sm" onClick={applyFilters}>Apply</Button>
              <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline">Reset</button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : coordinators.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No coordinators found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {coordinators.map(c => <CoordinatorCard key={c.id} coordinator={c} />)}
            </div>
            {total > PAGE_SIZE && (
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="flex items-center text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
                <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
