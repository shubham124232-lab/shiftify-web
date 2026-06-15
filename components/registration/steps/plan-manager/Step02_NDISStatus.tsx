'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const REG_GROUPS = [
  'Support Coordination', 'Daily Activities', 'Community Participation',
  'Improved Living Arrangements', 'Employment Support', 'Plan Management',
  'Therapeutic Supports', 'Behaviour Support', 'Early Childhood',
];

export function PmStep02_NDISStatus() {
  const { register, watch, control, formState: { errors } } = useFormContext();
  const status = watch('ndisRegistrationStatus') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>NDIS Registration Status <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'REGISTERED', label: 'Registered NDIS Plan Manager', desc: 'Hold current NDIS registration for plan management' },
            { value: 'APPLYING', label: 'Applying / In Progress', desc: 'Application submitted or in progress with the NDIS Commission' },
            { value: 'NOT_REGISTERED', label: 'Not Currently Registered', desc: 'Operating without NDIS registration (self-managed participants only)' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${status === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: status === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('ndisRegistrationStatus')} style={{ marginTop: 3, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.ndisRegistrationStatus && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.ndisRegistrationStatus.message as string}</p>}
      </div>

      {(status === 'REGISTERED' || status === 'APPLYING') && (
        <>
          <div>
            <label style={labelStyle}>NDIS Provider Number</label>
            <input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Registration Expiry Date</label>
            <input type="date" {...register('registrationExpiryDate')} style={inputStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>Approved Registration Groups</label>
            <Controller name="approvedRegistrationGroups" control={control} defaultValue={[]} render={({ field }) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {REG_GROUPS.map(g => {
                  const sel = (field.value ?? []).includes(g);
                  return (
                    <button key={g} type="button"
                      onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== g) : [...cur, g]); }}
                      style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                        background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                      {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{g}
                    </button>
                  );
                })}
              </div>
            )} />
          </div>
        </>
      )}
    </div>
  );
}
