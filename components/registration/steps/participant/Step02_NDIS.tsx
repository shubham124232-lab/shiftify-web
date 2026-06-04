'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ParticipantStep02_NDIS() {
  const { register, watch, formState: { errors } } = useFormContext();
  const fundingType = watch('fundingManagementType') as string;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div><label style={labelStyle}>NDIS Number</label><input {...register('ndisNumber')} placeholder="XXXXXXXX" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Your NDIS number is optional and kept private.</p>
      </div>
      <div>
        <label style={labelStyle}>Funding Management Type <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'SELF', label: 'Self Managed', desc: 'You manage your own NDIS funds directly' },
            { value: 'PLAN', label: 'Plan Managed', desc: 'A Plan Manager manages your funds' },
            { value: 'NDIA', label: 'Agency Managed (NDIA)', desc: 'The NDIA manages your funds directly' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px',
              border: `1.5px solid ${fundingType === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              borderRadius: 10, background: fundingType === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('fundingManagementType')} style={{ display: 'none' }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${fundingType === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`, background: fundingType === opt.value ? 'var(--clr-primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {fundingType === opt.value && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 9 }} />}
              </div>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div><div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{opt.desc}</div></div>
            </label>
          ))}
        </div>
        {errors.fundingManagementType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.fundingManagementType.message as string}</p>}
      </div>
    </div>
  );
}
