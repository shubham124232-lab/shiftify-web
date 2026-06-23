'use client';
import { useFormContext } from 'react-hook-form';

function Toggle({ label, name, desc }: { label: string; name: string; desc?: string }) {
  const { register, watch } = useFormContext();
  const val = watch(name) as boolean;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1.5px solid var(--clr-border)', borderRadius: 10, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <label style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}>
        <input type="checkbox" {...register(name)} style={{ display: 'none' }} />
        <div style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </label>
    </div>
  );
}

export function ProviderStep10_About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--clr-muted)' }}>
        Select which platform features your organisation wants to use.
      </p>
      <Toggle
        label="Post Support Requests"
        name="canPostRequests"
        desc="Post service requests and shifts on the marketplace"
      />
      <Toggle
        label="Access Worker Marketplace"
        name="canViewWorkerMarketplace"
        desc="Browse and contact support workers directly"
      />
      <Toggle
        label="Post Worker Requirements"
        name="canPostWorkerRequirements"
        desc="Advertise specific worker roles or skill requirements"
      />
      <Toggle
        label="Post SIL / SDA Vacancies"
        name="canPostSilSdaVacancies"
        desc="List accommodation vacancies visible to participants and coordinators"
      />
      <Toggle
        label="Seeking Plan Manager"
        name="seekingPlanManager"
        desc="Indicate you are open to connecting with plan managers on the platform"
      />
    </div>
  );
}
