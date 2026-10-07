'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { FUNDING_LABELS, POSTED_WITHIN_OPTIONS, SHIFT_TYPE_LABELS, SHIFTBOARD_CATEGORY_FILTERS } from '@/lib/constants/job-filters';

// Everything GET /jobs/live-dashboard filters on, besides suburb, urgency and
// sort (those sit in the results toolbar and tabs).
export interface LiveDashboardFilters {
  category: string;
  shiftType: string;
  fundingType: string;
  isRecurring: string; // "true" | "false" | ""
  postedWithin: string;
  dateFrom: string; // yyyy-mm-dd
  dateTo: string;
}

export const DEFAULT_LIVE_FILTERS: LiveDashboardFilters = {
  category: '', shiftType: '', fundingType: '', isRecurring: '', postedWithin: '', dateFrom: '', dateTo: '',
};

export function countLiveFilters(f: LiveDashboardFilters): number {
  // A date range counts once, however many ends are set.
  return [f.category, f.shiftType, f.fundingType, f.isRecurring, f.postedWithin].filter(Boolean).length
    + (f.dateFrom || f.dateTo ? 1 : 0);
}

// Local yyyy-mm-dd, `days` from today.
function isoDay(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DATE_CHIPS = [
  { label: 'Any date', range: () => ['', ''] },
  { label: 'Today',    range: () => [isoDay(0), isoDay(0)] },
  { label: 'Tomorrow', range: () => [isoDay(1), isoDay(1)] },
  { label: '7 days',   range: () => [isoDay(0), isoDay(7)] },
] as const;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sf-sb-group">
      <h3 className="sf-sb-group-title">{title}</h3>
      {children}
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className={`sf-sb-check${checked ? ' checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="sf-sb-check-label">{children}</span>
    </label>
  );
}

function Chips<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="sf-sb-chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Open by default, with the long lists (support category, advanced) folded
// away until clicked. The header still collapses the whole card.
export function LiveFilterCard({ filters, onChange, onReset }: {
  filters: LiveDashboardFilters;
  onChange: (patch: Partial<LiveDashboardFilters>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeCount = countLiveFilters(filters);
  const activeDate = DATE_CHIPS.find((c) => {
    const [from, to] = c.range();
    return from === filters.dateFrom && to === filters.dateTo;
  })?.label;

  return (
    <section className={`sf-sb-filters sf-sb-filters--rail${open ? ' open' : ''}`} aria-label="Filter shifts">
      <div className="sf-sb-filters-head">
        <button
          type="button"
          className="sf-sb-rail-toggle"
          aria-expanded={open}
          aria-controls="sf-ld-filters-body"
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal aria-hidden="true" strokeWidth={2} />
          <h2>
            Filter shifts
            <span className="sf-sb-active-count" aria-label={`${activeCount} active`}>{activeCount}</span>
          </h2>
          <ChevronDown className="sf-sb-rail-chevron" aria-hidden="true" strokeWidth={2.2} />
        </button>
        {activeCount > 0 && (
          <button type="button" className="sf-sb-clear" onClick={onReset}>Clear all</button>
        )}
      </div>

      {open && (
        <>
          <div className="sf-sb-filters-body" id="sf-ld-filters-body">
            <Group title="Date">
              <div className="sf-sb-chips" role="radiogroup" aria-label="Date">
                {DATE_CHIPS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    role="radio"
                    aria-checked={activeDate === c.label}
                    className={activeDate === c.label ? 'on' : ''}
                    onClick={() => { const [dateFrom, dateTo] = c.range(); onChange({ dateFrom, dateTo }); }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Group>

            <details
              className="sf-sb-advanced"
              open={categoryOpen}
              onToggle={(e) => setCategoryOpen(e.currentTarget.open)}
            >
              <summary>
                <ChevronRight aria-hidden="true" strokeWidth={2.4} />
                Support category
                {filters.category && <span className="sf-sb-advanced-count">1</span>}
              </summary>
              <div className="sf-sb-sub">
                {SHIFTBOARD_CATEGORY_FILTERS.map((opt) => (
                  <Check
                    key={opt.value}
                    checked={filters.category === opt.value}
                    onChange={() => onChange({ category: filters.category === opt.value ? '' : opt.value })}
                  >
                    {opt.label}
                  </Check>
                ))}
              </div>
            </details>

            <Group title="Frequency">
              <Chips
                label="Frequency"
                value={filters.isRecurring}
                onChange={(isRecurring) => onChange({ isRecurring })}
                options={[{ value: '', label: 'All' }, { value: 'false', label: 'One-time' }, { value: 'true', label: 'Recurring' }]}
              />
            </Group>

            <details
              className="sf-sb-advanced"
              open={advancedOpen}
              onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
            >
              <summary>
                <ChevronRight aria-hidden="true" strokeWidth={2.4} />
                Advanced filters
              </summary>

              <div className="sf-sb-sub">
                <h4>Shift type</h4>
                {Object.entries(SHIFT_TYPE_LABELS).map(([value, label]) => (
                  <Check
                    key={value}
                    checked={filters.shiftType === value}
                    onChange={() => onChange({ shiftType: filters.shiftType === value ? '' : value })}
                  >
                    {label}
                  </Check>
                ))}
              </div>

              <div className="sf-sb-sub">
                <h4>Funding type</h4>
                {Object.entries(FUNDING_LABELS).map(([value, label]) => (
                  <Check
                    key={value}
                    checked={filters.fundingType === value}
                    onChange={() => onChange({ fundingType: filters.fundingType === value ? '' : value })}
                  >
                    {label}
                  </Check>
                ))}
              </div>

              <div className="sf-sb-sub">
                <h4>Posted within</h4>
                <Chips
                  label="Posted within"
                  value={filters.postedWithin}
                  onChange={(postedWithin) => onChange({ postedWithin })}
                  options={POSTED_WITHIN_OPTIONS}
                />
              </div>

              <div className="sf-sb-sub">
                <h4>Custom dates</h4>
                <div className="sf-sb-dates">
                  <label>
                    From
                    <input className="sf-sb-input" type="date" value={filters.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} />
                  </label>
                  <label>
                    To
                    <input className="sf-sb-input" type="date" value={filters.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} />
                  </label>
                </div>
              </div>
            </details>
          </div>

          <div className="sf-sb-filters-foot">
            <button
              type="button"
              className="sf-sb-show-btn"
              onClick={() => {
                setOpen(false);
                document.getElementById('sf-sb-shifts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Show matching shifts
            </button>
          </div>
        </>
      )}
    </section>
  );
}
