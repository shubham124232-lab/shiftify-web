'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ParticipantStep02_NDIS() {
  const { register, watch, formState: { errors } } = useFormContext();
  const fundingType = watch('fundingManagementType') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* NDIS Number */}
      <div>
        <label style={labelStyle}>NDIS Number</label>
        <input {...register('ndisNumber')} placeholder="43XXXXXXX" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Optional. Usually a 9-digit number.</p>
      </div>

      {/* Funding Management Type */}
      <div>
        <label style={labelStyle}>How is your NDIS funding managed? <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'SELF',  label: 'Self-Managed', desc: 'You manage your own budget and pay providers directly' },
            { value: 'PLAN',  label: 'Plan-Managed', desc: 'A plan manager handles invoices and payments for you' },
            { value: 'NDIA',  label: 'NDIA-Managed (Agency)', desc: 'The NDIA pays registered providers directly' },
          ].map(opt => (
            <label key={opt.value} style={{
              display: 'flex', gap: 12, cursor: 'pointer', padding: '12px 14px',
              border: `1.5px solid ${fundingType === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              borderRadius: 10, background: fundingType === opt.value ? 'rgba(79,70,229,0.05)' : '#fff',
            }}>
              <input type="radio" value={opt.value} {...register('fundingManagementType')} style={{ marginTop: 2, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.fundingManagementType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.fundingManagementType.message as string}</p>}
      </div>

      {/* Support Coordination Funding */}
      <div>
        <label style={labelStyle}>Support Coordination Funding</label>
        <select {...register('supportCoordinationFunding')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="NONE">None</option>
          <option value="LEVEL_1">Level 1 — Support Connection</option>
          <option value="LEVEL_2">Level 2 — Coordination of Supports</option>
          <option value="LEVEL_3">Level 3 — Specialist Support Coordination</option>
        </select>
      </div>

      {/* NDIS Plan Dates */}
      <div>
        <label style={labelStyle}>NDIS Plan Period</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ ...labelStyle, fontSize: 11, color: 'var(--clr-muted)' }}>Plan Start Date</label>
            <input type="date" {...register('ndisStartDate')} style={inputStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: 11, color: 'var(--clr-muted)' }}>Plan End Date</label>
            <input type="date" {...register('ndisEndDate')} style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
