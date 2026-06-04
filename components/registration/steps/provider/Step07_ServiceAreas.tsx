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
          <TagInput label="Service Areas *" value={field.value ?? []} onChange={field.onChange}
            placeholder="Type suburb or region and press Enter" error={errors.serviceAreas?.message as string} />
        )}
      />
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
              border: `1.5px solid ${mode === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: mode === opt.value ? 'rgba(79,70,229,0.07)' : '#fff',
              fontSize: 12, fontWeight: 600,
              color: mode === opt.value ? 'var(--clr-primary)' : 'var(--clr-text)',
            }}>
              <input type="radio" value={opt.value} {...register('serviceMode')} style={{ display: 'none' }} />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.serviceMode && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.serviceMode.message as string}</p>}
      </div>
    </div>
  );
}
