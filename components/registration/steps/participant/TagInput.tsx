'use client';
import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

export function TagInput({ name, placeholder }: { name: string; placeholder?: string }) {
  const { control } = useFormContext();
  const [text, setText] = useState('');
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length > 0 ? 8 : 0 }}>
            {tags.map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--clr-primary)', color: '#fff', borderRadius: 14, padding: '4px 10px', fontSize: 12 }}>
                {t}
                <button type="button" onClick={() => remove(t)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>&times;</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              placeholder={placeholder ?? 'Type and press Enter to add…'}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="button" onClick={add} style={{ padding: '0 16px', borderRadius: 'var(--btn-radius)', background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add</button>
          </div>
        </div>
      );
    }} />
  );
}
