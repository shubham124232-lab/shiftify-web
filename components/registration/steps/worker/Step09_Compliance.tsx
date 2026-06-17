'use client';
import { useFormContext, useFieldArray } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  borderRadius: 8, border: '1.5px solid var(--clr-border)',
  fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box',
};

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

function ReferencesSection() {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'references' });
  const refErrors = (errors.references as any) ?? [];

  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>
        References <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(optional — up to 2)</span>
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map((field, i) => (
          <div key={field.id} style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-primary)' }}>Referee {i + 1}</span>
              <button type="button" onClick={() => remove(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, padding: '2px 6px' }}>
                Remove
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input {...register(`references.${i}.name`)} placeholder="e.g. Jane Smith"
                  style={{ ...inputStyle, borderColor: refErrors[i]?.name ? '#ef4444' : 'var(--clr-border)' }} />
                {refErrors[i]?.name && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{refErrors[i].name.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Relationship <span style={{ color: '#ef4444' }}>*</span></label>
                <input {...register(`references.${i}.relationship`)} placeholder="e.g. Former Supervisor"
                  style={{ ...inputStyle, borderColor: refErrors[i]?.relationship ? '#ef4444' : 'var(--clr-border)' }} />
                {refErrors[i]?.relationship && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{refErrors[i].relationship.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input {...register(`references.${i}.phone`)} type="tel" placeholder="0400 000 000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input {...register(`references.${i}.email`)} type="email" placeholder="jane@example.com" style={inputStyle} />
              </div>
            </div>
          </div>
        ))}
        {fields.length < 2 && (
          <button type="button"
            onClick={() => append({ name: '', relationship: '', phone: '', email: '' })}
            style={{ height: 40, borderRadius: 10, border: '1.5px dashed var(--clr-border)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--clr-primary)', fontWeight: 600 }}>
            + Add Referee
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkerStep09_Compliance() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--clr-muted)', margin: 0 }}>
        Optionally add professional references, then read and accept the declarations below.
      </p>

      <ReferencesSection />

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Required Agreements</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CheckboxDeclaration name="termsAccepted" required
            label="I agree to the Shiftify Terms and Conditions and understand my obligations as a Support Worker on the platform." />
          <CheckboxDeclaration name="ndisCodeAccepted" required
            label="I confirm I will comply with the NDIS Code of Conduct and all relevant legislation, including the NDIS Act 2013." />
          <CheckboxDeclaration name="privacyPolicyAccepted" required
            label="I have read and agree to the Shiftify Privacy Policy and consent to the collection and use of my personal information as described." />
          <CheckboxDeclaration name="declarationStatement" required
            label="I declare that all information provided during registration is true, accurate, and complete. I understand that providing false information may result in account suspension." />
        </div>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Important</div>
        <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
          Shiftify conducts background verification on all Support Workers. Your NDIS Worker Screening Check will be validated through the NDIS Worker Screening Database. You may not provide supports until verification is complete.
        </p>
      </div>
    </div>
  );
}
