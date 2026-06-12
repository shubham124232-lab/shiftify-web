'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { getProfileProgress, upsertProfile, type ProfileProgress } from '@/lib/api/profile';
import { TOTAL_STEPS, WIZARD_START_STEP, ROLE_LABELS } from '@/lib/registration/stepConfig';
import { getStepsForRole } from '@/lib/registration';
import { STEP_COMPONENTS } from '@/lib/registration/stepComponents';
import { api } from '@/lib/api';
import { UserRole, UserStatus } from '@/lib/types';

// ─── Step renderer ─────────────────────────────────────────────────────────────

interface StepRendererProps {
  role: UserRole;
  compIndex: number;
  defaultValues: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  isFinalStep: boolean;
}

function StepRenderer({ role, compIndex, defaultValues, onSave, onBack, isFinalStep }: StepRendererProps) {
  const allSteps = getStepsForRole(role);
  const config   = allSteps[compIndex];
  const StepComp = STEP_COMPONENTS[role]?.[compIndex];

  const form = useForm({
    resolver:      config ? zodResolver(config.schema) : undefined,
    defaultValues,
    mode:          'onBlur',
  });

  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState<string | null>(null);

  async function onSubmit(data: FieldValues) {
    setSaving(true); setApiErr(null);
    try { await onSave(data as Record<string, unknown>); }
    catch (err) { setApiErr(err instanceof Error ? err.message : 'Failed to save. Please try again.'); setSaving(false); }
  }

  if (!config || !StepComp) return null;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`bi ${config.icon}`} style={{ color: 'var(--clr-primary)', fontSize: 18 }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--clr-text)', letterSpacing: -0.3 }}>{config.title}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-muted)' }}>{config.description}</p>
          </div>
        </div>

        {apiErr && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#C62828' }}>
            <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />{apiErr}
          </div>
        )}

        <StepComp />

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="button" onClick={onBack}
            style={{ height: 42, padding: '0 18px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-arrow-left" />Back
          </button>
          <button type="submit" disabled={saving} className="btn-shiftify"
            style={{ flex: 1, height: 42, fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
            {isFinalStep ? 'Complete Setup' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardProfileSetupStepPage() {
  const router = useRouter();
  const params = useParams();
  const step   = Number(params.step);

  const { user, activeRole, isAuth } = useAuth();
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [progress, setProgress] = useState<ProfileProgress | null>(null);
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

  async function handleNext(formData: Record<string, unknown> = {}) {
    if (!activeRole) return;
    setError(null);
    try {
      const DATE_FIELDS = ['dob', 'visaExpiry'];
      const payload: Record<string, unknown> = { ...formData, profileStep: step };
      for (const field of DATE_FIELDS) {
        const val = payload[field];
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          payload[field] = new Date(val + 'T00:00:00.000Z').toISOString();
        }
      }
      await upsertProfile(activeRole, payload);
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

      <div className="card-shiftify" style={{ padding: '32px' }}>
        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {activeRole && (
          <StepRenderer
            key={step}
            role={activeRole as UserRole}
            compIndex={step - WIZARD_START_STEP}
            defaultValues={
              {
                ...(user as unknown as Record<string, unknown> ?? {}),
                ...((user as unknown as Record<string, unknown>)?.workerProfile as Record<string, unknown> ?? {}),
                ...((user as unknown as Record<string, unknown>)?.providerProfile as Record<string, unknown> ?? {}),
                ...((user as unknown as Record<string, unknown>)?.coordinatorProfile as Record<string, unknown> ?? {}),
                ...((user as unknown as Record<string, unknown>)?.participantProfile as Record<string, unknown> ?? {}),
                ...((user as unknown as Record<string, unknown>)?.planManagerProfile as Record<string, unknown> ?? {}),
              }
            }
            onSave={handleNext}
            onBack={() => step > WIZARD_START_STEP ? router.push(`/dashboard/profile-setup/${step - 1}`) : router.back()}
            isFinalStep={step >= totalSteps}
          />
        )}
            </div>
    </div>
  );
}
