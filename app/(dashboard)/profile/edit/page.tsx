'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { upsertProfile } from '@/lib/api/profile';
import { getStepsForRole } from '@/lib/registration';
import { STEP_COMPONENTS } from '@/lib/registration/stepComponents';
import { ROLE_LABELS } from '@/lib/registration/stepConfig';
import { UserRole } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';

// ─── Tab group definitions ────────────────────────────────────────────────────

interface TabGroup {
  id: string;
  label: string;
  compIndices: number[];
}

const TAB_GROUPS: Record<UserRole, TabGroup[]> = {
  [UserRole.PARTICIPANT]: [
    { id: 'personal',     label: 'Personal',               compIndices: [0] },
    { id: 'ndis',         label: 'NDIS',                   compIndices: [1] },
    { id: 'support',      label: 'Support Needs',          compIndices: [2] },
    { id: 'emergency',    label: 'Emergency Contact',      compIndices: [3] },
    { id: 'declaration',  label: 'Declaration',            compIndices: [4] },
  ],
  [UserRole.SUPPORT_WORKER]: [
    { id: 'identity',     label: 'Identity',               compIndices: [0] },
    { id: 'righttowork',  label: 'Right to Work',          compIndices: [1] },
    { id: 'worktype',     label: 'Work Type',              compIndices: [2] },
    { id: 'services',     label: 'Services',               compIndices: [3] },
    { id: 'availability', label: 'Availability',           compIndices: [4] },
    { id: 'areas',        label: 'Service Areas',          compIndices: [5] },
    { id: 'financials',   label: 'Financials',             compIndices: [6] },
    { id: 'docs',         label: 'Documents & Compliance', compIndices: [7, 8] },
  ],
  [UserRole.PROVIDER]: [
    { id: 'business',    label: 'Business',             compIndices: [0] },       // Business Identity
    { id: 'contacts',    label: 'Contacts',             compIndices: [1] },       // Key Contacts
    { id: 'compliance',  label: 'Compliance',           compIndices: [2] },       // Compliance & Legal
    { id: 'services',    label: 'Services',             compIndices: [3, 4] },    // Services Offered + Service Coverage
    { id: 'workforce',   label: 'Workforce',            compIndices: [5, 6, 7] }, // Workforce Capability + Capacity + Participant Handling
    { id: 'pricing',     label: 'Pricing & Features',   compIndices: [8, 9] },    // Pricing & Billing + Platform Features
    { id: 'profile',     label: 'Profile & Agreements', compIndices: [10, 11] },  // Profile & Branding + Agreements
  ],
  [UserRole.COORDINATOR]: [
    { id: 'roleorg',     label: 'Role & Organisation',     compIndices: [0] },
    { id: 'compliance',  label: 'Qualification & Docs',    compIndices: [1] },
    { id: 'capability',  label: 'Service Capability',      compIndices: [2] },
    { id: 'coverage',    label: 'Service Coverage',        compIndices: [3] },
    { id: 'capacity',    label: 'Availability & Capacity', compIndices: [4] },
    { id: 'plan',        label: 'Plan Management',         compIndices: [5] },
    { id: 'rates',       label: 'Rates & Commercials',     compIndices: [6] },
    { id: 'profile',     label: 'Profile & Trust',         compIndices: [7] },
    { id: 'declaration', label: 'Declaration',             compIndices: [8] },
  ],
  [UserRole.PLAN_MANAGER]: [
    { id: 'business',     label: 'Business',               compIndices: [0] },
    { id: 'availability', label: 'Availability',           compIndices: [1] },
  ],
};

// ─── Merge Zod schemas for grouped tabs ──────────────────────────────────────

function mergeSchemas(schemas: z.ZodTypeAny[]): z.ZodObject<z.ZodRawShape> {
  const merged: z.ZodRawShape = {};
  for (const s of schemas) {
    if (s instanceof z.ZodObject) Object.assign(merged, s.shape);
  }
  return z.object(merged);
}

// ─── Tab panel ────────────────────────────────────────────────────────────────

interface TabPanelProps {
  role: UserRole;
  group: TabGroup;
  defaultValues: Record<string, unknown>;
}

function TabPanel({ role, group, defaultValues }: TabPanelProps) {
  const allSteps = getStepsForRole(role);
  const schemas  = group.compIndices
    .map(i => allSteps[i]?.schema)
    .filter((s): s is z.ZodTypeAny => Boolean(s));
  const schema = mergeSchemas(schemas);

  const form = useForm({
    resolver:      zodResolver(schema),
    defaultValues,
    mode:          'onBlur',
  });

  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);
  const [saved,  setSaved]  = useState(false);

  async function onSubmit(data: FieldValues) {
    setSaving(true); setErr(null); setSaved(false);
    try {
      await upsertProfile(role, data as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {group.compIndices.map((compIndex, i) => {
          const StepComp = STEP_COMPONENTS[role]?.[compIndex];
          const config   = allSteps[compIndex];
          if (!StepComp || !config) return null;
          return (
            <div key={compIndex} style={i > 0 ? { marginTop: 32, paddingTop: 32, borderTop: '1px solid #e5e7eb' } : {}}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${config.icon}`} style={{ color: 'var(--clr-primary)', fontSize: 16 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--clr-text)' }}>{config.title}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-muted)' }}>{config.description}</p>
                </div>
              </div>
              <StepComp />
            </div>
          );
        })}

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

  const role   = activeRole as UserRole | null;
  const groups = role ? (TAB_GROUPS[role] ?? []) : [];
  const activeTab = searchParams.get('tab') ?? groups[0]?.id ?? '';

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

  function setTab(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', id);
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

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', borderBottom: '1.5px solid #e5e7eb', marginBottom: 24 }}>
          {groups.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setTab(g.id)}
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: activeTab === g.id ? 700 : 500,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === g.id ? '2.5px solid var(--clr-primary)' : '2.5px solid transparent',
                color: activeTab === g.id ? 'var(--clr-primary)' : '#64748b',
                marginBottom: -1.5,
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Active tab */}
        {groups.map(g =>
          g.id !== activeTab ? null : (
            <div
              key={g.id}
              style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '28px 28px' }}
            >
              <TabPanel
                key={`${role}-${g.id}`}
                role={role}
          
                group={g}
                defaultValues={defaultValues}
                 />
            </div>
          )
        )}
      </div>
    </>
  );
}
