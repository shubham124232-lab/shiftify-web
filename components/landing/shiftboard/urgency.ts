import { CalendarClock, CalendarDays, Clock, Zap, type LucideIcon } from 'lucide-react';
import type { ShiftboardUrgency } from '@/lib/types/shiftboard';

// One source for a timing lane's label, colour and icon — shared by the tabs,
// the shift rows and the map pins so the three always agree.
// `window` is the lane's start-time window, same wording as the home nav ticker.
export const SHIFTBOARD_URGENCY: Record<ShiftboardUrgency, { label: string; window: string; color: string; Icon: LucideIcon; filled?: boolean }> = {
  RAPID:       { label: 'Rapid',       window: 'Now – 60 min', color: 'var(--sf-rapid)',   Icon: Zap, filled: true },
  URGENT:      { label: 'Urgent',      window: '1 – 4 hours',  color: 'var(--sf-urgent)',  Icon: Clock },
  LAST_MINUTE: { label: 'Last Minute', window: '4 – 48 hours', color: 'var(--sf-lastmin)', Icon: CalendarClock },
  ROUTINE:     { label: 'Routine',     window: '48 hours +',   color: 'var(--sf-routine)', Icon: CalendarDays },
};

export const URGENCY_ORDER: ShiftboardUrgency[] = ['RAPID', 'URGENT', 'LAST_MINUTE', 'ROUTINE'];
