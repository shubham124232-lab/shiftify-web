import type { ReactNode } from 'react';

/* One price inside a table cell: amount, unit and a small note beneath. */
interface Price { amount: string; unit?: string; note?: string }

interface Role {
  key: string;
  name: string;
  start: string;
  /* Subscription first, then the pay-as-you-go Shift Pass (if any). */
  continue: Price[];
  addon: string;
  bestFor: string;
  free?: boolean;
}

const roles: Role[] = [
  {
    key: 'participant',
    name: 'Participant',
    start: 'Free, always',
    continue: [],
    addon: '',
    bestFor: 'Anyone booking support',
    free: true,
  },
  {
    key: 'worker',
    name: 'Support Worker',
    start: '10 free applications',
    continue: [
      { amount: '$49.99', unit: '/mo', note: 'Shiftify Basic subscription' },
      { amount: '$9.99', unit: '/use', note: 'Shift Pass, pay as you go' },
    ],
    addon: 'Available Now — $24.99/mo',
    bestFor: 'Independent support workers',
  },
  {
    key: 'coordinator',
    name: 'Support Coordinator',
    start: '10 free actions',
    continue: [
      { amount: '$49.99', unit: '/mo', note: 'Shiftify Pro subscription' },
      { amount: '$19.99', unit: '/use', note: 'Shift Pass, pay as you go' },
    ],
    addon: 'Speed · Growth — unlocks worker list',
    bestFor: 'Coordinators sourcing support',
  },
  {
    key: 'provider',
    name: 'Provider',
    start: '10 free actions',
    continue: [
      { amount: 'From $99.99', unit: '/mo', note: 'Starter · Team · Growth · Scale' },
      { amount: '$19.99', unit: '/use', note: 'Shift Pass, pay as you go' },
    ],
    addon: 'Marketplace add-ons below',
    bestFor: 'Businesses posting shifts',
  },
  {
    key: 'plan-manager',
    name: 'Plan Manager',
    start: 'Public dashboard, view only',
    continue: [
      { amount: '$19.99', unit: '/mo', note: 'Shiftify Basic — required for database access' },
    ],
    addon: 'Compare inclusion tiers',
    bestFor: 'Plan management services',
  },
];

interface Option {
  key: string;
  icon: string;
  title: string;
  price?: string;
  body?: string;
  rows?: [string, string][];
  foot?: string;
}

const options: Option[] = [
  {
    key: 'connect',
    icon: 'bi-link-45deg',
    title: 'Direct Connect',
    price: '$9.99',
    body: 'Charged only when a worker accepts. Up to 3 concurrent invites per shift — the rest withdraw free.',
  },
  {
    key: 'featured',
    icon: 'bi-flag',
    title: 'Featured Shift',
    rows: [
      ['Rapid', '$19.99 / 60 min'],
      ['Urgent', '$14.99 / 24 hr'],
      ['Last-Minute', '$9.99 / 48 hr'],
      ['Routine', '$21.99 / 7 days'],
    ],
  },
  {
    key: 'platinum',
    icon: 'bi-star',
    title: 'Platinum Tile Sponsorship',
    rows: [
      ['Metro', '$499.99/mo'],
      ['State', '$999.99/mo'],
      ['National', '$1,499.99/mo'],
    ],
    foot: '25–35% off on multi-month terms.',
  },
  {
    key: 'listings',
    icon: 'bi-clipboard2',
    title: 'SIL / SDA Listings',
    rows: [
      ['Standard', '$199 / 30 days'],
      ['Featured', '$399 / 30 days'],
    ],
  },
];

/* Featured Shift rows carry their lane colour. */
const laneClass: Record<string, string> = {
  Rapid: 'is-rapid',
  Urgent: 'is-urgent',
  'Last-Minute': 'is-lastmin',
  Routine: 'is-routine',
};

const Empty = () => <span className="sf-cmp-dash" aria-label="Not applicable">—</span>;

function ContinueCell({ prices }: { prices: Price[] }) {
  if (prices.length === 0) return <Empty />;
  const out: ReactNode[] = [];
  prices.forEach((p, i) => {
    if (i > 0) out.push(<span key={`or-${i}`} className="sf-cmp-or">or</span>);
    out.push(
      <span key={p.amount + i} className="sf-cmp-price">
        <strong className={i > 0 ? 'is-pass' : undefined}>{p.amount}</strong>
        {p.unit && <em>{p.unit}</em>}
        {p.note && <small>{p.note}</small>}
      </span>,
    );
  });
  return <>{out}</>;
}

export default function PricingSection() {
  return (
    <section id="pricing" className="sf-section sf-pricing" aria-labelledby="sf-pricing-heading">
      <div className="sf-wrap">

        <div className="sf-pricing-head">
          <span className="sf-eyebrow">Pricing</span>
          <h2 id="sf-pricing-heading" className="sf-h2">Compare pricing for every role at a glance.</h2>
        </div>

        <div className="sf-cmp-scroll" role="region" aria-label="Pricing by role" tabIndex={0}>
          <table className="sf-cmp">
            <thead>
              <tr>
                <td className="sf-cmp-corner" />
                {roles.map((r) => (
                  <th key={r.key} scope="col" className={`sf-cmp-role is-${r.key}`}>{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Start</th>
                {roles.map((r) => (
                  <td key={r.key} className={r.free ? 'is-free' : undefined}>
                    <span className="sf-cmp-start">{r.start}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Continue</th>
                {roles.map((r) => (
                  <td key={r.key} className={r.free ? 'is-free' : undefined}>
                    <ContinueCell prices={r.continue} />
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Add-on</th>
                {roles.map((r) => (
                  <td key={r.key} className={r.free ? 'is-free' : undefined}>
                    {r.addon ? r.addon : <Empty />}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Best for</th>
                {roles.map((r) => (
                  <td key={r.key} className={r.free ? 'is-free sf-cmp-best' : 'sf-cmp-best'}>{r.bestFor}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sf-mkt-head">
          <h3 className="sf-mkt-title">
            Provider Marketplace Options
            <span className="sf-mkt-badge">Provider only</span>
          </h3>
          <p className="sf-mkt-sub">
            Optional tools for Providers to connect with workers, promote shifts and advertise SIL/SDA vacancies.
          </p>
        </div>

        <div className="sf-mkt-grid">
          {options.map((o) => (
            <article key={o.key} className={`sf-mkt-card is-${o.key}`}>
              <i className={`bi ${o.icon} sf-mkt-icon`} aria-hidden="true" />
              <h4 className="sf-mkt-card-title">{o.title}</h4>
              {o.price && <p className="sf-mkt-price">{o.price}</p>}
              {o.body && <p className="sf-mkt-body">{o.body}</p>}
              {o.rows && (
                <dl className="sf-mkt-rows">
                  {o.rows.map(([label, value]) => (
                    <div key={label} className={`sf-mkt-row ${laneClass[label] ?? ''}`}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {o.foot && <p className="sf-mkt-foot">{o.foot}</p>}
            </article>
          ))}
        </div>

        <p className="sf-mkt-note">
          Matching is included as standard. Featured Shift provides optional additional visibility.
        </p>

      </div>
    </section>
  );
}
