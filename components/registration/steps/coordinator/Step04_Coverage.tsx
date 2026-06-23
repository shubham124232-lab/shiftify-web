'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { useState, KeyboardEvent } from 'react';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

const SERVICE_MODES = [
  { value: 'IN_PERSON',  label: 'In-Person',  desc: 'Face-to-face coordination at participant location' },
  { value: 'TELEHEALTH', label: 'Telehealth',  desc: 'Remote sessions via video or phone' },
  { value: 'HYBRID',     label: 'Hybrid',      desc: 'Mix of in-person and remote coordination' },
];

function TagInput({ name }: { name: string }) {
  const { control, formState: { errors } } = useFormContext();
  const [text, setText] = useState('');
  const err = (errors[name]?.message) as string | undefined;
  return (
    <Controller name={name} control={control} defaultValue={[]} render={({ field }) => {
      const tags: string[] = field.value ?? [];
      const add = () => {
        const v = text.trim();
        if (v && !tags.includes(v)) field.onChange([...tags, v]);
        setText('');
      };
      const remove = (t: string) => field.onChange(tags.filter(x => x !== t));
      return (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--clr-primary)', color: '#fff', borderRadius: 14, padding: '4px 10px', fontSize: 12 }}>
                {t}
                <button type="button" onClick={() => remove(t)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>&times;</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
              placeholder="e.g. Sydney CBD, Northern Beaches…" style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={add} style={{ padding: '0 16px', borderRadius: 'var(--btn-radius)', background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add</button>
          </div>
          {err && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{err}</p>}
        </div>
      );
    }} />
  );
}

export function CoordStep04_Coverage() {
  const { register, watch } = useFormContext();
  const mode = watch('serviceMode') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Service areas */}
      <div>
        <label style={labelStyle}>Service Area(s) <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Add the suburbs, regions, or LGAs you cover. Press Enter or comma to add each one.</p>
        <TagInput name="serviceAreas" />
      </div>

      {/* Service mode */}
      <div>
        <label style={labelStyle}>Service Mode <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>How do you deliver your coordination services?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SERVICE_MODES.map(sm => (
            <label key={sm.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${mode === sm.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: mode === sm.value ? 'rgba(79,70,229,0.05)' : '#fff' }}>
              <input type="radio" value={sm.value} {...register('serviceMode')} style={{ marginTop: 2, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{sm.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{sm.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
