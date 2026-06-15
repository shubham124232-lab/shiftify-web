'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function CoordStep01_RoleOrg() {
  const { register, watch, formState: { errors } } = useFormContext();
  const roleType = watch('roleType') as string;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Coordinator Type <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { value: 'INDEPENDENT', label: 'Independent', desc: 'Self-employed coordinator' },
            { value: 'AGENCY_EMPLOYED', label: 'Agency / Organisation', desc: 'Employed by a provider' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '12px', border: `1.5px solid ${roleType === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`, borderRadius: 10, cursor: 'pointer', background: roleType === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('roleType')} style={{ display: 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
              <span style={{ fontSize: 11, color: 'var(--clr-muted)' }}>{opt.desc}</span>
            </label>
          ))}
        </div>
        {errors.roleType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.roleType.message as string}</p>}
      </div>
      <div><label style={labelStyle}>Organisation Name</label><input {...register('organisationName')} placeholder="e.g. Care Coordination Partners" style={inputStyle} /></div>
      <div><label style={labelStyle}>ABN</label><input {...register('abn')} placeholder="XX XXX XXX XXX" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Gender <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span></label>
        <select {...register('gender')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Prefer not to say</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="NON_BINARY">Non-binary</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </div>
  );
}
