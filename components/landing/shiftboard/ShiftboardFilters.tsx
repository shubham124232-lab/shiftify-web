'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  BadgeCheck, CalendarDays, HeartHandshake, MapPin, Navigation, Search, SlidersHorizontal, SunMoon, Zap, type LucideIcon,
} from 'lucide-react';
import {
  DATE_PRESET_OPTIONS, RADIUS_OPTIONS, SHIFTBOARD_CATEGORY_FILTERS, TIME_OF_DAY_OPTIONS, WORKER_REQUIREMENT_FILTERS,
} from '@/lib/constants/job-filters';
import type { GeolocationStatus } from '@/lib/hooks/useGeolocation';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import type { ShiftboardFilters as Filters, TimeOfDay } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY, URGENCY_ORDER } from './urgency';

// Must match the phone breakpoint in app/shiftboard.css.
export const PHONE_QUERY = '(max-width: 767px)';

// Short chip labels for the date presets — the full labels live in the constant.
const DATE_CHIP_LABEL: Record<string, string> = {
  '': 'Any date', today: 'Today', tomorrow: 'Tomorrow', week: '7 days', month: '30 days',
};

function Group({ title, Icon, count, children }: { title: string; Icon: LucideIcon; count?: number; children: ReactNode }) {
  return (
    <div className="sf-sb-group">
      <h3 className="sf-sb-group-title">
        <Icon aria-hidden="true" strokeWidth={1.75} />
        <span>{title}</span>
        {count ? <span className="sf-sb-group-count" aria-label={`${count} selected`}>{count}</span> : null}
      </h3>
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
  const requirementCount = Object.values(filters.requirements).filter(Boolean).length;
  const activeCount = countActiveFilters(filters);

  // ---- Phone bottom sheet: scroll lock, Escape, drag-down-to-dismiss ----
  const sheetRef = useRef<HTMLElement>(null);
  const dragStart = useRef<number | null>(null);
  const dragY = useRef(0);
  const [drag, setDrag] = useState(0);

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

  const locateLabel = geoStatus === 'pending'
    ? 'Finding your location…'
    : hasLocation ? 'Using your location' : 'Use my current location';

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
        <h2 className="sf-sb-mono">
          <SlidersHorizontal aria-hidden="true" strokeWidth={2} />
          Filter shifts
          {activeCount > 0 && <span className="sf-sb-active-count">{activeCount} active</span>}
        </h2>
        <div className="sf-sb-filters-actions">
          <button type="button" className="sf-sb-link" onClick={onReset} disabled={activeCount === 0}>Reset all</button>
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
        <Group title="Location" Icon={MapPin}>
          <label className="sf-sb-field">
            <Search aria-hidden="true" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search suburb or postcode"
              aria-label="Search suburb or postcode"
              value={filters.suburb}
              onChange={(e) => onChange({ suburb: e.target.value })}
            />
          </label>
          <button
            type="button"
            className={`sf-sb-locate${hasLocation ? ' on' : ''}`}
            onClick={onUseMyLocation}
            disabled={geoStatus === 'pending'}
          >
            {hasLocation
              ? <span className="sf-sb-locate-dot" aria-hidden="true" />
              : <Navigation aria-hidden="true" strokeWidth={2} />}
            {locateLabel}
          </button>
          {(geoStatus === 'denied' || geoStatus === 'unsupported') && (
            <p className="sf-sb-hint">Location unavailable — search by suburb instead.</p>
          )}
          <div className="sf-sb-sub">
            <span className="sf-sb-sub-label" id="sf-sb-radius-label">Within</span>
            <div className="sf-sb-segment" role="radiogroup" aria-labelledby="sf-sb-radius-label">
              {RADIUS_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  role="radio"
                  aria-checked={filters.radiusKm === km}
                  className={filters.radiusKm === km ? 'on' : ''}
                  onClick={() => onChange({ radiusKm: km })}
                >
                  {km}<small>km</small>
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Date" Icon={CalendarDays}>
          <div className="sf-sb-chips" role="radiogroup" aria-label="Date">
            {DATE_PRESET_OPTIONS.map((o) => {
              const on = (filters.datePreset ?? '') === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={o.label}
                  className={on ? 'on' : ''}
                  onClick={() => onChange({ datePreset: o.value, startFrom: '', startTo: '' })}
                >
                  {DATE_CHIP_LABEL[o.value]}
                </button>
              );
            })}
          </div>
        </Group>

        <Group title="Time of day" Icon={SunMoon} count={filters.timeOfDay.length}>
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
        </Group>

        <Group title="Support category" Icon={HeartHandshake} count={filters.category ? 1 : 0}>
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

        <Group title="Shift type" Icon={Zap} count={filters.urgency ? 1 : 0}>
          {URGENCY_ORDER.map((value) => {
            const { label, color, Icon, filled } = SHIFTBOARD_URGENCY[value];
            return (
              <Check
                key={value}
                checked={filters.urgency === value}
                onChange={() => onChange({ urgency: filters.urgency === value ? '' : value })}
                accent={color}
                meta={<Icon className="sf-sb-lane-icon" aria-hidden="true" strokeWidth={2} fill={filled ? 'currentColor' : 'none'} />}
              >
                {label}
              </Check>
            );
          })}
        </Group>

        <Group title="Worker requirements" Icon={BadgeCheck} count={requirementCount}>
          {WORKER_REQUIREMENT_FILTERS.map((opt) => (
            <Check
              key={opt.value}
              checked={Boolean(filters.requirements[opt.value as keyof Filters['requirements']])}
              onChange={() => toggleRequirement(opt.value)}
            >
              {opt.label}
            </Check>
          ))}
        </Group>
      </div>

      {/* Phone sheet only: the primary action closes the sheet on the results. */}
      <div className="sf-sb-sheet-footer">
        <button type="button" className="sf-sb-sheet-cta" onClick={() => onOpenChange(false)}>
          {resultCount == null ? 'Show shifts' : `Show ${resultCount} ${resultCount === 1 ? 'shift' : 'shifts'}`}
        </button>
      </div>
    </aside>
    </>
  );
}
