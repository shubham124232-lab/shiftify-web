'use client';
import { useState, useEffect } from 'react';
import { useFormContext }        from 'react-hook-form';
import { useRegistrationStore }  from '@/lib/store/registration.store';
import { listDocuments }         from '@/lib/api/profile';
import { FileUploadField }       from '../../fields/FileUploadField';

const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--clr-border)', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4 };

const PROVIDER_DOCS = [
  {
    docType: 'NDIS_AUDIT',
    label: 'NDIS Provider Registration Certificate',
  },
  {
    docType: 'PUBLIC_LIABILITY_INSURANCE',
    label: 'Public Liability Insurance Certificate',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'PROFESSIONAL_INDEMNITY',
    label: 'Professional Indemnity Insurance',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'WORKERS_COMP',
    label: 'Workers Compensation Insurance',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'POLICIES_PROCEDURES',
    label: 'Policies & Procedures Document',
  },
  {
    docType: 'POLICE_CHECK',
    label: 'Police Check (Director / Key Personnel)',
    showIssueDate: true,
    showExpiryDate: true,
  },
] as const;

function InsurancePolicyDetails() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14, background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--clr-primary)' }}>
        <i className="bi bi-shield-check" style={{ marginRight: 6 }} />
        Insurance Policy Details
      </p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--clr-muted)' }}>
        Enter policy metadata here and upload certificates below. These details help match you with participants requiring compliant providers.
      </p>

      {/* Public Liability */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)' }}>Public Liability Insurance</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Policy Number</label>
            <input {...register('publicLiabilityPolicyNumber')} placeholder="e.g. PLI-2024-001" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Coverage Amount</label>
            <input {...register('publicLiabilityCoverageAmount')} placeholder="e.g. $20M" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date</label>
            <input type="date" {...register('publicLiabilityExpiryDate')} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Professional Indemnity */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)' }}>Professional Indemnity Insurance</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Policy Number</label>
            <input {...register('professionalIndemnityPolicyNumber')} placeholder="e.g. PI-2024-001" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date</label>
            <input type="date" {...register('professionalIndemnityExpiryDate')} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Workers Comp */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)' }}>Workers Compensation Insurance</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Policy Number</label>
            <input {...register('workersCompPolicyNumber')} placeholder="e.g. WC-2024-001" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date</label>
            <input type="date" {...register('workersCompExpiryDate')} style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProviderStep11_Documents() {
  const store = useRegistrationStore();
  const [existingDocs, setExistingDocs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments()
      .then(docs => { const map: Record<string, boolean> = {}; docs.forEach(d => { map[d.docType] = true; }); setExistingDocs(map); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InsurancePolicyDetails />

      <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 14 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
          All documents are optional at this stage. You can upload them from your Documents page at any time.
        </p>
      </div>

      {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
        PROVIDER_DOCS.map(doc => {
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
              showIssueDate={'showIssueDate' in doc ? (doc as { showIssueDate?: boolean }).showIssueDate : false}
              onUploaded={(val) => { store.setUploadedDoc(doc.docType, val); setExistingDocs(p => ({ ...p, [doc.docType]: true })); }}
            />
          );
        })
      )}
    </div>
  );
}
