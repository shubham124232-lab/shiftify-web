'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep04_AccountsContact() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        For invoices and billing enquiries. Leave blank if the same as primary contact.
      </p>
      <div><label style={labelStyle}>Accounts Contact Name</label><input {...register('accountsContactName')} placeholder="Finance Manager" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Accounts Email</label>
        <input {...register('accountsContactEmail')} type="email" placeholder="accounts@organisation.com" style={{ ...inputStyle, borderColor: errors.accountsContactEmail ? '#ef4444' : undefined }} />
        {errors.accountsContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.accountsContactEmail.message as string}</p>}
      </div>
    </div>
  );
}
