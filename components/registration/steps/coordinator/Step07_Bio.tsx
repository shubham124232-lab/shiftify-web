'use client';
import { useFormContext } from 'react-hook-form';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10 }}>
      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>{desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}</div>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

function ProfilePhotoUpload() {
  const { setValue, watch } = useFormContext();
  const current = watch('profilePhoto') as string | undefined;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await api.post<{ url: string }>('/upload/avatar', form);
      setValue('profilePhoto', res.url, { shouldDirty: true });
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label style={labelStyle}>Profile Photo <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(optional)</span></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--clr-border)', overflow: 'hidden', flexShrink: 0, background: 'var(--clr-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {current
            ? <img src={current} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <i className="bi bi-person-fill" style={{ fontSize: 36, color: 'var(--clr-muted)' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" disabled={uploading}
            onClick={() => inputRef.current?.click()}
            style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1.5px solid var(--clr-primary)', background: '#fff', color: 'var(--clr-primary)', fontWeight: 600, fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading…' : current ? 'Change Photo' : 'Upload Photo'}
          </button>
          {current && (
            <button type="button" onClick={() => setValue('profilePhoto', '', { shouldDirty: true })}
              style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1.5px solid var(--clr-border)', background: '#fff', color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Remove
            </button>
          )}
          <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: 0 }}>JPG, PNG or WebP · Max 5 MB</p>
        </div>
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

export function CoordStep07_Bio() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProfilePhotoUpload />
      <div>
        <label style={labelStyle}>Professional Bio</label>
        <textarea {...register('bio')} rows={6}
          placeholder="Tell participants and families about your background, approach to coordination and what sets you apart as a coordinator…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>This appears on your coordinator profile visible to participants and families.</p>
      </div>
      <Toggle label="Seeking a Plan Manager" name="seekingPlanManager" desc="Plan Managers in your area can see your profile and reach out" />
    </div>
  );
}
