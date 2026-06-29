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
import DocumentUploadField, { type ExistingDoc, type MetadataFieldConfig } from '@/components/profile/DocumentUploadField';

// ── Roles that get the Documents tab ─────────────────────────────────────────

const DOC_TAB_ROLES: string[] = ['SUPPORT_WORKER', 'COORDINATOR', 'PROVIDER', 'PLAN_MANAGER'];

// ── Per-role document rows config ─────────────────────────────────────────────

interface DocRowConfig {
  docType: string;
  label: string;
  metadataFields?: MetadataFieldConfig[];
  uploadRequired: boolean;
  optional?: boolean;
  multiple?: boolean;
}

const ROLE_DOC_ROWS: Record<string, DocRowConfig[]> = {
  SUPPORT_WORKER: [
    {
      docType: 'POLICE_CHECK', label: 'Police Check', uploadRequired: true,
      metadataFields: [
        { name: 'issueDate',   label: 'Issue Date',   type: 'date', required: true },
        { name: 'expiryDate',  label: 'Expiry Date',  type: 'date', required: true },
      ],
    },
    {
      docType: 'NDIS_SCREENING', label: 'NDIS Worker Screening', uploadRequired: true,
      metadataFields: [
        { name: 'referenceNumber', label: 'Reference Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',      type: 'date', required: true },
      ],
    },
    {
      docType: 'WWCC', label: 'Working With Children Check (WWCC)', uploadRequired: false,
      metadataFields: [
        { name: 'referenceNumber', label: 'Reference Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',      type: 'date', required: true },
      ],
    },
    {
      docType: 'FIRST_AID', label: 'First Aid Certificate', uploadRequired: true,
      metadataFields: [
        { name: 'certType',   label: 'Certificate Type', type: 'select', required: true,
          options: [
            { value: 'HLTAID011', label: 'HLTAID011 — Provide First Aid' },
            { value: 'HLTAID009', label: 'HLTAID009 — Provide CPR' },
            { value: 'OTHER',     label: 'Other' },
          ] },
        { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      ],
    },
    {
      docType: 'CPR', label: 'CPR Certificate', uploadRequired: true,
      metadataFields: [
        { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      ],
    },
    {
      docType: 'MANUAL_HANDLING', label: 'Manual Handling Certificate', uploadRequired: true,
      metadataFields: [
        { name: 'completed', label: 'Completed Training?', type: 'select', required: true,
          options: [{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }] },
      ],
    },
    {
      docType: 'DRIVERS_LICENCE', label: "Driver's Licence", uploadRequired: true,
      metadataFields: [
        { name: 'licenceType', label: 'Licence Class', type: 'select', required: true,
          options: [
            { value: 'C',  label: 'C — Car' },
            { value: 'R',  label: 'R — Ride' },
            { value: 'HR', label: 'HR — Heavy Rigid' },
            { value: 'HC', label: 'HC — Heavy Combination' },
            { value: 'MR', label: 'MR — Medium Rigid' },
          ] },
        { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      ],
    },
    {
      docType: 'PUBLIC_LIABILITY_INSURANCE', label: 'Public Liability Insurance', uploadRequired: true,
      metadataFields: [
        { name: 'referenceNumber', label: 'Policy Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',   type: 'date', required: true },
      ],
    },
    {
      docType: 'PERSONAL_ACCIDENT_INSURANCE', label: 'Personal Accident Insurance', uploadRequired: true,
    },
    {
      docType: 'QUALIFICATION_CERTIFICATE', label: 'Qualification Certificate', uploadRequired: true, multiple: true,
    },
  ],

  COORDINATOR: [
    {
      docType: 'POLICE_CHECK', label: 'Police Check', uploadRequired: true,
      metadataFields: [
        { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      ],
    },
    {
      docType: 'WWCC', label: 'Working With Children Check (WWCC)', uploadRequired: false,
      metadataFields: [
        { name: 'referenceNumber', label: 'Reference Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',      type: 'date', required: true },
      ],
    },
    {
      docType: 'NDIS_SCREENING', label: 'NDIS Worker Screening', uploadRequired: false,
      metadataFields: [
        { name: 'referenceNumber', label: 'Reference Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',      type: 'date', required: true },
      ],
    },
    {
      docType: 'PROFESSIONAL_INDEMNITY', label: 'Professional Indemnity Insurance', uploadRequired: true,
      metadataFields: [
        { name: 'insurerName',     label: 'Insurer Name',  type: 'text', required: true },
        { name: 'referenceNumber', label: 'Policy Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',   type: 'date', required: true },
      ],
    },
    {
      docType: 'PUBLIC_LIABILITY_INSURANCE', label: 'Public Liability Insurance', uploadRequired: true,
      metadataFields: [
        { name: 'referenceNumber', label: 'Policy Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',   type: 'date', required: true },
      ],
    },
    {
      docType: 'QUALIFICATION_CERTIFICATE', label: 'Qualification Certificate', uploadRequired: true, multiple: true,
      metadataFields: [
        { name: 'qualType', label: 'Qualification Type', type: 'select', required: true,
          options: [
            { value: 'CERT_III', label: 'Certificate III' },
            { value: 'CERT_IV',  label: 'Certificate IV' },
            { value: 'DIPLOMA',  label: 'Diploma' },
            { value: 'BACHELOR', label: 'Bachelor' },
            { value: 'OTHER',    label: 'Other' },
          ] },
      ],
    },
  ],

  PROVIDER: [
    {
      docType: 'PUBLIC_LIABILITY_INSURANCE', label: 'Public Liability Insurance', uploadRequired: true,
      metadataFields: [
        { name: 'referenceNumber', label: 'Policy Number',    type: 'text', required: true },
        { name: 'coverageAmount',  label: 'Coverage Amount',  type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',      type: 'date', required: true },
      ],
    },
    {
      docType: 'PROFESSIONAL_INDEMNITY', label: 'Professional Indemnity Insurance', uploadRequired: true,
      metadataFields: [
        { name: 'referenceNumber', label: 'Policy Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',   type: 'date', required: true },
      ],
    },
    {
      docType: 'WORKERS_COMP', label: "Workers' Compensation", uploadRequired: false,
      metadataFields: [
        { name: 'referenceNumber', label: 'Policy Number', type: 'text', required: true },
        { name: 'expiryDate',      label: 'Expiry Date',   type: 'date', required: true },
      ],
    },
    {
      docType: 'POLICIES_PROCEDURES', label: 'Policies & Procedures Document', uploadRequired: true,
      optional: true, multiple: true,
      metadataFields: [
        { name: 'policyType', label: 'Policy Type', type: 'select', required: true,
          options: [
            { value: 'INCIDENT_MANAGEMENT', label: 'Incident Management' },
            { value: 'RISK_MANAGEMENT',     label: 'Risk Management' },
            { value: 'SAFEGUARDING',        label: 'Safeguarding' },
          ] },
      ],
    },
  ],

  PLAN_MANAGER: [
    { docType: 'ABN_CONFIRMATION',          label: 'ABN Confirmation',                         uploadRequired: true },
    { docType: 'NDIS_REGISTRATION_PROOF',   label: 'NDIS Registration Proof',                  uploadRequired: true },
    { docType: 'BUSINESS_REP_PROOF',        label: 'Authorised Business Representative Evidence', uploadRequired: true },
    { docType: 'BUSINESS_ADDRESS_EVIDENCE', label: 'Business Address Evidence',                uploadRequired: true },
    { docType: 'CONTACT_IDENTITY_EVIDENCE', label: 'Primary Contact Identity Evidence',        uploadRequired: true },
    { docType: 'BANK_FINANCE_EVIDENCE',     label: 'Bank / Finance Setup Evidence',            uploadRequired: true },
    { docType: 'PROFESSIONAL_INDEMNITY',    label: 'Professional Indemnity Insurance',         uploadRequired: true, optional: true,
      metadataFields: [
        { name: 'referenceNumber', label: 'Policy Number', type: 'text' },
        { name: 'expiryDate',      label: 'Expiry Date',   type: 'date' },
      ],
    },
    { docType: 'POLICIES_PROCEDURES',       label: 'Policies Document',                        uploadRequired: true, optional: true, multiple: true },
  ],
};

// ── Documents tab panel ───────────────────────────────────────────────────────

function DocumentsTabPanel({ role }: { role: string }) {
  const [docs, setDocs] = useState<ExistingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ documents: ExistingDoc[] }>('/upload/document')
      .then((res) => setDocs(res.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function docByType(docType: string): ExistingDoc | undefined {
    return docs.find((d) => d.docType === docType);
  }

  function docsByType(docType: string): ExistingDoc[] {
    return docs.filter((d) => d.docType === docType);
  }

  function handleSaved(saved: ExistingDoc) {
    setDocs((prev) => {
      const existing = prev.find((d) => d.id === saved.id);
      if (existing) return prev.map((d) => (d.id === saved.id ? saved : d));
      return [...prev, saved];
    });
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/upload/document/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 24, height: 24, border: '3px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const rows = ROLE_DOC_ROWS[role] ?? [];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="bi bi-file-earmark-text" style={{ color: 'var(--clr-primary)', fontSize: 16 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--clr-text)' }}>Documents &amp; Certifications</h3>
        <p style={{ margin: '2px 0 16px', fontSize: 12, color: 'var(--clr-muted)' }}>Upload and manage your compliance documents.</p>

        <div className="space-y-3">
          {rows.map((row) => {
            if (row.multiple) {
              const existing = docsByType(row.docType);
              return (
                <div key={row.docType} className="space-y-2">
                  {existing.map((doc) => (
                    <div key={doc.id} className="relative">
                      <DocumentUploadField
                        docType={row.docType}
                        label={row.label}
                        metadataFields={row.metadataFields}
                        uploadRequired={row.uploadRequired}
                        existingDoc={doc}
                        onSaved={handleSaved}
                        optional={row.optional}
                      />
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  ))}
                  {/* Add another */}
                  <DocumentUploadField
                    docType={row.docType}
                    label={existing.length > 0 ? `Add another ${row.label}` : row.label}
                    metadataFields={row.metadataFields}
                    uploadRequired={row.uploadRequired}
                    existingDoc={null}
                    onSaved={handleSaved}
                    optional={row.optional}
                  />
                </div>
              );
            }

            return (
              <DocumentUploadField
                key={row.docType}
                docType={row.docType}
                label={row.label}
                metadataFields={row.metadataFields}
                uploadRequired={row.uploadRequired}
                existingDoc={docByType(row.docType) ?? null}
                onSaved={handleSaved}
                optional={row.optional}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab panel (existing steps) ───────────────────────────────────────────────

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

  const hasDocTab  = role ? DOC_TAB_ROLES.includes(role) : false;
  const docTabIndex = steps.length; // docs tab is always last

  const activeTab   = searchParams.get('tab') ?? '0';
  const activeIndex = parseInt(activeTab, 10);
  const activeStep  = steps[activeIndex];
  const isDocTab    = hasDocTab && activeIndex === docTabIndex;

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

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', borderBottom: '1.5px solid #e5e7eb', marginBottom: 24 }}>
          {steps.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTab(i)}
              style={{
                padding: '9px 16px', fontSize: 13,
                fontWeight: activeIndex === i ? 700 : 500,
                cursor: 'pointer', background: 'none', border: 'none',
                borderBottom: activeIndex === i ? '2.5px solid var(--clr-primary)' : '2.5px solid transparent',
                color: activeIndex === i ? 'var(--clr-primary)' : '#64748b',
                marginBottom: -1.5, transition: 'color 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {step.title}
            </button>
          ))}
          {hasDocTab && (
            <button
              type="button"
              onClick={() => setTab(docTabIndex)}
              style={{
                padding: '9px 16px', fontSize: 13,
                fontWeight: isDocTab ? 700 : 500,
                cursor: 'pointer', background: 'none', border: 'none',
                borderBottom: isDocTab ? '2.5px solid var(--clr-primary)' : '2.5px solid transparent',
                color: isDocTab ? 'var(--clr-primary)' : '#64748b',
                marginBottom: -1.5, transition: 'color 0.15s', whiteSpace: 'nowrap',
              }}
            >
              Documents
            </button>
          )}
        </div>

        {/* Active panel */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '28px 28px' }}>
          {isDocTab ? (
            <DocumentsTabPanel role={role} />
          ) : activeStep ? (
            <TabPanel
              key={`${role}-${activeIndex}`}
              role={role}
              step={activeStep}
              stepIndex={activeIndex}
              defaultValues={defaultValues}
            />
          ) : null}
        </div>

      </div>
    </>
  );
}
