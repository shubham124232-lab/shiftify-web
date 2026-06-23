'use client';
import { useState, useEffect } from 'react';
import { useFormContext }       from 'react-hook-form';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--clr-border)', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4 };
const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8 };

function Toggle({ label, name }: { label: string; name: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', lineHeight: 1.4 }}>{label}</span>
      <label style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

const COMPLIANCE_DOCS = [
  { docType: 'PUBLIC_LIABILITY_INSURANCE', label: 'Public Liability Insurance Certificate', showReferenceNumber: true, referenceNumberLabel: 'Policy Number', showExpiryDate: true },
  { docType: 'PROFESSIONAL_INDEMNITY',     label: 'Professional Indemnity Insurance',       showReferenceNumber: true, referenceNumberLabel: 'Policy Number', showExpiryDate: true },
  { docType: 'WORKERS_COMP',              label: 'Workers Compensation Insurance',          showReferenceNumber: true, referenceNumberLabel: 'Policy Number', showExpiryDate: true },
  { docType: 'NDIS_AUDIT',                label: 'NDIS Provider Registration Certificate' },
  { docType: 'POLICIES_PROCEDURES',       label: 'Policies & Procedures (Incident / Risk / Safeguarding)' },
] as const;

export function ProviderStep03_PrimaryContact() {
  const store = useRegistrationStore();
  const { register, watch, formState: { errors } } = useFormContext();
  const ndisRegistered = watch('ndisRegistered') as boolean;
  const [existingDocs, setExistingDocs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments()
      .then(docs => { const map: Record<string, boolean> = {}; docs.forEach(d => { map[d.docType] = true; }); setExistingDocs(map); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Insurance metadata */}
      <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--clr-primary)' }}>
          <i className="bi bi-shield-check" style={{ marginRight: 6 }} />Insurance Policy Details
        </p>

        {/* Public Liability */}
        <div>
          <p style={sectionTitle}>Public Liability Insurance</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><label style={labelStyle}>Policy Number</label><input {...register('publicLiabilityPolicyNumber')} placeholder="PLI-2024-001" style={inputStyle} /></div>
            <div><label style={labelStyle}>Coverage Amount</label><input {...register('publicLiabilityCoverageAmount')} placeholder="e.g. $20M" style={inputStyle} /></div>
            <div><label style={labelStyle}>Expiry Date</label><input type="date" {...register('publicLiabilityExpiryDate')} style={inputStyle} /></div>
          </div>
        </div>

        {/* Professional Indemnity */}
        <div>
          <p style={sectionTitle}>Professional Indemnity Insurance</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={labelStyle}>Policy Number</label><input {...register('professionalIndemnityPolicyNumber')} placeholder="PI-2024-001" style={inputStyle} /></div>
            <div><label style={labelStyle}>Expiry Date</label><input type="date" {...register('professionalIndemnityExpiryDate')} style={inputStyle} /></div>
          </div>
        </div>

        {/* Workers Comp */}
        <div>
          <p style={sectionTitle}>Workers Compensation Insurance</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={labelStyle}>Policy Number</label><input {...register('workersCompPolicyNumber')} placeholder="WC-2024-001" style={inputStyle} /></div>
            <div><label style={labelStyle}>Expiry Date</label><input type="date" {...register('workersCompExpiryDate')} style={inputStyle} /></div>
          </div>
        </div>
      </div>

      {/* NDIS Audit Status — only if registered */}
      {ndisRegistered && (
        <div>
          <label style={labelStyle}>NDIS Audit Status</label>
          <select {...register('ndisAuditStatus')} style={{ ...inputStyle, height: 42, cursor: 'pointer' }}>
            <option value="">Select…</option>
            <option value="VERIFIED">Verified — audit passed</option>
            <option value="PENDING">Pending — awaiting audit</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      )}

      {/* Document uploads */}
      <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
          All documents are optional at this stage. Upload from your Documents page anytime.
        </p>
      </div>

      {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
        COMPLIANCE_DOCS.map(doc => {
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
              showReferenceNumber={'showReferenceNumber' in doc ? (doc as { showReferenceNumber?: boolean }).showReferenceNumber : false}
              referenceNumberLabel={'referenceNumberLabel' in doc ? (doc as { referenceNumberLabel?: string }).referenceNumberLabel : undefined}
              showExpiryDate={'showExpiryDate' in doc ? (doc as { showExpiryDate?: boolean }).showExpiryDate : false}
              onUploaded={val => { store.setUploadedDoc(doc.docType, val); setExistingDocs(p => ({ ...p, [doc.docType]: true })); }}
            />
          );
        })
      )}

      {/* Compliance Declaration */}
      <Toggle
        label='I confirm this organisation complies with NDIS Practice Standards and Quality & Safeguarding requirements.'
        name="complianceDeclaration"
      />
    </div>
  );
}
