'use client';
import { useFormContext, Controller } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };

const CAPACITY_STATUSES = [
  'Accepting New Participants',
  'Limited Capacity',
  'Not Accepting',
];
// Spec Step 7: "Types of Participants They Work With" — billing/management type
const PARTICIPANT_MGMT_TYPES = [
  'Self-managed',
  'Plan-managed',
  'NDIA-managed',
];

function CheckboxGroup({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 8 }}>{label}</label>
      <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map(opt => {
            const selected = (field.value ?? []).includes(opt);
            return (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '10px 12px', borderRadius: 8,
                border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                background: selected ? 'rgba(79,70,229,0.06)' : '#fff' }}>
                <input type="checkbox" checked={selected}
                  onChange={() => { const cur = field.value ?? []; field.onChange(selected ? cur.filter((s: string) => s !== opt) : [...cur, opt]); }}
                  style={{ display: 'none' }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: selected ? 'var(--clr-primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 9 }} />}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )} />
    </div>
  );
}

export function CoordStep05_Capacity() {
  const { register } = useFormContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Spec Step 6 — Current Capacity Status */}
      <div>
        <label style={labelStyle}>Current Capacity Status <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CAPACITY_STATUSES.map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
              border: '1.5px solid var(--clr-border)', borderRadius: 8 }}>
              <input type="radio" value={s} {...register('currentCapacityStatus')} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Spec Step 6 — Availability Type */}
      <div>
        <label style={labelStyle}>Availability Type</label>
        <select {...register('availabilityType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="BUSINESS_HOURS">Business Hours Only</option>
          <option value="FLEXIBLE">Flexible</option>
          <option value="EMERGENCY_AVAILABLE">Emergency Available</option>
        </select>
      </div>

      {/* Spec Step 6 — Max Participant Load */}
      <div>
        <label style={labelStyle}>
          Maximum Participant Caseload{' '}
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>Optional</span>
        </label>
        <input type="number" {...register('maxParticipantLoad', { valueAsNumber: true })} min={0} max={500} placeholder="e.g. 15" style={inputStyle} />
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3 }}>Number of participants you can handle at one time.</p>
      </div>

      {/* Spec Step 7 — Types of Participants They Work With (funding management type) */}
      <CheckboxGroup
        name="participantTypesAccepted"
        options={PARTICIPANT_MGMT_TYPES}
        label="Participant Management Types (Spec Step 7)"
      />

      {/* Note: Billing method preference is captured in the next step (Billing & Rates) */}
    </div>
  );
}
