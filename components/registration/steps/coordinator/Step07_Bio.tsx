'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const TRAVEL_OPTIONS = [
  { value: 'NONE',                label: 'No travel charges' },
  { value: 'INCLUDED',            label: 'Included in hourly rate' },
  { value: 'CHARGED_SEPARATELY',  label: 'Charged separately (NDIS transport rates)' },
];

export function CoordStep07_Bio() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Hourly rate */}
      <div>
        <label style={labelStyle}>Hourly Rate</label>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--clr-muted)' }}>Support Coordination is funded under the Capacity Building budget. The NDIS sets pricing limits.</p>
        <div style={{ position: 'relative', width: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--clr-muted)' }}>$</span>
          <input type="number" step="0.50" min="0"
            {...register('hourlyRate', { valueAsNumber: true })}
            placeholder="100.00"
            style={{ ...inputStyle, paddingLeft: 28 }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--clr-muted)' }}>/hr</span>
        </div>
        {errors.hourlyRate && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.hourlyRate.message as string}</p>}
      </div>

      {/* Travel charges */}
      <div>
        <label style={labelStyle}>Travel Charges</label>
        <select {...register('travelCharges')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {TRAVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

    </div>
  );
}
