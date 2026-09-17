'use client';

import type { CSSProperties } from 'react';
import { ArrowRight, Calendar, HeartPulse, House, MapPin, Users, type LucideIcon } from 'lucide-react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import type { ShiftboardJob } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY } from './urgency';

// Home-based help gets a house, out-and-about help gets people.
const GROUP_ICON: Record<string, LucideIcon> = {
  'Personal Care': House,
  'Domestic Support': House,
  'Social Support': Users,
  'Nursing': HeartPulse,
  'Allied Health': HeartPulse,
};

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const at = new Date(d); at.setHours(0, 0, 0, 0);
  const delta = Math.round((at.getTime() - today.getTime()) / 86_400_000);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// "10:00am – 2:00pm" — en-AU puts a (narrow) space before am/pm; drop it.
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, '').toLowerCase();
}

function formatHours(job: ShiftboardJob): { value: number; unit: string } {
  const hours = job.totalHours
    ?? (new Date(job.scheduledEndAt).getTime() - new Date(job.scheduledStartAt).getTime()) / 3_600_000;
  const value = Math.round(hours * 10) / 10;
  return { value, unit: value === 1 ? 'hr' : 'hrs' };
}

function formatDistance(km: number): string {
  return km < 1 ? 'Under 1 km away' : `${Math.round(km)} km away`;
}

// `index` staggers the rows' entrance animation.
export function ShiftboardCard({ job, index = 0 }: { job: ShiftboardJob; index?: number }) {
  const urg = SHIFTBOARD_URGENCY[job.urgency];
  const category = JOB_CATEGORIES.find((c) => c.value === job.category);
  const CategoryIcon = (category && GROUP_ICON[category.group]) ?? Users;
  const day = formatDay(job.scheduledStartAt);
  const hours = formatHours(job);
  const isNew = Date.now() - new Date(job.createdAt).getTime() < 86_400_000;

  return (
    <article className="sf-sb-row" style={{ '--lane': urg.color, '--i': index } as CSSProperties}>
      {/* Icon only — the lane name stays available to screen readers and on hover. */}
      <div className="sf-sb-row-lane" role="img" aria-label={`${urg.label} shift`} title={urg.label}>
        <urg.Icon aria-hidden="true" strokeWidth={2} fill={urg.filled ? 'currentColor' : 'none'} />
      </div>

      <div className="sf-sb-row-cell sf-sb-row-place">
        <div>
          <strong>
            {job.suburb}
            {isNew && <em className="sf-sb-row-new">New</em>}
          </strong>
          <span className="sf-sb-row-distance">
            <MapPin aria-hidden="true" strokeWidth={2} />
            {job.distanceKm != null ? formatDistance(job.distanceKm) : job.state}
          </span>
        </div>
      </div>

      <div className="sf-sb-row-cell">
        <CategoryIcon aria-hidden="true" strokeWidth={1.75} />
        <div>
          <strong>{category?.label ?? job.category}</strong>
          {job.subcategory && <span>{job.subcategory}</span>}
        </div>
      </div>

      <div className="sf-sb-row-cell">
        <Calendar aria-hidden="true" strokeWidth={1.75} />
        <div>
          <strong>
            <b className={`sf-sb-row-day${day === 'Today' ? ' today' : day === 'Tomorrow' ? ' tomorrow' : ''}`}>{day}</b>
          </strong>
          <span>{formatTime(job.scheduledStartAt)} – {formatTime(job.scheduledEndAt)}</span>
        </div>
      </div>

      <div className="sf-sb-row-cell sf-sb-row-hours">
        <span className="sf-sb-row-stat">
          <b>{hours.value}</b>
          <small>{hours.unit}</small>
        </span>
        <span className="sf-sb-row-stat-label">Duration</span>
      </div>

      <a href="/register?role=SUPPORT_WORKER" className="sf-sb-row-cta" aria-label={`View details for the ${urg.label.toLowerCase()} shift in ${job.suburb}`}>
        <span>
          View details
          <ArrowRight aria-hidden="true" strokeWidth={2.2} />
        </span>
      </a>
    </article>
  );
}
