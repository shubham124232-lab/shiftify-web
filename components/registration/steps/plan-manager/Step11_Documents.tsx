'use client';
import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const PM_DOCS = [
  {
    docType: 'PROFESSIONAL_INDEMNITY',
    label: 'Professional Indemnity Insurance',
    required: true,
    helpText: 'Minimum $1M coverage required for NDIS registration.',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'PUBLIC_LIABILITY_INSURANCE',
    label: 'Public Liability Insurance',
    required: true,
    helpText: 'Minimum $10M coverage recommended.',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'QUALIFICATION_CERTIFICATE',
    label: 'Qualification Certificate',
    required: false,
    helpText: 'e.g. Cert IV in Financial Services or equivalent.',
    showExpiryDate: true,
  },
  {
    docType: 'POLICE_CHECK',
    label: 'Police Check (Authorised Representative)',
    required: false,
    showIssueDate: true,
    showExpiryDate: true,
  },
] as const;

export function PmStep11_Documents() {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        Upload compliance documents. Professional Indemnity and Public Liability are required to go live on the marketplace.
      </p>

      {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
        PM_DOCS.map(doc => {
          const uploaded = existingDocs[doc.docType] || !!store.uploadedDocs[doc.docType];
          return (
            <div key={doc.docType} style={{ padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4 }}>
                {doc.label}
                {doc.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                {!doc.required && <span style={{ fontSize: 11, color: 'var(--clr-muted)', marginLeft: 6, fontWeight: 400 }}>Optional</span>}
              </div>
              {'helpText' in doc && doc.helpText && (
                <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: '0 0 8px' }}>{doc.helpText}</p>
              )}
              <FileUploadField
                label={doc.label}
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                maxSizeMb={25}
                uploadOptions={{ category: 'compliance', docType: doc.docType }}
                currentValue={uploaded ? 'uploaded' : null}
                optional={!doc.required}
                showReferenceNumber={'showReferenceNumber' in doc ? (doc as { showReferenceNumber?: boolean }).showReferenceNumber : false}
                referenceNumberLabel={'referenceNumberLabel' in doc ? (doc as { referenceNumberLabel?: string }).referenceNumberLabel : undefined}
                showExpiryDate={'showExpiryDate' in doc ? (doc as { showExpiryDate?: boolean }).showExpiryDate : false}
                showIssueDate={'showIssueDate' in doc ? (doc as { showIssueDate?: boolean }).showIssueDate : false}
                onUploaded={(val) => { store.setUploadedDoc(doc.docType, val); setExistingDocs(p => ({ ...p, [doc.docType]: true })); }}
              />
            </div>
          );
        })
      )}

      <div style={{ padding: '10px 14px', background: 'rgba(79,70,229,0.04)', borderRadius: 10, border: '1px solid rgba(79,70,229,0.15)' }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-shield-check" style={{ marginRight: 6 }} />
          Documents are auto-approved on submission. You can update them at any time from your Documents page.
        </p>
      </div>
    </div>
  );
}
