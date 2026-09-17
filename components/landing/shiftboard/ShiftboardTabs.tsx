'use client';

import type { ShiftboardCounts, ShiftboardUrgency } from '@/lib/types/shiftboard';

const TABS: { value: ShiftboardUrgency | ''; label: string; icon: string }[] = [
  { value: '',            label: 'All shifts',   icon: 'bi-lightning-charge-fill' },
  { value: 'RAPID',       label: 'Rapid',         icon: 'bi-lightning-charge-fill' },
  { value: 'URGENT',      label: 'Urgent',        icon: 'bi-exclamation-circle-fill' },
  { value: 'LAST_MINUTE', label: 'Last Minute',   icon: 'bi-clock-fill' },
  { value: 'ROUTINE',     label: 'Routine',       icon: 'bi-calendar2-week-fill' },
];

export function ShiftboardTabs({
  active, onChange, counts,
}: {
  active: ShiftboardUrgency | '';
  onChange: (v: ShiftboardUrgency | '') => void;
  counts: ShiftboardCounts;
}) {
  return (
    <div className="sf-shiftboard-tabs" role="tablist" aria-label="Filter shifts by timing">
      {TABS.map((t) => {
        const count = t.value === '' ? counts.ALL : counts[t.value];
        return (
          <button
            key={t.value || 'all'}
            type="button"
            role="tab"
            aria-selected={active === t.value}
            className={`sf-shiftboard-tab${active === t.value ? ' active' : ''}`}
            onClick={() => onChange(t.value)}
          >
            <i className={`bi ${t.icon}`} aria-hidden="true" />
            {t.label} ({count})
          </button>
        );
      })}
    </div>
  );
}
