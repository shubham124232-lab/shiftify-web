'use client';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const COORD_LEVELS = ['Level 1 — Support Connection', 'Level 2 — Coordination of Supports', 'Level 3 — Specialist Support Coordination'];
const COMPLEXITY   = ['Early Childhood', 'Complex Trauma', 'Justice Involvement', 'Psychosocial / Mental Health', 'Challenging Behaviours', 'High Physical Support Needs', 'Ageing & NDIS Overlap'];
const EXTRA_SVCS   = ['Capacity Building', 'Plan Reviews', 'SIL Coordination', 'Plan Management', 'Allied Health Liaison', 'Housing Transitions'];
const YRS_EXP      = ['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years'];

function ChipSelector({ name, options, label, error }: { name: string; options: string[]; label: string; error?: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map(opt => {
            const selected = (field.value ?? []).includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => { const cur = field.value ?? []; field.onChange(selected ? cur.filter((s: string) => s !== opt) : [...cur, opt]); }}
                style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: selected ? 'rgba(79,70,229,0.1)' : '#fff',
                  color: selected ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                {selected && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                {opt}
              </button>
            );
          })}
        </div>
      )} />
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function QualificationsField() {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'qualifications' });
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>
        Qualifications <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span>
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map((field, idx) => (
          <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <input {...register(`qualifications.${idx}.name`)} placeholder="Qualification name" style={{ ...inputStyle, fontSize: 12 }} />
            <input {...register(`qualifications.${idx}.institution`)} placeholder="Institution (optional)" style={{ ...inputStyle, fontSize: 12 }} />
            <button type="button" onClick={() => remove(idx)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--clr-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
              <i className="bi bi-x" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => append({ name: '', institution: '' })}
          style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 8, border: '1.5px dashed var(--clr-border)', background: '#fff', cursor: 'pointer', fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-plus" style={{ marginRight: 4 }} />Add Qualification
        </button>
      </div>
    </div>
  );
}

export function CoordStep03_Experience() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Years of Experience <span style={{ color: '#ef4444' }}>*</span></label>
        <select {...register('yearsExperience')} style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.yearsExperience ? '#ef4444' : undefined }}>
          <option value="">Select…</option>
          {YRS_EXP.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {errors.yearsExperience && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.yearsExperience.message as string}</p>}
      </div>
      <ChipSelector name="supportCoordinationLevel" options={COORD_LEVELS} label="Coordination Level(s) *" error={errors.supportCoordinationLevel?.message as string} />
      <ChipSelector name="participantComplexityExperience" options={COMPLEXITY} label="Complexity Experience" />
      <ChipSelector name="servicesOfferedBeyondCoordination" options={EXTRA_SVCS} label="Additional Services Offered" />
      <QualificationsField />
    </div>
  );
}
