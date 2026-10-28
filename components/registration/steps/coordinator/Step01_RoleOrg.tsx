'use client';
import { useFormContext } from 'react-hook-form';
import { inp, lbl } from '@/components/jobs/post/shared';

const YRS_EXP = ['0-1', '1-3', '3-5', '5+'];

const ROLE_TYPES = [
  { value: 'INDEPENDENT',        label: 'Independent',           desc: 'Self-employed coordinator' },
  { value: 'SC_ORGANISATION',    label: 'SC Organisation',       desc: 'Employed by a support coordination organisation' },
  { value: 'NDIS_PROVIDER',      label: 'NDIS Provider',         desc: 'Employed by a registered NDIS provider' },
  { value: 'OTHER_ORGANISATION', label: 'Other Organisation',    desc: 'Employed by another type of organisation' },
];

const CONTACT_METHODS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone call' },
  { value: 'SMS', label: 'SMS' },
  { value: 'PLATFORM_MESSAGE', label: 'Platform message' },
];

export function CoordStep01_RoleOrg() {
  const { register, watch, formState: { errors } } = useFormContext();
  const roleType = watch('roleType') as string;
  const ndisReg  = watch('ndisRegistered') as boolean | string;
  const isRegistered = ndisReg === true || ndisReg === 'true';
  const isOrg = !!roleType && roleType !== 'INDEPENDENT';

  return (
    <div className="flex flex-col gap-[18px]">

      {/* Role type */}
      <div>
        <label className={lbl}>Coordinator Type <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_TYPES.map(opt => (
            <label key={opt.value}
              className={`flex flex-col gap-[3px] p-3 rounded-[10px] cursor-pointer border-[1.5px] ${roleType === opt.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
              <input type="radio" value={opt.value} {...register('roleType')} className="hidden" />
              <span className="text-[13px] font-bold">{opt.label}</span>
              <span className="text-[11px] text-slate-500">{opt.desc}</span>
            </label>
          ))}
        </div>
        {errors.roleType && <p className="text-xs text-red-500 mt-1">{errors.roleType.message as string}</p>}
      </div>

      {/* Organisation name + role — conditional on any org type */}
      {isOrg && (
        <>
          <div>
            <label className={lbl}>Organisation Name <span className="text-red-500">*</span></label>
            <input {...register('organisationName')} placeholder="e.g. Care Coordination Partners"
              className={`${inp} ${errors.organisationName ? 'border-red-500' : ''}`} />
            {errors.organisationName && <p className="text-xs text-red-500 mt-1">{errors.organisationName.message as string}</p>}
          </div>
          <div>
            <label className={lbl}>Your Role in the Organisation</label>
            <input {...register('organisationRole')} placeholder="e.g. Senior Support Coordinator" className={inp} />
          </div>
          <div>
            <label className={lbl}>Team Invitation Code (optional)</label>
            <input {...register('joinedViaInviteCode')} placeholder="e.g. SUNRISE24" className={inp} />
            <p className="text-[11px] text-slate-500 mt-1">If a colleague at your organisation shared a code with you, enter it here to join their organisation.</p>
          </div>
        </>
      )}

      {/* ABN */}
      <div>
        <label className={lbl}>ABN (Australian Business Number) <span className="text-red-500">*</span></label>
        <input {...register('abn')} placeholder="XX XXX XXX XXX" className={inp} />
        <p className="text-[11px] text-slate-500 mt-1">Required for all independent and agency coordinators.</p>
      </div>

      {/* NDIS registration status */}
      <div>
        <label className={lbl}>NDIS Provider Registration Status <span className="text-red-500">*</span></label>
        <p className="mb-2.5 text-xs text-slate-500">Both registered and unregistered coordinators are welcome.</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'true',  label: 'Registered NDIS Provider',  desc: 'Registered with the NDIS Quality and Safeguards Commission' },
            { value: 'false', label: 'Unregistered Provider',      desc: 'Operating lawfully but not NDIS-commission registered' },
          ].map(opt => {
            const sel = String(ndisReg) === opt.value;
            return (
              <label key={opt.value}
                className={`flex flex-col gap-[3px] p-3 rounded-[10px] cursor-pointer border-[1.5px] ${sel ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
                <input type="radio" value={opt.value} {...register('ndisRegistered')} className="hidden" />
                <span className="text-[13px] font-bold">{opt.label}</span>
                <span className="text-[11px] text-slate-500">{opt.desc}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* NDIS provider number — conditional */}
      {isRegistered && (
        <div>
          <label className={lbl}>NDIS Provider Number <span className="text-red-500">*</span></label>
          <input {...register('ndisProviderNumber')} placeholder="4-XXXXXXXX" className={inp} />
          <p className="text-[11px] text-slate-500 mt-1">Find your provider number in the NDIS Commission portal.</p>
        </div>
      )}

      {/* Years of experience */}
      <div>
        <label className={lbl}>Years of Experience <span className="text-red-500">*</span></label>
        <select {...register('yearsExperience')} className={`${inp} cursor-pointer ${errors.yearsExperience ? 'border-red-500' : ''}`}>
          <option value="">Select...</option>
          {YRS_EXP.map(y => <option key={y} value={y}>{y} years</option>)}
        </select>
        {errors.yearsExperience && <p className="text-xs text-red-500 mt-1">{errors.yearsExperience.message as string}</p>}
      </div>

      {/* Preferred contact method */}
      <div>
        <label className={lbl}>Preferred Contact Method</label>
        <select {...register('preferredContactMethod')} className={`${inp} cursor-pointer`}>
          <option value="">Select...</option>
          {CONTACT_METHODS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

    </div>
  );
}
