'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const CAPACITY_STATUSES = ['Accepting new participants', 'Limited availability', 'Waitlist only', 'Not accepting new participants'];
const FUNDING_TYPES     = ['NDIS Self Managed', 'NDIS Plan Managed', 'NDIS Agency Managed (NDIA)'];
const PARTICIPANT_TYPES = ['Adults', 'Older Adults', 'Children', 'Autism Spectrum', 'Psychosocial / Mental Health', 'Physical Disability', 'Intellectual Disability', 'Complex Needs'];

export function CoordStep05_Capacity() {
  const { register, control } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Current Capacity Status</label>
        <select {...register('currentCapacityStatus')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          {CAPACITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Availability Type</label>
        <select {...register('availabilityType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CASUAL">Casual / As needed</option>
          <option value="CONTRACT">Contract / Fixed term</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Maximum Participant Caseload</label>
        <input type="number" {...register('maxParticipantLoad', { valueAsNumber: true })} min={0} max={500} placeholder="e.g. 15" style={inputStyle} />
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Participant Types Accepted</label>
        <Controller name="participantTypesAccepted" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PARTICIPANT_TYPES.map(pt => {
              const selected = (field.value ?? []).includes(pt);
              return (
                <button key={pt} type="button"
                  onClick={() => { const cur = field.value ?? []; field.onChange(selected ? cur.filter((s: string) => s !== pt) : [...cur, pt]); }}
                  style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: selected ? 'rgba(79,70,229,0.1)' : '#fff',
                    color: selected ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  {selected && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                  {pt}
                </button>
              );
            })}
          </div>
        )} />
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Funding Types Supported</label>
        <Controller name="fundingTypeCompatibility" control={control} defaultValue={[]} render={({ field }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FUNDING_TYPES.map(ft => {
              const selected = (field.value ?? []).includes(ft);
              return (
                <label key={ft} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '10px 12px', borderRadius: 8,
                  border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: selected ? 'rgba(79,70,229,0.06)' : '#fff' }}>
                  <input type="checkbox" checked={selected}
                    onChange={() => { const cur = field.value ?? []; field.onChange(selected ? cur.filter((s: string) => s !== ft) : [...cur, ft]); }}
                    style={{ display: 'none' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: selected ? 'var(--clr-primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 9 }} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{ft}</span>
                </label>
              );
            })}
          </div>
        )} />
      </div>
    </div>
  );
}
