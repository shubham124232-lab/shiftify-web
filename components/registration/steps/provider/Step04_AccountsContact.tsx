'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep04_AccountsContact() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 10 }}>Accounts / Finance Contact</div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--clr-muted)' }}>
          For invoices and billing enquiries. Leave blank if the same as primary contact.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input {...register('accountsContactName')} placeholder="Finance Manager" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input {...register('accountsContactEmail')} type="email" placeholder="accounts@organisation.com"
              style={{ ...inputStyle, borderColor: errors.accountsContactEmail ? '#ef4444' : undefined }} />
            {errors.accountsContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.accountsContactEmail.message as string}</p>}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 10 }}>
          Secondary Contact <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--clr-muted)' }}>
          An additional point of contact (e.g. compliance officer, operations manager).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input {...register('secondaryContactName')} placeholder="Jane Smith" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role / Title</label>
              <input {...register('secondaryContactRole')} placeholder="Operations Manager" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input {...register('secondaryContactPhone')} type="tel" placeholder="0400 000 000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input {...register('secondaryContactEmail')} type="email" placeholder="contact@organisation.com"
                style={{ ...inputStyle, borderColor: errors.secondaryContactEmail ? '#ef4444' : undefined }} />
              {errors.secondaryContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.secondaryContactEmail.message as string}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
