// components/landing/PricingSection.tsx
'use client';

import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface Tier {
  label: string;
  price: string;
  period: string;
  desc: string;
  color: string;
  isPrimary?: boolean;
}

interface Plan {
  key: string;
  tabLabel: string;
  tiers: Tier[];
  footnote: string;
}

const plans: Plan[] = [
  {
    key: 'participants',
    tabLabel: 'Participants',
    tiers: [
      { label: 'Free', price: '$0', period: 'forever', desc: 'Post jobs, search providers & workers, view SIL / SDA. 0% platform fee.', color: '#DB2777', isPrimary: true },
    ],
    footnote: 'Participants never pay to post or confirm.',
  },
  {
    key: 'coordinators',
    tabLabel: 'Support Coordinators',
    tiers: [
      { label: 'Free', price: '$0', period: '5 posts / month', desc: 'Profile + 5 posts per month to get started.', color: '#059669' },
      { label: 'Basic', price: '$49.99', period: '/month', desc: 'Unlimited jobs. Manage your whole caseload.', color: '#F97316', isPrimary: true },
      { label: '+ Growth', price: '$29.99', period: 'add-on', desc: 'Full network access across all providers & workers.', color: '#2563EB' },
      { label: '+ Speed', price: '$19.99', period: 'add-on', desc: 'Filter and jump straight to Available Now.', color: '#DB2777' },
    ],
    footnote: 'Add-ons stack onto Basic. No commission per job.',
  },
  {
    key: 'providers',
    tabLabel: 'Providers',
    tiers: [
      { label: 'Free', price: '$0', period: 'browse only', desc: 'View fill-rate benchmarks before you commit.', color: '#059669' },
      { label: 'Basic', price: '$99.99', period: '/month', desc: 'Post shifts, apply, receive apps, SIL/SDA listings.', color: '#0D9488', isPrimary: true },
      { label: '+ Growth', price: '$39.99', period: 'add-on', desc: 'Full network access to every worker on the platform.', color: '#2563EB' },
      { label: '+ Speed', price: '$29.99', period: 'add-on', desc: 'Urgent replacement filling when a shift falls through.', color: '#DB2777' },
      { label: 'Platinum', price: '$399–599', period: '/ 30 days', desc: 'Featured tile placement. Only 3 spots per surface.', color: '#7C3AED' },
    ],
    footnote: 'No per-job commission on any tier.',
  },
  {
    key: 'workers',
    tabLabel: 'Support Workers',
    tiers: [
      { label: 'Free', price: '$0', period: '5 applications / month', desc: 'Profile + 5 applications per month.', color: '#059669' },
      { label: 'Basic', price: '$49.99', period: '/month', desc: 'Unlimited applications & messaging.', color: '#059669', isPrimary: true },
      { label: '+ Available Now', price: '$24.99', period: 'add-on', desc: 'Priority placement on urgent jobs nearby.', color: '#DB2777' },
    ],
    footnote: 'Free tier stays free forever. You keep 100% of your rate.',
  },
  {
    key: 'planmanagers',
    tabLabel: 'Plan Managers',
    tiers: [
      { label: 'Flat', price: '$19.99', period: '/month', desc: 'Profile + visibility. Receive connection requests. Connect with SC & providers. View providers & SIL/SDA.', color: '#EC4899', isPrimary: true },
    ],
    footnote: 'No job posting, no database access.',
  },
];

const legend = [
  { tag: 'FREE',  label: 'Entry',          color: '#059669' },
  { tag: 'BASIC', label: 'Operate',        color: '#F97316' },
  { tag: 'GROWTH',label: 'Access network', color: '#2563EB' },
  { tag: 'SPEED', label: 'Urgent action',  color: '#DB2777' },
] as const;

export default function PricingSection() {
  const [activeKey, setActiveKey] = useState('providers');
  const active = plans.find((p) => p.key === activeKey) ?? plans[0];

  return (
    <section id="pricing" className="section-py master-pricing-bg" aria-labelledby="pricing-heading">
      <div className="container-xl">

        <div className="text-center mb-6 fade-up">
          <span className="section-label">Master Pricing · All Roles</span>
          <h2 id="pricing-heading" className="section-title">
            Free to <em style={{ fontStyle: 'italic', color: 'var(--clr-primary)' }}>enter</em>. Pay only for reach and speed.
          </h2>
          <p className="section-sub" style={{ maxWidth: 640, margin: '0 auto 20px' }}>
            Four levers: <strong>Free</strong> to enter, <strong>Basic</strong> to operate,{' '}
            <strong>Growth</strong> to access the network, <strong>Speed</strong> to jump the urgent queue.
          </p>
          <span className="mp-note-pill">
            <FiCheckCircle size={16} aria-hidden="true" />
            0% commission per post / job — subscription only
          </span>
        </div>

        <div className="mp-tabs fade-up" role="tablist" aria-label="Pricing by role">
          {plans.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={activeKey === p.key}
              onClick={() => setActiveKey(p.key)}
              className={`mp-tab-btn${activeKey === p.key ? ' active' : ''}`}
            >
              {p.tabLabel} <span className="mp-tab-count">{plans.find((pl) => pl.key === p.key)!.tiers.length}</span>
            </button>
          ))}
        </div>

        <div key={active.key}>
          <div className="mp-tier-grid">
            {active.tiers.map((t) => {
              const tagInfo = legend.find((l) => l.tag === t.label.replace('+ ', '').toUpperCase());
              return (
                <div key={t.label} className={`mp-tier-card${t.isPrimary ? ' primary' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="mp-tier-label" style={{ color: t.isPrimary ? '#fff' : t.color, background: t.isPrimary ? `${t.color}33` : `${t.color}14` }}>
                      {t.label}
                    </span>
                    {tagInfo && <span className="mp-tier-tagline">{tagInfo.label}</span>}
                  </div>
                  <div className="flex items-end gap-1 my-3">
                    <span className="mp-tier-price">{t.price}</span>
                    <span className="mp-tier-period">{t.period}</span>
                  </div>
                  <p className="mp-tier-desc">{t.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="mp-footnote">{active.footnote}</p>
        </div>

      </div>
    </section>
  );
}
