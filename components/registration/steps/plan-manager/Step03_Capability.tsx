'use client';
import { useFormContext, Controller } from 'react-hook-form';

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

const SERVICES = [
  'Budget Statements', 'Invoice Processing', 'Provider Payments', 'NDIS Portal Management',
  'Plan Review Support', 'Allied Health Coordination', 'SIL / SDA Coordination',
  'Transition Support', 'Complex Case Management',
];

const PLAN_TYPES = ['Plan-managed', 'Agency-managed (NDIA)', 'Self-managed'];

export function PmStep03_Capability() {
  const { control } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Plan Types Supported <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', margin: '0 0 8px' }}>Which NDIS funding management types do you support?</p>
        <Controller name="planTypesSupported" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {PLAN_TYPES.map(pt => {
              const sel = (field.value ?? []).includes(pt);
              return (
                <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '10px 12px', borderRadius: 8,
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'rgba(79,70,229,0.06)' : '#fff' }}>
                  <input type="checkbox" checked={sel}
                    onChange={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== pt) : [...cur, pt]); }}
                    style={{ display: 'none' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: sel ? 'var(--clr-primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 9 }} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{pt}</span>
                </label>
              );
            })}
          </div>
        )} />
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Services Provided</label>
        <Controller name="servicesProvided" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {SERVICES.map(s => {
              const sel = (field.value ?? []).includes(s);
              return (
                <button key={s} type="button"
                  onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((x: string) => x !== s) : [...cur, s]); }}
                  style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{s}
                </button>
              );
            })}
          </div>
        )} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle label="SIL / SDA Invoicing" name="silSdaInvoicing"
          desc="You process invoices for Supported Independent Living (SIL) and Specialist Disability Accommodation (SDA) services" />
        <Toggle label="Manages Recurring / Regular Invoices" name="plansRecurringInvoices"
          desc="Handles invoices on a regular schedule (weekly, fortnightly, monthly)" />
        <Toggle label="Manages Once-Off Invoices" name="plansOnceOffInvoices"
          desc="Handles individual service invoices as they arise" />
        <Toggle label="Provides Budget Statements to Participants" name="providesBudgetStatements"
          desc="Sends regular budget utilisation statements to participants or their nominees" />
      </div>
    </div>
  );
}
