'use client';
import { useFormContext } from 'react-hook-form';

function CheckboxDeclaration({ name, label }: { name: string; label: React.ReactNode }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const val = watch(name) as boolean;
  const err = (errors[name]?.message) as string | undefined;
  return (
    <div>
      <label style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '14px',
        border: `1.5px solid ${err ? 'var(--td-pink)' : val ? 'var(--td-muted-dark)' : 'var(--clr-border)'}`,
        borderRadius: 10, background: val ? 'var(--td-grey-tint)' : 'var(--td-white)', alignItems: 'flex-start' }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
          border: `2px solid ${val ? 'var(--td-muted-dark)' : 'var(--clr-border)'}`,
          background: val ? 'var(--td-muted-dark)' : 'var(--td-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
          {val && <i className="bi bi-check-lg" style={{ color: 'var(--td-white)', fontSize: 12 }} />}
        </div>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
      </label>
      {err && <p style={{ fontSize: 11, color: 'var(--td-pink)', marginTop: 4, marginLeft: 2 }}>{err}</p>}
    </div>
  );
}

export function ParticipantStep05_Declaration() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(183,37,88,0.04)', border: '1px solid rgba(183,37,88,0.2)', borderRadius: 10, padding: 14 }}>
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
