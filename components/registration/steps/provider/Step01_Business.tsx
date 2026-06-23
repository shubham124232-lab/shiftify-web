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
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function ProviderStep01_Business() {
  const { register, watch, formState: { errors } } = useFormContext();
  const ndisReg = watch('ndisRegistered') as boolean;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Business name */}
      <div>
        <label style={labelStyle}>Business / Trading Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('businessName')} placeholder="e.g. Sunshine Care Services"
          style={{ ...inputStyle, borderColor: errors.businessName ? '#ef4444' : undefined }} />
        {errors.businessName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.businessName.message as string}</p>}
      </div>

      {/* Legal entity */}
      <div>
        <label style={labelStyle}>Legal Entity Name</label>
        <input {...register('legalEntityName')} placeholder="e.g. Sunshine Care Services Pty Ltd" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Registered legal name if different from trading name.</p>
      </div>

      {/* ABN */}
      <div>
        <label style={labelStyle}>ABN (Australian Business Number) <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('abn')} placeholder="XX XXX XXX XXX"
          style={{ ...inputStyle, borderColor: errors.abn ? '#ef4444' : undefined }} />
        {errors.abn && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.abn.message as string}</p>}
      </div>

      {/* Business structure */}
      <div>
        <label style={labelStyle}>Business Structure</label>
        <select {...register('businessStructure')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select structure…</option>
          <option value="SOLE_TRADER">Sole Trader</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="COMPANY">Company (Pty Ltd)</option>
          <option value="TRUST">Trust</option>
          <option value="NOT_FOR_PROFIT">Not-for-Profit / Charity</option>
          <option value="GOVERNMENT">Government / Local Council</option>
        </select>
      </div>

      {/* NDIS Registration Status */}
      <div>
        <label style={labelStyle}>NDIS Registration Status</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Registered NDIS Provider', value: true },
            { label: 'Unregistered Provider',    value: false },
          ].map(opt => {
            const sel = ndisReg === opt.value;
            return (
              <label key={String(opt.value)} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                background: sel ? 'rgba(79,70,229,0.05)' : '#fff',
                fontSize: 12, fontWeight: 500,
              }}>
                <input type="checkbox" {...register('ndisRegistered')}
                  checked={ndisReg === opt.value}
                  onChange={() => {}}
                  onClick={() => {}}
                  style={{ display: 'none' }} />
                {opt.label}
              </label>
            );
          })}
        </div>
        {/* Use a hidden real toggle for the actual value */}
        <div style={{ display: 'none' }}>
          <Toggle label="" name="ndisRegistered" />
        </div>
      </div>

      {/* NDIS Provider Number — conditional */}
      {ndisReg && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14 }}>
          <label style={labelStyle}>NDIS Provider Registration Number</label>
          <input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" style={inputStyle} />
        </div>
      )}

      {/* GST Registered */}
      <Toggle label="Registered for GST" name="gstRegistered" />

      {/* Years in operation */}
      <div>
        <label style={labelStyle}>Years in Operation</label>
        <select {...register('yearsInOperation')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="0-1">0–1 years</option>
          <option value="1-3">1–3 years</option>
          <option value="3-5">3–5 years</option>
          <option value="5+">5+ years</option>
        </select>
      </div>

      {/* ABN confirmation */}
      <Toggle label="I confirm this ABN is active and registered to my business" name="abnConfirmed" />
    </div>
  );
}
