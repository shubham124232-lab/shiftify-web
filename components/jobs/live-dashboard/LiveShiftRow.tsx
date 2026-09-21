'use client';

import type { CSSProperties } from 'react';
import { EyeOff, Star } from 'lucide-react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import type { Job } from '@/components/jobs/job-card';
import { SHIFTBOARD_URGENCY } from '@/components/landing/shiftboard/urgency';
import { formatDay, formatHours, formatStartsIn, formatTime } from '@/components/landing/shiftboard/format';
import type { ShiftboardUrgency } from '@/lib/types/shiftboard';

export function LiveShiftRow({ job, index, canApply, applying, onApply, onView, onToggleSave, onToggleHide }: {
  job: Job;
  index: number;
  canApply: boolean;
  applying: boolean;
  onApply: () => void;
  onView: () => void;
  onToggleSave: () => void;
  onToggleHide: () => void;
}) {
  const urg = SHIFTBOARD_URGENCY[job.urgency as ShiftboardUrgency] ?? SHIFTBOARD_URGENCY.ROUTINE;
  const category = JOB_CATEGORIES.find((c) => c.value === job.category)?.label ?? job.category;
  const applied = !!job.ownApplication;
  const isOwner = !!job.isOwnRequest;
  const hours = job.estimatedHours != null ? formatHours(Number(job.estimatedHours)) : null;
  const rate = job.budgetPerHour
    ? `$${Number(job.budgetPerHour).toFixed(2)} / hr`
    : job.budgetType === 'TOTAL' && job.totalBudget ? `$${Number(job.totalBudget).toFixed(2)} total` : null;

  // Every state is real: who owns the request, whether this account may
  // apply, and whether it already has.
  const status = isOwner ? 'Your request' : applied ? 'Application sent' : null;
  const primary = !isOwner && !applied && canApply;
  const cta = isOwner ? 'Manage' : primary ? 'Apply now' : 'View shift';

  return (
    <article className="sf-sb-row" style={{ '--lane': urg.color, '--i': index } as CSSProperties}>
      <span className="sf-sb-row-icon" role="img" aria-label={`${urg.label} shift`} title={urg.label}>
        <urg.Icon aria-hidden="true" strokeWidth={2} fill={urg.filled ? 'currentColor' : 'none'} />
      </span>

      <div className="sf-sb-row-body">
        <h3>
          <a href={`/jobs/${job.id}`} onClick={(e) => { e.preventDefault(); onView(); }}>
            {job.suburb}{job.state ? `, ${job.state}` : ''}
          </a>
          {status && <span className="sf-sb-row-status">{status}</span>}
        </h3>
        <p className="sf-sb-row-cat">{job.title || category}</p>
        <ul className="sf-sb-row-meta">
          <li>
            {formatDay(job.scheduledStartAt)}, {formatTime(job.scheduledStartAt)}
            {job.scheduledEndAt ? `–${formatTime(job.scheduledEndAt)}` : ''}
          </li>
          {hours && <li>{hours}</li>}
          {rate && <li>{rate}</li>}
          <li className="sf-sb-row-starts">{formatStartsIn(job.scheduledStartAt)}</li>
        </ul>
      </div>

      <div className="sf-sb-row-actions">
        {canApply && !isOwner && (
          <>
            <button
              type="button"
              className={`sf-sb-row-icon-btn${job.saved ? ' on' : ''}`}
              onClick={onToggleSave}
              aria-label={job.saved ? 'Remove from saved' : 'Save shift'}
              aria-pressed={!!job.saved}
            >
              <Star aria-hidden="true" strokeWidth={2} fill={job.saved ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="sf-sb-row-icon-btn" onClick={onToggleHide} aria-label="Hide shift">
              <EyeOff aria-hidden="true" strokeWidth={2} />
            </button>
          </>
        )}
        <button
          type="button"
          className={`sf-sb-row-cta${primary ? ' primary' : ''}`}
          onClick={primary ? onApply : onView}
          disabled={applying}
        >
          {applying ? 'Applying…' : cta}
        </button>
      </div>
    </article>
  );
}
