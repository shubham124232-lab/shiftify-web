'use client';
import { useFormContext } from 'react-hook-form';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
      border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{
          width: 42, height: 24, borderRadius: 12, transition: 'background 0.2s',
          background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18,
            borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </label>
    </div>
  );
}

export function WorkerStep07_Financials() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hourly rate */}
      <div>
        <label htmlFor="hourlyRate" style={labelStyle}>
          Hourly Rate <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, fontWeight: 600, color: 'var(--clr-muted)',
          }}>$</span>
          <input
            id="hourlyRate" type="number" step="0.50" min="1" max="9999"
            {...register('hourlyRate', { valueAsNumber: true })}
            placeholder="35.00"
            style={{ ...inputStyle, paddingLeft: 28, borderColor: errors.hourlyRate ? '#ef4444' : 'var(--clr-border)' }}
          />
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--clr-muted)',
          }}>/hr</span>
        </div>
        {errors.hourlyRate && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.hourlyRate.message as string}</p>}
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 4 }}>
          NDIS pricing guide rates apply. Participants may negotiate within their plan budget.
        </p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" style={labelStyle}>Professional Bio</label>
        <textarea
          id="bio"
          {...register('bio')}
          rows={5}
          placeholder="Tell participants about your experience, approach and what makes you a great support worker…"
          style={{
            ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical',
          }}
        />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>
          This is the first thing participants read on your profile. Be warm and specific.
        </p>
      </div>

      {/* Preferences */}
      <div>
        <label htmlFor="preferences" style={labelStyle}>Work Preferences</label>
        <textarea
          id="preferences"
          {...register('preferences')}
          rows={3}
          placeholder="e.g. Prefer female participants, comfortable with pets, enjoy community activities…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
        />
      </div>

      {/* Available now + seeking PM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle
          label="Mark as Available Now"
          name="isAvailableNow"
          desc="You'll appear with an 'Available Now' badge. Auto-clears after 24 hours."
        />
        <Toggle
          label="Seeking a Plan Manager"
          name="seekingPlanManager"
          desc="Plan Managers in your area can reach out to you"
        />
      </div>
    </div>
  );
}
