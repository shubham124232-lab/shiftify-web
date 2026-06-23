'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export function PmStep05_ServiceCoverage() {
  const { register, watch, control, formState: { errors } } = useFormContext();
  const coverageType = watch('serviceCoverageType') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Service Coverage <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'AUSTRALIA_WIDE', label: 'National', desc: 'Can manage participants across all states and territories' },
            { value: 'STATE_BASED', label: 'State / Territory', desc: 'Specific states only' },
            { value: 'REGION_BASED', label: 'Regional / Local', desc: 'Specific postcodes or suburbs only' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${coverageType === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: coverageType === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('serviceCoverageType')} style={{ marginTop: 3, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.serviceCoverageType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.serviceCoverageType.message as string}</p>}
      </div>

      {coverageType === 'STATE_BASED' && (
        <div>
          <label style={{ ...labelStyle, marginBottom: 8 }}>States / Territories Covered <span style={{ color: '#ef4444' }}>*</span></label>
          <Controller name="stateCoverage" control={control} defaultValue={[]} render={({ field }) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STATES.map(s => {
                const sel = (field.value ?? []).includes(s);
                return (
                  <button key={s} type="button"
                    onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((x: string) => x !== s) : [...cur, s]); }}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                      background: sel ? 'var(--clr-primary)' : '#fff', color: sel ? '#fff' : 'var(--clr-text)' }}>
                    {s}
                  </button>
                );
              })}
            </div>
          )} />
        </div>
      )}

      {coverageType === 'REGION_BASED' && (
        <div>
          <label style={labelStyle}>Postcodes / Suburbs Served <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea {...register('postcodesServed.0')} rows={3} placeholder="List postcodes or suburb names, one per line or comma-separated"
            style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', fontSize: 12 }} />
        </div>
      )}

      <div>
        <label style={labelStyle}>Timezone</label>
        <select {...register('timezone')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="AEST">AEST — NSW, VIC, QLD, ACT, TAS</option>
          <option value="ACST">ACST — SA, NT</option>
          <option value="AWST">AWST — WA</option>
          <option value="MULTIPLE">Multiple timezones</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Operating Hours</label>
        <select {...register('operatingHours')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="BUSINESS_HOURS">Business hours Mon–Fri</option>
          <option value="EXTENDED">Extended hours (evenings / weekends)</option>
          <option value="24_7">24/7</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Invoice Turnaround Time</label>
        <select {...register('invoiceTurnaroundTime')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="SAME_DAY">Same day</option>
          <option value="1_2_DAYS">1–2 business days</option>
          <option value="3_5_DAYS">3–5 business days</option>
          <option value="1_WEEK">Up to 1 week</option>
        </select>
      </div>
    </div>
  );
}
