'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const CAPACITY_STATUSES = [
  { value: 'ACCEPTING',      label: 'Accepting New Participants', desc: 'I have capacity to take on new referrals now' },
  { value: 'LIMITED',        label: 'Limited Availability',       desc: 'I can take a few more participants with some lead time' },
  { value: 'WAITLIST_ONLY',  label: 'Waitlist Only',              desc: 'I am at capacity but open to future inquiries' },
  { value: 'NOT_ACCEPTING',  label: 'Not Accepting',              desc: 'I am fully booked and not taking new participants' },
];

const AVAILABILITY_TYPES = [
  { value: 'FULL_TIME',  label: 'Full-Time' },
  { value: 'PART_TIME',  label: 'Part-Time' },
  { value: 'CASUAL',     label: 'Casual / Flexible' },
];

export function CoordStep05_Capacity() {
  const { register, watch, formState: { errors } } = useFormContext();
  const status = watch('capacityStatus') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Capacity status */}
      <div>
        <label style={labelStyle}>Current Capacity Status <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CAPACITY_STATUSES.map(cs => (
            <label key={cs.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${status === cs.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: status === cs.value ? 'rgba(79,70,229,0.05)' : '#fff' }}>
              <input type="radio" value={cs.value} {...register('capacityStatus')} style={{ marginTop: 2, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{cs.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{cs.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.capacityStatus && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.capacityStatus.message as string}</p>}
      </div>

      {/* Max participant load */}
      <div>
        <label style={labelStyle}>Maximum Participant Load</label>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--clr-muted)' }}>How many active participants can you support at once?</p>
        <input type="number" min={1} max={200} {...register('maxParticipantLoad', { valueAsNumber: true })}
          placeholder="e.g. 20" style={{ ...inputStyle, width: 160 }} />
      </div>

      {/* Availability type */}
      <div>
        <label style={labelStyle}>Availability Type <span style={{ color: '#ef4444' }}>*</span></label>
        <select {...register('availabilityType')} style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.availabilityType ? '#ef4444' : undefined }}>
          <option value="">Select…</option>
          {AVAILABILITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {errors.availabilityType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.availabilityType.message as string}</p>}
      </div>

    </div>
  );
}
