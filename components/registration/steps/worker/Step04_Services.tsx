'use client';
import { useFormContext, Controller } from 'react-hook-form';
import { ServiceMultiSelect }         from '../../fields/ServiceMultiSelect';
import { TagInput }                   from '../../fields/TagInput';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5,
};

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER',     label: 'Beginner',     desc: '0–1 year',    icon: 'bi-1-circle-fill' },
  { value: 'INTERMEDIATE', label: 'Intermediate', desc: '1–3 years',   icon: 'bi-2-circle-fill' },
  { value: 'EXPERIENCED',  label: 'Experienced',  desc: '3–5 years',   icon: 'bi-3-circle-fill' },
  { value: 'EXPERT',       label: 'Expert',       desc: '5+ years',    icon: 'bi-star-fill'     },
];

const HIGH_INTENSITY = [
  'Tracheostomy Management', 'Ventilator Management', 'Catheterisation', 'Complex Bowel Care',
  'Subcutaneous Injection', 'Enteral Feeding', 'Epilepsy Management', 'Wound Care',
  'Diabetes Management', 'Medication Administration', 'Dysphagia Support',
];

const DISABILITY_TYPES = [
  'Autism Spectrum Disorder', 'Intellectual Disability', 'Physical Disability',
  'Acquired Brain Injury', 'Psychosocial Disability', 'Sensory Impairment (Vision)',
  'Sensory Impairment (Hearing)', 'Neurological Condition', 'Spinal Cord Injury',
  'Multiple Sclerosis', 'Cerebral Palsy', 'Down Syndrome', 'Challenging Behaviours',
];

export function WorkerStep04_Services() {
  const { control, watch, register, formState: { errors } } = useFormContext();
  const expLevel = watch('experienceLevel');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Services offered */}
      <div>
        <Controller
          name="servicesOffered"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <ServiceMultiSelect
              label={<>Services Offered <span style={{ color: '#ef4444' }}>*</span></>  as unknown as string}
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.servicesOffered?.message as string}
            />
          )}
        />
      </div>

      {/* High Intensity Skills */}
      <div>
        <label style={labelStyle}>High Intensity Skills <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>(select all that apply)</span></label>
        <Controller
          name="highIntensitySkills"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HIGH_INTENSITY.map(skill => {
                const selected = (field.value ?? []).includes(skill);
                return (
                  <button key={skill} type="button"
                    onClick={() => {
                      const cur = field.value ?? [];
                      field.onChange(selected ? cur.filter((s: string) => s !== skill) : [...cur, skill]);
                    }}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                      background: selected ? 'rgba(79,70,229,0.1)' : '#fff',
                      color: selected ? 'var(--clr-primary)' : 'var(--clr-text)', cursor: 'pointer',
                    }}>
                    {selected && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                    {skill}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Experience level */}
      <div>
        <label style={labelStyle}>Experience Level <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {EXPERIENCE_LEVELS.map(lvl => {
            const selected = expLevel === lvl.value;
            return (
              <label key={lvl.value} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                border: `1.5px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                borderRadius: 10, cursor: 'pointer',
                background: selected ? 'rgba(79,70,229,0.06)' : '#fff',
              }}>
                <input type="radio" value={lvl.value} {...register('experienceLevel')} style={{ display: 'none' }} />
                <i className={`bi ${lvl.icon}`} style={{ color: selected ? 'var(--clr-primary)' : 'var(--clr-muted)', fontSize: 16 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text)' }}>{lvl.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--clr-muted)' }}>{lvl.desc}</div>
                </div>
              </label>
            );
          })}
        </div>
        {errors.experienceLevel && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.experienceLevel.message as string}</p>}
      </div>

      {/* Disability experience */}
      <div>
        <label style={labelStyle}>Disability Experience <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--clr-muted)' }}>(select all that apply)</span></label>
        <Controller
          name="disabilityExperience"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISABILITY_TYPES.map(type => {
                const selected = (field.value ?? []).includes(type);
                return (
                  <button key={type} type="button"
                    onClick={() => {
                      const cur = field.value ?? [];
                      field.onChange(selected ? cur.filter((s: string) => s !== type) : [...cur, type]);
                    }}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      border: `1.5px solid ${selected ? '#16a34a' : 'var(--clr-border)'}`,
                      background: selected ? '#F0FFF4' : '#fff',
                      color: selected ? '#16a34a' : 'var(--clr-text)', cursor: 'pointer',
                    }}>
                    {selected && <i className="bi bi-check2" style={{ marginRight: 4 }} />}
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
}
