'use client';

import type { CSSProperties } from 'react';
import { EyeOff, Star } from 'lucide-react';
import type { Job } from '@/components/jobs/job-card';
import { SHIFTBOARD_URGENCY } from '@/components/landing/shiftboard/urgency';
import { formatDay, formatHours, formatStartsIn, formatTime } from '@/components/landing/shiftboard/format';
import { LaneIcon, findCategory } from '@/components/landing/shiftboard/rowIcons';
import type { ShiftboardUrgency } from '@/lib/types/shiftboard';

// Same row as the public shiftboard (.sf-shift--board), plus the signed-in
// actions: save, hide and apply / manage.
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
  const urgency = (job.urgency in SHIFTBOARD_URGENCY ? job.urgency : 'ROUTINE') as ShiftboardUrgency;
  const urg = SHIFTBOARD_URGENCY[urgency];
  const category = findCategory(job.category);
  const applied = !!job.ownApplication;
  const isOwner = !!job.isOwnRequest;
  const hours = job.estimatedHours != null
    ? Number(job.estimatedHours)
    : job.scheduledEndAt ? (new Date(job.scheduledEndAt).getTime() - new Date(job.scheduledStartAt).getTime()) / 3_600_000 : null;
  const rate = job.budgetPerHour
    ? `$${Number(job.budgetPerHour).toFixed(2)} / hr`
    : job.budgetType === 'TOTAL' && job.totalBudget ? `$${Number(job.totalBudget).toFixed(2)} total` : null;

  // Every state is real: who owns the request, whether this account may
  // apply, and whether it already has.
  const status = isOwner ? 'Your request' : applied ? 'Application sent' : null;
  const primary = !isOwner && !applied && canApply;
  const cta = isOwner ? 'Manage' : primary ? 'Apply now' : 'View shift';

  return (
    <article
      className="sf-shift sf-shift--board"
      style={{ '--row-accent': urg.color, animationDelay: `${index * 40}ms` } as CSSProperties}
    >
      <span className="sf-shift-lane" role="img" aria-label={`${urg.label} shift`} title={urg.label}>
        <LaneIcon urgency={urgency} className="sf-shift-lane-icon" />
      </span>

      <span className="sf-shift-place">
        <b>
          <a href={`/jobs/${job.id}`} onClick={(e) => { e.preventDefault(); onView(); }}>{job.suburb}</a>
        </b>
        <em>{job.state}</em>
        {status && <span className="sf-shift-status">{status}</span>}
      </span>

      <span className="sf-shift-cell sf-shift-service">
        <span><b>{category?.label ?? job.category}</b><em>{job.title || category?.group}</em></span>
      </span>

      <span className="sf-shift-cell sf-shift-when">
        <span>
          <b>{formatDay(job.scheduledStartAt)}</b>
          <em>{formatTime(job.scheduledStartAt)}{job.scheduledEndAt ? ` – ${formatTime(job.scheduledEndAt)}` : ''}</em>
        </span>
      </span>

      <span className="sf-shift-cell sf-shift-starts">
        <span>
          <b>{formatStartsIn(job.scheduledStartAt)}</b>
          <em>{[hours != null ? formatHours(hours) : null, rate].filter(Boolean).join(' · ')}</em>
        </span>
      </span>

      <span className="sf-shift-actions">
        {canApply && !isOwner && (
          <>
            <button
              type="button"
              className={`sf-shift-icon-btn${job.saved ? ' on' : ''}`}
              onClick={onToggleSave}
              aria-label={job.saved ? 'Remove from saved' : 'Save shift'}
              aria-pressed={!!job.saved}
            >
              <Star aria-hidden="true" strokeWidth={2} fill={job.saved ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="sf-shift-icon-btn" onClick={onToggleHide} aria-label="Hide shift">
              <EyeOff aria-hidden="true" strokeWidth={2} />
            </button>
          </>
        )}
        <button
          type="button"
          className={`sf-shift-btn${primary ? ' primary' : ''}`}
          onClick={primary ? onApply : onView}
          disabled={applying}
        >
          {applying ? 'Applying…' : cta}
        </button>
      </span>
    </article>
  );
}
