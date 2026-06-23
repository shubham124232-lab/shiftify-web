'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function ChipPicker({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>{label}</label>
      <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map(opt => {
            const sel = (field.value ?? []).includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== opt) : [...cur, opt]); }}
                style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{opt}
              </button>
            );
          })}
        </div>
      )} />
    </div>
  );
}

export function ProviderStep08_Workforce() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      <ChipPicker
        name="participantTypes"
        label="Participant Types Accepted"
        options={['Self-managed', 'Plan-managed', 'NDIA-managed']}
      />

      <ChipPicker
        name="participantComplexityAccepted"
        label="Participant Complexity Accepted"
        options={['Standard', 'Complex', 'High Risk']}
      />

    </div>
  );
}
