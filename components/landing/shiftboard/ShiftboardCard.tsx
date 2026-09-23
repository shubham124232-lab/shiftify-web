'use client';

import { useState, type CSSProperties } from 'react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import type { ShiftboardJob } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY } from './urgency';
import { formatDay, formatHours, formatStartsIn, formatTime } from './format';
import { ShiftPreviewDialog } from './ShiftPreviewDialog';

export function ShiftboardCard({ job, index = 0 }: { job: ShiftboardJob; index?: number }) {
  const urg = SHIFTBOARD_URGENCY[job.urgency];
  const category = JOB_CATEGORIES.find((c) => c.value === job.category);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <article className="sf-sb-row" style={{ '--lane': urg.color, '--i': index } as CSSProperties}>
      <span className="sf-sb-row-icon" role="img" aria-label={`${urg.label} shift`} title={urg.label}>
        <urg.Icon aria-hidden="true" strokeWidth={2} fill={urg.filled ? 'currentColor' : 'none'} />
      </span>

      <div className="sf-sb-row-body">
        <h3>{job.suburb}{job.state ? `, ${job.state}` : ''}</h3>
        <p className="sf-sb-row-cat">{category?.label ?? job.category}</p>
        <ul className="sf-sb-row-meta">
          <li>{formatDay(job.scheduledStartAt)}, {formatTime(job.scheduledStartAt)}–{formatTime(job.scheduledEndAt)}</li>
          <li>{formatHours(job.totalHours ?? (new Date(job.scheduledEndAt).getTime() - new Date(job.scheduledStartAt).getTime()) / 3_600_000)}</li>
          {job.distanceKm != null && (
            <li>{job.distanceKm < 1 ? 'Under 1 km away' : `${Math.round(job.distanceKm)} km away`}</li>
          )}
          <li className="sf-sb-row-starts">{formatStartsIn(job.scheduledStartAt)}</li>
        </ul>
      </div>

      <button
        type="button"
        className="sf-sb-row-cta"
        aria-haspopup="dialog"
        aria-label={`View the ${urg.label.toLowerCase()} shift in ${job.suburb}`}
        onClick={() => setPreviewOpen(true)}
      >
        View shift
      </button>

      {previewOpen && <ShiftPreviewDialog job={job} onClose={() => setPreviewOpen(false)} />}
    </article>
  );
}
