'use client';
import { useFormContext } from 'react-hook-form';
import { FileUploadField } from '@/components/registration/FileUploadField';

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
        <div style={{ width: 42, height: 24, borderRadius: 12, transition: 'background 0.2s', background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

const DOCS = [
  { key: 'policeCheck',          label: 'Police Check',               docType: 'POLICE_CHECK',              required: true  },
  { key: 'ndisScreening',        label: 'NDIS Worker Screening Check', docType: 'NDIS_SCREENING',            required: true  },
  { key: 'wwcc',                 label: 'Working with Children Check', docType: 'WWCC',                      required: false },
  { key: 'firstAid',             label: 'First Aid Certificate',       docType: 'FIRST_AID',                 required: false },
  { key: 'cpr',                  label: 'CPR Certificate',             docType: 'CPR',                       required: false },
  { key: 'driversLicence',       label: "Driver's Licence",            docType: 'DRIVERS_LICENCE',           required: false },
  { key: 'vehicleInsurance',     label: 'Vehicle Insurance',           docType: 'VEHICLE_INSURANCE',         required: false },
  { key: 'manualHandlingCert',   label: 'Manual Handling Certificate', docType: 'MANUAL_HANDLING',           required: false },
  { key: 'infectionControl',     label: 'Infection Control Training',  docType: 'INFECTION_CONTROL',         required: false },
];

export function WorkerStep08_Documents() {
  const { register } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--clr-muted)', margin: 0 }}>
        Upload your compliance documents. Police Check and NDIS Screening are required to go live on the marketplace.
      </p>

      {/* Training Toggles */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Training Completed</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Toggle label="Manual Handling Training" name="manualHandlingCompleted"
            desc="Have you completed a manual handling / safe patient handling course?" />
        </div>
      </div>

      {/* First Aid Cert Type */}
      <div>
        <label style={labelStyle}>First Aid Certificate Type</label>
        <select {...register('firstAidCertType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="HLTAID011">HLTAID011 — Provide First Aid</option>
          <option value="HLTAID009">HLTAID009 — Provide CPR</option>
          <option value="HLTAID010">HLTAID010 — Provide Basic Emergency Life Support</option>
          <option value="HLTAID014">HLTAID014 — Provide Advanced First Aid</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Document Uploads */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Documents</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DOCS.map(doc => (
            <div key={doc.key} style={{ padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
                {doc.label}
                {doc.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                {!doc.required && <span style={{ fontSize: 11, color: 'var(--clr-muted)', marginLeft: 6, fontWeight: 400 }}>Optional</span>}
              </div>
              <FileUploadField
                name={doc.key}
                uploadOptions={{ category: 'COMPLIANCE', docType: doc.docType }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
