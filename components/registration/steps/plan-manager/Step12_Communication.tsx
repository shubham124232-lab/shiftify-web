'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

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

export function PmStep12_Communication() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Invoice Notification Email</label>
        <input {...register('invoiceNotificationEmail')} type="email" placeholder="Receives alerts when invoices arrive" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Compliance Notices Email</label>
        <input {...register('complianceNoticesEmail')} type="email" placeholder="Receives NDIS Commission notices and audits" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Escalation Contact for Failed Payments</label>
        <input {...register('escalationContactForFailedPayments')} placeholder="Name or email" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Who is contacted if an NDIA payment fails or a claim is rejected.</p>
      </div>
      <Toggle label="Enable SMS Alerts" name="smsAlertsEnabled"
        desc="Receive SMS notifications for urgent items (e.g. failed claims, large invoices)" />
    </div>
  );
}
