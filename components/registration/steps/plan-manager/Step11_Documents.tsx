'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DocumentUploadField, { type ExistingDoc } from '@/components/profile/DocumentUploadField';

// ── PM doc config — matches ROLE_DOC_ALLOWLIST on backend ────────────────────

const PM_DOCS = [
  { docType: 'ABN_CONFIRMATION',          label: 'ABN Confirmation',                              required: true  },
  { docType: 'NDIS_REGISTRATION_PROOF',   label: 'NDIS Registration Proof',                       required: true  },
  { docType: 'BUSINESS_REP_PROOF',        label: 'Authorised Business Representative Evidence',   required: true  },
  { docType: 'BUSINESS_ADDRESS_EVIDENCE', label: 'Business Address Evidence',                     required: true  },
  { docType: 'CONTACT_IDENTITY_EVIDENCE', label: 'Primary Contact Identity Evidence',             required: true  },
  { docType: 'BANK_FINANCE_EVIDENCE',     label: 'Bank / Finance Setup Evidence',                 required: true  },
  {
    docType: 'PROFESSIONAL_INDEMNITY', label: 'Professional Indemnity Insurance', required: false,
    metadataFields: [
      { name: 'referenceNumber', label: 'Policy Number', type: 'text' as const },
      { name: 'expiryDate',      label: 'Expiry Date',   type: 'date' as const },
    ],
  },
  { docType: 'POLICIES_PROCEDURES', label: 'Policies Document', required: false },
] as const;

// ── Step component ────────────────────────────────────────────────────────────

export function PmStep11_Documents() {
  const [docs, setDocs] = useState<ExistingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ documents: ExistingDoc[] }>('/upload/document')
      .then((res) => setDocs(res.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function docByType(docType: string): ExistingDoc | null {
    return docs.find((d) => d.docType === docType) ?? null;
  }

  function handleSaved(saved: ExistingDoc) {
    setDocs((prev) => {
      const exists = prev.find((d) => d.id === saved.id);
      if (exists) return prev.map((d) => (d.id === saved.id ? saved : d));
      return [...prev, saved];
    });
  }

  const mandatoryUploaded = PM_DOCS
    .filter((d) => d.required)
    .every((d) => !!docByType(d.docType));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: 24, height: 24, border: '3px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--clr-muted)' }}>
        Upload the required proof documents below. You can update these at any time from your Documents page.
      </p>

      {PM_DOCS.map((doc) => (
        <DocumentUploadField
          key={doc.docType}
          docType={doc.docType}
          label={doc.label}
          metadataFields={'metadataFields' in doc ? [...doc.metadataFields] : undefined}
          uploadRequired
          existingDoc={docByType(doc.docType)}
          onSaved={handleSaved}
          optional={!doc.required}
        />
      ))}

      {!mandatoryUploaded && (
        <div style={{ padding: '10px 14px', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />
            Upload all 6 required documents to complete this step. You can click Next to continue and upload later from your profile.
          </p>
        </div>
      )}

      {mandatoryUploaded && (
        <div style={{ padding: '10px 14px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }} />
            All required documents uploaded. Click Next to continue.
          </p>
        </div>
      )}
    </div>
  );
}
