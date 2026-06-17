'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

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

      {/* Social Links */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Social Media <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { field: 'socialLinks.facebook', placeholder: 'https://facebook.com/yourpage', icon: 'bi-facebook' },
            { field: 'socialLinks.instagram', placeholder: 'https://instagram.com/yourhandle', icon: 'bi-instagram' },
            { field: 'socialLinks.linkedin', placeholder: 'https://linkedin.com/company/yourpage', icon: 'bi-linkedin' },
          ].map(({ field, placeholder, icon }) => (
            <div key={field} style={{ position: 'relative' }}>
              <i className={`bi ${icon}`} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)', fontSize: 14 }} />
              <input {...register(field)} type="url" placeholder={placeholder}
                style={{ ...inputStyle, paddingLeft: 36 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Marketplace flags */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Platform Features</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Toggle label="Seeking a Plan Manager" name="seekingPlanManager"
            desc="Plan managers will be able to see you're looking for a plan management partner" />
          <Toggle label="Post Support Requests" name="canPostRequests"
            desc="Post requests on the marketplace for support workers or services" />
          <Toggle label="Access Worker Marketplace" name="canViewWorkerMarketplace"
            desc="Browse and contact support workers directly" />
          <Toggle label="Post Worker Requirements" name="canPostWorkerRequirements"
            desc="Advertise specific worker roles or skill requirements" />
          <Toggle label="Post SIL / SDA Vacancies" name="canPostSilSdaVacancies"
            desc="List accommodation vacancies visible to participants and coordinators" />
        </div>
      </div>
    </div>
  );
}
