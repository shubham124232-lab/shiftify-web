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
        border: `2px solid ${val ? '#22c55e' : 'var(--clr-border)'}`, background: val ? '#22c55e' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        {val && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 12 }} />}
      </div>
      <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

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

export function PmStep14_Terms() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        Please read and accept all declarations to complete your Plan Manager registration.
      </p>

      <Toggle label="Currently Accepting New Clients" name="acceptingClients"
        desc="Your organisation is open to taking on new NDIS participants" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <CheckboxDeclaration name="termsAccepted"
          label={<>I have read and agree to the Shiftify <a href="/terms" target="_blank" style={{ color: 'var(--clr-primary)' }}>Terms &amp; Conditions</a>.</>} />
        <CheckboxDeclaration name="ndisCodeAccepted"
          label="I commit to upholding the NDIS Code of Conduct and my obligations as a registered Plan Manager." />
        <CheckboxDeclaration name="privacyPolicyAccepted"
          label={<>I have read and agree to the Shiftify <a href="/privacy" target="_blank" style={{ color: 'var(--clr-primary)' }}>Privacy Policy</a> and consent to the collection and handling of participant and organisational data.</>} />
        <CheckboxDeclaration name="confirmAuthorityToRegister"
          label="I confirm that I am authorised to register this organisation on the Shiftify platform and bind it to these terms." />
        <CheckboxDeclaration name="confirmDetailsAccurate"
          label="I declare that all information provided during this registration is true, accurate, and complete. I understand that providing false information may result in account suspension and referral to the NDIS Commission." />
        <CheckboxDeclaration name="consentToVerification"
          label="I consent to Shiftify verifying our NDIS registration status, insurance documents, and organisational details with relevant bodies including the NDIS Commission and ASIC." />
        <CheckboxDeclaration name="consentToParticipantLinkingControls"
          label="I understand and agree to the Shiftify participant linking and consent framework, including requirements around participant approval before processing funds." />
        <CheckboxDeclaration name="consentToInvoiceRoutingRules"
          label="I agree to comply with Shiftify invoice routing and payment processing guidelines, and understand that non-compliance may result in delayed processing or account review." />
      </div>
    </div>
  );
}
