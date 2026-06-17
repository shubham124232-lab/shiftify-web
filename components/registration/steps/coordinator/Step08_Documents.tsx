'use client';
import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const COORD_DOCS = [
  {
    docType: 'PROFESSIONAL_INDEMNITY',
    label: 'Professional Indemnity Insurance',
    helpText: 'Required for NDIS registered coordinators.',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'PUBLIC_LIABILITY_INSURANCE',
    label: 'Public Liability Insurance',
    showReferenceNumber: true, referenceNumberLabel: 'Policy Number',
    showExpiryDate: true,
  },
  {
    docType: 'NDIS_SCREENING',
    label: 'NDIS Worker Screening Check',
    helpText: 'Required for direct participant contact.',
    showReferenceNumber: true, referenceNumberLabel: 'Clearance Number',
    showExpiryDate: true,
  },
  {
    docType: 'POLICE_CHECK',
    label: 'Police Check',
    helpText: 'Recommended for participant-facing coordinators.',
    showIssueDate: true,
    showExpiryDate: true,
  },
  {
    docType: 'WWCC',
    label: 'Working With Children Check',
    helpText: 'Required if coordinating support for participants under 18.',
    showReferenceNumber: true, referenceNumberLabel: 'WWCC Number',
    showExpiryDate: true,
  },
  {
    docType: 'QUALIFICATION_CERTIFICATE',
    label: 'Qualification Certificate',
    helpText: 'Diploma of Community Services or equivalent.',
    showExpiryDate: true,
  },
] as const;

export function CoordStep08_Documents() {
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
      <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 14 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-info-circle" style={{ marginRight: 6 }} />All documents are optional at this stage. Upload from your Documents page at any time.
        </p>
      </div>

      {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
        COORD_DOCS.map(doc => {
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
              helpText={'helpText' in doc ? (doc as { helpText?: string }).helpText : undefined}
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
