'use client';
import { useFormContext } from 'react-hook-form';
import { FileUploadField } from '@/components/registration/FileUploadField';

const PM_DOCS = [
  { key: 'professionalIndemnity',   label: 'Professional Indemnity Insurance', docType: 'PROFESSIONAL_INDEMNITY',   required: true,  helpText: 'Minimum $1M coverage required for NDIS registration.' },
  { key: 'publicLiability',         label: 'Public Liability Insurance',        docType: 'PUBLIC_LIABILITY_INSURANCE', required: true,  helpText: 'Minimum $10M coverage recommended.' },
  { key: 'qualificationCertificate',label: 'Qualification Certificate',         docType: 'QUALIFICATION_CERTIFICATE',  required: false, helpText: 'e.g. Cert IV in Financial Services or equivalent.' },
  { key: 'policeCheck',             label: 'Police Check',                       docType: 'POLICE_CHECK',               required: false },
];

export function PmStep11_Documents() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        Upload compliance documents. Professional Indemnity and Public Liability are required to go live on the marketplace.
      </p>
      {PM_DOCS.map(doc => (
        <div key={doc.key} style={{ padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
            {doc.label}
            {doc.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
            {!doc.required && <span style={{ fontSize: 11, color: 'var(--clr-muted)', marginLeft: 6, fontWeight: 400 }}>Optional</span>}
          </div>
          {doc.helpText && <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: '0 0 8px' }}>{doc.helpText}</p>}
          <FileUploadField name={doc.key} uploadOptions={{ category: 'COMPLIANCE', docType: doc.docType }} />
        </div>
      ))}
      <div style={{ padding: '10px 14px', background: 'rgba(79,70,229,0.04)', borderRadius: 10, border: '1px solid rgba(79,70,229,0.15)' }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-shield-check" style={{ marginRight: 6 }} />
          Documents are verified against NDIS Commission records. Auto-approved on submission.
        </p>
      </div>
    </div>
  );
}
