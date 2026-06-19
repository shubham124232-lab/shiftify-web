'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function CoordStep02_NDIS() {
  const { register, watch } = useFormContext();
  const ndisReg = watch('ndisRegistered') as boolean | string;
  const isRegistered = ndisReg === true || ndisReg === 'true';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={labelStyle}>NDIS Provider Registration Status <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>
          Both registered and unregistered coordinators are welcome.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { value: 'true',  label: 'Registered NDIS Provider',   desc: 'Registered with the NDIS Quality and Safeguards Commission' },
            { value: 'false', label: 'Unregistered Provider',       desc: 'Operating lawfully but not NDIS-commission registered' },
          ].map(opt => {
            const sel = String(ndisReg) === opt.value;
            return (
              <label key={opt.value} style={{
                display: 'flex', flexDirection: 'column', gap: 3, padding: 12, cursor: 'pointer',
                border: '1.5px solid ' + (sel ? 'var(--clr-primary)' : 'var(--clr-border)'),
                borderRadius: 10,
                background: sel ? 'rgba(79,70,229,0.06)' : '#fff',
              }}>
                <input type="radio" value={opt.value} {...register('ndisRegistered')} style={{ display: 'none' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{opt.label}</span>
                <span style={{ fontSize: 11, color: 'var(--clr-muted)' }}>{opt.desc}</span>
              </label>
            );
          })}
        </div>
      </div>

      {isRegistered && (
        <div>
          <label style={labelStyle}>NDIS Provider Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" style={inputStyle} />
          <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>
            Find your provider number in your NDIS Commission portal.
          </p>
        </div>
      )}
    </div>
  );
}
