'use client';
import { useFormContext } from 'react-hook-form';

function CheckboxDeclaration({ name, label }: { name: string; label: React.ReactNode }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const val = watch(name) as boolean;
  const err = (errors[name]?.message) as string | undefined;
  return (
    <label style={{
      display: 'flex', gap: 12, cursor: 'pointer', padding: '14px',
      border: `1.5px solid ${err ? '#ef4444' : val ? '#22c55e' : 'var(--clr-border)'}`,
      borderRadius: 10, background: val ? '#F0FFF4' : '#fff', alignItems: 'flex-start',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `2px solid ${val ? '#22c55e' : 'var(--clr-border)'}`,
        background: val ? '#22c55e' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {val && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 12 }} />}
      </div>
      <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export function ProviderStep12_Declaration() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        By completing your profile you agree to the following declarations.
      </p>
      <CheckboxDeclaration name="termsAccepted"
        label={<>I have read and agree to the Shiftify <a href="/terms" target="_blank" style={{ color: 'var(--clr-primary)' }}>Terms &amp; Conditions</a>.</>} />
      <CheckboxDeclaration name="ndisCodeAccepted"
        label="Our organisation commits to upholding the NDIS Code of Conduct and applicable Quality and Safeguarding standards." />
      <CheckboxDeclaration name="privacyPolicyAccepted"
        label={<>I have read and agree to the Shiftify <a href="/privacy" target="_blank" style={{ color: 'var(--clr-primary)' }}>Privacy Policy</a> and consent to the collection and handling of organisational data as described.</>} />
      <CheckboxDeclaration name="serviceAgreementAccepted"
        label="I agree to operate under the Shiftify Provider Service Agreement and understand the obligations this creates." />
      <CheckboxDeclaration name="platformRulesAccepted"
        label="I acknowledge the Shiftify Platform Rules including expectations around response times, participant communication, and marketplace conduct." />
      <CheckboxDeclaration name="complianceDeclaration"
        label="I declare that all information provided is true and accurate, our organisation holds all required registrations and insurances, and we will notify Shiftify of any material changes to our compliance status." />
    </div>
  );
}
