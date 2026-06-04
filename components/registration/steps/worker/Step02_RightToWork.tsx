'use client';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};

const RTW_OPTIONS = [
  { value: 'CITIZEN',     label: 'Australian Citizen',     icon: 'bi-flag-fill',           desc: 'Born in Australia or naturalised' },
  { value: 'PR',          label: 'Permanent Resident',     icon: 'bi-house-heart-fill',    desc: 'Permanent residency visa holder' },
  { value: 'VISA_HOLDER', label: 'Visa Holder',            icon: 'bi-passport-fill',       desc: 'Working visa or other valid visa' },
];

const VISA_TYPES = [
  'Working Holiday (417)', 'Working Holiday (462)', 'Graduate Visa (485)',
  'Student Visa (500)', 'Skilled Independent (189)', 'Skilled Nominated (190)',
  'Partner Visa (820/801)', 'Other',
];

export function WorkerStep02_RightToWork() {
  const { register, watch, formState: { errors } } = useFormContext();
  const rtw = watch('rightToWork');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Right to work selector */}
      <div>
        <label style={labelStyle}>Right to Work in Australia <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RTW_OPTIONS.map(opt => {
            const selected = rtw === opt.value;
            return (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                background: selected ? 'rgba(79,70,229,0.06)' : '#fff',
                transition: 'all 0.15s',
              }}>
                <input type="radio" value={opt.value} {...register('rightToWork')} style={{ display: 'none' }} />
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: selected ? 'var(--clr-primary)' : 'var(--clr-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bi ${opt.icon}`} style={{ color: selected ? '#fff' : 'var(--clr-primary)', fontSize: 15 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 1 }}>{opt.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%',
                  border: selected ? '2px solid var(--clr-primary)' : '2px solid var(--clr-border)',
                  background: selected ? 'var(--clr-primary)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 10 }} />}
                </div>
              </label>
            );
          })}
        </div>
        {errors.rightToWork && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{errors.rightToWork.message as string}</p>
        )}
      </div>

      {/* Visa fields — conditional */}
      {rtw === 'VISA_HOLDER' && (
        <div style={{
          background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.15)',
          borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600 }}>
            <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
            Please provide your visa details
          </p>

          <div>
            <label style={labelStyle}>Visa Type <span style={{ color: '#ef4444' }}>*</span></label>
            <select {...register('visaType')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select visa type…</option>
              {VISA_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {errors.visaType && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.visaType.message as string}</p>}
          </div>

          <div>
            <label style={labelStyle}>Visa Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" {...register('visaExpiry')} style={inputStyle} />
            {errors.visaExpiry && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3 }}>{errors.visaExpiry.message as string}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
