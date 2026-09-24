import { createElement } from 'react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import type { ShiftboardUrgency } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY } from './urgency';

// Shift-row icons shared by the public shiftboard and the Live Dashboard.
// The lane icon is drawn exactly like the timing tabs above the list.
export function LaneIcon({ urgency, className }: { urgency: ShiftboardUrgency; className?: string }) {
  const { Icon, filled } = SHIFTBOARD_URGENCY[urgency];
  return createElement(Icon, { className, 'aria-hidden': true, strokeWidth: 2.2, fill: filled ? 'currentColor' : 'none' });
}

const GROUP_ICON: Record<string, string> = {
  'Domestic Support': 'bi-house',
  'Social Support': 'bi-people',
  'Personal Care': 'bi-person-heart',
  Nursing: 'bi-heart-pulse',
  'Allied Health': 'bi-clipboard2-pulse',
};

export function findCategory(value: string) {
  return JOB_CATEGORIES.find((c) => c.value === value);
}

// Bootstrap icon class for a category's service group.
export function categoryIcon(value: string): string {
  return GROUP_ICON[findCategory(value)?.group ?? ''] ?? 'bi-grid';
}
