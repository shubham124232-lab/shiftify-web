'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { AvailabilityGrid }           from '../../fields/AvailabilityGrid';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};

const AVAIL_TYPES = [
  { value: 'CASUAL',    label: 'Casual',     desc: 'Work when it suits you' },
  { value: 'PART_TIME', label: 'Part-time',  desc: 'Regular part-time shifts' },
  { value: 'FULL_TIME', label: 'Full-time',  desc: '38+ hours per week' },
  { value: 'ON_DEMAND', label: 'On-demand',  desc: 'Available for urgent / same-day shifts' },
];

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
      border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{
          width: 42, height: 24, borderRadius: 12, transition: 'background 0.2s',
          background: val ? '#DC2626' : 'var(--clr-border)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18,
            borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </label>
    </div>
  );
}

export function WorkerStep05_Availability() {
  const { register, watch, control, formState: { errors } } = useFormContext();
  const availType = watch('availabilityType');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Availability type */}
      <div>
        <label style={labelStyle}>Availability Type <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {AVAIL_TYPES.map(opt => {
            const selected = availType === opt.value;
            return (
              <label key={opt.value} style={{
                display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px',
                border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                borderRadius: 10, cursor: 'pointer',
                background: selected ? 'rgba(79,70,229,0.06)' : '#fff',
              }}>
                <input type="radio" value={opt.value} {...register('availabilityType')} style={{ display: 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text)' }}>{opt.label}</span>
                <span style={{ fontSize: 11, color: 'var(--clr-muted)' }}>{opt.desc}</span>
              </label>
            );
          })}
        </div>
        {errors.availabilityType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.availabilityType.message as string}</p>}
      </div>

      {/* Emergency availability */}
      <Toggle
        label="Available for emergency shifts"
        name="emergencyAvailability"
        desc="You may be contacted for urgent or same-day jobs in your area"
      />

      {/* Weekly slots */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>
          Weekly Availability <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginBottom: 10, marginTop: 0 }}>
          Click a day to add time slots. These are your recurring available hours each week.
        </p>
        <Controller
          name="availability"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <AvailabilityGrid
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.availability?.message as string}
            />
          )}
        />
      </div>
    </div>
  );
}
