'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { getProfileProgress, upsertProfile, type ProfileProgress } from '@/lib/api/profile';
import { TOTAL_STEPS, WIZARD_START_STEP, ROLE_LABELS } from '@/lib/registration/stepConfig';
import { api } from '@/lib/api';
import { UserStatus } from '@/lib/types';

export default function SetupProfileStepPage() {
  const router   = useRouter();
  const params   = useParams();
  const step     = Number(params.step);

  const { user, activeRole, isAuth, silentInit } = useAuth();
  const updateProfile  = useAuthStore(s => s.updateProfile);
  const phoneVerified  = useAuthStore(s => s.phoneVerified);
  const initialized    = useAuthStore(s => s.initialized);

  const [progress,    setProgress]    = useState<ProfileProgress | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Ensure auth state is populated when arriving directly on this URL
  useEffect(() => {
    silentInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuth || !activeRole) return;
    if (!initialized) return; // wait for /users/me so phoneVerified is accurate
    // Only block unverified PENDING users — verified PENDING users belong here
    if (!user || (!phoneVerified && user.status === 'PENDING')) {
      router.replace('/setup/verify');
      return;
    }

    getProfileProgress()
      .then((prog) => {
        setProgress(prog);

        if (prog.isComplete) {
          setRedirecting(true);
          router.replace('/dashboard');
          return;
        }

        const totalSteps = TOTAL_STEPS[activeRole] ?? prog.totalSteps;

        if (step < WIZARD_START_STEP) {
          router.replace(`/setup/profile/${WIZARD_START_STEP}`);
          return;
        }
        if (step > prog.profileStep + 1) {
          router.replace(`/setup/profile/${prog.profileStep + 1}`);
          return;
        }
        if (step > totalSteps) {
          router.replace('/dashboard');
        }
      })
      .catch(() => setProgress(null));
  }, [isAuth, activeRole, user, step, router, phoneVerified, initialized]);

  async function handleNext() {
    if (!activeRole) return;
    setSaving(true);
    setError(null);
    try {
      await upsertProfile(activeRole, { step });
      const totalSteps = TOTAL_STEPS[activeRole] ?? progress?.totalSteps ?? 4;
      if (step < totalSteps) {
        router.push(`/setup/profile/${step + 1}`);
        return;
      }
      if (activeRole === 'PARTICIPANT') {
        await api.post('/subscriptions/activate', {});
        updateProfile({ status: UserStatus.ACTIVE } as never);
        router.replace('/dashboard');
      } else {
        router.replace('/setup/plan');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save step. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!isAuth || redirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg)' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const totalSteps = activeRole ? (TOTAL_STEPS[activeRole] ?? progress?.totalSteps ?? 4) : 4;
  const roleLabel  = activeRole ? (ROLE_LABELS[activeRole] ?? activeRole) : '';
  const pct        = Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-heart-pulse-fill" style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-primary)', letterSpacing: -0.5 }}>Shiftify</span>
      </Link>

      <div className="card-shiftify" style={{ maxWidth: 640, width: '100%', padding: '36px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginBottom: 6, fontWeight: 500 }}>
            {roleLabel} Profile Setup
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 16 }}>
            Step {step} of {totalSteps}
          </h1>
          <div style={{ height: 6, background: 'var(--clr-border)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--clr-primary)', borderRadius: 4, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 6 }}>{pct}% complete</div>
        </div>

        <div style={{ background: 'var(--clr-bg)', border: '1.5px dashed var(--clr-border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', marginBottom: 28 }}>
          <i className="bi bi-layout-text-window-reverse" style={{ fontSize: 32, color: 'var(--clr-muted)', marginBottom: 12, display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 6 }}>
            Step {step} &mdash; {roleLabel}
          </div>
          <div style={{ fontSize: 13, color: 'var(--clr-muted)', lineHeight: 1.5 }}>
            Form fields for step {step} are coming in the next session.
            Click Continue to advance your progress.
          </div>
        </div>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {step > WIZARD_START_STEP && (
            <button
              type="button"
              onClick={() => router.push(`/setup/profile/${step - 1}`)}
              style={{ height: 46, padding: '0 20px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: '1.5px solid var(--clr-border)', background: '#fff', color: 'var(--clr-text)', cursor: 'pointer', flexShrink: 0 }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="btn-shiftify"
            style={{ flex: 1, height: 46, fontSize: 15, fontWeight: 700, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : step >= totalSteps ? 'Finish Setup' : 'Continue'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--clr-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--clr-muted)', textDecoration: 'none' }}>
            Skip for now &mdash; complete later from dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
