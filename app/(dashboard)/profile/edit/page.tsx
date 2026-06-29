'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { upsertProfile } from '@/lib/api/profile';
import { getStepsForRole, type StepConfig } from '@/lib/registration';
import { STEP_COMPONENTS } from '@/lib/registration/stepComponents';
import { ROLE_LABELS } from '@/lib/registration/stepConfig';
import { UserRole } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { sanitiseDates } from '@/lib/utils';

// ─── Tab panel ────────────────────────────────────────────────────────────────

interface TabPanelProps {
  role: UserRole;
  step: StepConfig;
  stepIndex: number;
  defaultValues: Record<string, unknown>;
}

function TabPanel({ role, step, stepIndex, defaultValues }: TabPanelProps) {
  const StepComp = STEP_COMPONENTS[role]?.[stepIndex];

  const form = useForm({
    resolver:      zodResolver(step.schema),
    defaultValues,
    mode:          'onBlur',
  });

  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);
  const [saved,  setSaved]  = useState(false);

  async function onSubmit(data: FieldValues) {
    setSaving(true); setErr(null); setSaved(false);
    try {
      await upsertProfile(role, sanitiseDates(data as Record<string, unknown>));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!StepComp) return null;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`bi ${step.icon}`} style={{ color: 'var(--clr-primary)', fontSize: 16 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--clr-text)' }}>{step.title}</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-muted)' }}>{step.description}</p>
          </div>
        </div>

        <StepComp />

        {err && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C62828', marginTop: 20 }}>
            {err}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-shiftify"
            style={{ height: 40, padding: '0 24px', fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving && (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            )}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-check-circle-fill" /> Saved
            </span>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileEditPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, activeRole } = useAuth();

  const [defaultValues, setDefaultValues] = useState<Record<string, unknown>>({});
  const [loading,       setLoading]       = useState(true);

  const role  = activeRole as UserRole | null;
  const steps = role ? getStepsForRole(role) : [];

  // Use step index as tab id
  const activeTab = searchParams.get('tab') ?? '0';
  const activeIndex = parseInt(activeTab, 10);
  const activeStep  = steps[activeIndex] ?? steps[0];

  useEffect(() => {
    if (!user) return;
    api.get<{ user: Record<string, unknown> }>('/users/me')
      .then(res => {
        const u = res.user as Record<string, unknown>;
        setDefaultValues({
          ...u,
          ...((u.workerProfile      as Record<string, unknown>) ?? {}),
          ...((u.providerProfile    as Record<string, unknown>) ?? {}),
          ...((u.coordinatorProfile as Record<string, unknown>) ?? {}),
          ...((u.participantProfile as Record<string, unknown>) ?? {}),
          ...((u.planManagerProfile as Record<string, unknown>) ?? {}),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  function setTab(index: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', String(index));
    router.push(`?${p.toString()}`, { scroll: false });
  }

  if (!user || !role) return null;

  const roleLabel = ROLE_LABELS[role] ?? role;

  if (loading) {
    return (
      <>
        <PageHeader title="Edit Profile" description={`Update your ${roleLabel} profile information.`} />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Profile" description={`Update your ${roleLabel} profile information.`} />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 48px' }}>

        <div style={{ marginBottom: 20 }}>
          <Link href="/profile" style={{ fontSize: 13, color: 'var(--clr-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-arrow-left" /> Back to My Profile
          </Link>
        </div>

        {/* Tab bar — one tab per step, generated from role config */}
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', borderBottom: '1.5px solid #e5e7eb', marginBottom: 24 }}>
          {steps.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTab(i)}
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: activeIndex === i ? 700 : 500,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                borderBottom: activeIndex === i ? '2.5px solid var(--clr-primary)' : '2.5px solid transparent',
                color: activeIndex === i ? 'var(--clr-primary)' : '#64748b',
                marginBottom: -1.5,
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Active tab panel */}
        {activeStep && (
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '28px 28px' }}>
            <TabPanel
              key={`${role}-${activeIndex}`}
              role={role}
              step={activeStep}
              stepIndex={activeIndex}
              defaultValues={defaultValues}
            />
          </div>
        )}
      </div>
    </>
  );
}
