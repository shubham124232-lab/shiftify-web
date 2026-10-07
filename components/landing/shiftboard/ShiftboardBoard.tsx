'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, House } from 'lucide-react';
import { api } from '@/lib/api';
import { PUBLIC_SORT_OPTIONS } from '@/lib/constants/job-filters';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import {
  DEFAULT_SHIFTBOARD_FILTERS, type DatePreset, type ShiftboardFilters, type ShiftboardResponse, type ShiftboardUrgency,
} from '@/lib/types/shiftboard';
import { ShiftboardTabs } from './ShiftboardTabs';
import { ShiftboardFilters as FiltersSidebar, countActiveFilters } from './ShiftboardFilters';
import { ShiftboardTabBar } from './ShiftboardTabBar';
import { ShiftboardCard } from './ShiftboardCard';
import { LiveClock } from './LiveClock';
import { SaveSearchCard } from './SaveSearchCard';
import { PlatinumBusinesses } from './PlatinumBusinesses';

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
        <header className="sf-sb-intro">
          <h1>Live Shiftboard</h1>
          <p>Explore support opportunities by timing, location and the work that suits you.</p>
        </header>

        <div className="sf-sb-top">
          <PlatinumBusinesses />
        </div>

        <LiveClock className="sf-sb-clock" />

        <FiltersSidebar
          filters={filters}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_SHIFTBOARD_FILTERS)}
          geoStatus={geo.status}
          onUseMyLocation={geo.request}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          resultCount={loading ? null : data?.total ?? null}
        />

        <div className="sf-sb-main">
          <p className="sf-sb-notice">
            <span className="sf-sb-notice-icon"><House aria-hidden="true" strokeWidth={2} /></span>
            Exact addresses and personal details are shared only after confirmation.
          </p>

          <div className="sf-sb-toolbar">
            <label className="sf-sb-search">
              <input
                type="search"
                placeholder="Search suburb or postcode"
                aria-label="Search suburb or postcode"
                value={filters.suburb}
                onChange={(e) => patchFilters({ suburb: e.target.value })}
              />
            </label>
            <label className="sf-sb-sort">
              <span className="sf-sb-sr">Sort shifts</span>
              <select
                value={filters.sortBy}
                onChange={(e) => patchFilters({ sortBy: e.target.value as ShiftboardFilters['sortBy'] })}
              >
                {PUBLIC_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" strokeWidth={2} />
            </label>
          </div>

          <ShiftboardTabs
            active={filters.urgency}
            onChange={(v: ShiftboardUrgency | '') => patchFilters({ urgency: v })}
            counts={data?.counts ?? EMPTY_COUNTS}
          />

          <div className="sf-sb-list-head" id="sf-sb-shifts">
            <h2>Available shifts</h2>
            <p aria-live="polite">
              {loading ? 'Loading…' : data ? `${data.total} ${data.total === 1 ? 'result' : 'results'}` : ''}
            </p>
          </div>

          {loading ? (
            <div className="sf-sb-list" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="sf-sb-row-skeleton" />)}
            </div>
          ) : !data || data.jobs.length === 0 ? (
            <div className="sf-sb-empty">
              <p>{data ? 'No shifts match these filters right now.' : 'Shifts couldn’t be loaded right now. Please try again shortly.'}</p>
              {data && (
                <button type="button" className="sf-sb-outline-btn" onClick={() => setFilters(DEFAULT_SHIFTBOARD_FILTERS)}>
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="sf-sb-shifts">
              <div className="sf-sb-list sf-sb-list--grid">
                {data.jobs.map((job, i) => <ShiftboardCard key={job.id} job={job} index={i} />)}
              </div>
            </div>
          )}

          <ul className="sf-sb-trust">
            <li><strong>Privacy protected</strong>Personal details stay private until confirmation.</li>
            <li><strong>Useful information first</strong>See timing, suburb and requirements before joining.</li>
            <li><strong>Apply securely</strong>Sign in or create an account from the shift preview.</li>
          </ul>
        </div>

        <div className="sf-sb-side">
          <div className="sf-sb-card sf-sb-map-card" id="sf-sb-map-card">
            <div className="sf-sb-card-head">
              <h2>Shifts near you</h2>
              <button type="button" className="sf-sb-link" onClick={() => setMapExpanded((v) => !v)} aria-expanded={mapExpanded}>
                {mapExpanded ? 'Collapse map' : 'Expand map'}
              </button>
            </div>
            <ShiftboardMap
              jobs={data?.jobs ?? []}
              center={mapCenter}
              hasLocation={hasLocation}
              radiusKm={filters.radiusKm}
              expanded={mapExpanded}
            />
          </div>
          <SaveSearchCard filters={filters} onApply={setFilters} />
        </div>
      </div>

      <ShiftboardTabBar
        filtersOpen={filtersOpen}
        activeFilters={countActiveFilters(filters)}
        onOpenFilters={() => setFiltersOpen(true)}
        onCloseFilters={() => setFiltersOpen(false)}
      />
    </section>
  );
}
