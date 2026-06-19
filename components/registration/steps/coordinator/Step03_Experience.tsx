'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const COORD_LEVELS = [
  'Support Connection (Level 1)',
  'Support Coordination (Level 2)',
  'Specialist Support Coordination (Level 3)',
];
const COMPLEXITY = [
  'Psychosocial Disability', 'Autism', 'Physical Disability', 'Intellectual Disability',
  'Complex Behaviour', 'High Medical Needs', 'Early Childhood', 'Complex Trauma',
  'Justice Involvement', 'Ageing & NDIS Overlap',
];
const EXTRA_SVCS = [
  'Plan Reviews Support', 'Crisis Management', 'Housing Navigation (SIL / SDA)',
  'Provider Sourcing', 'Capacity Building', 'Allied Health Liaison', 'Housing Transitions',
];
const QUALIFICATIONS_OPTIONS = [
  'Certificate III Individual Support', 'Certificate IV Disability',
  'Diploma Community Services', 'Bachelor Social Work', 'Other',
];
const YRS_EXP = ['0-1', '1-3', '3-5', '5+'];

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
                  border: '1.5px solid ' + (selected ? 'var(--clr-primary)' : 'var(--clr-border)'),
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
  const { control } = useFormContext();
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>
        Relevant Qualifications <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span>
      </label>
      <Controller name="qualifications" control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {QUALIFICATIONS_OPTIONS.map(opt => {
            const current = (field.value ?? []) as Array<{ name: string }>;
            const selected = current.some((q) => q.name === opt);
            return (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                border: '1.5px solid ' + (selected ? 'var(--clr-primary)' : 'var(--clr-border)'),
                borderRadius: 8, background: selected ? 'rgba(79,70,229,0.06)' : '#fff',
              }}>
                <input type="checkbox" style={{ display: 'none' }} checked={selected}
                  onChange={() => {
                    if (selected) field.onChange(current.filter((q) => q.name !== opt));
                    else field.onChange([...current, { name: opt, institution: '' }]);
                  }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: '2px solid ' + (selected ? 'var(--clr-primary)' : 'var(--clr-border)'),
                  background: selected ? 'var(--clr-primary)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 9 }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )} />
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
          <option value="">Select...</option>
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
