'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep09_Pricing() {
  const { register } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Pricing model */}
      <div>
        <label style={labelStyle}>Pricing Model</label>
        <select {...register('pricingModel')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="NDIS_PRICE_GUIDE">As per NDIS Price Guide</option>
          <option value="CUSTOM">Custom Pricing</option>
        </select>
      </div>

      {/* Travel charges */}
      <div>
        <label style={labelStyle}>Travel Charges</label>
        <select {...register('travelCharges')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="NONE">No travel charges</option>
          <option value="INCLUDED">Included in service rates</option>
          <option value="CHARGED_SEPARATELY">Charged separately (NDIS transport rates)</option>
        </select>
      </div>

      {/* Cancellation policy */}
      <div>
        <label style={labelStyle}>Cancellation Policy</label>
        <textarea {...register('cancellationPolicy')} rows={3}
          placeholder="e.g. Cancellations within 7 days are charged at 100%. No-shows charged in full."
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>
          Displayed to participants and coordinators on your profile.
        </p>
      </div>

      {/* Billing method */}
      <div>
        <label style={labelStyle}>Billing Method</label>
        <select {...register('billingMethod')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="DIRECT">Direct</option>
          <option value="VIA_PLAN_MANAGER">Via Plan Manager</option>
          <option value="PLATFORM">Platform (future)</option>
        </select>
      </div>

      <div style={{ padding: 12, background: 'rgba(79,70,229,0.04)', borderRadius: 10, fontSize: 12, color: 'var(--clr-primary)' }}>
        <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
        Shiftify does not process payments. Invoices are coordinated directly between providers, plan managers and the NDIA.
      </div>

    </div>
  );
}
