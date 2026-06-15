'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function PmStep08_StaffModel() {
  const { register, watch } = useFormContext();
  const model = watch('organisationUserModel') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Organisation User Model</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'SINGLE_USER', label: 'Single User', desc: 'Just you — sole trader or principal managing everything' },
            { value: 'SMALL_TEAM', label: 'Small Team', desc: '2–5 staff accessing the platform' },
            { value: 'LARGE_ORG', label: 'Large Organisation', desc: '6+ staff with separate admin and case manager roles' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${model === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: model === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('organisationUserModel')} style={{ marginTop: 3, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {(model === 'SMALL_TEAM' || model === 'LARGE_ORG') && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Primary Admin Name</label><input {...register('staffAdminName')} placeholder="Full name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Primary Admin Email</label><input {...register('staffAdminEmail')} type="email" placeholder="admin@planmanager.com.au" style={inputStyle} /></div>
          </div>
          <div>
            <label style={labelStyle}>Staff Seats Required</label>
            <input type="number" min={1} max={500} {...register('staffSeatsRequired', { valueAsNumber: true })} placeholder="e.g. 5" style={inputStyle} />
            <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Number of staff who need platform access. Determines your subscription tier.</p>
          </div>
        </>
      )}
    </div>
  );
}
