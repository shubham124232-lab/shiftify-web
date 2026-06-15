'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 10 };

export function PmStep01_Business() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Legal Identity */}
      <div>
        <div style={sectionTitle}>Legal Identity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Business / Trading Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input {...register('businessName')} placeholder="e.g. Smith Plan Management" style={{ ...inputStyle, borderColor: errors.businessName ? '#ef4444' : undefined }} />
            {errors.businessName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.businessName.message as string}</p>}
          </div>
          <div><label style={labelStyle}>Legal Entity Name</label><input {...register('legalEntityName')} placeholder="As registered with ASIC" style={inputStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>ABN</label><input {...register('abn')} placeholder="XX XXX XXX XXX" style={inputStyle} /></div>
            <div><label style={labelStyle}>ACN <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>if applicable</span></label><input {...register('acn')} placeholder="XXX XXX XXX" style={inputStyle} /></div>
          </div>
          <div>
            <label style={labelStyle}>Business Structure</label>
            <select {...register('businessStructure')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select…</option>
              <option value="SOLE_TRADER">Sole Trader</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="COMPANY">Company (Pty Ltd)</option>
              <option value="TRUST">Trust</option>
              <option value="NOT_FOR_PROFIT">Not-for-Profit / Association</option>
            </select>
          </div>
          <div><label style={labelStyle}>Trust Name <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>if trust structure</span></label><input {...register('trustName')} placeholder="e.g. Smith Family Trust" style={inputStyle} /></div>
        </div>
      </div>

      {/* Director / Principal */}
      <div>
        <div style={sectionTitle}>Principal Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>Director / Principal Name</label><input {...register('directorName')} placeholder="Full name" style={inputStyle} /></div>
          <div><label style={labelStyle}>Position / Title</label><input {...register('directorPosition')} placeholder="e.g. Director" style={inputStyle} /></div>
        </div>
      </div>

      {/* Business Address */}
      <div>
        <div style={sectionTitle}>Business Address</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={labelStyle}>Street Address</label><input {...register('businessAddress')} placeholder="123 Example St" style={inputStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Suburb</label><input {...register('businessSuburb')} placeholder="Suburb" style={inputStyle} /></div>
            <div><label style={labelStyle}>State</label>
              <select {...register('businessState')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">State</option>
                {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Postcode</label><input {...register('businessPostcode')} placeholder="0000" maxLength={4} style={inputStyle} /></div>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <div style={sectionTitle}>Business Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>Business Phone</label><input {...register('businessPhone')} type="tel" placeholder="(02) 0000 0000" style={inputStyle} /></div>
          <div><label style={labelStyle}>Business Email</label><input {...register('businessEmail')} type="email" placeholder="info@planmanager.com.au" style={inputStyle} /></div>
          <div><label style={labelStyle}>Website</label><input {...register('websiteUrl')} type="url" placeholder="https://yoursite.com.au" style={inputStyle} /></div>
          <div><label style={labelStyle}>Finance Team Email</label><input {...register('financeTeamEmail')} type="email" placeholder="finance@planmanager.com.au" style={inputStyle} /></div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={labelStyle}>Accounts Payable Phone</label>
          <input {...register('accountsPayablePhone')} type="tel" placeholder="0400 000 000" style={inputStyle} />
        </div>
      </div>

      {/* Operation */}
      <div>
        <label style={labelStyle}>Years in Operation</label>
        <select {...register('yearsInOperation')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}
