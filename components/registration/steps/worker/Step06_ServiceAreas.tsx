'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { TagInput }                   from '../../fields/TagInput';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};

export function WorkerStep06_ServiceAreas() {
  const { register, watch, control, setValue, formState: { errors } } = useFormContext();
  const hasVehicle           = watch('hasVehicle') as boolean;
  const canTransport         = watch('canTransportParticipants') as boolean;
  const radius               = watch('travelRadiusKm') as number ?? 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Service areas */}
      <Controller
        name="serviceAreas"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <TagInput
            label="Service Areas *"
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Type suburb and press Enter"
            error={errors.serviceAreas?.message as string}
          />
        )}
      />

      {/* Travel radius */}
      <div>
        <label style={labelStyle}>Travel Radius: <strong style={{ color: 'var(--clr-primary)' }}>{radius} km</strong></label>
        <input
          type="range" min={0} max={200} step={5}
          {...register('travelRadiusKm', { valueAsNumber: true })}
          style={{ width: '100%', accentColor: 'var(--clr-primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--clr-muted)', marginTop: 2 }}>
          <span>0 km</span><span>100 km</span><span>200 km</span>
        </div>
      </div>

      {/* Transport capability */}
      <div>
        <label style={labelStyle}>Can you transport participants?</label>
        <p style={{ fontSize: 12, color: 'var(--clr-muted)', margin: '0 0 8px' }}>
          Includes transporting participants to appointments, community activities, or between locations.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Yes', 'No'] as const).map(opt => {
            const selected = opt === 'Yes' ? canTransport === true : canTransport === false;
            return (
              <button key={opt} type="button"
                onClick={() => setValue('canTransportParticipants', opt === 'Yes')}
                style={{
                  flex: 1, height: 42, borderRadius: 10, fontWeight: 700, fontSize: 13,
                  border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: selected ? 'rgba(79,70,229,0.07)' : '#fff',
                  color: selected ? 'var(--clr-primary)' : 'var(--clr-text)', cursor: 'pointer',
                }}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicle toggle */}
      <div>
        <label style={labelStyle}>Do you have a vehicle?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Yes', 'No'] as const).map(opt => {
            const selected = opt === 'Yes' ? hasVehicle === true : hasVehicle === false;
            return (
              <button key={opt} type="button"
                onClick={() => setValue('hasVehicle', opt === 'Yes')}
                style={{
                  flex: 1, height: 42, borderRadius: 10, fontWeight: 700, fontSize: 13,
                  border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: selected ? 'rgba(79,70,229,0.07)' : '#fff',
                  color: selected ? 'var(--clr-primary)' : 'var(--clr-text)', cursor: 'pointer',
                }}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicle details — conditional */}
      {hasVehicle && (
        <div style={{
          background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)',
          borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
            <i className="bi bi-car-front-fill" style={{ marginRight: 6 }} />
            Vehicle Details
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Make</label>
              <input {...register('vehicleDetails.make')} placeholder="e.g. Toyota" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input {...register('vehicleDetails.model')} placeholder="e.g. Corolla" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <input type="number" {...register('vehicleDetails.year', { valueAsNumber: true })} placeholder="e.g. 2020" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Colour</label>
              <input {...register('vehicleDetails.colour')} placeholder="e.g. Silver" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Registration Plate <span style={{ color: '#ef4444' }}>*</span></label>
            <input {...register('vehicleDetails.rego')} placeholder="e.g. ABC123"
              style={{ ...inputStyle, borderColor: (errors.vehicleDetails as any)?.rego ? '#ef4444' : 'var(--clr-border)' }} />
            {(errors.vehicleDetails as any)?.rego && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{(errors.vehicleDetails as any).rego.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
