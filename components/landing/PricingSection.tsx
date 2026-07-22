// components/landing/PricingSection.tsx
'use client';

import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface Tier {
  label: string;
  price: string;
  period: string;
  features: string[];
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
      {
        label: 'Free', price: '$0', period: 'always', color: '#DB2777', isPrimary: true,
        features: [
          'Post jobs, search providers & workers',
          'View SIL / SDA listings',
          'No plan or payment step, ever',
        ],
      },
    ],
    footnote: 'Participants are never charged — no plan, no payment step, ever.',
  },
  {
    key: 'coordinators',
    tabLabel: 'Support Coordinators',
    tiers: [
      {
        label: 'Free', price: '$0', period: '5 posts / month', color: '#059669',
        features: ['Profile creation', 'Registration', '5 job posts per month'],
      },
      {
        label: 'Basic', price: '$49.99', period: '/month', color: '#F97316', isPrimary: true,
        features: ['Post unlimited jobs', 'Manage participants', 'Receive applications', 'Live availability of SW and Providers'],
      },
      {
        label: '+ Growth', price: '$29.99', period: 'add-on', color: '#2563EB',
        features: ['Access to participant opportunities', 'Access to provider list', 'Access to support worker list', 'Access to plan manager list', 'View SIL / SDA listings'],
      },
      {
        label: '+ Speed', price: '$19.99', period: 'add-on', color: '#DB2777',
        features: ['Filter "Available Now" workers', 'Faster response on urgent jobs'],
      },
    ],
    footnote: 'Add-ons stack onto Basic. No commission per job.',
  },
  {
    key: 'providers',
    tabLabel: 'Providers',
    tiers: [
      {
        label: 'Basic', price: '$99.99', period: '/month', color: '#0D9488', isPrimary: true,
        features: ['Access listings', 'Post jobs (replacement staff / shifts)', 'Be visible on platform (SC / PM / Participants)', 'Show Live Availability'],
      },
      {
        label: '+ Growth', price: '$39.99', period: 'add-on', color: '#2563EB',
        features: ['Access to participant opportunities', 'Access to support worker list', 'Access to support coordinator list', 'Access to plan manager list'],
      },
      {
        label: '+ Speed', price: '$29.99', period: 'add-on', color: '#DB2777',
        features: ['Access to "Available Now" support workers and participants', 'Faster replacement staff filling', 'Priority in urgent staffing'],
      },
      {
        label: 'SIL / SDA Listing', price: '$99–199', period: '/ 30 days', color: '#7C3AED',
        features: ['Post vacancy'],
      },
      {
        label: 'Platinum Tile', price: '$399–599', period: '/ 30 days', color: '#DC2626',
        features: ['Top placement on SDA/SIL board', 'Top placement on main page', 'Only first 3 listings shown'],
      },
    ],
    footnote: 'No per-job commission on any tier. Only the first 3 Platinum Tile listings are shown at any time.',
  },
  {
    key: 'workers',
    tabLabel: 'Support Workers',
    tiers: [
      {
        label: 'Free', price: '$0', period: '5 applications / month', color: '#059669',
        features: ['Profile creation', 'Registration', 'Visible on platform', 'Receive job invites', 'Apply to 5 jobs per month'],
      },
      {
        label: 'Basic', price: '$49.99', period: '/month', color: '#059669', isPrimary: true,
        features: ['Apply to unlimited jobs', 'Access all job postings', 'Messaging access', 'Show live availability (normal schedule)'],
      },
      {
        label: '+ Available Now', price: '$24.99', period: 'add-on', color: '#DB2777',
        features: ['Mark themselves as "Available Now"', 'Priority in urgent jobs', 'Higher chance of being selected for last-minute shifts'],
      },
    ],
    footnote: 'Free tier stays free forever. 0% commission — you keep 100% of your pay.',
  },
  {
    key: 'planmanagers',
    tabLabel: 'Plan Managers',
    tiers: [
      {
        label: 'Basic', price: '$19.99', period: '/month', color: '#EC4899', isPrimary: true,
        features: [
          'Create profile',
          'Be visible to Support Coordinators, Providers & Participants',
          'Receive connection / enquiry requests',
          'Accept / reject connection requests',
        ],
      },
    ],
    footnote: 'Limited, connection-based visibility only — no open browsing or database access.',
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
                  <ul className="mp-tier-features">
                    {t.features.map((f) => (
                      <li key={f}>
                        <FiCheckCircle size={14} style={{ color: t.color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
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
