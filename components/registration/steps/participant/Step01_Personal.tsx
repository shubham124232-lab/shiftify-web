'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const PARTICIPANT_TYPES = [
  { value: 'SELF',      label: 'Self (I have a disability)' },
  { value: 'PARENT',    label: 'Parent / Guardian' },
  { value: 'GUARDIAN',  label: 'Legal Guardian' },
  { value: 'CARER',     label: 'Carer' },
  { value: 'NOMINEE',   label: 'Nominee / Authorised Representative' },
];

export function ParticipantStep01_Personal() {
  const { register, watch, formState: { errors } } = useFormContext();
  const gender = watch('gender') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Preferred Name */}
      <div>
        <label style={labelStyle}>Preferred Name</label>
        <input {...register('preferredName')} placeholder="What should workers call you?" style={inputStyle} />
      </div>

      {/* Participant Type */}
      <div>
        <label style={labelStyle}>Who is this profile for?</label>
        <select {...register('participantType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {PARTICIPANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Age Group */}
      <div>
        <label style={labelStyle}>Age Group</label>
        <select {...register('ageGroup')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['0–5 years', '6–12 years', '13–17 years', '18–25 years', '26–40 years', '41–60 years', '61–75 years', '75+ years'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
            <label key={g} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 12px', borderRadius: 20,
              border: `1.5px solid ${gender === g ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: gender === g ? 'rgba(79,70,229,0.07)' : '#fff',
              fontSize: 12, fontWeight: 500, color: gender === g ? 'var(--clr-primary)' : 'var(--clr-text)',
            }}>
              <input type="radio" value={g} {...register('gender')} style={{ display: 'none' }} />
              {g}
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label style={labelStyle}>Location</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: 10 }}>
          <div>
            <input {...register('suburb')} placeholder="Suburb" style={{ ...inputStyle, borderColor: errors.suburb ? '#ef4444' : undefined }} />
          </div>
          <div>
            <input {...register('postcode')} placeholder="Postcode" style={inputStyle} maxLength={4} />
          </div>
          <div>
            <select {...register('state')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">State</option>
              {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 4 }}>
          Used to find support workers near you. Not shown publicly.
        </p>
      </div>
    </div>
  );
}
