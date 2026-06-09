'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { getProfileProgress, upsertProfile, type ProfileProgress } from '@/lib/api/profile';
import { TOTAL_STEPS, WIZARD_START_STEP, ROLE_LABELS } from '@/lib/registration/stepConfig';
import { api } from '@/lib/api';
import { UserStatus } from '@/lib/types';

export default function DashboardProfileSetupStepPage() {
  const router = useRouter();
  const params = useParams();
  const step   = Number(params.step);

  const { user, activeRole, isAuth } = useAuth();
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [progress, setProgress] = useState<ProfileProgress | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!isAuth || !activeRole) return;

    getProfileProgress()
      .then((prog) => {
        setProgress(prog);

        if (prog.isComplete) {
          router.replace('/dashboard');
          return;
        }

        const totalSteps = TOTAL_STEPS[activeRole] ?? prog.totalSteps;

        if (step < WIZARD_START_STEP) {
          router.replace(`/dashboard/profile-setup/${WIZARD_START_STEP}`);
          return;
        }
        if (step > prog.profileStep + 1) {
          router.replace(`/dashboard/profile-setup/${prog.profileStep + 1}`);
          return;
        }
        if (step > totalSteps) {
          router.replace('/dashboard');
        }
      })
      .catch(() => setProgress(null));
  }, [isAuth, activeRole, user, step, router]);

  async function handleNext() {
    if (!activeRole) return;
    setSaving(true);
    setError(null);
    try {
      await upsertProfile(activeRole, { step });
      const totalSteps = TOTAL_STEPS[activeRole] ?? progress?.totalSteps ?? 4;
      if (step < totalSteps) {
        router.push(`/dashboard/profile-setup/${step + 1}`);
        return;
      }
      if (activeRole === 'PARTICIPANT') {
        if (user?.status !== UserStatus.ACTIVE) {
          await api.post('/subscriptions/activate', {});
          updateProfile({ status: UserStatus.ACTIVE } as never);
        }
        router.replace('/dashboard');
      } else {
        if (user?.status === UserStatus.PENDING) {
          router.replace('/dashboard/profile-setup/plan');
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save step. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const totalSteps = activeRole ? (TOTAL_STEPS[activeRole] ?? progress?.totalSteps ?? 4) : 4;
  const roleLabel  = activeRole ? (ROLE_LABELS[activeRole] ?? activeRole) : '';
  const pct        = Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginBottom: 4 }}>
          {roleLabel} Profile Setup
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 0 }}>
          Step {step} of {totalSteps}
        </h1>
      </div>

      <div style={{ background: 'var(--clr-border)', borderRadius: 6, height: 8, marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--clr-primary)', borderRadius: 6, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--clr-muted)', marginBottom: 32 }}>
        {pct}% complete &mdash; {roleLabel} profile
      </div>

      <div className="card-shiftify" style={{ padding: '40px 32px', textAlign: 'center', marginBottom: 28 }}>
        <i className="bi bi-layout-text-window-reverse" style={{ fontSize: 36, color: 'var(--clr-muted)', marginBottom: 14, display: 'block' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8 }}>
          Step {step} &mdash; {roleLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--clr-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          Form fields for step {step} are coming in the next session.
          Click Continue to advance your progress.
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {step > WIZARD_START_STEP && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/profile-setup/${step - 1}`)}
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
    </div>
  );
}
