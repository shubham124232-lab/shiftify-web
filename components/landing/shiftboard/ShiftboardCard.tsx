'use client';

import { useState, type CSSProperties } from 'react';
import type { ShiftboardJob } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY } from './urgency';
import { formatDay, formatHours, formatStartsIn, formatTime } from './format';
import { LaneIcon, categoryIcon, findCategory } from './rowIcons';
import { ShiftPreviewDialog } from './ShiftPreviewDialog';

export function ShiftboardCard({ job, index = 0 }: { job: ShiftboardJob; index?: number }) {
  const urg = SHIFTBOARD_URGENCY[job.urgency];
  const category = findCategory(job.category);
  const [previewOpen, setPreviewOpen] = useState(false);

  const hours = job.totalHours ?? (new Date(job.scheduledEndAt).getTime() - new Date(job.scheduledStartAt).getTime()) / 3_600_000;
  const place = job.distanceKm != null
    ? job.distanceKm < 1 ? 'Under 1 km away' : `${Math.round(job.distanceKm)} km away`
    : job.state ?? '';

  return (
    <article
      className="sf-shift sf-shift--board"
      style={{ '--row-accent': urg.color, animationDelay: `${index * 40}ms` } as CSSProperties}
    >
      <span className="sf-shift-lane" role="img" aria-label={`${urg.label} shift`} title={urg.label}>
        <LaneIcon urgency={job.urgency} className="sf-shift-lane-icon" />
      </span>

      <span className="sf-shift-place">
        <b>{job.suburb}</b>
        {place && <em>{place}</em>}
      </span>

      <span className="sf-shift-cell sf-shift-service">
        <i className={`bi ${categoryIcon(job.category)}`} aria-hidden="true" />
        <span><b>{category?.label ?? job.category}</b><em>{job.subcategory || category?.group}</em></span>
      </span>

      <span className="sf-shift-cell sf-shift-when">
        <i className="bi bi-calendar3" aria-hidden="true" />
        <span><b>{formatDay(job.scheduledStartAt)}</b><em>{formatTime(job.scheduledStartAt)} – {formatTime(job.scheduledEndAt)}</em></span>
      </span>

      <span className="sf-shift-cell sf-shift-starts">
        <i className="bi bi-hourglass-split" aria-hidden="true" />
        <span><b>{formatStartsIn(job.scheduledStartAt)}</b><em>{formatHours(hours)}</em></span>
      </span>

      <button
        type="button"
        className="sf-shift-btn"
        aria-haspopup="dialog"
        aria-label={`View the ${urg.label.toLowerCase()} shift in ${job.suburb}`}
        onClick={() => setPreviewOpen(true)}
      >
        View details
      </button>

      {previewOpen && <ShiftPreviewDialog job={job} onClose={() => setPreviewOpen(false)} />}
    </article>
  );
}
