'use client';
// SetupBanner -- shown at top of every dashboard home while the account is PENDING (subscription not active).
// Profile-completion prompts were removed from the dashboards; only the subscription-required notice remains.

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function SetupBanner() {
  const { user, activeRole } = useAuth();
  // Participants are free -- never show a subscription lock banner for them.
  if (activeRole === 'PARTICIPANT') return null;
  const userStatus = (user as unknown as Record<string, unknown>)?.status as string | undefined;
  if (userStatus !== 'PENDING') return null;

  return (
    <div className="relative mb-5 flex items-start gap-4 rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-50 via-amber-50/40 to-white p-4 shadow-sm sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-700 shadow-sm ring-1 ring-inset ring-amber-300/40">
        <i className="bi bi-lock-fill text-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[14px] font-bold tracking-tight text-slate-900">
          Subscription required — jobs are locked
        </p>
        <p className="mb-3 text-[13px] leading-relaxed text-slate-500">
          You cannot post or apply to jobs until your subscription is active.
        </p>
        <Link
          href="/subscription"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/25 transition hover:shadow-md hover:shadow-amber-500/30"
        >
          Activate Plan <i className="bi bi-arrow-right" />
        </Link>
      </div>
    </div>
  );
}
