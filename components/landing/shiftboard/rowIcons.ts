import { createElement } from 'react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import type { ShiftboardUrgency } from '@/lib/types/shiftboard';
import { IconLastMinute, IconRapid, IconRoutine, IconUrgent } from '../home/PremiumIcons';

// Lane icons shared by the home hero board, the public shiftboard (rows and
// timing tabs) and the Live Dashboard: the home page's duotone set.
const LANE_ICON: Record<ShiftboardUrgency, typeof IconRapid> = {
  RAPID: IconRapid,
  URGENT: IconUrgent,
  LAST_MINUTE: IconLastMinute,
  ROUTINE: IconRoutine,
};

export function LaneIcon({ urgency, className }: { urgency: ShiftboardUrgency; className?: string }) {
  return createElement(LANE_ICON[urgency], { className });
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
