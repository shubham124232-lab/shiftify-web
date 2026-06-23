'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const QUALIFICATIONS = [
  { value: 'DIPLOMA_COMMUNITY_SERVICES',  label: 'Diploma of Community Services' },
  { value: 'BACHELOR_SOCIAL_WORK',        label: 'Bachelor of Social Work' },
  { value: 'BACHELOR_DISABILITY',         label: 'Bachelor of Disability Studies' },
  { value: 'CERT_IV_DISABILITY',          label: 'Certificate IV in Disability' },
  { value: 'PSYCHOLOGY_DEGREE',           label: 'Psychology Degree' },
  { value: 'OCCUPATIONAL_THERAPY',        label: 'Occupational Therapy' },
  { value: 'NURSING',                     label: 'Nursing' },
  { value: 'OTHER',                       label: 'Other relevant qualification' },
];

const COMP_DOCS = [
  { docType: 'POLICE_CHECK',            label: 'Police Check',                          helpText: 'Recommended for participant-facing coordinators.', showIssueDate: true, showExpiryDate: true },
  { docType: 'WWCC',                    label: 'Working With Children Check',           helpText: 'Required if coordinating support for participants under 18.', showReferenceNumber: true, referenceNumberLabel: 'WWCC Number', showExpiryDate: true },
  { docType: 'NDIS_SCREENING',          label: 'NDIS Worker Screening Check',           helpText: 'Required for direct participant contact.', showReferenceNumber: true, referenceNumberLabel: 'Clearance Number', showExpiryDate: true },
  { docType: 'PROFESSIONAL_INDEMNITY',  label: 'Professional Indemnity Insurance',      helpText: 'Required for NDIS registered coordinators.', showReferenceNumber: true, referenceNumberLabel: 'Policy Number', showExpiryDate: true },
  { docType: 'PUBLIC_LIABILITY_INSURANCE', label: 'Public Liability Insurance',         showReferenceNumber: true, referenceNumberLabel: 'Policy Number', showExpiryDate: true },
] as const;

export function CoordStep02_NDIS() {
  const { control, formState: { errors } } = useFormContext();
  const store = useRegistrationStore();
  const [existingDocs, setExistingDocs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments()
      .then(docs => { const m: Record<string, boolean> = {}; docs.forEach(d => { m[d.docType] = true; }); setExistingDocs(m); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Qualifications */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Relevant Qualifications <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select all that apply.</p>
        <Controller name="qualifications" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUALIFICATIONS.map(q => {
              const sel = (field.value ?? []).includes(q.value);
              return (
                <button key={q.value} type="button"
                  onClick={() => {
                    const cur = field.value ?? [];
                    field.onChange(sel ? cur.filter((s: string) => s !== q.value) : [...cur, q.value]);
                  }}
                  style={{ padding: '7px 13px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: sel ? 'var(--clr-primary)' : '#fff',
                    color: sel ? '#fff' : 'var(--clr-text)', fontWeight: sel ? 600 : 400 }}>
                  {q.label}
                </button>
              );
            })}
          </div>
        )} />
        {errors.qualifications && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.qualifications.message as string}</p>}
      </div>

      {/* Compliance documents */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)' }}>Compliance Documents</p>
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)' }}>
            <i className="bi bi-info-circle" style={{ marginRight: 6 }} />All documents are optional at this stage and can be uploaded later.
          </p>
        </div>
        {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {COMP_DOCS.map(doc => {
              const uploaded = existingDocs[doc.docType] || !!store.uploadedDocs[doc.docType];
              return (
                <FileUploadField
                  key={doc.docType}
                  label={doc.label}
                  accept=".pdf,.jpg,.jpeg,.png,.heic"
                  maxSizeMb={25}
                  uploadOptions={{ category: 'compliance', docType: doc.docType }}
                  currentValue={uploaded ? 'uploaded' : null}
                  optional
                  helpText={'helpText' in doc ? (doc as any).helpText : undefined}
                  showReferenceNumber={'showReferenceNumber' in doc ? (doc as any).showReferenceNumber : false}
                  referenceNumberLabel={'referenceNumberLabel' in doc ? (doc as any).referenceNumberLabel : undefined}
                  showExpiryDate={'showExpiryDate' in doc ? (doc as any).showExpiryDate : false}
                  showIssueDate={'showIssueDate' in doc ? (doc as any).showIssueDate : false}
                  onUploaded={(val) => { store.setUploadedDoc(doc.docType, val); setExistingDocs(p => ({ ...p, [doc.docType]: true })); }}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
