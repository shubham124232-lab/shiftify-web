'use client';
// Document upload step for Support Worker.
// Shows required docs (NDIS, Police Check, WWCC, First Aid) + optional certs.
// Does NOT gate step progression — user can skip and upload from /documents later.

import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

interface DocSpec {
  docType:  string;
  label:    string;
  required: boolean;
  helpText?: string;
}

const WORKER_DOCS: DocSpec[] = [
  { docType: 'NDIS_SCREENING',  label: 'NDIS Worker Screening Check', required: true,  helpText: 'Required by law for NDIS work. Apply via your state screening unit.' },
  { docType: 'POLICE_CHECK',    label: 'Police Check',                required: true,  helpText: 'Must be issued within the last 3 years.' },
  { docType: 'WWCC',            label: 'Working With Children Check', required: false, helpText: 'Required if you work with participants under 18.' },
  { docType: 'FIRST_AID',       label: 'First Aid Certificate',       required: false, helpText: 'HLTAID011 or equivalent.' },
  { docType: 'CPR',             label: 'CPR Certificate',             required: false, helpText: 'HLTAID009 or equivalent. Often combined with First Aid.' },
  { docType: 'MANUAL_HANDLING', label: 'Manual Handling Certificate', required: false },
  { docType: 'INFECTION_CONTROL', label: 'Infection Control Certificate', required: false },
];

export function WorkerStep08_Documents() {
  const store = useRegistrationStore();
  const [existingDocs, setExistingDocs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Load already-uploaded docs so we can show them as done
  useEffect(() => {
    listDocuments()
      .then(docs => {
        const map: Record<string, boolean> = {};
        docs.forEach(d => { map[d.docType] = true; });
        setExistingDocs(map);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)',
        borderRadius: 10, padding: 14,
      }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
          Documents marked <span style={{ color: '#ef4444' }}>*</span> are required to apply for jobs.
          You can upload them now or later from your Documents page. Your account will remain active either way.
        </p>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading your documents…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {WORKER_DOCS.map(doc => {
            const alreadyUploaded = existingDocs[doc.docType] || !!store.uploadedDocs[doc.docType];
            return (
              <div key={doc.docType}>
                <FileUploadField
                  label={`${doc.label}${doc.required ? ' *' : ''}`}
                  accept=".pdf,.jpg,.jpeg,.png,.heic"
                  maxSizeMb={25}
                  uploadOptions={{ category: 'compliance', docType: doc.docType }}
                  currentValue={alreadyUploaded ? 'uploaded' : null}
                  optional={!doc.required}
                  helpText={doc.helpText}
                  onUploaded={(val) => {
                    store.setUploadedDoc(doc.docType, val);
                    setExistingDocs(prev => ({ ...prev, [doc.docType]: true }));
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 4 }}>
        Files accepted: PDF, JPG, PNG, HEIC · Max 25 MB each ·
        <a href="/documents" style={{ color: 'var(--clr-primary)', marginLeft: 4 }}>
          View all documents
        </a>
      </p>
    </div>
  );
}
