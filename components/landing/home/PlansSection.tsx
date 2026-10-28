import type { SVGProps } from 'react';
import { IconWorker, IconCoordinator, IconProvider } from './PremiumIcons';

type Ico = (p: SVGProps<SVGSVGElement>) => JSX.Element;
interface Addon { icon: string; name: string; price: string; desc: string }
interface Plan {
  key: string;
  role: string;
  name: string;
  Icon: Ico;
  accent: string;
  price: string;
  period: string;
  year?: string;
  features: string[];
  addons?: Addon[];
  pass?: string;
  cta: string;
  href: string;
}

/* The middle plan is the one we lead with. */
const FEATURED_PLAN = 'coordinators';

const plans: Plan[] = [
  {
    key: 'workers',
    role: 'Support Worker',
    name: 'Shiftify Basic',
    Icon: IconWorker,
    accent: 'var(--sf-urgent)',
    price: '$49.99',
    period: '/month',
    year: '$389.92/year',
    features: [
      'Unlimited eligible applications',
      'Messaging and availability',
      'Optional Available Now add-on',
    ],
    pass: 'Or one Shift Pass — $9.99',
    cta: 'View worker pricing',
    href: '/register?role=SUPPORT_WORKER',
  },
  {
    key: 'coordinators',
    role: 'Support Coordinator',
    name: 'Shiftify Pro',
    Icon: IconCoordinator,
    accent: 'var(--sf-routine)',
    price: '$49.99',
    period: '/month',
    year: '$389.92/year',
    features: [
      'Unlimited support-request posts',
      'Participant workspace',
    ],
    addons: [
      { icon: 'bi-lightning-charge-fill', name: 'Speed',  price: '$19.99/month · $155.92/year', desc: 'Available Now worker filter and fast replacement tools' },
      { icon: 'bi-bar-chart-fill',        name: 'Growth', price: '$29.99/month · $233.92/year', desc: 'Direct Invite, expanded network and enhanced visibility' },
    ],
    pass: 'Or one Shift Pass — $19.99',
    cta: 'View coordinator pricing',
    href: '/register?role=COORDINATOR',
  },
  {
    key: 'providers',
    role: 'Provider',
    name: 'Starter',
    Icon: IconProvider,
    accent: 'var(--sf-ink)',
    price: 'From $99.99',
    period: '/month',
    year: 'Plans scale with your team',
    features: [
      'Unlimited shift posts',
      'Internal workforce tools',
      'Branch and team management',
    ],
    pass: 'Or one Shift Pass — $19.99',
    cta: 'View provider plans',
    href: '/register?role=PROVIDER',
  },
];

export default function PlansSection() {
  return (
    <section id="pricing" className="sf-section sf-plans" aria-labelledby="sf-plans-heading">
      <div className="sf-wrap">

        <div style={{ marginBottom: 22 }}>
          <span className="sf-eyebrow">Simple. Flexible. Transparent.</span>
          <h2 id="sf-plans-heading" className="sf-h2" style={{ marginBottom: 10 }}>
            Start free. Choose what fits next.
          </h2>
          <p className="sf-lede">
            Participants are always free. Support Workers, Support Coordinators and Providers each
            receive 10 introductory actions — once only, with no expiry.
          </p>
        </div>

        <div className="sf-plan-grid">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`sf-plan${p.key === FEATURED_PLAN ? ' featured' : ''}`}
              style={{ ['--tile-accent' as string]: p.accent }}
            >
              {p.key === FEATURED_PLAN && <span className="sf-plan-badge">Most popular</span>}

              <div className="sf-plan-head">
                <p.Icon className="sf-plan-icon" />
                <div>
                  <h3 className="sf-plan-role">{p.role}</h3>
                  <p className="sf-plan-name">{p.name}</p>
                </div>
              </div>

              <p className="sf-plan-price">
                {p.price}<small>{p.period}</small>
              </p>
              {p.year && <p className="sf-plan-year">{p.year}</p>}

              <ul className="sf-plan-feats">
                {p.features.map((f) => (
                  <li key={f}>
                    <i className="bi bi-check-lg" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              {p.addons && (
                <div>
                  <p className="sf-addon-label">Optional add-on packages</p>
                  {p.addons.map((a) => (
                    <div key={a.name} className="sf-addon">
                      <i className={`bi ${a.icon} lead`} aria-hidden="true" />
                      <div>
                        <b>{a.name} — {a.price}</b>
                        <span>{a.desc}</span>
                      </div>
                      <i className="bi bi-chevron-right chev" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}

              <div className="sf-plan-foot">
                {p.pass && <p className="sf-plan-pass">{p.pass}</p>}
                <a href={p.href} className="sf-plan-btn">{p.cta}</a>
              </div>
            </div>
          ))}
        </div>

        <div className="sf-plan-strip">
          <b>Optional marketplace tools:</b>{' '}
          Featured Shifts from $9.99 · Direct Connect $9.99 per accepted connection ·
          SIL/SDA listings from $199/30 days · Platinum Sponsorship from $499.99/month
          <div style={{ fontSize: 11.5, marginTop: 4, color: 'var(--sf-muted)' }}>Prices include GST.</div>
        </div>

        <a href="/pricing" className="sf-plan-compare">Compare all plans, limits and inclusions →</a>

      </div>
    </section>
  );
}
