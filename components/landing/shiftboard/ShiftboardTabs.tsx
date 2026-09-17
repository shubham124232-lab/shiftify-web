'use client';

import type { CSSProperties } from 'react';
import { Zap } from 'lucide-react';
import type { ShiftboardCounts, ShiftboardUrgency } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY, URGENCY_ORDER } from './urgency';

const TABS = [
  { value: '' as const, label: 'All shifts', window: 'Live now', color: 'var(--sf-pink)', Icon: Zap, filled: true, live: true },
  ...URGENCY_ORDER.map((value) => ({ value, live: false, ...SHIFTBOARD_URGENCY[value] })),
];

export function ShiftboardTabs({
  active, onChange, counts,
}: {
  active: ShiftboardUrgency | '';
  onChange: (v: ShiftboardUrgency | '') => void;
  counts: ShiftboardCounts;
}) {
  return (
    <div className="sf-sb-tabs" role="tablist" aria-label="Filter shifts by timing">
      {TABS.map(({ value, label, window, color, Icon, filled, live }) => {
        const count = value === '' ? counts.ALL : counts[value];
        const isActive = active === value;
        return (
          <button
            key={value || 'all'}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${label}, ${count} ${count === 1 ? 'shift' : 'shifts'}, ${window}`}
            className={`sf-sb-tab${isActive ? ' active' : ''}`}
            style={{ '--tab-c': color } as CSSProperties}
            onClick={() => onChange(value)}
          >
            <span className="sf-sb-tab-top">
              <Icon className="sf-sb-tab-icon" aria-hidden="true" strokeWidth={2} fill={filled ? 'currentColor' : 'none'} />
              <span className="sf-sb-tab-count" aria-hidden="true">{count}</span>
            </span>
            <span className="sf-sb-tab-label">{label}</span>
            <span className="sf-sb-tab-window" aria-hidden="true">
              {live && <span className="sf-sb-tab-live" />}
              {window}
            </span>
          </button>
        );
      })}
    </div>
  );
}
