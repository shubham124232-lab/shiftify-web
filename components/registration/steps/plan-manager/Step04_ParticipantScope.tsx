'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const PARTICIPANT_TYPES = [
  'Children (under 18)', 'Adults (18–64)', 'Older Adults (65+)',
  'Early Childhood (0–6)', 'Autism Spectrum', 'Psychosocial / Mental Health',
  'Physical Disability', 'Intellectual Disability', 'Acquired Brain Injury',
  'Sensory Impairment', 'Complex / High Needs',
];
const COMPLEXITY = [
  'Standard caseload', 'Challenging behaviours', 'Multiple providers',
  'Justice involvement', 'Homeless / at risk', 'CALD backgrounds',
  'English as second language',
];

function ChipPicker({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>{label}</label>
      <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
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

export function PmStep04_ParticipantScope() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ChipPicker name="participantTypesSupported" options={PARTICIPANT_TYPES} label="Participant Types Supported" />
      <ChipPicker name="participantComplexityExperience" options={COMPLEXITY} label="Complexity Experience" />
    </div>
  );
}
