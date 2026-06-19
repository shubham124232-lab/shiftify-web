'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { TagInput } from '../../fields/TagInput';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

export function ProviderStep07_ServiceAreas() {
  const { register, control, watch, formState: { errors } } = useFormContext();
  const mode = watch('serviceMode') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Controller
        name="serviceAreas"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <TagInput label="Primary Service Areas *" value={field.value ?? []} onChange={field.onChange}
            placeholder="Type suburb, postcode or region and press Enter" error={errors.serviceAreas?.message as string} />
        )}
      />

      {/* Multiple Locations / branches — spec Step 6 */}
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
        Add each office or branch location if you operate from multiple sites.
      </p>

      <div>
        <label style={labelStyle}>Service Delivery Mode <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'IN_PERSON', label: 'In-person' },
            { value: 'REMOTE',    label: 'Remote / Telehealth' },
            { value: 'BOTH',      label: 'Both' },
          ].map(opt => (
            <label key={opt.value} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              border: `1.5px solid ${mode ===
