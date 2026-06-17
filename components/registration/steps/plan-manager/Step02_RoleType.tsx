'use client';
import { useFormContext } from 'react-hook-form';

const ROLE_OPTIONS = [
  {
    value: 'PLAN_MANAGER',
    label: 'Plan Manager',
    desc: 'You are the primary registered Plan Manager, directly responsible for managing NDIS participant funds and invoice processing.',
    icon: 'bi-person-badge-fill',
  },
  {
    value: 'PM_ORG_ADMIN',
    label: 'Organisation Admin',
    desc: 'You manage a team of Plan Managers and have administrative oversight of the organisation accounts and operations.',
    icon: 'bi-building-fill',
  },
  {
    value: 'PM_STAFF_MEMBER',
    label: 'Staff Member',
    desc: 'You work as part of a Plan Management organisation and process invoices on behalf of participants.',
    icon: 'bi-people-fill',
  },
];

export function PmStep02_RoleType() {
  const { register, watch } = useFormContext();
  const selected = watch('pmRoleType') as string;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--clr-muted)' }}>
        Select the role that best describes how you operate as a Plan Manager. This determines the features and responsibilities associated with your account.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ROLE_OPTIONS.map(opt => (
          <label key={opt.value}
            style={{ display: 'flex', gap: 14, padding: '16px', borderRadius: 12, cursor: 'pointer',
              border: `1.5px solid ${selected === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: selected === opt.value ? 'rgba(79,70,229,0.06)' : '#fff',
              transition: 'all 0.15s' }}>
            <input type="radio" value={opt.value} {...register('pmRoleType')} style={{ display: 'none' }} />
            <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: selected === opt.value ? 'rgba(79,70,229,0.12)' : 'var(--clr-surface)',
              border: `1.5px solid ${selected === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}` }}>
              <i className={`bi ${opt.icon}`} style={{ fontSize: 18, color: selected === opt.value ? 'var(--clr-primary)' : 'var(--clr-muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: selected === opt.value ? 'var(--clr-primary)' : 'var(--clr-text)', marginBottom: 3 }}>
                {opt.label}
                {selected === opt.value && <i className="bi bi-check-circle-fill" style={{ marginLeft: 8, fontSize: 13, color: 'var(--clr-primary)' }} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--clr-muted)', lineHeight: 1.5 }}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
