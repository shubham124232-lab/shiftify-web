'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const STAFF_ROLES = ['Billing Officer', 'Account Manager', 'Compliance Officer', 'Customer Service', 'Administrator'];

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

export function PmStep08_StaffModel() {
  const { register, watch, control, formState: { errors } } = useFormContext();
  const model = watch('organisationUserModel') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Organisation User Model</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'SINGLE', label: 'Single User', desc: 'Just you — sole trader or principal managing everything' },
            { value: 'SMALL_TEAM', label: 'Small Team', desc: '2–5 staff accessing the platform' },
            { value: 'LARGE_ORGANISATION', label: 'Large Organisation', desc: '6+ staff with separate admin and case manager roles' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${model === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: model === opt.value ? 'rgba(79,70,229,0.06)' : '#fff' }}>
              <input type="radio" value={opt.value} {...register('organisationUserModel')} style={{ marginTop: 3, accentColor: 'var(--clr-primary)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {(model === 'SMALL_TEAM' || model === 'LARGE_ORGANISATION') && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Primary Admin Name</label><input {...register('staffAdminName')} placeholder="Full name" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Primary Admin Email</label>
              <input {...register('staffAdminEmail')} type="email" placeholder="admin@planmanager.com.au" style={{ ...inputStyle, borderColor: errors.staffAdminEmail ? '#ef4444' : undefined }} />
              {errors.staffAdminEmail && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.staffAdminEmail.message as string}</p>}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Staff Seats Required</label>
            <input type="number" min={1} max={500} {...register('staffSeatsRequired', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
              placeholder="e.g. 5" style={{ ...inputStyle, borderColor: errors.staffSeatsRequired ? '#ef4444' : undefined }} />
            {errors.staffSeatsRequired && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.staffSeatsRequired.message as string}</p>}
            <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Number of staff who need platform access. Determines your subscription tier.</p>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>Staff Roles</label>
            <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: '0 0 8px' }}>Which roles exist within your organisation?</p>
            <Controller name="staffRoles" control={control} defaultValue={[]} render={({ field }) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {STAFF_ROLES.map(role => {
                  const sel = (field.value ?? []).includes(role);
                  return (
                    <button key={role} type="button"
                      onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== role) : [...cur, role]); }}
                      style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                        background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                      {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{role}
                    </button>
                  );
                })}
              </div>
            )} />
          </div>

          <Toggle label="Admin-Only Billing Mode" name="adminOnlyBillingMode"
            desc="Only staff with the Administrator role can create, edit or approve invoices" />
        </>
      )}
    </div>
  );
}
