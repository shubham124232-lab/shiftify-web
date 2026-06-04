'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { TagInput } from '../../fields/TagInput';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

const LANGUAGES = ['English', 'Mandarin', 'Arabic', 'Vietnamese', 'Greek', 'Italian', 'Tagalog', 'Hindi', 'Spanish', 'Korean', 'Other'];

export function CoordStep04_Coverage() {
  const { register, control, watch, formState: { errors } } = useFormContext();
  const mode = watch('serviceMode') as string;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Controller name="serviceAreas" control={control} defaultValue={[]} render={({ field }) => (
        <TagInput label="Service Areas *" value={field.value ?? []} onChange={field.onChange}
          placeholder="Type suburb or region, press Enter" error={errors.serviceAreas?.message as string} />
      )} />
      <div>
        <label style={labelStyle}>Service Mode <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ value: 'IN_PERSON', label: 'In-person' }, { value: 'REMOTE', label: 'Remote' }, { value: 'BOTH', label: 'Both' }].map(opt => (
            <label key={opt.value} style={{ flex: 1, padding: '10px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              border: `1.5px solid ${mode === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: mode === opt.value ? 'rgba(79,70,229,0.07)' : '#fff',
              fontSize: 12, fontWeight: 600, color: mode === opt.value ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
              <input type="radio" value={opt.value} {...register('serviceMode')} style={{ display: 'none' }} />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.serviceMode && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.serviceMode.message as string}</p>}
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Languages Spoken</label>
        <Controller name="languages" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(lang => {
              const selected = (field.value ?? []).includes(lang);
              return (
                <button key={lang} type="button"
                  onClick={() => { const cur = field.value ?? []; field.onChange(selected ? cur.filter((s: string) => s !== lang) : [...cur, lang]); }}
                  style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: selected ? 'rgba(79,70,229,0.1)' : '#fff',
                    color: selected ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  {selected && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                  {lang}
                </button>
              );
            })}
          </div>
        )} />
      </div>
    </div>
  );
}
