'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep03_PrimaryContact() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        The person participants and coordinators will contact when making bookings.
      </p>
      <div><label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label><input {...register('primaryContactName')} placeholder="Jane Smith" style={{ ...inputStyle, borderColor: errors.primaryContactName ? '#ef4444' : undefined }} />{errors.primaryContactName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.primaryContactName.message as string}</p>}</div>
      <div><label style={labelStyle}>Role / Title</label><input {...register('primaryContactRole')} placeholder="e.g. Operations Manager" style={inputStyle} /></div>
      <div><label style={labelStyle}>Phone <span style={{ color: '#ef4444' }}>*</span></label><input {...register('primaryContactPhone')} type="tel" placeholder="+61 2 xxxx xxxx" style={{ ...inputStyle, borderColor: errors.primaryContactPhone ? '#ef4444' : undefined }} />{errors.primaryContactPhone && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.primaryContactPhone.message as string}</p>}</div>
      <div><label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label><input {...register('primaryContactEmail')} type="email" placeholder="contact@organisation.com" style={{ ...inputStyle, borderColor: errors.primaryContactEmail ? '#ef4444' : undefined }} />{errors.primaryContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.primaryContactEmail.message as string}</p>}</div>
    </div>
  );
}
