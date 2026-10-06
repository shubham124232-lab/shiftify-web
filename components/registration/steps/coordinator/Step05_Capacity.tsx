'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: 'var(--td-white)', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const CAPACITY_STATUSES = [
  { value: 'ACCEPTING',      label: 'Accepting New Participants', desc: 'I have capacity to take on new referrals now' },
  { value: 'LIMITED',        label: 'Limited Availability',       desc: 'I can take a few more participants with some lead time' },
  { value: 'WAITLIST_ONLY',  label: 'Waitlist Only',              desc: 'I am at capacity but open to future inquiries' },
  { value: 'NOT_ACCEPTING',  label: 'Not Accepting',              desc: 'I am fully booked and not taking new participants' },
];

const AVAILABILITY_TYPES = [
  { value: 'BUSINESS_HOURS',       label: 'Business Hours' },
  { value: 'FLEXIBLE',             label: 'Flexible' },
  { value: 'EMERGENCY_AVAILABLE',  label: 'Short-notice Availability' },
];

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
      border: '1.5px solid var(--clr-border)', borderRadius: 10, background: 'var(--td-white)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{
          width: 42, height: 24, borderRadius: 12, transition: 'background 0.2s',
          background: val ? 'var(--td-pink)' : 'var(--clr-border)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18,
            borderRadius: '50%', background: 'var(--td-white)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(10,10,10,0.2)',
          }} />
        </div>
      </label>
    </div>
  );
}

export function CoordStep05_Capacity() {
  const { register, watch, formState: { errors } } = useFormContext();
  const status = watch('currentCapacityStatus') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Capacity status */}
      <div>
        <label style={labelStyle}>Current Capacity Status <span style={{ color: 'var(--td-pink)' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CAPACITY_STATUSES.map(cs => (
            <label key={cs.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${status === cs.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: status === cs.value ? 'rgba(183,37,88,0.05)' : 'var(--td-white)' }}>
              <input type="radio" value={cs.value} {...register('currentCapacityStatus')} style={{ marginTop: 2, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{cs.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{cs.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.currentCapacityStatus && <p style={{ fontSize: 12, color: 'var(--td-pink)', marginTop: 4 }}>{errors.currentCapacityStatus.message as string}</p>}
      </div>

      {/* Max participant load */}
      <div>
        <label style={labelStyle}>Maximum Participant Load</label>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--clr-muted)' }}>How many active participants can you support at once?</p>
        <input type="number" min={1} max={200}
          {...register('maxParticipantLoad', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
          placeholder="e.g. 20" style={{ ...inputStyle, width: 160, borderColor: errors.maxParticipantLoad ? 'var(--td-pink)' : undefined }} />
        {errors.maxParticipantLoad && <p style={{ fontSize: 12, color: 'var(--td-pink)', marginTop: 4 }}>{errors.maxParticipantLoad.message as string}</p>}
      </div>

      {/* Availability type */}
      <div>
        <label style={labelStyle}>Availability Type <span style={{ color: 'var(--td-pink)' }}>*</span></label>
        <select {...register('availabilityType')} style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.availabilityType ? 'var(--td-pink)' : undefined }}>
          <option value="">Select…</option>
          {AVAILABILITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {errors.availabilityType && <p style={{ fontSize: 12, color: 'var(--td-pink)', marginTop: 3 }}>{errors.availabilityType.message as string}</p>}
      </div>

      {/* Public listing */}
      <Toggle
        label="Post my profile publicly"
        name="isPubliclyListed"
        desc="Let participants browse and reach out to you directly"
      />

    </div>
  );
}
