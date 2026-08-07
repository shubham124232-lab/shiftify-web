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

export function PmStep13_Commercial() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 10 }}>Billing Contact</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Billing Contact Name</label><input {...register('billingContactName')} placeholder="Full name" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Billing Contact Email</label>
              <input {...register('billingContactEmail')} type="email" placeholder="billing@planmanager.com.au" style={{ ...inputStyle, borderColor: errors.billingContactEmail ? '#ef4444' : undefined }} />
              {errors.billingContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.billingContactEmail.message as string}</p>}
            </div>
          </div>
          <div><label style={labelStyle}>Billing Address</label><input {...register('billingAddress')} placeholder="Street, Suburb, State, Postcode" style={inputStyle} /></div>
        </div>
      </div>

      <Toggle label="GST Registered" name="gstRegistered" desc="Your organisation is registered for GST with the ATO" />
    </div>
  );
}
