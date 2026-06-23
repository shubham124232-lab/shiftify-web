'use client';
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { listDocuments }        from '@/lib/api/profile';
import { FileUploadField }      from '../../fields/FileUploadField';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

const DOCS = [
  { docType: 'POLICE_CHECK',            label: 'Police Check',                required: true,  showIssueDate: true,  showExpiryDate: true },
  { docType: 'NDIS_SCREENING',          label: 'NDIS Worker Screening Check', required: true,  showReferenceNumber: true, referenceNumberLabel: 'Clearance Number', showExpiryDate: true },
  { docType: 'WWCC',                    label: 'Working with Children Check',  required: false, showReferenceNumber: true, referenceNumberLabel: 'WWCC Number',      showExpiryDate: true },
  { docType: 'FIRST_AID',               label: 'First Aid Certificate',        required: false, showExpiryDate: true },
  { docType: 'CPR',                     label: 'CPR Certificate',              required: false, showExpiryDate: true },
  { docType: 'DRIVERS_LICENCE',         label: "Driver's Licence",             required: false, showExpiryDate: true },
  { docType: 'VEHICLE_INSURANCE',       label: 'Vehicle Insurance',            required: false, showExpiryDate: true },
  { docType: 'MANUAL_HANDLING',         label: 'Manual Handling Certificate',  required: false, showExpiryDate: true },
  { docType: 'INFECTION_CONTROL',       label: 'Infection Control Training',   required: false },
] as const;

export function WorkerStep08_Documents() {
  const { register } = useFormContext();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--clr-muted)', margin: 0 }}>
        Upload your compliance documents. Police Check and NDIS Screening are required to go live on the marketplace.
      </p>

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Training Completed</label>
        <Toggle label="Manual Handling Training" name="manualHandlingCompleted"
          desc="Have you completed a manual handling / safe patient handling course?" />
      </div>

      <div>
        <label style={labelStyle}>First Aid Certificate Type</label>
        <select {...register('firstAidCertType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="HLTAID011">HLTAID011 — Provide First Aid</option>
          <option value="HLTAID009">HLTAID009 — Provide CPR</option>
          <option value="OTHER">Other</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Documents</label>
        {loading ? <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>Loading…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DOCS.map(doc => {
              const uploaded = existingDocs[doc.docType] || !!store.uploadedDocs[doc.docType];
              return (
                <div key={doc.docType} style={{ padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 8 }}>
                    {doc.label}
                    {doc.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                    {!doc.required && <span style={{ fontSize: 11, color: 'var(--clr-muted)', marginLeft: 6, fontWeight: 400 }}>Optional</span>}
                  </div>
                  <FileUploadField
                    label={doc.label}
                    accept=".pdf,.jpg,.jpeg,.png,.heic"
                    maxSizeMb={25}
                    uploadOptions={{ category: 'compliance', docType: doc.docType }}
                    currentValue={uploaded ? 'uploaded' : null}
                    optional={!doc.required}
                    showReferenceNumber={'showReferenceNumber' in doc ? doc.showReferenceNumber : false}
                    referenceNumberLabel={'referenceNumberLabel' in doc ? doc.referenceNumberLabel : undefined}
                    showExpiryDate={'showExpiryDate' in doc ? doc.showExpiryDate : false}
                    showIssueDate={'showIssueDate' in doc ? doc.showIssueDate : false}
                    onUploaded={(val) => { store.setUploadedDoc(doc.docType, val); setExistingDocs(p => ({ ...p, [doc.docType]: true })); }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
