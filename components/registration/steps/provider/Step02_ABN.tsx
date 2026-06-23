'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const sectionLabel: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 10 };

export function ProviderStep02_ABN() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Primary Contact */}
      <div>
        <div style={sectionLabel}>Primary Contact Person</div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--clr-muted)' }}>
          The person participants and coordinators will contact for bookings and enquiries.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input {...register('primaryContactName')} placeholder="Jane Smith"
              style={{ ...inputStyle, borderColor: errors.primaryContactName ? '#ef4444' : undefined }} />
            {errors.primaryContactName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.primaryContactName.message as string}</p>}
          </div>
          <div>
            <label style={labelStyle}>Role / Title</label>
            <select {...register('primaryContactRole')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select role…</option>
              <option value="Director">Director</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
              <option value="Operations Manager">Operations Manager</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Phone <span style={{ color: '#ef4444' }}>*</span></label>
              <input {...register('primaryContactPhone')} type="tel" placeholder="+61 4xx xxx xxx"
                style={{ ...inputStyle, borderColor: errors.primaryContactPhone ? '#ef4444' : undefined }} />
              {errors.primaryContactPhone && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.primaryContactPhone.message as string}</p>}
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input {...register('primaryContactEmail')} type="email" placeholder="contact@org.com.au"
                style={{ ...inputStyle, borderColor: errors.primaryContactEmail ? '#ef4444' : undefined }} />
              {errors.primaryContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.primaryContactEmail.message as string}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Accounts / Billing Contact */}
      <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 18 }}>
        <div style={sectionLabel}>Accounts / Billing Contact</div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--clr-muted)' }}>
          For invoices and payment enquiries. Leave blank if same as primary contact.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input {...register('accountsContactName')} placeholder="Finance Manager" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input {...register('accountsContactEmail')} type="email" placeholder="accounts@org.com.au"
              style={{ ...inputStyle, borderColor: errors.accountsContactEmail ? '#ef4444' : undefined }} />
            {errors.accountsContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.accountsContactEmail.message as string}</p>}
          </div>
        </div>
      </div>

      {/* Secondary Contact */}
      <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 18 }}>
        <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 8 }}>
          Secondary Contact
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--clr-muted)' }}>
          An additional point of contact e.g. compliance officer.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input {...register('secondaryContactName')} placeholder="Jane Smith" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role / Title</label>
              <input {...register('secondaryContactRole')} placeholder="Compliance Officer" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input {...register('secondaryContactPhone')} type="tel" placeholder="0400 000 000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input {...register('secondaryContactEmail')} type="email" placeholder="secondary@org.com.au"
                style={{ ...inputStyle, borderColor: errors.secondaryContactEmail ? '#ef4444' : undefined }} />
              {errors.secondaryContactEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.secondaryContactEmail.message as string}</p>}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
