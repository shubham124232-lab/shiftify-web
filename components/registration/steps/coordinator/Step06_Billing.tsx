'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function CoordStep06_Billing() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Preferred Billing Method</label>
        <select {...register('billingMethodPreference')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['Invoice to Plan Manager', 'Invoice to NDIA (Agency Managed)', 'Invoice to Participant (Self Managed)', 'Multiple methods accepted'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Hourly Rate</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--clr-muted)' }}>$</span>
          <input type="number" step="0.50" min="0" {...register('hourlyRate', { valueAsNumber: true })} placeholder="100.00" style={{ ...inputStyle, paddingLeft: 28 }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--clr-muted)' }}>/hr</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>NDIS Support Coordination rate under Capacity Building budget.</p>
      </div>
    </div>
  );
}
