'use client';
import { useFormContext } from 'react-hook-form';
import { FileUploadField } from '../../fields/FileUploadField';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
      border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{
          width: 42, height: 24, borderRadius: 12, transition: 'background 0.2s',
          background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18,
            borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
        <span style={{ fontSize: 12, color: val ? 'var(--clr-primary)' : 'var(--clr-muted)', fontWeight: 600 }}>
          {val ? 'Yes' : 'No'}
        </span>
      </label>
    </div>
  );
}

export function WorkerStep03_WorkType() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const workType = watch('workType') as string;
  const hasPL    = watch('publicLiabilityInsurance') as boolean;
  const hasPA    = watch('personalAccidentInsurance') as boolean;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Employment type */}
      <div>
        <label style={labelStyle}>Employment Type <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { value: 'CONTRACTOR', label: 'Sole Trader / Contractor', icon: 'bi-person-workspace', desc: 'ABN required · invoice for work' },
            { value: 'AGENCY',     label: 'Agency / Employee',         icon: 'bi-building-fill',   desc: 'Employed through an organisation' },
          ] as const).map(opt => {
            const selected = workType === opt.value;
            return (
              <label key={opt.value} style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 12px',
                border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                borderRadius: 10, cursor: 'pointer',
                background: selected ? 'rgba(79,70,229,0.06)' : '#fff', transition: 'all 0.15s',
              }}>
                <input type="radio" value={opt.value} {...register('workType')} style={{ display: 'none' }} />
                <i className={`bi ${opt.icon}`} style={{ fontSize: 20, color: selected ? 'var(--clr-primary)' : 'var(--clr-muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{opt.label}</span>
                <span style={{ fontSize: 11, color: 'var(--clr-muted)' }}>{opt.desc}</span>
              </label>
            );
          })}
        </div>
        {errors.workType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.workType.message as string}</p>}
      </div>

      {/* ABN — conditional on CONTRACTOR */}
      {workType === 'CONTRACTOR' && (
        <div style={{
          background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)',
          borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <label style={labelStyle}>Australian Business Number (ABN) <span style={{ color: '#ef4444' }}>*</span></label>
            <input {...register('abn')} placeholder="XX XXX XXX XXX" style={{ ...inputStyle, borderColor: errors.abn ? '#ef4444' : 'var(--clr-border)' }} />
            {errors.abn && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.abn.message as string}</p>}
          </div>
          <Toggle label="Registered for GST?" name="gstRegistered" />
        </div>
      )}

      {/* Insurance toggles */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 10 }}>Insurance Coverage</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Toggle label="I have Public Liability Insurance" name="publicLiabilityInsurance"
            desc="Covers damage or injury caused to a third party during service delivery" />
          <Toggle label="I have Personal Accident Insurance" name="personalAccidentInsurance"
            desc="Covers you personally for injury or accident while providing support" />
        </div>
      </div>

      {/* PL Insurance details */}
      {hasPL && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--clr-primary)' }}>Public Liability Insurance Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Policy Number</label>
              <input {...register('publicLiabilityPolicyNumber')} placeholder="e.g. PL-123456" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input {...register('publicLiabilityExpiry')} type="date" style={inputStyle} />
            </div>
          </div>
          <FileUploadField label="Upload Policy Document" accept=".pdf,.jpg,.png" maxSizeMb={10}
            uploadOptions={{ category: 'documents', docType: 'PUBLIC_LIABILITY' }}
            onUploaded={(url) => setValue('publicLiabilityDocUrl', url, { shouldDirty: true })} />
        </div>
      )}

      {/* Personal Accident Insurance details */}
      {hasPA && (
        <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Personal Accident Insurance Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Policy Number</label>
              <input {...register('personalAccidentPolicyNumber')} placeholder="e.g. PA-789012" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input {...register('personalAccidentExpiry')} type="date" style={inputStyle} />
            </div>
          </div>
          <FileUploadField label="Upload Policy Document" accept=".pdf,.jpg,.png" maxSizeMb={10}
            uploadOptions={{ category: 'documents', docType: 'PERSONAL_ACCIDENT' }}
            onUploaded={(url) => setValue('personalAccidentDocUrl', url, { shouldDirty: true })} />
        </div>
      )}

      {/* Driving */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 10 }}>Driving</label>
        <Toggle label="I have a valid Australian driver's licence" name="hasDriversLicence" />
      </div>

      {watch('hasDriversLicence') && (
        <div>
          <label style={labelStyle}>Licence Class</label>
          <select {...register('driversLicenceType')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select class…</option>
            <option value="C">C — Car</option>
            <option value="R">R — Motorcycle</option>
            <option value="MR">MR — Medium Rigid</option>
            <option value="HR">HR — Heavy Rigid</option>
            <option value="HC">HC — Heavy Combination</option>
          </select>
        </div>
      )}

      <Toggle label="I have my own vehicle for client transport" name="ownVehicle" />
    </div>
  );
}
