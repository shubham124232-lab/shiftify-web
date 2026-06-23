'use client';
import { useFormContext } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function ProviderStep07_ServiceAreas() {
  const { register } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Current capacity status */}
      <div>
        <label style={labelStyle}>Current Capacity Status</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'OPEN',    label: 'Open for New Participants' },
            { value: 'LIMITED', label: 'Limited Availability' },
            { value: 'FULL',    label: 'Full — Not Accepting' },
          ].map(opt => {
            return (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                border: '1.5px solid var(--clr-border)', borderRadius: 10, cursor: 'pointer',
                background: '#fff', fontSize: 13, fontWeight: 500,
              }}>
                <input type="radio" value={opt.value} {...register('currentCapacityStatus')}
                  style={{ width: 16, height: 16, accentColor: 'var(--clr-primary)', cursor: 'pointer' }} />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Live availability */}
      <Toggle
        label="Ability to Post Live Availability"
        name="abilityToPostLiveAvailability"
        desc="Enables shift posting, vacancy posting and worker hiring on the platform"
      />

    </div>
  );
}
