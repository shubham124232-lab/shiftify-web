'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { ServiceMultiSelect } from '../../fields/ServiceMultiSelect';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

function Toggle({ label, name }: { label: string; name: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</span>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function ProviderStep06_Services() {
  const { control, watch, register, formState: { errors } } = useFormContext();
  const offersSil = watch('offersSil') as boolean;
  const offersSda = watch('offersSda') as boolean;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Controller
        name="coreServices"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <ServiceMultiSelect
            label={'Core Services *' as string}
            value={field.value ?? []}
            onChange={field.onChange}
            error={errors.coreServices?.message as string}
          />
        )}
      />

      {/* SIL */}
      <Toggle label="We offer Supported Independent Living (SIL)" name="offersSil" />
      {offersSil && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle}>SIL Details</label>
          <textarea {...register('silDetails.description')} rows={3} placeholder="Describe your SIL offering: vacancy types, locations, ratios, support hours…"
            style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        </div>
      )}

      {/* SDA */}
      <Toggle label="We offer Specialist Disability Accommodation (SDA)" name="offersSda" />
      {offersSda && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle}>SDA Details</label>
          <textarea {...register('sdaDetails.description')} rows={3} placeholder="Describe your SDA properties: design categories, locations, vacancies, accessibility features…"
            style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        </div>
      )}
    </div>
  );
}
