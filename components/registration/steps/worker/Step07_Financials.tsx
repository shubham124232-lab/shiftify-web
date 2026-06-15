'use client';
import { useFormContext, Controller } from 'react-hook-form';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' };

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <label style={{ cursor: 'pointer' }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, transition: 'background 0.2s', background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

function ChipPicker({ name, options, label }: { name: string; options: string[]; label: string }) {
  const { control } = useFormContext();
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <Controller name={name} control={control} defaultValue={[]} render={({ field }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {options.map(opt => {
            const sel = (field.value ?? []).includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => { const cur = field.value ?? []; field.onChange(sel ? cur.filter((s: string) => s !== opt) : [...cur, opt]); }}
                style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${sel ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: sel ? 'rgba(79,70,229,0.1)' : '#fff', color: sel ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                {sel && <i className="bi bi-check2" style={{ marginRight: 4 }} />}{opt}
              </button>
            );
          })}
        </div>
      )} />
    </div>
  );
}

const PARTICIPANT_TYPES = ['Children (under 18)', 'Adults (18–64)', 'Older adults (65+)', 'High needs / complex', 'Behavioural support', 'Psychosocial', 'Physical disability', 'Intellectual disability', 'Autism'];
const LANGUAGES = ['English', 'Mandarin', 'Cantonese', 'Arabic', 'Vietnamese', 'Greek', 'Italian', 'Hindi', 'Korean', 'Tagalog', 'Spanish', 'Other'];

export function WorkerStep07_Financials() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hourly Rate */}
      <div>
        <label htmlFor="hourlyRate" style={labelStyle}>Hourly Rate <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--clr-muted)' }}>$</span>
          <input id="hourlyRate" type="number" step="0.50" min="1" max="9999" {...register('hourlyRate', { valueAsNumber: true })}
            placeholder="35.00" style={{ ...inputStyle, paddingLeft: 28, borderColor: errors.hourlyRate ? '#ef4444' : undefined }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--clr-muted)' }}>/hr</span>
        </div>
        {errors.hourlyRate && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.hourlyRate.message as string}</p>}
      </div>

      {/* Rate Type */}
      <div>
        <label style={labelStyle}>Rate Type</label>
        <select {...register('hourlyRateType')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="FIXED">Fixed Rate</option>
          <option value="NDIS_PRICE_GUIDE">NDIS Price Guide Rate</option>
          <option value="NEGOTIABLE">Negotiable</option>
        </select>
      </div>

      {/* Weekend/Night Rates */}
      <div>
        <label style={labelStyle}>Weekend & Night Rates (optional)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[['weekendNightRates.weekendRate', 'Weekend $/hr'], ['weekendNightRates.nightRate', 'Night $/hr'], ['weekendNightRates.publicHolidayRate', 'Public Holiday $/hr']].map(([field, ph]) => (
            <div key={field} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--clr-muted)' }}>$</span>
              <input type="number" step="0.50" min="0" {...register(field, { valueAsNumber: true })}
                placeholder={ph} style={{ ...inputStyle, paddingLeft: 22, fontSize: 12 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Travel Charges */}
      <div>
        <label style={labelStyle}>Travel Charges</label>
        <select {...register('travelCharges')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select…</option>
          <option value="NONE">No travel charges</option>
          <option value="INCLUDED">Included in hourly rate</option>
          <option value="CHARGED_SEPARATELY">Charged separately (NDIS rates)</option>
        </select>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" style={labelStyle}>Professional Bio</label>
        <textarea id="bio" {...register('bio')} rows={5}
          placeholder="Tell participants about your experience, approach and what makes you a great support worker…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
      </div>

      {/* Work Preferences */}
      <div>
        <label htmlFor="preferences" style={labelStyle}>Work Preferences</label>
        <textarea id="preferences" {...register('preferences')} rows={2}
          placeholder="e.g. Prefer working in the community, comfortable with pets…"
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
      </div>

      {/* Preferred Participant Type */}
      <ChipPicker name="preferredParticipantType" options={PARTICIPANT_TYPES} label="Preferred Participant Types" />

      {/* Gender Preference */}
      <div>
        <label style={labelStyle}>Gender Preference (for participants)</label>
        <select {...register('genderPreference')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">No preference</option>
          <option value="FEMALE">Female participants preferred</option>
          <option value="MALE">Male participants preferred</option>
          <option value="ANY">Any gender</option>
        </select>
      </div>

      {/* Languages Spoken */}
      <ChipPicker name="languagesSpoken" options={LANGUAGES} label="Languages Spoken" />

      {/* Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle label="Mark as Available Now" name="isAvailableNow" desc="You'll appear with an 'Available Now' badge. Auto-clears after 24 hours." />
        <Toggle label="Seeking a Plan Manager" name="seekingPlanManager" desc="Plan Managers in your area can reach out to you" />
      </div>
    </div>
  );
}
