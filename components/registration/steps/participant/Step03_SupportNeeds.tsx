'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const DISABILITY_TYPES = ['Autism Spectrum Disorder', 'Intellectual Disability', 'Physical Disability', 'Acquired Brain Injury', 'Psychosocial / Mental Health', 'Sensory Impairment', 'Neurological Condition', 'Multiple Conditions', 'Other'];
const MOBILITY_NEEDS   = ['Wheelchair user', 'Walking frame', 'Manual transfers needed', 'Hoist required', 'Independent mobility', 'Limited mobility'];
const COMMS_NEEDS      = ['Verbal communication', 'Non-verbal / AAC device', 'Simplified language', 'Visual supports', 'Sign language / Auslan', 'Interpreter required'];
const BEHAVIOUR_NOTES  = ['Challenging behaviours', 'Behaviour support plan in place', 'Requires consistent routine', 'Sensory sensitivities', 'Elopement risk'];
const MEDICAL_NOTES    = ['Epilepsy', 'Diabetes management', 'Complex medication needs', 'Enteral feeding', 'Respiratory support', 'Allergy management'];

function ChipPicker({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={labelStyle}>{label}</label>
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
                {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                {opt}
              </button>
            );
          })}
        </div>
      )} />
    </div>
  );
}

export function ParticipantStep03_SupportNeeds() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-muted)', background: 'var(--clr-surface)', padding: 12, borderRadius: 8 }}>
        <i className="bi bi-shield-lock" style={{ marginRight: 6, color: 'var(--clr-primary)' }} />
        This information is private. It is only shared with the support worker assigned to your job.
      </p>
      <div>
        <label style={labelStyle}>Primary Disability / Condition</label>
        <select {...register('primaryDisability')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {DISABILITY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <ChipPicker name="mobilitySupportNeeds" options={MOBILITY_NEEDS} label="Mobility Support Needs" />
      <ChipPicker name="communicationNeeds" options={COMMS_NEEDS} label="Communication Needs" />
      <ChipPicker name="behaviourSensoryNotes" options={BEHAVIOUR_NOTES} label="Behaviour & Sensory Notes" />
      <ChipPicker name="medicalConsiderations" options={MEDICAL_NOTES} label="Medical Considerations" />
      <div>
        <label style={labelStyle}>Risk & Safety Notes</label>
        <textarea {...register('riskSafetyNotes')} rows={3} placeholder="Any safety considerations, risks, or important context the support worker should know…" style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
      </div>
    </div>
  );
}
