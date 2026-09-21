'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronRight, Navigation } from 'lucide-react';
import {
  DATE_PRESET_OPTIONS, RADIUS_OPTIONS, SHIFTBOARD_CATEGORY_FILTERS, TIME_OF_DAY_OPTIONS, WORKER_REQUIREMENT_FILTERS,
} from '@/lib/constants/job-filters';
import type { GeolocationStatus } from '@/lib/hooks/useGeolocation';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import type { ShiftboardFilters as Filters, TimeOfDay } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY, URGENCY_ORDER } from './urgency';

// Must match the phone breakpoint in app/shiftboard.css.
export const PHONE_QUERY = '(max-width: 767px)';

// The panel shows the four short presets; "Next 30 days" stays API-only.
const DATE_CHIPS: { value: string; label: string }[] = [
  { value: '', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: '7 days' },
];
const DISTANCE_CHIPS = RADIUS_OPTIONS.filter((km) => km <= 50);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sf-sb-group">
      <h3 className="sf-sb-group-title">{title}</h3>
      {children}
    </div>
  );
}

function Check({ checked, onChange, children, meta, accent }: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  meta?: ReactNode;
  accent?: string;
}) {
  return (
    <label className={`sf-sb-check${checked ? ' checked' : ''}`} style={accent ? { '--check-c': accent } as CSSProperties : undefined}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="sf-sb-check-label">{children}</span>
      {meta && <span className="sf-sb-check-meta">{meta}</span>}
    </label>
  );
}

export function countActiveFilters(filters: Filters): number {
  const hasLocation = filters.nearLat != null && filters.nearLng != null;
  return (filters.suburb.trim() ? 1 : 0) + (hasLocation ? 1 : 0) + (filters.datePreset ? 1 : 0)
    + filters.timeOfDay.length + (filters.category ? 1 : 0) + (filters.urgency ? 1 : 0)
    + Object.values(filters.requirements).filter(Boolean).length;
}

// How far (px) the sheet must be dragged down before letting go closes it.
const DISMISS_DISTANCE = 110;

