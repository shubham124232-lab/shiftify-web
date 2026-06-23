'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { FileUploadField } from '../../fields/FileUploadField';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const LANGUAGES = ['English','Arabic','Cantonese','Dari','Greek','Hindi','Italian','Khmer','Korean','Macedonian','Mandarin','Persian','Polish','Punjabi','Serbian','Somali','Spanish','Tagalog','Tamil','Turkish','Ukrainian','Vietnamese'];
const GENDERS   = ['Male','Female','Non-binary','Gender diverse','Prefer not to say'];

function Toggle({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      padding: '14px 16px', borderRadius: 10, border: `1.5px solid ${val ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
      background: val ? 'rgba(79,70,229,0.04)' : '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
        <input type="checkbox" {...register(name)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 24, background: val ? 'var(--clr-primary)' : '#ccc', transition: '0.2s', cursor: 'pointer' }} />
        <span style={{ position: 'absolute', top: 3, left: val ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </label>
    </div>
  );
}

export function CoordStep08_Documents() {
  const { register, setValue, watch, control, formState: { errors } } = useFormContext();
  const photoPreview = watch('profilePhoto') as string | null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Profile photo */}
      <div>
        <label style={labelStyle}>Profile Photo</label>
        <FileUploadField
          label="Upload a professional headshot"
          accept=".jpg,.jpeg,.png,.heic"
          maxSizeMb={10}
          uploadOptions={{ category: 'avatars' }}
          currentValue={photoPreview}
          optional
          helpText="JPG, PNG or HEIC — max 10 MB. A professional headshot builds participant trust."
          onUploaded={(url) => setValue('profilePhoto', url, { shouldValidate: true })}
        />
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle}>Professional Bio <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--clr-muted)' }}>Introduce yourself to participants and families — your experience, approach, and values.</p>
        <textarea {...register('bio')} rows={5} placeholder="e.g. I have 6 years of experience supporting NDIS participants with complex needs across Sydney…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', borderColor: errors.bio ? '#ef4444' : undefined }} />
        {errors.bio && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.bio.message as string}</p>}
      </div>

      {/* Languages */}
      <div>
        <label style={labelStyle}>Languages Spoken</label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select all languages you can support participants in.</p>
        <Controller name="languages" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {LANGUAGES.map(lang => {
              const sel = (field.value ?? []).includes(lang);
              return (
                <button key={lang} type="button"
                  onClick={() => {
                    const cur = field.value ?? [];
                    field.onChange(sel ? cur.filter((s: string) => s !== lang) : [...cur, lang]);
                  }}
                  style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: sel ? 'var(--clr-primary)' : '#fff',
                    color: sel ? '#fff' : 'var(--clr-text)', fontWeight: sel ? 600 : 400 }}>
                  {lang}
                </button>
              );
            })}
          </div>
        )} />
      </div>

      {/* Gender */}
      <div>
        <label style={labelStyle}>Gender Identity</label>
        <select {...register('gender')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Prefer not to say</option>
          {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Some participants have preferences for coordinator gender. This helps with matching.</p>
      </div>

      {/* Seeking plan manager */}
      <Toggle
        name="seekingPlanManager"
        label="Open to Plan Manager Referrals"
        hint="Visible to plan managers who may want to refer participants to you directly."
      />

    </div>
  );
}
