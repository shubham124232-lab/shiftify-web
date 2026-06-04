'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep10_About() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Business Description</label>
        <textarea {...register('businessDescription')} rows={6}
          placeholder="Tell participants, coordinators and plan managers about your organisation — your values, experience, approach to care…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>This appears on your provider profile page. Be warm, specific and professional.</p>
      </div>
      <div>
        <label style={labelStyle}>Website URL</label>
        <input {...register('websiteUrl')} type="url" placeholder="https://yourorganisation.com.au"
          style={{ ...inputStyle, borderColor: errors.websiteUrl ? '#ef4444' : undefined }} />
        {errors.websiteUrl && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.websiteUrl.message as string}</p>}
      </div>
    </div>
  );
}
