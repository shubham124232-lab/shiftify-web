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

interface MarketplaceCheck {
  canPost: boolean; canBrowse: boolean; canApply: boolean; missing: string[];
}

export function SetupBanner() {
  const { user, activeRole } = useAuth();
  const profileStep = useAuthStore(selectProfileStep);
  // Participants are free -- never show a subscription lock banner for them.
  const isParticipant = activeRole === 'PARTICIPANT';
  const [check,      setCheck]      = useState<MarketplaceCheck | null>(null);
  const [completion, setCompletion] = useState<number | null>(null);
  const [apiError,   setApiError]   = useState(false);
  const [dismissed,  setDismissed]  = useState(false);

  useEffect(() => {
    if (!user) return;
    setApiError(false);
    api.get<{ user: unknown; marketplace: MarketplaceCheck; profileCompletion: number }>('/users/me')
      .then(res => {
        setCheck(res.marketplace ?? null);
        setCompletion(typeof res.profileCompletion === 'number' ? res.profileCompletion : null);
      })
      .catch(() => setApiError(true));
  }, [user]);

  if (dismissed) return null;

  // Participants are free -- pending status means they haven't activated yet (auto happens),
  // not that they need a paid subscription.
  const isPending  = !isParticipant && (user as unknown as Record<string, unknown>)?.status === 'PENDING';
  const hasMissing = (check?.missing?.length ?? 0) > 0;
  const pct        = completion ?? 0;

  // Profile wizard incomplete banner (shown when profileStep < totalSteps, after account creation)
  const totalWizardSteps = activeRole ? (TOTAL_STEPS[activeRole] ?? 0) : 0;
  const isManaged = (user as unknown as Record<string, unknown>)?.accountType === 'MANAGED';
  const showWizardBanner =
    !isManaged &&
    !isParticipant &&
    activeRole &&
    user?.status === 'ACTIVE' &&
    profileStep >= 2 &&
    profileStep < totalWizardSteps;

  // API reachable + profile fully complete + not pending -> nothing to show
  if (!apiError && !isPending && !hasMissing && pct >= 100 && !showWizardBanner) return null;

  // API unreachable -- show a minimal nudge so the banner is never invisible
  // (wizard banner doesn't need API data — falls through to the main return)
  if (apiError && !showWizardBanner) {
    return (
      <div style={{
        background: '#F0F9FF', border: '1px solid #BAE6FD',
        borderRadius: 12, padding: '14px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <i className="bi bi-person-fill-gear" style={{ fontSize: 20, color: '#0284c7', flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 13, color: '#0369a1' }}>
          Make sure your profile is complete to unlock all features.
        </div>
        <Link href="/profile" style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          View Profile
        </Link>
        <button type="button" onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 4, flexShrink: 0 }}>
          <i className="bi bi-x-lg" />
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: isPending ? '#FFF9C4' : '#fff7ed',
      border: `1px solid ${isPending ? '#F59E0B' : '#fb923c'}`,
      borderRadius: 12, padding: '16px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative',
    }}>
      {/* Icon */}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: isPending ? 'rgba(245,158,11,0.12)' : 'rgba(251,146,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`bi ${isPending ? 'bi-lock-fill' : 'bi-person-fill-exclamation'}`}
          style={{ fontSize: 18, color: isPending ? '#d97706' : '#ea580c' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isPending && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
              Subscription required -- jobs are locked
            </div>
            <div style={{ fontSize: 13, color: '#78350f', marginBottom: 10, lineHeight: 1.5 }}>
              You cannot post or apply to jobs until your subscription is active.
            </div>
            <Link href="/subscription" className="btn-shiftify" style={{ display: 'inline-flex', height: 34, padding: '0 16px', fontSize: 13, fontWeight: 700, alignItems: 'center', textDecoration: 'none', borderRadius: 8 }}>
              Activate Plan
            </Link>
          </>
        )}

        {!isPending && hasMissing && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7c2d12' }}>
                Profile {pct}% complete -- finish to unlock all features
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 5, background: '#fed7aa', borderRadius: 4, marginBottom: 10, maxWidth: 320 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#ea580c', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            {/* Missing items */}
            <ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {check!.missing.slice(0, 4).map((m, i) => (
                <li key={i} style={{ fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-circle-fill" style={{ fontSize: 5, color: '#f97316' }} />
                  {m}
                </li>
              ))}
              {check!.missing.length > 4 && (
                <li style={{ fontSize: 12, color: '#92400e' }}>+{check!.missing.length - 4} more items</li>
              )}
            </ul>
            <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>
              Complete Profile Steps <i className="bi bi-arrow-right" />
            </Link>
          </>
        )}

        {!isPending && !hasMissing && pct < 100 && !showWizardBanner && (
          <div style={{ fontSize: 13, color: '#78350f' }}>
            Your profile is almost complete.{' '}
            <Link href="/profile" style={{ fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>
              View profile
            </Link>
          </div>
        )}

        {showWizardBanner && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7c2d12', marginBottom: 4 }}>
              Your profile is incomplete ({profileStep - 2} of {totalWizardSteps - 2} steps done)
            </div>
            <div style={{ fontSize: 13, color: '#92400e', marginBottom: 10, lineHeight: 1.5 }}>
              Complete your profile to unlock full marketplace access.
            </div>
            <Link
              href={`/dashboard/profile-setup/${profileStep + 1}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}
            >
              Continue Setup <i className="bi bi-arrow-right" />
            </Link>
          </>
        )}
      </div>

      {/* Dismiss */}
      {!isPending && (
        <button type="button" onClick={() => setDismissed(true)}
          style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 4 }}>
          <i className="bi bi-x-lg" />
        </button>
      )}
    </div>
  );
}
