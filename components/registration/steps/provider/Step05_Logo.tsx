'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { TagInput } from '../../fields/TagInput';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

export function ProviderStep05_Logo() {
  const { register, control, watch, formState: { errors } } = useFormContext();
  const mode = watch('serviceMode') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Primary service areas */}
      <Controller
        name="serviceAreas"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <TagInput
            label="Primary Service Areas *"
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Type suburb, postcode or state and press Enter"
            error={errors.serviceAreas?.message as string}
          />
        )}
      />

      {/* Multiple branch locations */}
      <Controller
        name="multipleLocations"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <TagInput
            label="Additional Branch Locations"
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Add branch suburb or address and press Enter"
          />
        )}
      />
      <p style={{ margin: '-12px 0 0', fontSize: 11, color: 'var(--clr-muted)' }}>
        Add each office or branch if you operate from multiple sites.
      </p>

      {/* Service mode */}
      <div>
        <label style={labelStyle}>Service Delivery Mode <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'IN_PERSON', label: 'In-person' },
            { value: 'REMOTE',    label: 'Remote' },
            { value: 'BOTH',      label: 'Both' },
          ].map(opt => (
            <label key={opt.value} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              border: `1.5px solid ${mode === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: mode === opt.value ? 'rgba(79,70,229,0.05)' : '#fff',
              fontSize: 13, fontWeight: 500,
            }}>
              <input type="radio" value={opt.value} {...register('serviceMode')} style={{ display: 'none' }} />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.serviceMode && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.serviceMode.message as string}</p>}
      </div>

    </div>
  );
}
