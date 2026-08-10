'use client';
// SetupBanner -- shown at top of every dashboard home when setup is incomplete.
// Reads marketplace.missing + profileCompletion from GET /users/me.
// Falls back to a minimal "complete your profile" nudge if the API is unreachable.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore, selectProfileStep } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { TOTAL_STEPS } from '@/lib/registration/stepConfig';
import { cn } from '@/lib/utils';

interface MarketplaceCheck {
  canPost: boolean; canBrowse: boolean; canApply: boolean; missing: string[];
}

export function SetupBanner() {
  const { user, activeRole } = useAuth();
  const profileStep = useAuthStore(selectProfileStep);
  // Participants are free -- never show a subscription lock banner for them.
  const isParticipant = activeRole === 'PARTICIPANT';
  const [check,            setCheck]           = useState<MarketplaceCheck | null>(null);
  const [completion,       setCompletion]       = useState<number | null>(null);
  const [completionMissing,setCompletionMissing]= useState<string[]>([]);
  const [apiError,         setApiError]         = useState(false);
  const [dismissed,        setDismissed]        = useState(false);

  useEffect(() => {
    if (!user) return;
    setApiError(false);
    api.get<{ user: unknown; marketplace: MarketplaceCheck; profileCompletion: number; completionMissing: string[] }>('/users/me')
      .then(res => {
        setCheck(res.marketplace ?? null);
        setCompletion(typeof res.profileCompletion === 'number' ? res.profileCompletion : null);
        setCompletionMissing(Array.isArray(res.completionMissing) ? res.completionMissing : []);
      })
      .catch(() => setApiError(true));
  }, [user]);

  if (dismissed) return null;

  const totalWizardSteps = activeRole ? (TOTAL_STEPS[activeRole] ?? 0) : 0;
  const isManaged  = (user as unknown as Record<string, unknown>)?.accountType === 'MANAGED';
  const hasMissing = completionMissing.length > 0 || (check?.missing?.length ?? 0) > 0;
  const pct        = completion ?? 0;
  const userStatus = (user as unknown as Record<string, unknown>)?.status as string | undefined;

  // PENDING + profile not yet done → guide them to complete it
  const showPendingProfileBanner =
    !isManaged && !isParticipant && !!activeRole &&
    userStatus === 'PENDING' &&
    totalWizardSteps > 0 && profileStep < totalWizardSteps;

  // PENDING + profile done → needs subscription
  const showPendingSubscriptionBanner =
    !isParticipant &&
    userStatus === 'PENDING' &&
    !showPendingProfileBanner;

  // ACTIVE users with incomplete wizard (re-entry from dashboard)
  const showWizardBanner =
    !isManaged && !isParticipant && !!activeRole &&
    userStatus === 'ACTIVE' &&
    profileStep >= 2 && profileStep < totalWizardSteps;

  // Nothing to show
  if (!apiError && !showPendingProfileBanner && !showPendingSubscriptionBanner && !hasMissing && pct >= 100 && !showWizardBanner && completion !== null) return null;

  // API unreachable — minimal nudge (wizard banners don't need API data)
  if (apiError && !showPendingProfileBanner && !showWizardBanner) {
    return (
      <div className="relative mb-5 flex items-center gap-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-sky-50/50 to-white px-5 py-3.5 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-200/60 text-sky-700 ring-1 ring-inset ring-sky-300/40">
          <i className="bi bi-person-fill-gear text-[17px]" />
        </span>
        <p className="flex-1 text-[13px] font-medium text-sky-900">
          Make sure your profile is complete to unlock all features.
        </p>
        <Link
          href="/profile"
          className="shrink-0 whitespace-nowrap rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-700"
        >
          View Profile
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
        >
          <i className="bi bi-x-lg text-sm" />
        </button>
      </div>
    );
  }

  const amber = showPendingSubscriptionBanner;

  return (
    <div
      className={cn(
        'relative mb-5 flex items-start gap-4 rounded-2xl border p-4 shadow-sm sm:p-5',
        amber
          ? 'border-amber-300/50 bg-gradient-to-br from-amber-50 via-amber-50/40 to-white'
          : 'border-orange-300/50 bg-gradient-to-br from-orange-50 via-orange-50/40 to-white',
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset',
          amber
            ? 'bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-700 ring-amber-300/40'
            : 'bg-gradient-to-br from-orange-100 to-orange-200/60 text-orange-700 ring-orange-300/40',
        )}
      >
        <i className={cn('bi text-[18px]', amber ? 'bi-lock-fill' : 'bi-person-fill-exclamation')} />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">

        {/* PENDING — profile incomplete */}
        {showPendingProfileBanner && (
          <>
            <p className="mb-1.5 text-[14px] font-bold tracking-tight text-slate-900">
              Complete your profile
              <span className="ml-1.5 font-medium text-slate-400">
                ({Math.max(0, profileStep - 2)} of {totalWizardSteps - 2} steps done)
              </span>
            </p>
            <div className="mb-2.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-[width] duration-500"
                style={{ width: `${Math.round((profileStep / totalWizardSteps) * 100)}%` }}
              />
            </div>
            <p className="mb-3 text-[13px] leading-relaxed text-slate-500">
              Finish your profile to unlock marketplace features and activate your plan.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:shadow-md hover:shadow-orange-500/30"
            >
              Complete Profile <i className="bi bi-arrow-right" />
            </Link>
          </>
        )}

        {/* PENDING — profile done, needs subscription */}
        {showPendingSubscriptionBanner && (
          <>
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
          </>
        )}

        {!showPendingProfileBanner && !showPendingSubscriptionBanner && (hasMissing || pct < 100) && !showWizardBanner && (
          <>
            <p className="mb-1.5 text-[14px] font-bold tracking-tight text-slate-900">
              Profile {pct}% complete <span className="font-medium text-slate-400">— finish to unlock all features</span>
            </p>
            {/* Progress bar */}
            <div className="mb-2.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Missing fields from completionMissing */}
            {completionMissing.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {completionMissing.slice(0, 5).map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-orange-100/70 px-2.5 py-1 text-[11px] font-medium text-orange-800 ring-1 ring-inset ring-orange-200/60"
                  >
                    {m}
                  </span>
                ))}
                {completionMissing.length > 5 && (
                  <span className="inline-flex items-center px-1 py-1 text-[11px] font-medium text-orange-700/70">
                    +{completionMissing.length - 5} more
                  </span>
                )}
              </div>
            )}
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:shadow-md hover:shadow-orange-500/30"
            >
              Complete Profile <i className="bi bi-arrow-right" />
            </Link>
          </>
        )}

        {showWizardBanner && (
          <>
            <p className="mb-1 text-[14px] font-bold tracking-tight text-slate-900">
              Your profile is incomplete
              <span className="ml-1.5 font-medium text-slate-400">
                ({profileStep - 2} of {totalWizardSteps - 2} steps done)
              </span>
            </p>
            <p className="mb-3 text-[13px] leading-relaxed text-slate-500">
              Complete your profile to unlock full marketplace access.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:shadow-md hover:shadow-orange-500/30"
            >
              Continue Setup <i className="bi bi-arrow-right" />
            </Link>
          </>
        )}
      </div>

      {/* Dismiss */}
      {!showPendingSubscriptionBanner && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
        >
          <i className="bi bi-x-lg text-sm" />
        </button>
      )}
    </div>
  );
}
