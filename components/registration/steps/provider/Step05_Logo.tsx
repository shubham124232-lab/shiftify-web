'use client';
import { useState } from 'react';
import { FileUploadField } from '../../fields/FileUploadField';
import { upsertProfile } from '@/lib/api/profile';

export function ProviderStep05_Logo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  async function handleLogoUploaded(url: string) {
    setLogoUrl(url);
    // Save logoUrl into the provider profile immediately (upsert is partial-safe)
    await upsertProfile('PROVIDER', { logoUrl: url }).catch(() => null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        Your organisation logo appears on your provider profile and in search results. Use a square or landscape format, min 200×200px.
      </p>

      {/* Logo preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--clr-surface)', borderRadius: 12 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
          border: '1.5px solid var(--clr-border)',
          background: logoUrl ? 'transparent' : 'rgba(79,70,229,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <i className="bi bi-building-fill" style={{ fontSize: 28, color: 'var(--clr-primary)', opacity: 0.5 }} />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>Organisation Logo</div>
          <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>JPG, PNG, HEIC or WebP · Max 5 MB</div>
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
  );
}
