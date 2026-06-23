'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const QUALIFICATIONS = [
  { value: 'CERT_III_INDIVIDUAL_SUPPORT', label: 'Certificate III Individual Support' },
  { value: 'CERT_IV_DISABILITY',          label: 'Certificate IV Disability' },
  { value: 'DIPLOMA_COMMUNITY_SERVICES',  label: 'Diploma Community Services' },
  { value: 'BACHELOR_SOCIAL_WORK',        label: 'Bachelor Social Work' },
  { value: 'OTHER',                       label: 'Other' },
];

const BASIC_DOCS = [
  { docType: 'POLICE_CHECK',   label: 'Police Check',                helpText: 'Recommended for participant-facing coordinators.', showIssueDate: true, showExpiryDate: true },
  { docType: 'WWCC',           label: 'Working With Children Check', helpText: 'Required if coordinating for participants under 18.', showReferenceNumber: true, referenceNumberLabel: 'WWCC Number', showExpiryDate: true },
  { docType: 'NDIS_SCREENING', label: 'NDIS Worker Screening Check', helpText: 'Required for direct participant contact.', showReferenceNumber: true, referenceNumberLabel: 'Clearance Number', showExpiryDate: true },
] as const;

export function CoordStep02_NDIS() {
  const { register, control, formState: { errors } } = useFormContext();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Qualifications */}
      <div>
        <label style={labelStyle}>Relevant Qualifications <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select all that apply.</p>
        <Controller name="qualifications" control={control} defaultValue={[]} render={({ field }) => {
          const selected: string[] = field.value ?? [];
          const hasOther = selected.includes('OTHER');
          const otherUploaded = existingDocs['QUALIFICATION_CERTIFICATE'] || !!store.uploadedDocs['QUALIFICATION_CERTIFICATE'];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {QUALIFICATIONS.map(q => {
                  const sel = selected.includes(q.value);
                  return (
                    <button key={q.value} type="button"
                      onClick={() => field.onChange(sel ? selected.filter(s => s !== q.value) : [...selected, q.value])}
                      style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                        background: sel ? 'var(--clr-primary)' : '#fff',
                        color: sel ? '#fff' : 'var(--clr-text)', fontWeight: sel ? 600 : 400 }}>
                      {q.label}
                    </button>
                  );
                })}
              </div>
              {hasOther && (
                <FileUploadField
                  label="Upload Qualification Certificate"
                  accept=".pdf,.jpg,.jpeg,.png,.heic"
                  maxSizeMb={25}
                  uploadOptions={{ category: 'compliance', docType: 'QUALIFICATION_CERTIFICATE' }}
                  currentValue={otherUploaded ? 'uploaded' : null}
                  helpText="Required when 'Other' is selected."
                  onUploaded={(val) => { store.setUploadedDoc('QUALIFICATION_CERTIFICATE', val); setExistingDocs(p => ({ ...p, QUALIFICATION_CERTIFICATE: true })); }}
                />
              )}
            </div>
          );
        }} />
        {errors.qualifications && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.qualifications.message as string}</p>}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

      {/* Professional Indemnity Insurance */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Professional Indemnity Insurance</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Provider / Insurer Name</label>
            <input {...register('professionalIndemnityProviderName')} placeholder="e.g. Guild Insurance" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Policy Number</label>
              <input {...register('professionalIndemnityPolicyNumber')} placeholder="Enter number…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input type="date" {...register('professionalIndemnityExpiry')} style={inputStyle} />
            </div>
          </div>
          {!loading && (
            <FileUploadField
              label="Upload Proof of PI Insurance"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
              maxSizeMb={25}
              uploadOptions={{ category: 'compliance', docType: 'PROFESSIONAL_INDEMNITY' }}
              currentValue={existingDocs['PROFESSIONAL_INDEMNITY'] || !!store.uploadedDocs['PROFESSIONAL_INDEMNITY'] ? 'uploaded' : null}
              optional
              helpText="Required for NDIS registered coordinators."
              onUploaded={(val) => { store.setUploadedDoc('PROFESSIONAL_INDEMNITY', val); setExistingDocs(p => ({ ...p, PROFESSIONAL_INDEMNITY: true })); }}
            />
          )}
        </div>
      </div>

      {/* Public Liability Insurance */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Public Liability Insurance</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Policy Number</label>
              <input {...register('publicLiabilityPolicyNumber')} placeholder="Enter number…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input type="date" {...register('publicLiabilityExpiry')} style={inputStyle} />
            </div>
          </div>
          {!loading && (
            <FileUploadField
              label="Upload Proof of PL Insurance"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
              maxSizeMb={25}
              uploadOptions={{ category: 'compliance', docType: 'PUBLIC_LIABILITY_INSURANCE' }}
              currentValue={existingDocs['PUBLIC_LIABILITY_INSURANCE'] || !!store.uploadedDocs['PUBLIC_LIABILITY_INSURANCE'] ? 'uploaded' : null}
              optional
              onUploaded={(val) => { store.setUploadedDoc('PUBLIC_LIABILITY_INSURANCE', val); setExistingDocs(p => ({ ...p, PUBLIC_LIABILITY_INSURANCE: true })); }}
            />
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

      {/* Screening docs */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)' }}>Screening &amp; Checks</p>
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)' }}>
            <i className="bi bi-info-circle" style={{ marginRight: 6 }} />All documents are optional at this stage and can be uploaded later.
          </p>
        </div>
        {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BASIC_DOCS.map(doc => {
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
