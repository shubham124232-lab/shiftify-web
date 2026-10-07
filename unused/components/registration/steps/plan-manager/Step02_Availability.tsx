'use client';
import { useFormContext } from 'react-hook-form';

function CheckboxDeclaration({ name, label }: { name: string; label: React.ReactNode }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const val = watch(name) as boolean;
  const err = (errors[name]?.message) as string | undefined;
  return (
    <label style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '14px', border: `1.5px solid ${err ? '#ef4444' : val ? '#22c55e' : 'var(--clr-border)'}`, borderRadius: 10, background: val ? '#F0FFF4' : '#fff', alignItems: 'flex-start' }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1, border: `2px solid ${val ? '#22c55e' : 'var(--clr-border)'}`, background: val ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {val && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 12 }} />}
      </div>
      <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export function PmStep02_Availability() {
  const { register, watch, formState: { errors } } = useFormContext();
  const accepting = watch('acceptingClients') as boolean;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Accepting clients */}
      <div style={{
        padding: '16px', borderRadius: 12,
        border: `1.5px solid ${accepting ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
        background: accepting ? 'rgba(79,70,229,0.06)' : 'var(--clr-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' }}>Accepting New Clients</div>
            <div style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 2 }}>
              Controls whether participants and coordinators can find you in the Plan Manager directory
            </div>
          </div>
          <label style={{ cursor: 'pointer', flexShrink: 0 }}>
            <input type="checkbox" {...register('acceptingClients')} style={{ display: 'none' }} />
            <div style={{ width: 48, height: 26, borderRadius: 13, background: accepting ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: accepting ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </label>
        </div>
        {accepting && (
          <div style={{ padding: '8px 10px', background: 'rgba(22,163,74,0.1)', borderRadius: 8, fontSize: 12, color: '#15803d', fontWeight: 500 }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }} />
            You will appear in Plan Manager search results
          </div>
        )}
      </div>

      {/* Declarations */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 10 }}>Platform Declaration <span style={{ color: '#ef4444' }}>*</span></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CheckboxDeclaration name="termsAccepted"
            label={<>I have read and agree to the Shiftify <a href="/terms" target="_blank" style={{ color: 'var(--clr-primary)' }}>Terms & Conditions</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--clr-primary)' }}>Privacy Policy</a>.</>} />
          <CheckboxDeclaration name="ndisCodeAccepted"
            label="I commit to upholding the NDIS Code of Conduct and my obligations as a Plan Manager." />
        </div>
        {(errors.termsAccepted || errors.ndisCodeAccepted) && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>Please accept both declarations to complete your profile.</p>
        )}
      </div>
    </div>
  );
}
