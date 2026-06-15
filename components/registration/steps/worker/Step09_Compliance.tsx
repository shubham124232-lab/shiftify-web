'use client';
import { useFormContext } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function CheckboxDeclaration({ name, label, required }: { name: string; label: string; required?: boolean }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const checked = watch(name) as boolean;
  const error = errors[name];
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
      padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${error ? '#ef4444' : checked ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
      background: checked ? 'rgba(79,70,229,0.04)' : '#fff', transition: 'all 0.15s' }}>
      <input type="checkbox" {...register(name)} style={{ marginTop: 2, accentColor: 'var(--clr-primary)', width: 16, height: 16, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </span>
    </label>
  );
}

export function WorkerStep09_Compliance() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--clr-muted)', margin: 0 }}>
        Please read and accept the following declarations before completing your registration.
      </p>

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Required Agreements</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CheckboxDeclaration
            name="termsAccepted"
            required
            label="I agree to the Shiftify Terms and Conditions and understand my obligations as a Support Worker on the platform."
          />
          <CheckboxDeclaration
            name="ndisCodeAccepted"
            required
            label="I confirm I will comply with the NDIS Code of Conduct and all relevant legislation, including the NDIS Act 2013."
          />
          <CheckboxDeclaration
            name="privacyPolicyAccepted"
            required
            label="I have read and agree to the Shiftify Privacy Policy and consent to the collection and use of my personal information as described."
          />
          <CheckboxDeclaration
            name="declarationStatement"
            required
            label="I declare that all information provided during registration is true, accurate, and complete. I understand that providing false information may result in account suspension."
          />
        </div>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>⚠️ Important</div>
        <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
          Shiftify conducts background verification on all Support Workers. Your NDIS Worker Screening Check will be validated through the NDIS Worker Screening Database. You may not provide supports until verification is complete.
        </p>
      </div>
    </div>
  );
}
