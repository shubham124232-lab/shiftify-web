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

const LINKING_METHODS = ['Participant self-links via portal', 'Support Coordinator links on behalf', 'You invite participant directly', 'Via referral from LAC'];

export function PmStep09_ParticipantLinking() {
  const { control } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Participant Linking Method(s)</label>
        <Controller name="participantLinkingMethod" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LINKING_METHODS.map(m => {
              const sel = (field.value ?? []).includes(m);
              return (
                <label key={m} style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'rgba(79,70,229,0.06)' : '#fff' }}>
                  <input type="checkbox" checked={sel}
                    onChange={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== m) : [...cur, m]); }}
                    style={{ accentColor: 'var(--clr-primary)', marginTop: 2 }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m}</span>
                </label>
              );
            })}
          </div>
        )} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle label="Require Approval Before Linking" name="linkApprovalRequired"
          desc="You manually approve each participant link request before they are connected to your organisation" />
        <Toggle label="Require Service Agreement Before Invoicing" name="requiresServiceAgreementBeforeInvoicing"
          desc="A signed service agreement must be in place before processing any invoices for a participant" />
      </div>
    </div>
  );
}