export function ShiftboardFilters({
  filters, onChange, onReset, geoStatus, onUseMyLocation, open, onOpenChange, resultCount,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  geoStatus: GeolocationStatus;
  onUseMyLocation: () => void;
  // Tablet: folds the panel open/closed. Phone: shows it as a bottom sheet.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultCount: number | null;
}) {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const sheetOpen = isPhone && open;
  const hasLocation = filters.nearLat != null && filters.nearLng != null;
  const activeCount = countActiveFilters(filters);
  const advancedCount = filters.timeOfDay.length + (filters.urgency ? 1 : 0)
    + Object.values(filters.requirements).filter(Boolean).length;

  // ---- Phone bottom sheet: scroll lock, Escape, drag-down-to-dismiss ----
  const sheetRef = useRef<HTMLElement>(null);
  const dragStart = useRef<number | null>(null);
  const dragY = useRef(0);
  const [drag, setDrag] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen, onOpenChange]);

  useEffect(() => {
    if (!sheetOpen) return;
    const move = (e: PointerEvent) => {
      if (dragStart.current == null) return;
      dragY.current = Math.max(0, e.clientY - dragStart.current);
      setDrag(dragY.current);
    };
    const end = () => {
      if (dragStart.current == null) return;
      const shouldClose = dragY.current > DISMISS_DISTANCE;
      dragStart.current = null;
      dragY.current = 0;
      setDrag(0);
      if (shouldClose) onOpenChange(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [sheetOpen, onOpenChange]);

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

  // Filters apply live; the button just takes the visitor to the results.
  const showResults = () => {
    onOpenChange(false);
    if (!isPhone) document.getElementById('sf-sb-shifts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const locateLabel = geoStatus === 'pending'
    ? 'Finding your location…'
    : hasLocation ? 'Using your location' : 'Use my location';

  return (
    <>
    {/* Fixed-position, so it never takes a cell in the page grid. Phone only. */}
    <div className={`sf-sb-sheet-backdrop${sheetOpen ? ' open' : ''}`} onClick={() => onOpenChange(false)} aria-hidden="true" />
    <aside
      ref={sheetRef}
      id="sf-sb-filters"
      className={`sf-sb-filters${open ? ' open' : ''}${drag ? ' dragging' : ''}`}
      style={drag ? { '--drag': `${drag}px` } as CSSProperties : undefined}
      aria-label="Filter shifts"
      {...(isPhone ? { role: 'dialog', 'aria-modal': true, 'aria-hidden': !open, tabIndex: -1 } : {})}
    >
      <div
        className="sf-sb-filters-head"
        onPointerDown={(e) => {
          // Buttons in the header stay tappable; drag starts from anywhere else.
          if (sheetOpen && !(e.target as HTMLElement).closest('button')) dragStart.current = e.clientY;
        }}
      >
        <h2>
          Filter shifts
          <span className="sf-sb-active-count" aria-label={`${activeCount} active`}>{activeCount}</span>
        </h2>
        <div className="sf-sb-filters-actions">
          <button type="button" className="sf-sb-clear" onClick={onReset} disabled={activeCount === 0}>Clear all</button>
          <button
            type="button"
            className="sf-sb-filters-toggle"
            aria-expanded={open}
            aria-controls="sf-sb-filters-body"
            onClick={() => onOpenChange(!open)}
          >
            {isPhone ? 'Done' : open ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="sf-sb-filters-body" id="sf-sb-filters-body">
        <Group title="Location">
          <input
            className="sf-sb-input"
            type="search"
            placeholder="Suburb or postcode"
            aria-label="Suburb or postcode"
            value={filters.suburb}
            onChange={(e) => onChange({ suburb: e.target.value })}
          />
          <button
            type="button"
            className={`sf-sb-locate${hasLocation ? ' on' : ''}`}
            onClick={onUseMyLocation}
            disabled={geoStatus === 'pending'}
          >
            <Navigation aria-hidden="true" strokeWidth={2.2} fill="currentColor" />
            {locateLabel}
          </button>
          {(geoStatus === 'denied' || geoStatus === 'unsupported') && (
            <p className="sf-sb-hint">Location unavailable — search by suburb instead.</p>
          )}
        </Group>

        <Group title="Distance">
          <div className="sf-sb-chips dark" role="radiogroup" aria-label="Distance">
            {DISTANCE_CHIPS.map((km) => (
              <button
                key={km}
                type="button"
                role="radio"
                aria-checked={filters.radiusKm === km}
                className={filters.radiusKm === km ? 'on' : ''}
                onClick={() => onChange({ radiusKm: km })}
              >
                {km} km
              </button>
            ))}
          </div>
          {!hasLocation && <p className="sf-sb-hint">Distance applies once your location is on.</p>}
        </Group>

        <Group title="Date">
          <div className="sf-sb-chips" role="radiogroup" aria-label="Date">
            {DATE_CHIPS.map((o) => {
              const on = (filters.datePreset ?? '') === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={DATE_PRESET_OPTIONS.find((d) => d.value === o.value)?.label ?? o.label}
                  className={on ? 'on' : ''}
                  onClick={() => onChange({ datePreset: o.value as Filters['datePreset'], startFrom: '', startTo: '' })}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Group>

        <Group title="Support category">
          {SHIFTBOARD_CATEGORY_FILTERS.map((opt) => (
            <Check
              key={opt.value}
              checked={filters.category === opt.value}
              onChange={() => onChange({ category: filters.category === opt.value ? '' : opt.value })}
            >
              {opt.label}
            </Check>
          ))}
        </Group>

        <details
          className="sf-sb-advanced"
          open={advancedOpen}
          onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
        >
          <summary>
            <ChevronRight aria-hidden="true" strokeWidth={2.4} />
            Advanced filters
            {advancedCount > 0 && <span className="sf-sb-advanced-count">{advancedCount}</span>}
          </summary>

          <div className="sf-sb-sub">
            <h4>Time of day</h4>
            {TIME_OF_DAY_OPTIONS.map((opt) => {
              // "Morning (6am – 12pm)" → name on the left, hours on the right.
              const [, name = opt.label, hours] = opt.label.match(/^(.*?)\s*\((.*)\)$/) ?? [];
              return (
                <Check
                  key={opt.value}
                  checked={filters.timeOfDay.includes(opt.value)}
                  onChange={() => toggleTimeOfDay(opt.value)}
                  meta={hours?.replace(/\s/g, '')}
                >
                  {name}
                </Check>
              );
            })}
          </div>

          <div className="sf-sb-sub">
            <h4>Shift type</h4>
            {URGENCY_ORDER.map((value) => {
              const { label, color } = SHIFTBOARD_URGENCY[value];
              return (
                <Check
                  key={value}
                  checked={filters.urgency === value}
                  onChange={() => onChange({ urgency: filters.urgency === value ? '' : value })}
                  accent={color}
                  meta={<span className="sf-sb-lane-dot" aria-hidden="true" />}
                >
                  {label}
                </Check>
              );
            })}
          </div>

          <div className="sf-sb-sub">
            <h4>Worker requirements</h4>
            {WORKER_REQUIREMENT_FILTERS.map((opt) => (
              <Check
                key={opt.value}
                checked={Boolean(filters.requirements[opt.value as keyof Filters['requirements']])}
                onChange={() => toggleRequirement(opt.value)}
              >
                {opt.label}
              </Check>
            ))}
          </div>
        </details>
      </div>

      <div className="sf-sb-filters-foot">
        <button type="button" className="sf-sb-show-btn" onClick={showResults}>
          {isPhone && resultCount != null
            ? `Show ${resultCount} matching ${resultCount === 1 ? 'shift' : 'shifts'}`
            : 'Show matching shifts'}
        </button>
        <p>Only suburb-level locations are shown publicly.</p>
      </div>
    </aside>
    </>
  );
}
