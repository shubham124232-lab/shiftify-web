'use client';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FileUploadField } from '../../fields/FileUploadField';
import { upsertProfile }   from '@/lib/api/profile';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep11_Documents() {
  const { register, formState: { errors } } = useFormContext();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  async function handleLogoUploaded(url: string) {
    setLogoUrl(url);
    await upsertProfile('PROVIDER', { logoUrl: url }).catch(() => null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Business description */}
      <div>
        <label style={labelStyle}>Business Description</label>
        <textarea {...register('businessDescription')} rows={5}
          placeholder="Tell participants, coordinators and plan managers about your organisation — your values, experience and approach to care…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Appears on your provider profile. Be warm, specific and professional.</p>
      </div>

      {/* Logo */}
      <div>
        <label style={labelStyle}>Organisation Logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--clr-surface)', borderRadius: 12, marginBottom: 10 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
            border: '1.5px solid var(--clr-border)',
            background: logoUrl ? 'transparent' : 'rgba(79,70,229,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <i className="bi bi-building-fill" style={{ fontSize: 26, color: 'var(--clr-primary)', opacity: 0.5 }} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Organisation Logo</div>
            <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>JPG, PNG, HEIC or WebP · Max 5 MB · Square or landscape preferred</div>
          </div>
        </div>
        <FileUploadField
          label="Upload Logo"
          accept=".jpg,.jpeg,.png,.heic,.webp"
          maxSizeMb={5}
          uploadOptions={{ category: 'avatars' }}
          currentValue={logoUrl}
          optional
          onUploaded={handleLogoUploaded}
        />
      </div>

      {/* Website */}
      <div>
        <label style={labelStyle}>Website URL <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span></label>
        <input {...register('websiteUrl')} type="url" placeholder="https://yourorganisation.com.au"
          style={{ ...inputStyle, borderColor: errors.websiteUrl ? '#ef4444' : undefined }} />
        {errors.websiteUrl && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.websiteUrl.message as string}</p>}
      </div>

      {/* Social links */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Social Media <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { field: 'socialLinks.facebook',  placeholder: 'https://facebook.com/yourpage',    icon: 'bi-facebook'  },
            { field: 'socialLinks.instagram', placeholder: 'https://instagram.com/yourhandle', icon: 'bi-instagram' },
            { field: 'socialLinks.linkedin',  placeholder: 'https://linkedin.com/company/…',  icon: 'bi-linkedin'  },
          ].map(({ field, placeholder, icon }) => (
            <div key={field} style={{ position: 'relative' }}>
              <i className={`bi ${icon}`} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)', fontSize: 14 }} />
              <input {...register(field)} type="url" placeholder={placeholder}
                style={{ ...inputStyle, paddingLeft: 36 }} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
