'use client';

import { MapPin, Car, GraduationCap, ShieldCheck, Heart, IdCard } from 'lucide-react';
import { JOB_CATEGORIES } from '@/lib/constants/categories';
import type { ShiftboardJob } from '@/lib/types/shiftboard';

const URGENCY_META: Record<ShiftboardJob['urgency'], { label: string; accent: string }> = {
  RAPID:       { label: 'Rapid',       accent: 'var(--sf-rapid)' },
  URGENT:      { label: 'Urgent',      accent: 'var(--sf-urgent)' },
  LAST_MINUTE: { label: 'Last Minute', accent: 'var(--sf-lastmin)' },
  ROUTINE:     { label: 'Routine',     accent: 'var(--sf-routine)' },
};

// Small icon per active requirement — kept local rather than importing the
// dashboard's job-card helpers, since this is a marketing-chrome component.
const REQUIREMENT_ICON: Record<string, typeof Car> = {
  driversLicence: IdCard,
  vehicle: Car,
  certIIIOrAbove: GraduationCap,
  restrictivePractices: ShieldCheck,
  firstAid: ShieldCheck,
  alliedHealth: Heart,
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

function formatTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startIso).toLocaleTimeString('en-AU', opts)} – ${new Date(endIso).toLocaleTimeString('en-AU', opts)}`;
}

export function ShiftboardCard({ job }: { job: ShiftboardJob }) {
  const urg = URGENCY_META[job.urgency];
  const catLabel = JOB_CATEGORIES.find((c) => c.value === job.category)?.label ?? job.category;
  const activeRequirements = Object.entries(job.requirements).filter(([, v]) => v);

  return (
    <div className="sf-shiftboard-card" style={{ borderTopColor: urg.accent }}>
      <div className="sf-shiftboard-card-head">
        <span className="sf-shiftboard-badge" style={{ background: urg.accent }}>{urg.label}</span>
        <span className="sf-shiftboard-card-workers">
          <i className="bi bi-person-fill" aria-hidden="true" /> 1 support worker
        </span>
      </div>

      <div className="sf-shiftboard-card-location">
        <MapPin className="h-4 w-4" strokeWidth={1.75} />
        <span>{job.suburb}</span>
        {job.distanceKm != null && <span className="sf-shiftboard-card-distance">{job.distanceKm} km away</span>}
      </div>

      <p className="sf-shiftboard-card-category">{catLabel}{job.subcategory ? ` · ${job.subcategory}` : ''}</p>

      <div className="sf-shiftboard-card-meta">
        <span>{formatDay(job.scheduledStartAt)}</span>
        <span aria-hidden="true">·</span>
        <span>{formatTimeRange(job.scheduledStartAt, job.scheduledEndAt)}</span>
      </div>

      {activeRequirements.length > 0 && (
        <div className="sf-shiftboard-card-requirements">
          {activeRequirements.map(([key]) => {
            const Icon = REQUIREMENT_ICON[key] ?? ShieldCheck;
            return <Icon key={key} className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />;
          })}
        </div>
      )}

      <a href="/register?role=SUPPORT_WORKER" className="sf-shiftboard-card-btn">
        View details
      </a>
    </div>
  );
}
