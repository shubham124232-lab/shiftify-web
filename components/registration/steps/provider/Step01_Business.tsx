'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const STRUCTURES: { value: string; label: string }[] = [
  { value: 'SOLE_TRADER', label: 'Sole Trader'       },
  { value: 'PARTNERSHIP', label: 'Partnership'        },
  { value: 'COMPANY',     label: 'Company (Pty Ltd)'  },
  { value: 'TRUST',       label: 'Trust'              },
];

export function ProviderStep01_Business() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Business / Trading Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('businessName')} placeholder="e.g. Sunshine Care Services" style={{ ...inputStyle, borderColor: errors.businessName ? '#ef4444' : undefined }} />
        {errors.businessName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.businessName.message as string}</p>}
      </div>
      <div>
        <label style={labelStyle}>Legal Entity Name</label>
        <input {...register('legalEntityName')} placeholder="e.g. Sunshine Care Services Pty Ltd" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>The registered legal name of your organisation (if different from trading name).</p>
      </div>
      <div>
        <label style={labelStyle}>Business Structure</label>
        <select {...register('businessStructure')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select structure…</option>
          {STRUCTURES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Years in Operation</label>
        <select {...register('yearsInOperation')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select...</option>
          {['Less than 1 year', '1-2 years', '3-5 years', '6-10 years', '10+ years'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}
