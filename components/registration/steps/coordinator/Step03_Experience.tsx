'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const COORD_LEVELS = [
  { value: 'SUPPORT_CONNECTION',       label: 'Support Connection (Level 1)',          desc: 'Help participants identify and connect with providers' },
  { value: 'SUPPORT_COORDINATION',     label: 'Support Coordination (Level 2)',        desc: 'Assist participants to implement their NDIS plan' },
  { value: 'SPECIALIST_SUPPORT_COORD', label: 'Specialist Support Coordination (Level 3)', desc: 'Complex needs requiring specialist expertise' },
];

const COMPLEXITY = [
  { value: 'PSYCHOSOCIAL_DISABILITY',  label: 'Psychosocial Disability' },
  { value: 'AUTISM',                   label: 'Autism' },
  { value: 'PHYSICAL_DISABILITY',      label: 'Physical Disability' },
  { value: 'INTELLECTUAL_DISABILITY',  label: 'Intellectual Disability' },
  { value: 'COMPLEX_BEHAVIOUR',        label: 'Complex Behaviour' },
  { value: 'HIGH_MEDICAL_NEEDS',       label: 'High Medical Needs' },
];

const EXTRA_SERVICES = [
  { value: 'PLAN_REVIEWS_SUPPORT',     label: 'Plan Reviews Support' },
  { value: 'CRISIS_MANAGEMENT',        label: 'Crisis Management' },
  { value: 'HOUSING_NAVIGATION',       label: 'Housing Navigation (SIL / SDA)' },
  { value: 'PROVIDER_SOURCING',        label: 'Provider Sourcing' },
  { value: 'CAPACITY_BUILDING',        label: 'Capacity Building' },
];

function ChipGroup({ name, options }: { name: string; options: { value: string; label: string; desc?: string }[] }) {
  const { control, formState: { errors } } = useFormContext();
  const err = (errors[name]?.message) as string | undefined;
  return (
    <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map(o => {
            const sel = (field.value ?? []).includes(o.value);
            return (
              <button key={o.value} type="button" title={o.desc}
                onClick={() => {
                  const cur = field.value ?? [];
                  field.onChange(sel ? cur.filter((s: string) => s !== o.value) : [...cur, o.value]);
                }}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'var(--clr-primary)' : '#fff',
                  color: sel ? '#fff' : 'var(--clr-text)', fontWeight: sel ? 600 : 400 }}>
                {o.label}
              </button>
            );
          })}
        </div>
        {err && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{err}</p>}
      </>
    )} />
  );
}

export function CoordStep03_Experience() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <label style={labelStyle}>Support Coordination Level(s) Offered <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select all service types you are qualified to provide.</p>
        <ChipGroup name="coordinationLevels" options={COORD_LEVELS} />
      </div>

      <div>
        <label style={labelStyle}>Participant Complexity Experience <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select the disability and complexity types you are experienced with.</p>
        <ChipGroup name="participantComplexity" options={COMPLEXITY} />
      </div>

      <div>
        <label style={labelStyle}>Services Offered Beyond Coordination</label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Optional — select any additional services you provide.</p>
        <ChipGroup name="additionalServices" options={EXTRA_SERVICES} />
      </div>

    </div>
  );
}
