'use client';
import { useFormContext, Controller } from 'react-hook-form';

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

const INTAKE_METHODS = ['Email', 'Portal Upload', 'Post / Mail', 'Fax', 'EDI', 'Xero / MYOB integration'];

export function PmStep06_PaymentOps() {
  const { register, control } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Invoice Intake Methods</label>
        <Controller name="invoiceIntakeMethod" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {INTAKE_METHODS.map(m => {
              const sel = (field.value ?? []).includes(m);
              return (
                <button key={m} type="button"
                  onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== m) : [...cur, m]); }}
                  style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{m}
                </button>
              );
            })}
          </div>
        )} />
      </div>

      <div>
        <label style={labelStyle}>Primary Invoice Contact Email</label>
        <input {...register('primaryInvoiceContactEmail')} type="email" placeholder="invoices@planmanager.com.au" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={labelStyle}>Accounts Contact Name</label><input {...register('accountsContactName')} placeholder="Accounts Team" style={inputStyle} /></div>
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: 2 }}>Payment Enquiry Contact</label>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: '0 0 8px' }}>Who providers contact about payment status</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Name</label><input {...register('paymentEnquiryContactName')} placeholder="Full name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Email</label><input {...register('paymentEnquiryContactEmail')} type="email" placeholder="payments@planmanager.com.au" style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Phone</label><input {...register('paymentEnquiryContactPhone')} type="tel" placeholder="0400 000 000" style={inputStyle} /></div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Invoice Reference Format</label>
        <input {...register('invoiceReferenceFormat')} placeholder="e.g. NDIS Number + Provider Name + Date" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Specify what you require on invoices for faster processing.</p>
      </div>

      <div>
        <label style={labelStyle}>Remittance Advice</label>
        <input {...register('remittanceAdvice')} type="email" placeholder="remittance@planmanager.com.au" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Email or portal address where remittance advice is sent to providers after payment.</p>
      </div>

      <div>
        <label style={labelStyle}>Dispute Handling Contact</label>
        <input {...register('disputeHandlingContact')} placeholder="e.g. disputes@planmanager.com.au or 1300 000 000" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Who providers contact to raise a payment dispute or discrepancy.</p>
      </div>

      <div>
        <label style={labelStyle}>Finance Team Email (Staff Access)</label>
        <input {...register('staffFinanceTeamEmail')} type="email" placeholder="finance-team@planmanager.com.au" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Internal email for the finance team used for staff-to-staff payment escalations.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle label="Registered Providers Only" name="acceptsRegisteredProvidersOnly"
          desc="Only accept invoices from NDIS-registered providers" />
        <Toggle label="Require Service Dates on Invoices" name="requiresServiceDatesOnInvoices"
          desc="All invoices must include the dates services were delivered" />
        <Toggle label="Require Support Category Code" name="requiresSupportCategoryCode"
          desc="Invoices must include the NDIS support category / line item code" />
      </div>
    </div>
  );
}
