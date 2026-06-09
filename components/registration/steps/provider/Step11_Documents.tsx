'use client';
import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const PROVIDER_DOCS = [
  { docType: 'NDIS_AUDIT',                   label: 'NDIS Provider Registration Certificate', required: false },
  { docType: 'PUBLIC_LIABILITY_INSURANCE',   label: 'Public Liability Insurance Certificate',  required: false },
  { docType: 'PROFESSIONAL_INDEMNITY',       label: 'Professional Indemnity Insurance',        required: false },
  { docType: 'WORKERS_COMP',                 label: 'Workers Compensation Insurance',          required: false },
  { docType: 'POLICE_CHECK',                 label: 'Police Check (Director/Key Personnel)',   required: false },
];

export function ProviderStep11_Documents() {
  const store = useRegistrationStore();
  const [existingDocs, setExistingDocs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments().then(docs => {
      const map: Record<string, boolean> = {};
      docs.forEach(d => { map[d.docType] = true; });
      setExistingDocs(map);
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              onUploaded={(val) => { store.setUploadedDoc(doc.docType, val); setExistingDocs(p => ({ ...p, [doc.docType]: true })); }}
            />
          );
        })
      )}
    </div>
  );
}
