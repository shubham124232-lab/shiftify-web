'use client';

import { JOB_CATEGORIES } from '@/lib/constants/categories';
import { TIME_OF_DAY_OPTIONS, WORKER_REQUIREMENT_FILTERS } from '@/lib/constants/job-filters';
import type { GeolocationStatus } from '@/lib/hooks/useGeolocation';
import type { ShiftboardFilters as Filters, TimeOfDay } from '@/lib/types/shiftboard';

export function ShiftboardFilters({
  filters, onChange, onReset, geoStatus, onUseMyLocation,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  geoStatus: GeolocationStatus;
  onUseMyLocation: () => void;
}) {
  const toggleTimeOfDay = (v: TimeOfDay) => {
    const next = filters.timeOfDay.includes(v)
      ? filters.timeOfDay.filter((t) => t !== v)
      : [...filters.timeOfDay, v];
    onChange({ timeOfDay: next });
  };

  const toggleRequirement = (key: string) => {
    const next = { ...filters.requirements };
    if (next[key as keyof typeof next]) delete next[key as keyof typeof next];
    else next[key as keyof typeof next] = true;
    onChange({ requirements: next });
  };

  return (
    <aside className="sf-shiftboard-filters">
      <div className="sf-shiftboard-filters-head">
        <h2>Filter shifts</h2>
        <button type="button" className="sf-shiftboard-reset" onClick={onReset}>Reset all</button>
      </div>

      <div className="sf-shiftboard-filter-group">
        <label className="sf-shiftboard-filter-label">Location</label>
        <div className="sf-shiftboard-location-input">
          <i className="bi bi-geo-alt" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search suburb or postcode"
            value={filters.suburb}
            onChange={(e) => onChange({ suburb: e.target.value })}
          />
        </div>
        <label className="sf-shiftboard-checkbox-row">
          <input
            type="checkbox"
            checked={geoStatus === 'granted'}
            onChange={onUseMyLocation}
          />
          Use my current location
        </label>
        {geoStatus === 'denied' && (
          <p className="sf-shiftboard-hint">Location blocked — search by suburb instead.</p>
        )}
        {(filters.nearLat != null && filters.nearLng != null) && (
          <div className="sf-shiftboard-filter-subrow">
            <label htmlFor="sf-radius">Within {filters.radiusKm} km</label>
            <input
              id="sf-radius" type="range" min={5} max={100} step={5}
              value={filters.radiusKm}
              onChange={(e) => onChange({ radiusKm: Number(e.target.value) })}
            />
          </div>
        )}
      </div>

      <div className="sf-shiftboard-filter-group">
        <label className="sf-shiftboard-filter-label">Date</label>
        <div className="sf-shiftboard-date-row">
          <input type="date" value={filters.startFrom.slice(0, 10)} onChange={(e) => onChange({ startFrom: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
          <input type="date" value={filters.startTo.slice(0, 10)} onChange={(e) => onChange({ startTo: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
        </div>
      </div>

      <div className="sf-shiftboard-filter-group">
        <label className="sf-shiftboard-filter-label">Time of day</label>
        {TIME_OF_DAY_OPTIONS.map((opt) => (
          <label key={opt.value} className="sf-shiftboard-checkbox-row">
            <input type="checkbox" checked={filters.timeOfDay.includes(opt.value)} onChange={() => toggleTimeOfDay(opt.value)} />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="sf-shiftboard-filter-group">
        <label className="sf-shiftboard-filter-label">Support category</label>
        <select
          className="sf-shiftboard-select"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="sf-shiftboard-filter-group">
        <label className="sf-shiftboard-filter-label">Worker requirements</label>
        {WORKER_REQUIREMENT_FILTERS.map((opt) => (
          <label key={opt.value} className="sf-shiftboard-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(filters.requirements[opt.value as keyof Filters['requirements']])}
              onChange={() => toggleRequirement(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </aside>
  );
}
