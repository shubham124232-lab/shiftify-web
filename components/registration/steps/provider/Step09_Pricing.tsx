'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep09_Pricing() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Pricing Model</label>
        <select {...register('pricingModel')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['NDIS Price Guide Rates', 'Negotiated Rates', 'Fixed Package Pricing', 'Hourly Rate'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Preferred Billing Method</label>
        <select {...register('billingMethod')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['Invoice to Plan Manager', 'Invoice to NDIA (Agency Managed)', 'Invoice to Participant (Self Managed)', 'All billing methods'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div style={{ padding: 12, background: 'rgba(79,70,229,0.04)', borderRadius: 10, fontSize: 12, color: 'var(--clr-primary)' }}>
        <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
        Shiftify does not process payments. Invoices are coordinated directly between providers, plan managers and the NDIA.
      </div>
    </div>
  );
}
