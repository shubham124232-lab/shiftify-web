'use client';
// Core wizard engine. Renders: header → step indicator → current step form → navigation.
// Handles: per-step validation, backend save, draft persistence, back/next logic.

import { useState, useCallback, useEffect } from 'react';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver }           from '@hookform/resolvers/zod';
import { useRouter }             from 'next/navigation';
import Link                      from 'next/link';

import { StepIndicator }         from './StepIndicator';
import { WizardNavigation }      from './WizardNavigation';
import { useRegistrationStore }  from '@/lib/store/registration.store';
import { upsertProfile }         from '@/lib/api/profile';
import type { StepConfig }       from '@/lib/registration/types';
import type { UserRole }         from '@/lib/types';

interface Props {
  role:   UserRole;
  steps:  StepConfig[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stepComponents: React.ComponentType<any>[];
}

const ROLE_LABELS: Record<string, string> = {
  SUPPORT_WORKER: 'Support Worker',
  PROVIDER:       'Provider',
  COORDINATOR:    'Support Coordinator',
  PARTICIPANT:    'Participant',
  PLAN_MANAGER:   'Plan Manager',
};

export function WizardShell({ role, steps, stepComponents }: Props) {
  const router = useRouter();
  const store  = useRegistrationStore();
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const currentStep = store.currentStep;
  const config      = steps[currentStep];
  const StepComp    = stepComponents[currentStep];

  // Initialise store role/total on mount
  useEffect(() => {
    if (!store.role || store.role !== role) {
      store.setRole(role, steps.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const form = useForm({
    resolver:      zodResolver(config.schema),
    defaultValues: store.formData as Record<string, unknown>,
    mode:          'onBlur',
  });

  // When step changes, reset the form with current stored data + new resolver
  useEffect(() => {
    form.reset(store.formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleSubmit = useCallback(async (data: FieldValues) => {
    setSaving(true);
    setApiError(null);

    // Merge into store
    store.mergeFormData(data as Record<string, unknown>);

    try {
      // Save this step's data to backend — always send profileStep
      await upsertProfile(role, { ...store.formData, ...(data as Record<string, unknown>), profileStep: currentStep + 1 });

      store.markStepSaved(currentStep);
      store.setLastSaved();

      if (config.isFinal) {
        // Clear draft + redirect to dashboard
        store.resetWizard();
        router.replace('/dashboard');
      } else {
        store.setStep(currentStep + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }, [currentStep, config, store, router]);

  function handleBack() {
    if (currentStep > 0) {
      // Persist current draft without validating
      const current = form.getValues() as Record<string, unknown>;
      store.mergeFormData(current);
      store.setStep(currentStep - 1);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--clr-bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ─── Top bar ─────────────────────────────────────────────────── */}
      <header style={{
        background: '#fff', borderBottom: '1px solid var(--clr-border)',
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 99,
        gap: 16,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: 'var(--clr-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-heart-pulse-fill" style={{ color: '#fff', fontSize: 14 }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
            color: 'var(--clr-primary)', letterSpacing: -0.5,
          }}>Shiftify</span>
        </Link>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: 'var(--clr-muted)', fontWeight: 500 }}>
          {ROLE_LABELS[role] ?? role} Profile Setup
        </span>

        {store.isDirty && (
          <span style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-cloud-upload" />
            Unsaved
          </span>
        )}
      </header>

      {/* ─── Main content ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 60px' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>

          {/* Step indicator */}
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            savedSteps={store.savedSteps}
          />

          {/* Step card */}
          <div style={{
            background: '#fff', border: '1px solid var(--clr-border)',
            borderRadius: 16, padding: '28px 28px 24px',
            marginTop: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {/* Step header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(79,70,229,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${config.icon}`} style={{ color: 'var(--clr-primary)', fontSize: 20 }} />
              </div>
              <div>
                <h2 style={{
                  margin: 0, fontSize: 18, fontWeight: 800,
                  fontFamily: 'var(--font-display)', color: 'var(--clr-text)', letterSpacing: -0.3,
                }}>
                  {config.title}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--clr-muted)' }}>
                  {config.description}
                </p>
              </div>
            </div>

            {/* API error */}
            {apiError && (
              <div style={{
                background: '#FFF0F0', border: '1px solid #FFCDD2',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#C62828',
              }}>
                <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />
                {apiError}
              </div>
            )}

            {/* Step form — wrapped in FormProvider so step components can call useFormContext() */}
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                noValidate
              >
                {StepComp && <StepComp />}

                <WizardNavigation
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  isFinal={!!config.isFinal}
                  saving={saving}
                  onBack={handleBack}
                  onNext={() => {}} // submit handled by form
                  lastSavedAt={store.lastSavedAt}
                />
              </form>
            </FormProvider>
          </div>

          {/* Skip link */}
          {!config.isFinal && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--clr-muted)', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => router.replace('/dashboard')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--clr-muted)', textDecoration: 'underline', fontSize: 12,
                }}
              >
                Skip for now — complete later from your profile
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
