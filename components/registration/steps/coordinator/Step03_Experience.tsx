'use client';
import { useFormContext, Controller } from 'react-hook-form';

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
    </div>
  );
}
