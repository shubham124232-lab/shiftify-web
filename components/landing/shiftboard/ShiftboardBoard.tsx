'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { PUBLIC_SORT_OPTIONS } from '@/lib/constants/job-filters';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { DEFAULT_SHIFTBOARD_FILTERS, type ShiftboardFilters, type ShiftboardResponse, type ShiftboardUrgency } from '@/lib/types/shiftboard';
import { ShiftboardTabs } from './ShiftboardTabs';
import { ShiftboardFilters as FiltersSidebar } from './ShiftboardFilters';
import { ShiftboardCard } from './ShiftboardCard';
import { SaveSearchCard } from './SaveSearchCard';

// Leaflet touches `window` at import time — must never be part of the
// server-rendered tree.
const ShiftboardMap = dynamic(() => import('./ShiftboardMap'), { ssr: false });

const EMPTY_COUNTS = { ALL: 0, RAPID: 0, URGENT: 0, LAST_MINUTE: 0, ROUTINE: 0 } as const;

function buildQuery(filters: ShiftboardFilters): string {
  const params = new URLSearchParams();
  if (filters.suburb) params.set('suburb', filters.suburb);
  if (filters.nearLat != null && filters.nearLng != null) {
    params.set('nearLat', String(filters.nearLat));
    params.set('nearLng', String(filters.nearLng));
    params.set('radiusKm', String(filters.radiusKm));
  }
  if (filters.urgency) params.set('urgency', filters.urgency);
  if (filters.category) params.set('category', filters.category);
  if (filters.shiftType) params.set('shiftType', filters.shiftType);
  if (filters.startFrom) params.set('startFrom', filters.startFrom);
  if (filters.startTo) params.set('startTo', filters.startTo);
  if (filters.timeOfDay.length) params.set('timeOfDay', filters.timeOfDay.join(','));
  for (const [key, value] of Object.entries(filters.requirements)) {
    if (value) params.set(key, 'true');
  }
  params.set('sortBy', filters.sortBy);
  params.set('page', String(filters.page));
  params.set('limit', '20');
  return params.toString();
}

export function ShiftboardBoard() {
  const [filters, setFilters] = useState<ShiftboardFilters>(DEFAULT_SHIFTBOARD_FILTERS);
  const [data, setData] = useState<ShiftboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const geo = useGeolocation();

  const patchFilters = useCallback((patch: Partial<ShiftboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 'page' in patch ? patch.page! : 1 }));
  }, []);

  useEffect(() => {
    if (geo.status === 'granted' && geo.coords) {
      patchFilters({ nearLat: geo.coords.lat, nearLng: geo.coords.lng });
    }
  }, [geo.status, geo.coords, patchFilters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<ShiftboardResponse>(`/public/shiftboard?${buildQuery(filters)}`)
      .then((r) => { if (!cancelled) setData(r); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const mapCenter = useMemo(() => {
    if (filters.nearLat != null && filters.nearLng != null) return { lat: filters.nearLat, lng: filters.nearLng };
    const first = data?.jobs.find((j) => j.lat != null && j.lng != null);
    return first ? { lat: first.lat as number, lng: first.lng as number } : { lat: -33.8688, lng: 151.2093 }; // Sydney fallback
  }, [filters.nearLat, filters.nearLng, data]);

  return (
    <section className="sf-shiftboard-section">
      <header className="sf-shiftboard-header">
        <span className="sf-shiftboard-eyebrow">LIVE SHIFTBOARD — AUSTRALIA-WIDE</span>
        <h1>Live Shiftboard</h1>
        <p>Support opportunities near you.</p>
      </header>

      <div className="sf-shiftboard-layout">
        <FiltersSidebar
          filters={filters}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_SHIFTBOARD_FILTERS)}
          geoStatus={geo.status}
          onUseMyLocation={geo.request}
        />

        <div className="sf-shiftboard-main">
          <div className="sf-shiftboard-toolbar">
            <ShiftboardTabs
              active={filters.urgency}
              onChange={(v: ShiftboardUrgency | '') => patchFilters({ urgency: v })}
              counts={data?.counts ?? EMPTY_COUNTS}
            />
            <select
              className="sf-shiftboard-select sf-shiftboard-sort"
              value={filters.sortBy}
              onChange={(e) => patchFilters({ sortBy: e.target.value as ShiftboardFilters['sortBy'] })}
            >
              {PUBLIC_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="sf-shiftboard-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="sf-shiftboard-card-skeleton" />)}
            </div>
          ) : !data || data.jobs.length === 0 ? (
            <p className="sf-shiftboard-empty">No shifts match these filters right now.</p>
          ) : (
            <>
              <p className="sf-shiftboard-count">Showing {data.jobs.length} of {data.total} shifts</p>
              <div className="sf-shiftboard-grid">
                {data.jobs.map((job) => <ShiftboardCard key={job.id} job={job} />)}
              </div>
            </>
          )}
        </div>

        <div className="sf-shiftboard-side">
          <div className="sf-shiftboard-map-card">
            <h3>Shifts near you</h3>
            <ShiftboardMap jobs={data?.jobs ?? []} center={mapCenter} />
          </div>
          <SaveSearchCard filters={filters} onApply={setFilters} />
        </div>
      </div>
    </section>
  );
}
