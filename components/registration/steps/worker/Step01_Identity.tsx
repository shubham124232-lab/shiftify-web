'use client';
import { useFormContext } from 'react-hook-form';
import { useState }       from 'react';
import { FileUploadField } from '../../fields/FileUploadField';
import { useAuthStore }    from '@/lib/store/auth.store';
import { updateAvatarUrl } from '@/lib/api/profile';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];

export function WorkerStep01_Identity() {
  const { register, formState: { errors }, watch } = useFormContext();
  const user = useAuthStore(s => s.user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.profile?.avatarUrl ?? null);

  async function handleAvatarUploaded(url: string) {
    setAvatarUrl(url);
    await updateAvatarUrl(url).catch(() => null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Profile Photo */}
      <div>
        <label style={labelStyle}>Profile Photo <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 0, marginBottom: 8 }}>
          A clear, professional photo helps participants recognise you. Max 5 MB.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: avatarUrl ? 'transparent' : 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <i className="bi bi-person-fill" style={{ fontSize: 28, color: 'var(--clr-primary)' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <FileUploadField label="Upload Photo" accept=".jpg,.jpeg,.png,.heic,.webp" maxSizeMb={5}
              uploadOptions={{ category: 'avatars' }} currentValue={avatarUrl} onUploaded={handleAvatarUploaded} />
          </div>
        </div>
      </div>

      {/* Suburb + Postcode + State */}
      <div>
        <label style={labelStyle}>Location <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px', gap: 10 }}>
          <div>
            <input id="suburb" {...register('suburb')} placeholder="Suburb" style={{ ...inputStyle, borderColor: errors.suburb ? '#ef4444' : undefined }} />
            {errors.suburb && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.suburb.message as string}</p>}
          </div>
          <div>
            <input {...register('postcode')} placeholder="Postcode" style={inputStyle} maxLength={4} />
          </div>
          <div>
            <select id="state" {...register('state')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">State</option>
              {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.state.message as string}</p>}
          </div>
        </div>
      </div>

      {/* DOB */}
      <div>
        <label htmlFor="dob" style={labelStyle}>Date of Birth</label>
        <input id="dob" type="date" {...register('dob')} style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Used for age verification. Not shown publicly.</p>
      </div>

      {/* Gender */}
      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GENDERS.map(g => {
            const current = watch('gender');
            return (
              <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', borderRadius: 20,
                border: `1.5px solid ${current === g ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                background: current === g ? 'rgba(79,70,229,0.07)' : '#fff', fontSize: 12, fontWeight: 500,
                color: current === g ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                <input type="radio" value={g} {...register('gender')} style={{ display: 'none' }} />
                {g}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
