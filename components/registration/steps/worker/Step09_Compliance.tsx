'use client';
import { useFormContext, useFieldArray } from 'react-hook-form';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};

function CheckboxDeclaration({ name, label, required }: { name: string; label: React.ReactNode; required?: boolean }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const val = watch(name) as boolean;
  const err = (errors[name]?.message) as string | undefined;
  return (
    <label style={{
      display: 'flex', gap: 12, cursor: 'pointer', padding: '14px',
      border: `1.5px solid ${err ? '#ef4444' : val ? '#22c55e' : 'var(--clr-border)'}`,
      borderRadius: 10, background: val ? '#F0FFF4' : '#fff', alignItems: 'flex-start',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `2px solid ${val ? '#22c55e' : 'var(--clr-border)'}`,
        background: val ? '#22c55e' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {val && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 12 }} />}
      </div>
      <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export function WorkerStep09_Compliance() {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'references' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* References */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 10 }}>Professional References</label>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 0, marginBottom: 12 }}>
          Optional — up to 2 professional or character references. These will not be contacted without your permission.
        </p>

        {fields.map((field, i) => (
          <div key={field.id} style={{
            background: 'var(--clr-surface)', borderRadius: 10, padding: 14, marginBottom: 10,
            border: '1px solid var(--clr-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text)' }}>Reference {i + 1}</span>
              <button type="button" onClick={() => remove(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>
                <i className="bi bi-trash3" /> Remove
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input {...register(`references.${i}.name`)} style={inputStyle} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={labelStyle}>Relationship *</label>
                <input {...register(`references.${i}.relationship`)} style={inputStyle} placeholder="Supervisor, Manager…" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input {...register(`references.${i}.phone`)} style={inputStyle} type="tel" placeholder="+61 4xx xxx xxx" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input {...register(`references.${i}.email`)} style={inputStyle} type="email" placeholder="ref@example.com" />
              </div>
            </div>
          </div>
        ))}

        {fields.length < 2 && (
          <button type="button"
            onClick={() => append({ name: '', relationship: '', phone: '', email: '' })}
            style={{
              width: '100%', height: 40, borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1.5px dashed var(--clr-border)', background: 'var(--clr-surface)',
              color: 'var(--clr-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <i className="bi bi-plus-circle" /> Add Reference
          </button>
        )}
      </div>

      {/* Declarations */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Platform Declaration <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CheckboxDeclaration
            name="termsAccepted"
            required
            label={<>I have read and agree to the Shiftify <a href="/terms" target="_blank" style={{ color: 'var(--clr-primary)' }}>Terms & Conditions</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--clr-primary)' }}>Privacy Policy</a>.</>}
          />
          <CheckboxDeclaration
            name="ndisCodeAccepted"
            required
            label="I commit to upholding the NDIS Code of Conduct and understand my obligations as a support worker."
          />
        </div>
        {(errors.termsAccepted || errors.ndisCodeAccepted) && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
            Please accept both declarations to complete your profile.
          </p>
        )}
      </div>
    </div>
  );
}
