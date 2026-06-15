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

      <Toggle label="We offer Supported Independent Living (SIL)" name="offersSil" />
      {offersSil && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>SIL Type</label>
              <select {...register('silType')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select...</option>
                <option value="SHARED">Shared Living</option>
                <option value="INDIVIDUAL">Individual Living</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Support Level</label>
              <select {...register('silSupportLevel')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="COMPLEX">Complex / Intensive</option>
              </select>
            </div>
          </div>
          <Toggle label="Current Vacancies Available" name="silCurrentVacancies" />
        </div>
      )}

      <Toggle label="We offer Specialist Disability Accommodation (SDA)" name="offersSda" />
      {offersSda && (
        <div style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>SDA Design Categories</label>
            <Controller name="sdaDesignCategory" control={control} defaultValue={[]} render={({ field }) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Improved Liveability', 'Fully Accessible', 'Robust', 'High Physical Support'].map(cat => {
                  const sel = (field.value ?? []).includes(cat);
                  return (
                    <button key={cat} type="button"
                      onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== cat) : [...cur, cat]); }}
                      style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                        background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                      {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{cat}
                    </button>
                  );
                })}
              </div>
            )} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Current Vacancy Count</label>
              <input type="number" min={0} {...register('sdaVacancyCount', { valueAsNumber: true })} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Locations / Suburbs</label>
              <input {...register('sdaLocations.0')} placeholder="e.g. Parramatta NSW" style={inputStyle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
