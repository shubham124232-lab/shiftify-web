import type { SVGProps } from 'react';
import {
  IconPersonLine,
  IconGroupLine,
  IconBuildingsLine,
  IconDocumentLine,
} from './PremiumIcons';

type Ico = (p: SVGProps<SVGSVGElement>) => JSX.Element;

interface Row { label: string; name: string; price?: string; free?: boolean }
interface Card {
  key: string;
  role: string;
  blurb: string;
  Icon: Ico;
  rows: Row[];
  note?: string;
  cta: string;
  href: string;
}

const cards: Card[] = [
  {
    key: 'worker',
    role: 'Support Worker',
    blurb: 'Find and apply for support opportunities.',
    Icon: IconPersonLine,
    rows: [
      { label: 'Start',    name: 'actions to get started · use anytime', free: true },
      { label: 'Continue', name: 'Shiftify Basic', price: '$49.99' },
      { label: 'Flexible', name: 'Shift Pass',     price: '$9.99' },
    ],
    note: 'Optional: Available Now',
    cta: 'View Worker pricing',
    href: '/pricing/worker',
  },
  {
    key: 'coordinator',
    role: 'Support Coordinator',
    blurb: 'Find suitable support for participants.',
    Icon: IconGroupLine,
    rows: [
      { label: 'Start',    name: 'actions to get started · use anytime', free: true },
      { label: 'Continue', name: 'Shiftify Pro', price: '$49.99' },
      { label: 'Flexible', name: 'Shift Pass',   price: '$19.99' },
    ],
    note: 'Optional: Speed · Growth',
    cta: 'View Coordinator pricing',
    href: '/pricing/coordinator',
  },
  {
    key: 'provider',
    role: 'Provider',
    blurb: 'Post shifts and connect through the marketplace.',
    Icon: IconBuildingsLine,
    rows: [
      { label: 'Start',    name: 'actions to get started · use anytime', free: true },
      { label: 'Continue', name: 'Provider plans', price: 'From $99.99' },
      { label: 'Flexible', name: 'Shift Pass',     price: '$19.99' },
    ],
    note: 'Featured Shifts · Direct Connect · Visibility options',
    cta: 'View Provider pricing',
    href: '/pricing/provider',
  },
  {
    key: 'plan-manager',
    role: 'Plan Manager',
    blurb: 'Choose the access level that suits your service.',
    Icon: IconDocumentLine,
    rows: [
      { label: 'Start',    name: 'Free access' },
      { label: 'Continue', name: 'Shiftify Basic', price: '$19.99' },
      { label: 'Flexible', name: 'Compare inclusions before choosing' },
    ],
    note: 'Simple options for Plan Managers',
    cta: 'View Plan Manager pricing',
    href: '/pricing/plan-manager',
  },
];

/* Monthly prices carry a period; per-use prices carry a unit. */
const unit = (label: string) => (label === 'Flexible' ? '/use' : '/month');

const IconMegaphone = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M3 10.4v3.2a1.6 1.6 0 0 0 1.6 1.6H7l8.6 4.4V6L7 10.4H4.6A1.6 1.6 0 0 0 3 10.4Z" />
    <path d="M18.8 8.6a4.4 4.4 0 0 1 0 6.8" />
    <path d="M7 15.2V20a1.4 1.4 0 0 0 1.4 1.4h1.2" />
  </svg>
);

const Go = () => (
  <span className="sf-price-go" aria-hidden="true">
    <i className="bi bi-arrow-right" />
  </span>
);

export default function PricingSection() {
  return (
    <section id="pricing" className="sf-section sf-pricing" aria-labelledby="sf-pricing-heading">
      <div className="sf-wrap">

        <div className="sf-pricing-head">
          <span className="sf-eyebrow">Pricing</span>
          <h2 id="sf-pricing-heading" className="sf-h2">Pricing made clear.</h2>
          <p className="sf-lede">Find your role, see how you can start, then explore the option that suits you.</p>
        </div>

        {/* Participants sit above the paid roles — always free. */}
        <div className="sf-price-free">
          <span className="sf-price-rail" aria-hidden="true" />
          <span className="sf-price-icon sf-price-icon-free" aria-hidden="true"><IconGroupLine /></span>
          <div className="sf-price-free-copy">
            <h3 className="sf-price-free-role">Participants and authorised representatives</h3>
            <p className="sf-price-free-sub">Search, connect and book support at no cost — always.</p>
          </div>
          <span className="sf-price-free-tag">Always free</span>
          <a href="/signup/participant" className="sf-price-btn">
            Get support
            <Go />
          </a>
        </div>

        <div className="sf-price-grid">
          {cards.map(({ key, role, blurb, Icon, rows, note, cta, href }) => (
            <article key={key} className="sf-price-card">
              <span className="sf-price-top" aria-hidden="true" />

              <header className="sf-price-card-head">
                <span className="sf-price-icon" aria-hidden="true"><Icon /></span>
                <div className="sf-price-card-copy">
                  <h3 className="sf-price-role">{role}</h3>
                  <p className="sf-price-blurb">{blurb}</p>
                </div>
              </header>

              <dl className="sf-price-rows">
                {rows.map((r) => (
                  <div key={r.label} className="sf-price-row">
                    <dt className="sf-price-label">{r.label}</dt>
                    <dd className="sf-price-value">
                      {r.free && <span className="sf-price-free-pill">10 free</span>}
                      <span className={r.free ? 'sf-price-name is-soft' : 'sf-price-name'}>{r.name}</span>
                      {r.price && (
                        <span className="sf-price-amount">
                          {r.price}<em>{unit(r.label)}</em>
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {note && <p className="sf-price-note">{note}</p>}

              <a href={href} className="sf-price-btn sf-price-btn-block">
                {cta}
                <Go />
              </a>
            </article>
          ))}
        </div>

        {/* Visibility upsell bar. */}
        <div className="sf-price-boost">
          <span className="sf-price-boost-icon" aria-hidden="true"><IconMegaphone /></span>
          <h3 className="sf-price-boost-title">Need extra visibility?</h3>
          <p className="sf-price-boost-list">
            Featured Shifts <em>·</em> SIL/SDA Listing Boost <em>·</em> Platinum Business Placement
          </p>
          <a href="/pricing/visibility" className="sf-price-boost-btn">
            View visibility options
            <Go />
          </a>
        </div>

        <a href="/pricing" className="sf-price-all">
          See complete pricing and inclusions
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </a>

      </div>
    </section>
  );
}
