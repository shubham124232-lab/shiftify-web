'use client';
import { useFormContext } from 'react-hook-form';

function CheckboxDeclaration({ name, label }: { name: string; label: React.ReactNode }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const val = watch(name) as boolean;
  const err = (errors[name]?.message) as string | undefined;
  return (
    <label style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '14px',
      border: `1.5px solid ${err ? '#ef4444' : val ? '#22c55e' : 'var(--clr-border)'}`,
      borderRadius: 10, background: val ? '#F0FFF4' : '#fff', alignItems: 'flex-start' }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `2px solid ${val ? '#22c55e' : 'var(--clr-border)'}`,
        background: val ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {val && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 12 }} />}
      </div>
      <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export function ParticipantStep05_Declaration() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 14 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
          <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
          You can upload NDIS plan documents from your Documents page at any time.
        </p>
      </div>
      <CheckboxDeclaration name="termsAccepted"
        label={<>I have read and agree to the Shiftify <a href="/terms" target="_blank" style={{ color: 'var(--clr-primary)' }}>Terms &amp; Conditions</a>.</>} />
      <CheckboxDeclaration name="privacyPolicyAccepted"
        label={<>I have read and agree to the Shiftify <a href="/privacy" target="_blank" style={{ color: 'var(--clr-primary)' }}>Privacy Policy</a>.</>} />
      <CheckboxDeclaration name="ndisCodeAccepted"
        label="I understand and agree to uphold the NDIS Code of Conduct in all interactions with my supports." />
    </div>
  );
}
