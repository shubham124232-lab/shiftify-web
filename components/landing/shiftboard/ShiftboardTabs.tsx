'use client';

import type { CSSProperties } from 'react';
import type { ShiftboardCounts, ShiftboardUrgency } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY, URGENCY_ORDER } from './urgency';

export function ShiftboardTabs({
  active, onChange, counts, allSub,
}: {
  active: ShiftboardUrgency | '';
  onChange: (v: ShiftboardUrgency | '') => void;
  counts: ShiftboardCounts;
  // Replaces "N available" when the feed has no per-lane counts.
  allSub?: string;
}) {
  return (
    <div className="sf-sb-tabs" role="tablist" aria-label="Filter shifts by timing">
      <button
        type="button"
        role="tab"
        aria-selected={active === ''}
        className={`sf-sb-tab sf-sb-tab-all${active === '' ? ' active' : ''}`}
        onClick={() => onChange('')}
      >
        <span className="sf-sb-tab-label">All shifts</span>
        <span className="sf-sb-tab-window">{allSub ?? `${counts.ALL} available`}</span>
      </button>

      {URGENCY_ORDER.map((value) => {
        const { label, window, color, Icon, filled } = SHIFTBOARD_URGENCY[value];
        const count = counts[value];
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${label}, ${count} ${count === 1 ? 'shift' : 'shifts'}, ${window}`}
            className={`sf-sb-tab${isActive ? ' active' : ''}`}
            style={{ '--tab-c': color } as CSSProperties}
            onClick={() => onChange(value)}
          >
            <span className="sf-sb-tab-label">
              <Icon className="sf-sb-tab-icon" aria-hidden="true" strokeWidth={2.2} fill={filled ? 'currentColor' : 'none'} />
              {label}
            </span>
            <span className="sf-sb-tab-window" aria-hidden="true">{window}</span>
          </button>
        );
      })}
    </div>
  );
}
