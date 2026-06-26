'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { getProfileProgress, upsertProfile, type ProfileProgress } from '@/lib/api/profile';
import { sanitiseDates } from '@/lib/utils';
import { TOTAL_STEPS, WIZARD_START_STEP, ROLE_LABELS } from '@/lib/registration/stepConfig';
import { getStepsForRole } from '@/lib/registration';
import { STEP_COMPONENTS } from '@/lib/registration/stepComponents';
import { api } from '@/lib/api';
import { UserRole, UserStatus } from '@/lib/types';

// ─── Step renderer — FormProvider + zodResolver + real step component ─────────

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

export default function SetupProfileStepPage() {
  const router   = useRouter();
  const params   = useParams();
  const step     = Number(params.step);

  const { user, activeRole, isAuth, silentInit } = useAuth();
  const updateProfile  = useAuthStore(s => s.updateProfile);
  const phoneVerified  = useAuthStore(s => s.phoneVerified);
  const initialized    = useAuthStore(s => s.initialized);

  const [progress,     setProgress]     = useState<ProfileProgress | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [redirecting,  setRedirecting]  = useState(false);
  const [profileData,  setProfileData]  = useState<Record<string, unknown>>({});

  // Ensure auth state is populated when arriving directly on this URL
  useEffect(() => {
    silentInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full /users/me (including role profiles) for form prefill.
  // The auth store only holds basic user fields — profile sub-objects live here.
  useEffect(() => {
    if (!isAuth) return;
    api.get<Record<string, unknown>>('/users/me')
      .then(data => setProfileData(data as Record<string, unknown>))
      .catch(() => {});
  }, [isAuth]);

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
        const nextStep = Math.max(prog.profileStep + 1, WIZARD_START_STEP);
        if (step > nextStep) {
          router.replace(`/setup/profile/${nextStep}`);
          return;
        }
        // Landing on the wizard entry point (e.g. fresh login) but progress is
        // further along — resume where the user left off instead of redoing steps.
        if (step === WIZARD_START_STEP && nextStep > WIZARD_START_STEP) {
          router.replace(`/setup/profile/${nextStep}`);
          return;
        }
        if (step > totalSteps) {
          router.replace('/dashboard');
        }
      })
      .catch(() => setProgress(null));
  }, [isAuth, activeRole, user, step, router, phoneVerified, initialized]);

  async function handleNext(formData: Record<string, unknown> = {}) {
    if (!activeRole) return;
    setError(null);
    try {
      const payload = sanitiseDates({ ...formData, profileStep: step });
      await upsertProfile(activeRole, payload);
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

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {activeRole && (
          <StepRenderer
            key={step}
            role={activeRole as UserRole}
            compIndex={step - WIZARD_START_STEP}
            defaultValues={
              // Merge top-level user fields + role profile for prefill.
              // profileData comes from GET /users/me which includes profile sub-objects.
              {
                ...(profileData ?? {}),
                ...((profileData?.workerProfile        as Record<string, unknown>) ?? {}),
                ...((profileData?.providerProfile      as Record<string, unknown>) ?? {}),
                ...((profileData?.coordinatorProfile   as Record<string, unknown>) ?? {}),
                ...((profileData?.participantProfile   as Record<string, unknown>) ?? {}),
                ...((profileData?.planManagerProfile   as Record<string, unknown>) ?? {}),
              }
            }
            onSave={handleNext}
            onBack={() => step > WIZARD_START_STEP ? router.push(`/setup/profile/${step - 1}`) : router.back()}
            isFinalStep={step >= totalSteps}
          />
        )}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--clr-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--clr-muted)', textDecoration: 'none' }}>
            Skip for now &mdash; complete later from dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
