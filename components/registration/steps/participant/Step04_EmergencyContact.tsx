'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10 }}>
      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>{desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}</div>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function ParticipantStep04_EmergencyContact() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        This person will be contacted in an emergency during a support session.
      </p>
      <div>
        <label style={labelStyle}>Emergency Contact Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('emergencyContactName')} placeholder="Full name" style={{ ...inputStyle, borderColor: errors.emergencyContactName ? '#ef4444' : undefined }} />
        {errors.emergencyContactName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.emergencyContactName.message as string}</p>}
      </div>
      <div>
        <label style={labelStyle}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('emergencyContactPhone')} type="tel" placeholder="+61 4xx xxx xxx" style={{ ...inputStyle, borderColor: errors.emergencyContactPhone ? '#ef4444' : undefined }} />
        {errors.emergencyContactPhone && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.emergencyContactPhone.message as string}</p>}
      </div>
      <div>
        <label style={labelStyle}>Relationship <span style={{ color: '#ef4444' }}>*</span></label>
        <select {...register('emergencyContactRelationship')} style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.emergencyContactRelationship ? '#ef4444' : undefined }}>
          <option value="">Select…</option>
          {['Parent / Carer', 'Spouse / Partner', 'Child', 'Sibling', 'Friend', 'Guardian', 'Support Coordinator', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.emergencyContactRelationship && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.emergencyContactRelationship.message as string}</p>}
      </div>
      <Toggle label="Seeking a Plan Manager" name="seekingPlanManager" desc="Visible to Plan Managers who can reach out to help manage your NDIS funding" />
    </div>
  );
}
