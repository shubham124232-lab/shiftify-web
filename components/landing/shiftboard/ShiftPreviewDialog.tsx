'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import { WORKER_REQUIREMENT_FILTERS } from '@/lib/constants/job-filters';
import type { ShiftboardJob } from '@/lib/types/shiftboard';
import { formatDay, formatHours, formatTime } from './format';

// Shown for every shift; the shift's own requirements are added after these.
const BASE_NEEDS = [
  'Relevant checks and profile verification',
  'Experience suited to this support category',
  'Availability for the complete shift time',
];

// Public "View shift" preview. A native <dialog> opened with showModal(), so
// focus trapping, Esc to close and the backdrop come from the browser.
export function ShiftPreviewDialog({ job, onClose }: { job: ShiftboardJob; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const category = JOB_CATEGORIES.find((c) => c.value === job.category);
  const hours = job.totalHours ?? (new Date(job.scheduledEndAt).getTime() - new Date(job.scheduledStartAt).getTime()) / 3_600_000;
  const needs = [
    ...BASE_NEEDS,
    ...WORKER_REQUIREMENT_FILTERS
      .filter((r) => job.requirements?.[r.value as keyof ShiftboardJob['requirements']])
      .map((r) => r.label),
  ];
  const titleId = `sf-sb-preview-${job.id}`;

  useEffect(() => {
    const dialog = ref.current;
    // No close() in cleanup: under Strict Mode its queued close event would
    // fire after the remount and shut the dialog. Unmounting removes it anyway.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="sf-sb-preview"
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the dialog element itself is a click on the backdrop.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <header className="sf-sb-preview-head">
        <div>
          <h2 id={titleId}>{job.suburb}{job.state ? `, ${job.state}` : ''}</h2>
          <p>{category?.label ?? job.category}</p>
        </div>
        <button type="button" className="sf-sb-preview-close" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" strokeWidth={2} />
        </button>
      </header>

      <div className="sf-sb-preview-body">
        <p className="sf-sb-preview-when">
          {formatDay(job.scheduledStartAt)}, {formatTime(job.scheduledStartAt)}–{formatTime(job.scheduledEndAt)}
          {' · '}{formatHours(hours)}
          {job.distanceKm != null && ` · ${job.distanceKm < 1 ? 'Under 1 km' : `${Math.round(job.distanceKm)} km`} away`}
        </p>

        <h3>What this shift involves</h3>
        <p>Support with the listed activity, following the participant’s preferences and agreed support plan.</p>

        <h3>What you may need</h3>
        <ul>
          {needs.map((n) => <li key={n}>{n}</li>)}
        </ul>

        <p className="sf-sb-preview-privacy">
          <strong>Privacy comes first.</strong> This public preview shows an approximate location only. Personal
          details and the exact address are released after both sides confirm.
        </p>
      </div>

      <footer className="sf-sb-preview-foot">
        <a href="/login" className="sf-sb-outline-btn">Sign in to apply</a>
        <a href="/register?role=SUPPORT_WORKER" className="sf-sb-preview-join">Join Shiftify to apply</a>
      </footer>
    </dialog>
  );
}
