'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function ProviderStep02_ABN() {
  const { register, watch, formState: { errors } } = useFormContext();
  const ndisReg = watch('ndisRegistered') as boolean;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>ABN <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('abn')} placeholder="XX XXX XXX XXX" style={{ ...inputStyle, borderColor: errors.abn ? '#ef4444' : undefined }} />
        {errors.abn && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.abn.message as string}</p>}
      </div>

      <Toggle label="Registered for GST" name="gstRegistered" />
      <Toggle label="NDIS Registered Provider" name="ndisRegistered" desc="Registered with the NDIS Quality and Safeguards Commission" />

      {ndisReg && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>NDIS Provider Registration Number</label>
            <input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>NDIS Registration Expiry</label>
            <input {...register('ndisRegistrationExpiry')} type="date" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>NDIS Audit Status</label>
            <select {...register('ndisAuditStatus')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select…</option>
              <option value="NOT_REQUIRED">Not required (low-risk supports only)</option>
              <option value="CERTIFICATION">Certification audit (medium/high-risk supports)</option>
              <option value="VERIFICATION">Verification audit (lower-risk category)</option>
              <option value="AWAITING_AUDIT">Awaiting scheduled audit</option>
              <option value="AUDIT_IN_PROGRESS">Audit in progress</option>
              <option value="COMPLIANT">Compliant — audit passed</option>
              <option value="CONDITIONS_IMPOSED">Conditions imposed following audit</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Business Structure</label>
        <select {...register('businessStructure')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="SOLE_TRADER">Sole Trader</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="COMPANY">Company (Pty Ltd)</option>
          <option value="TRUST">Trust</option>
          <option value="NOT_FOR_PROFIT">Not-for-Profit / Charity</option>
          <option value="GOVERNMENT">Government / Local Council</option>
        </select>
      </div>

      <Toggle label="I confirm this ABN is active and registered to my business" name="abnConfirmed" />
    </div>
  );
}
