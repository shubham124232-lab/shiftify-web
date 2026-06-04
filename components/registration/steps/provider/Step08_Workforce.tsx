'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

const WORKFORCE_SIZES = ['1–5', '6–15', '16–30', '31–50', '51–100', '100+'];
const PARTICIPANT_TYPES = [
  'Adults (18–64)', 'Older Adults (65+)', 'Children (0–17)',
  'Autism Spectrum', 'Acquired Brain Injury', 'Physical Disability',
  'Intellectual Disability', 'Psychosocial Disability', 'Sensory Impairment',
  'Complex / High Needs', 'Challenging Behaviours',
];

export function ProviderStep08_Workforce() {
  const { register, control, formState: { errors } } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Workforce Size</label>
        <select {...register('workforceSize')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select team size…</option>
          {WORKFORCE_SIZES.map(s => <option key={s} value={s}>{s} workers</option>)}
        </select>
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Participant Types Supported</label>
        <Controller
          name="participantTypes"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PARTICIPANT_TYPES.map(pt => {
                const selected = (field.value ?? []).includes(pt);
                return (
                  <button key={pt} type="button"
                    onClick={() => {
                      const cur = field.value ?? [];
                      field.onChange(selected ? cur.filter((s: string) => s !== pt) : [...cur, pt]);
                    }}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                      background: selected ? 'rgba(79,70,229,0.1)' : '#fff',
                      color: selected ? 'var(--clr-primary)' : 'var(--clr-text)', cursor: 'pointer',
                    }}>
                    {selected && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                    {pt}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
}
