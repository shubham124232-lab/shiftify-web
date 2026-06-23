'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const YRS_EXP = ['0-1', '1-3', '3-5', '5+'];

export function CoordStep01_RoleOrg() {
  const { register, watch, formState: { errors } } = useFormContext();
  const roleType = watch('roleType') as string;
  const ndisReg  = watch('ndisRegistered') as boolean | string;
  const isRegistered = ndisReg === true || ndisReg === 'true';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Role type */}
      <div>
        <label style={labelStyle}>Coordinator Type <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { value: 'INDEPENDENT',    label: 'Independent',          desc: 'Self-employed coordinator' },
            { value: 'AGENCY_EMPLOYED', label: 'Agency / Organisation', desc: 'Employed by a provider' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 12,
              border: `1.5px solid ${roleType === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              borderRadius: 10, cursor: 'pointer', background: roleType === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('roleType')} style={{ display: 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
              <span style={{ fontSize: 11, color: 'var(--clr-muted)' }}>{opt.desc}</span>
            </label>
          ))}
        </div>
        {errors.roleType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.roleType.message as string}</p>}
      </div>

      {/* Organisation name — conditional on Agency */}
      {roleType === 'AGENCY_EMPLOYED' && (
        <div>
          <label style={labelStyle}>Organisation Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input {...register('organisationName')} placeholder="e.g. Care Coordination Partners"
            style={{ ...inputStyle, borderColor: errors.organisationName ? '#ef4444' : undefined }} />
          {errors.organisationName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.organisationName.message as string}</p>}
        </div>
      )}

      {/* ABN */}
      <div>
        <label style={labelStyle}>ABN (Australian Business Number) <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('abn')} placeholder="XX XXX XXX XXX" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Required for all independent and agency coordinators.</p>
      </div>

      {/* NDIS registration status */}
      <div>
        <label style={labelStyle}>NDIS Provider Registration Status <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Both registered and unregistered coordinators are welcome.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { value: 'true',  label: 'Registered NDIS Provider',  desc: 'Registered with the NDIS Quality and Safeguards Commission' },
            { value: 'false', label: 'Unregistered Provider',      desc: 'Operating lawfully but not NDIS-commission registered' },
          ].map(opt => {
            const sel = String(ndisReg) === opt.value;
            return (
              <label key={opt.value} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 12, cursor: 'pointer',
                border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                borderRadius: 10, background: sel ? 'rgba(79,70,229,0.06)' : '#fff' }}>
                <input type="radio" value={opt.value} {...register('ndisRegistered')} style={{ display: 'none' }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                <span style={{ fontSize: 11, color: 'var(--clr-muted)' }}>{opt.desc}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* NDIS provider number — conditional */}
      {isRegistered && (
        <div>
          <label style={labelStyle}>NDIS Provider Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" style={inputStyle} />
          <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Find your provider number in the NDIS Commission portal.</p>
        </div>
      )}

      {/* Years of experience */}
      <div>
        <label style={labelStyle}>Years of Experience <span style={{ color: '#ef4444' }}>*</span></label>
        <select {...register('yearsExperience')} style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.yearsExperience ? '#ef4444' : undefined }}>
          <option value="">Select...</option>
          {YRS_EXP.map(y => <option key={y} value={y}>{y} years</option>)}
        </select>
        {errors.yearsExperience && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.yearsExperience.message as string}</p>}
      </div>

    </div>
  );
}
