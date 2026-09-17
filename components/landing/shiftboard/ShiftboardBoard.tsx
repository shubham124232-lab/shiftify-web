'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { PUBLIC_SORT_OPTIONS } from '@/lib/constants/job-filters';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import {
  DEFAULT_SHIFTBOARD_FILTERS, type DatePreset, type ShiftboardFilters, type ShiftboardResponse, type ShiftboardUrgency,
} from '@/lib/types/shiftboard';
import { ShiftboardTabs } from './ShiftboardTabs';
import { ShiftboardFilters as FiltersSidebar } from './ShiftboardFilters';
import { ShiftboardCard } from './ShiftboardCard';
import { SaveSearchCard } from './SaveSearchCard';
import { PlatinumBusinesses } from './PlatinumBusinesses';
import { CommunityCard } from './CommunityCard';

// Leaflet touches `window` at import time — must never be part of the
// server-rendered tree.
const ShiftboardMap = dynamic(() => import('./ShiftboardMap'), {
  ssr: false,
  loading: () => <div className="sf-sb-map" aria-hidden="true" />,
});

const EMPTY_COUNTS = { ALL: 0, RAPID: 0, URGENT: 0, LAST_MINUTE: 0, ROUTINE: 0 } as const;

function presetRange(preset: DatePreset): { from: Date; to: Date } {
  const day = 86_400_000;
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const at = (days: number) => new Date(midnight.getTime() + days * day);
  switch (preset) {
    case 'today':    return { from: new Date(), to: at(1) };
    case 'tomorrow': return { from: at(1), to: at(2) };
    case 'week':     return { from: new Date(), to: at(8) };
    case 'month':    return { from: new Date(), to: at(31) };
  }
}

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
  if (filters.datePreset) {
    const { from, to } = presetRange(filters.datePreset);
    params.set('startFrom', from.toISOString());
    params.set('startTo', to.toISOString());
  } else {
    if (filters.startFrom) params.set('startFrom', filters.startFrom);
    if (filters.startTo) params.set('startTo', filters.startTo);
  }
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
  const [mapExpanded, setMapExpanded] = useState(false);
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

  const hasLocation = filters.nearLat != null && filters.nearLng != null;

  const mapCenter = useMemo(() => {
    if (filters.nearLat != null && filters.nearLng != null) return { lat: filters.nearLat, lng: filters.nearLng };
    const first = data?.jobs.find((j) => j.lat != null && j.lng != null);
    return first ? { lat: first.lat as number, lng: first.lng as number } : { lat: -33.8688, lng: 151.2093 }; // Sydney fallback
  }, [filters.nearLat, filters.nearLng, data]);

  return (
    <section className="sf-sb">
      <div className="sf-sb-layout">
        <FiltersSidebar
          filters={filters}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_SHIFTBOARD_FILTERS)}
          geoStatus={geo.status}
          onUseMyLocation={geo.request}
        />

        <div className="sf-sb-main">
          <header className="sf-sb-head">
            <div>
              <p className="sf-sb-mono sf-sb-eyebrow">Live shiftboard — Australia-wide</p>
              <h1>Live Shiftboard</h1>
              <p className="sf-sb-lede">Support opportunities near you.</p>
            </div>
            <div className="sf-sb-head-side">
              <p className="sf-sb-count" aria-live="polite">
                {loading ? 'Loading shifts…' : data ? `Showing ${data.jobs.length} of ${data.total} shifts` : ''}
              </p>
              <label className="sf-sb-sort">
                Sort by
                <span className="sf-sb-select-wrap light">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => patchFilters({ sortBy: e.target.value as ShiftboardFilters['sortBy'] })}
                  >
                    {PUBLIC_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </span>
              </label>
            </div>
          </header>

          <PlatinumBusinesses />

          <ShiftboardTabs
            active={filters.urgency}
            onChange={(v: ShiftboardUrgency | '') => patchFilters({ urgency: v })}
            counts={data?.counts ?? EMPTY_COUNTS}
          />

          <h2 className="sf-sb-mono sf-sb-list-head">
            Available shifts
            {!loading && data && <span className="sf-sb-list-count">{data.total}</span>}
          </h2>

          {loading ? (
            <div className="sf-sb-list" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="sf-sb-row-skeleton" />)}
            </div>
          ) : !data || data.jobs.length === 0 ? (
            <div className="sf-sb-empty">
              <p>{data ? 'No shifts match these filters right now.' : 'Shifts couldn’t be loaded right now. Please try again shortly.'}</p>
              {data && (
                <button type="button" className="sf-sb-empty-btn" onClick={() => setFilters(DEFAULT_SHIFTBOARD_FILTERS)}>
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="sf-sb-list">
              {data.jobs.map((job, i) => <ShiftboardCard key={job.id} job={job} index={i} />)}
            </div>
          )}
        </div>

        <div className="sf-sb-side">
          <div className="sf-sb-panel sf-sb-map-card">
            <div className="sf-sb-panel-head">
              <h2 className="sf-sb-mono">Shifts near you</h2>
              <button type="button" className="sf-sb-link" onClick={() => setMapExpanded((v) => !v)} aria-expanded={mapExpanded}>
                {mapExpanded ? 'Collapse map' : 'Expand map'}
                <ArrowUpRight aria-hidden="true" strokeWidth={2} />
              </button>
            </div>
            <ShiftboardMap
              jobs={data?.jobs ?? []}
              center={mapCenter}
              hasLocation={hasLocation}
              radiusKm={filters.radiusKm}
              expanded={mapExpanded}
              locating={geo.status === 'pending'}
              onRadiusChange={(km) => patchFilters({ radiusKm: km })}
              onLocate={geo.request}
            />
          </div>
          <SaveSearchCard filters={filters} onApply={setFilters} />
          <CommunityCard />
        </div>
      </div>
    </section>
  );
}
