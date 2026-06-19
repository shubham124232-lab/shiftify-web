'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const PLAN_TYPES = [
  { value: 'SELF_MANAGED', label: 'Self-Managed', desc: 'Participant manages their own budget and pays providers directly' },
  { value: 'PLAN_MANAGED', label: 'Plan-Managed', desc: 'A plan manager handles invoices and payments on behalf of participant' },
  { value: 'NDIA_MANAGED', label: 'NDIA-Managed (Agency)', desc: 'NDIA pays registered providers directly from participant funds' },
];

export function CoordStep06_Billing() {
  const { register, control } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Participant plan types — drives matching logic */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>
          Participant Plan Types You Work With <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: '0 0 10px' }}>
          You will only be matched with participants whose funding type matches your selection.
        </p>
        <Controller name="fundingTypeCompatibility" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLAN_TYPES.map(pt => {
              const sel = (field.value ?? []).includes(pt.value);
              return (
                <label key={pt.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                  padding: '12px 14px', borderRadius: 10,
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'rgba(79,70,229,0.05)' : '#fff',
                }}>
                  <input type="checkbox" checked={sel}
                    onChange={() => {
                      const cur = field.value ?? [];
                      field.onChange(sel ? cur.filter((s: string) => s !== pt.value) : [...cur, pt.value]);
                    }}
                    style={{ marginTop: 2, accentColor: 'var(--clr-primary)', width: 16, height: 16, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{pt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{pt.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )} />
      </div>

      {/* Billing method */}
      <div>
        <label style={labelStyle}>Preferred Billing Method</label>
        <select {...register('billingMethodPreference')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['Invoice to Plan Manager', 'Invoice to NDIA (Agency Managed)', 'Invoice to Participant (Self Managed)', 'Multiple methods accepted'].map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Hourly rate */}
      <div>
        <label style={labelStyle}>Hourly Rate</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--clr-muted)' }}>$</span>
          <input type="number" step="0.50" min="0" {...register('hourlyRate', { valueAsNumber: true })} placeholder="100.00" style={{ ...inputStyle, paddingLeft: 28 }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--clr-muted)' }}>/hr</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>NDIS Support Coordination rate under Capacity Building budget.</p>
      </div>

      {/* Travel charges */}
      <div>
        <label style={labelStyle}>Travel Charges</label>
        <select {...register('travelCharges')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="NONE">No travel charges</option>
          <option value="INCLUDED">Included in hourly rate</option>
          <option value="CHARGED_SEPARATELY">Charged separately (NDIS transport rates)</option>
        </select>
      </div>

    </div>
  );
}
