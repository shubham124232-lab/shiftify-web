// Shift-row wording shared by the public shiftboard, the Live Dashboard and
// the dashboard request lists, so every list reads the same.

const DAY = 86_400_000;

function dayDelta(iso: string): number {
  const a = new Date(iso); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / DAY);
}

// "Today", "Tomorrow", "Friday" within the week, then "Mon 6 Oct".
export function formatDay(iso: string): string {
  const delta = dayDelta(iso);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  const d = new Date(iso);
  if (delta > 1 && delta < 7) return d.toLocaleDateString('en-AU', { weekday: 'long' });
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// "10:00 am" — en-AU uses a narrow no-break space; normalise it.
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).replace(/\s+/g, ' ').toLowerCase();
}

export function formatHours(hours: number): string {
  const value = Math.round(hours * 10) / 10;
  return `${value} ${value === 1 ? 'hour' : 'hours'}`;
}

// Countdown while the start is close, then plain day words.
export function formatStartsIn(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (mins <= 0) return 'Started';
  if (mins < 60) return `Starts in ${mins} min`;
  if (mins < 180) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `Starts in ${h} ${h === 1 ? 'hr' : 'hrs'}${m ? ` ${m} min` : ''}`;
  }
  const delta = dayDelta(iso);
  if (delta === 0) return 'Starts today';
  if (delta === 1) return 'Starts tomorrow';
  return `Starts in ${delta} days`;
}
