'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function CheckboxDeclaration({ name, label }: { name: string; label: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <label style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 10,
      border: `1.5px solid ${val ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
      background: val ? 'rgba(79,70,229,0.04)' : '#fff' }}>
      <input type="checkbox" {...register(name)} style={{ marginTop: 2, accentColor: 'var(--clr-primary)', width: 15, height: 15, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--clr-text)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export function PmStep07_Compliance() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        Confirm your compliance obligations as an NDIS plan manager.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CheckboxDeclaration name="recordKeepingDeclaration"
          label="We maintain records of all participant plan budgets and transactions for a minimum of 7 years as required by the NDIS Act." />
        <CheckboxDeclaration name="conflictOfInterestDeclaration"
          label="We have a conflict of interest policy and will disclose any conflicts to participants and the NDIS Commission." />
        <CheckboxDeclaration name="noMisuseOfFundsDeclaration"
          label="We will not use participant NDIS funds for any purpose other than supports in the participant's approved plan." />
        <CheckboxDeclaration name="taxComplianceDeclaration"
          label="Our organisation meets all ATO obligations including GST registration (where applicable) and BAS lodgement." />
        <CheckboxDeclaration name="informationAccurateDeclaration"
          label="All information provided in this registration is true, accurate, and complete to the best of our knowledge." />
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 10 }}>Compliance Contacts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Complaints Contact Name</label><input {...register('complaintsContactName')} placeholder="Full name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Complaints Contact Email</label><input {...register('complaintsContactEmail')} type="email" placeholder="complaints@planmanager.com.au" style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Incident Escalation Contact</label><input {...register('incidentEscalationContact')} placeholder="Name or email" style={inputStyle} /></div>
          <div><label style={labelStyle}>Privacy Contact</label><input {...register('privacyContact')} placeholder="Name or email for privacy enquiries" style={inputStyle} /></div>
          <div><label style={labelStyle}>Records Retention Contact</label><input {...register('recordsRetentionContact')} placeholder="Name or email" style={inputStyle} /></div>
        </div>
      </div>
    </div>
  );
}
