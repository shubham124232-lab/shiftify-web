'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { TagInput } from '../../fields/TagInput';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

function Toggle({ label, name }: { label: string; name: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function PmStep01_Business() {
  const { register, control, watch, formState: { errors } } = useFormContext();
  const ndisReg = watch('ndisRegistered') as boolean;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Business Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input {...register('businessName')} placeholder="e.g. Smith Plan Management" style={{ ...inputStyle, borderColor: errors.businessName ? '#ef4444' : undefined }} />
        {errors.businessName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.businessName.message as string}</p>}
      </div>
      <div><label style={labelStyle}>ABN</label><input {...register('abn')} placeholder="XX XXX XXX XXX" style={inputStyle} /></div>
      <Toggle label="NDIS Registered Plan Manager" name="ndisRegistered" />
      {ndisReg && (
        <div><label style={labelStyle}>NDIS Provider Number</label><input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" style={inputStyle} /></div>
      )}
      <div>
        <label style={labelStyle}>Years in Operation</label>
        <select {...register('yearsInOperation')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <Controller name="serviceAreas" control={control} defaultValue={[]} render={({ field }) => (
        <TagInput label="Service Areas *" value={field.value ?? []} onChange={field.onChange}
          placeholder="Type suburb or region, press Enter" error={errors.serviceAreas?.message as string} />
      )} />
    </div>
  );
}
