'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const COORD_LEVELS = [
  { value: 'SUPPORT_COORDINATION',         label: 'Support Coordination',            desc: 'Assist participants to implement their NDIS plan effectively' },
  { value: 'SPECIALIST_SUPPORT_COORD',     label: 'Specialist Support Coordination', desc: 'Complex needs requiring specialist expertise' },
  { value: 'COORDINATION_OF_SUPPORTS',     label: 'Coordination of Supports',        desc: 'Low-complexity plan navigation and provider connection' },
];

const COMPLEXITY = [
  { value: 'LOW',      label: 'Low Complexity',    desc: 'Straightforward plans and stable needs' },
  { value: 'MEDIUM',   label: 'Medium Complexity', desc: 'Multiple providers and moderate coordination' },
  { value: 'HIGH',     label: 'High Complexity',   desc: 'Specialist needs, crisis, or complex circumstances' },
  { value: 'ALL',      label: 'All Levels',        desc: 'Comfortable with any participant complexity' },
];

const EXTRA_SERVICES = [
  { value: 'CRISIS_SUPPORT',          label: 'Crisis Support' },
  { value: 'HOUSING_TRANSITIONS',     label: 'Housing Transitions' },
  { value: 'SDA_SIL_SETUP',           label: 'SDA / SIL Setup' },
  { value: 'HOSPITAL_DISCHARGE',      label: 'Hospital Discharge' },
  { value: 'RURAL_REMOTE',            label: 'Rural / Remote' },
  { value: 'ABORIGINAL_TORRES_STRAIT',label: 'Aboriginal & Torres Strait Islander' },
  { value: 'CALD_COMMUNITIES',        label: 'CALD Communities' },
  { value: 'ADVOCACY_REFERRAL',       label: 'Advocacy & Referral' },
];

function ChipGroup({ name, options, defaultValue = [] }: { name: string; options: { value: string; label: string; desc?: string }[]; defaultValue?: string[] }) {
  const { control, formState: { errors } } = useFormContext();
  const err = (errors[name]?.message) as string | undefined;
  return (
    <Controller name={name} control={control} defaultValue={defaultValue} render={({ field }) => (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map(o => {
            const sel = (field.value ?? []).includes(o.value);
            return (
              <button key={o.value} type="button"
                onClick={() => {
                  const cur = field.value ?? [];
                  field.onChange(sel ? cur.filter((s: string) => s !== o.value) : [...cur, o.value]);
                }}
                title={o.desc}
                style={{ padding: '7px 13px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Coordination levels */}
      <div>
        <label style={labelStyle}>Coordination Level(s) <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select all service types you are qualified to provide.</p>
        <ChipGroup name="coordinationLevels" options={COORD_LEVELS} />
      </div>

      {/* Complexity */}
      <div>
        <label style={labelStyle}>Participant Complexity <span style={{ color: '#ef4444' }}>*</span></label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Select the complexity levels you are comfortable supporting.</p>
        <ChipGroup name="participantComplexity" options={COMPLEXITY} />
      </div>

      {/* Additional services */}
      <div>
        <label style={labelStyle}>Specialist / Additional Services</label>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--clr-muted)' }}>Optional — select any specialist areas you cover.</p>
        <ChipGroup name="additionalServices" options={EXTRA_SERVICES} />
      </div>

    </div>
  );
}
