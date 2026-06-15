'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

const WORKFORCE_SIZES = ['1-5', '6-15', '16-30', '31-50', '51-100', '100+'];
const PARTICIPANT_TYPES = [
  'Adults (18-64)', 'Older Adults (65+)', 'Children (0-17)',
  'Autism Spectrum', 'Acquired Brain Injury', 'Physical Disability',
  'Intellectual Disability', 'Psychosocial Disability', 'Sensory Impairment',
  'Complex / High Needs', 'Challenging Behaviours',
];
const STAFF_CAPABILITIES = [
  'Manual handling trained', 'Medication administration', 'PEG feeding',
  'Tracheostomy care', 'Catheter care', 'Wound care', 'Behaviour support',
  'Mental health first aid', 'Deaf / Auslan', 'CALD specialist',
];

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

function ChipPicker({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>{label}</label>
      <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map(opt => {
            const sel = (field.value ?? []).includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== opt) : [...cur, opt]); }}
                style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{opt}
              </button>
            );
          })}
        </div>
      )} />
    </div>
  );
}

export function ProviderStep08_Workforce() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Workforce Size</label>
        <select {...register('workforceSize')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select team size...</option>
          {WORKFORCE_SIZES.map(s => <option key={s} value={s}>{s} workers</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Hiring Type</label>
        <select {...register('workforceHiringType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select...</option>
          <option value="EMPLOYEES">Employees only</option>
          <option value="CONTRACTORS">Contractors only</option>
          <option value="BOTH">Both employees and contractors</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Current Capacity Status</label>
        <select {...register('currentCapacityStatus')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select...</option>
          <option value="ACCEPTING">Accepting new participants</option>
          <option value="LIMITED">Limited availability</option>
          <option value="FULL">Currently full - not accepting</option>
          <option value="WAITLIST">Waitlist available</option>
        </select>
      </div>
      <ChipPicker name="participantTypes" options={PARTICIPANT_TYPES} label="Participant Types Supported" />
      <ChipPicker name="participantComplexityAccepted" options={['Low', 'Medium', 'High', 'Complex / Intensive']} label="Complexity Levels Accepted" />
      <ChipPicker name="staffCapability" options={STAFF_CAPABILITIES} label="Staff Capabilities" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle label="Can Fill Urgent / Last-Minute Shifts" name="abilityToFillUrgentShifts"
          desc="Your organisation can respond to urgent shift requests within 24-48 hours" />
        <Toggle label="Can Post Live Availability" name="abilityToPostLiveAvailability"
          desc="Your team can update real-time availability on the platform" />
      </div>
    </div>
  );
}
