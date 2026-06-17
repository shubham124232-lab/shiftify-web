'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const DISABILITY_TYPES    = ['Autism Spectrum Disorder', 'Intellectual Disability', 'Physical Disability', 'Acquired Brain Injury', 'Psychosocial / Mental Health', 'Sensory Impairment', 'Neurological Condition', 'Multiple Conditions', 'Other'];
const SUPPORT_NEEDS       = ['Personal Care', 'Community Access', 'Domestic Assistance', 'Transport', 'Allied Health', 'Behaviour Support', 'SIL / Accommodation', 'Early Intervention', 'Day Programs', 'High Intensity Support'];
const MOBILITY_NEEDS      = ['Wheelchair user', 'Walking frame', 'Manual transfers needed', 'Hoist required', 'Independent mobility', 'Limited mobility'];
const COMMS_NEEDS         = ['Verbal communication', 'Non-verbal / AAC device', 'Simplified language', 'Visual supports', 'Sign language / Auslan', 'Interpreter required'];
const BEHAVIOUR_NOTES     = ['Challenging behaviours', 'Behaviour support plan in place', 'Requires consistent routine', 'Sensory sensitivities', 'Elopement risk'];
const MEDICAL_NOTES       = ['Epilepsy', 'Diabetes management', 'Complex medication needs', 'Enteral feeding', 'Respiratory support', 'Allergy management'];
const SUPPORT_PREFERENCES = ['Speaks specific language', 'Cultural background match', 'Has experience with my disability type', 'Non-smoker', 'Pet-friendly', 'Driving required'];
const SKILL_TAGS          = ['Manual handling', 'Hoist operation', 'Medication administration', 'PEG feeding', 'Behaviour support', 'Positive behaviour support', 'Sign language', 'Swimming / aquatic', 'Cooking / meal prep', 'Community access'];
const DAYS                = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_PREFS          = [
  { value: 'MORNING',   label: 'Morning (6am–12pm)' },
  { value: 'AFTERNOON', label: 'Afternoon (12pm–6pm)' },
  { value: 'EVENING',   label: 'Evening (6pm–10pm)' },
  { value: 'OVERNIGHT', label: 'Overnight (10pm–6am)' },
];

function ChipPicker({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={labelStyle}>{label}</label>
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

export function ParticipantStep03_SupportNeeds() {
  const { register, watch } = useFormContext();
  const preferredTime = watch('preferredTime') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ margin: 0, fontSize: 12, color: 'var(--clr-muted)', background: 'var(--clr-surface)', padding: 12, borderRadius: 8 }}>
        <i className="bi bi-shield-lock" style={{ marginRight: 6, color: 'var(--clr-primary)' }} />
        This information is private. It is only shared with the support worker assigned to your job.
      </div>

      {/* Primary Disability */}
      <div>
        <label style={labelStyle}>Primary Disability / Condition</label>
        <select {...register('primaryDisability')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {DISABILITY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <ChipPicker name="primarySupportNeeds" options={SUPPORT_NEEDS} label="Primary Support Needs" />

      {/* Preferred Support Type */}
      <div>
        <label style={labelStyle}>Support Type Needed</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ value: 'ONE_TIME', label: 'One-time' }, { value: 'ONGOING', label: 'Ongoing' }, { value: 'BOTH', label: 'Both' }].map(o => {
            const cur = watch('preferredSupportType');
            return (
              <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', borderRadius: 20,
                border: `1.5px solid ${cur === o.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                background: cur === o.value ? 'rgba(79,70,229,0.07)' : '#fff', fontSize: 12, fontWeight: 500 }}>
                <input type="radio" value={o.value} {...register('preferredSupportType')} style={{ display: 'none' }} />
                {o.label}
              </label>
            );
          })}
        </div>
      </div>

      <ChipPicker name="mobilitySupportNeeds" options={MOBILITY_NEEDS} label="Mobility Support Needs" />
      <ChipPicker name="communicationNeeds" options={COMMS_NEEDS} label="Communication Needs" />
      <ChipPicker name="behaviourSensoryNotes" options={BEHAVIOUR_NOTES} label="Behaviour & Sensory Notes" />
      <ChipPicker name="medicalConsiderations" options={MEDICAL_NOTES} label="Medical Considerations" />

      <div>
        <label style={labelStyle}>Risk & Safety Notes</label>
        <textarea {...register('riskSafetyNotes')} rows={3} placeholder="Any safety considerations, risks, or important context for the support worker…" style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
      </div>

      {/* Worker Preferences */}
      <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 16 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Worker Preferences</p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Preferred Worker Gender</label>
          <select {...register('preferredWorkerGender')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">No preference</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Any">Any gender</option>
          </select>
        </div>

        <ChipPicker name="supportPreferences" options={SUPPORT_PREFERENCES} label="Other Preferences" />

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Language Preference</label>
          <input {...register('languagePreference')} placeholder="e.g. Mandarin, Arabic, Vietnamese…" style={inputStyle} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Cultural Preference</label>
          <input {...register('culturalPreference')} placeholder="e.g. Same cultural background preferred…" style={inputStyle} />
        </div>

        <div style={{ marginTop: 12 }}>
          <ChipPicker name="skillsRequired" options={SKILL_TAGS} label="Specific Skills Required" />
        </div>
      </div>

      {/* Availability */}
      <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 16 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Preferred Availability</p>

        <ChipPicker name="preferredDays" options={DAYS} label="Preferred Days" />

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Preferred Time of Day</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIME_PREFS.map(t => (
              <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px',
                border: `1.5px solid ${preferredTime === t.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                borderRadius: 8, background: preferredTime === t.value ? 'rgba(79,70,229,0.05)' : '#fff', fontSize: 13 }}>
                <input type="radio" value={t.value} {...register('preferredTime')} style={{ accentColor: 'var(--clr-primary)' }} />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
