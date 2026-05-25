// components/landing/PricingSection.tsx
const plans = [
  {
    name: 'Participant', price: 'Free', period: '', featured: false, cta: 'Get Started Free', href: '/register',
    desc: 'For NDIS participants finding support.',
    features: ['Browse all support workers', 'Unlimited shift requests', 'Emergency shift access', 'Secure in-app messaging', 'NDIS budget tracking', 'Ratings & reviews'],
  },
  {
    name: 'Worker Pro', price: '$29', period: '/month', featured: true, badge: 'Most Popular', cta: 'Start Free Trial', href: '/register',
    desc: 'For support workers who want to grow fast.',
    features: ['Everything in Free', 'Priority listing in search', 'Urgent shift push notifications', 'NDIS-compliant invoicing', 'Earnings dashboard & analytics', 'Profile verification badge', 'Early access to new shifts', 'Dedicated support chat'],
  },
  {
    name: 'Provider', price: '$149', period: '/month', featured: false, cta: 'Contact Sales', href: '/register',
    desc: 'For NDIS-registered organisations and agencies.',
    features: ['Everything in Worker Pro', 'Verified Provider badge', 'Team management (unlimited workers)', 'Bulk shift publishing', 'Advanced analytics & reports', 'Compliance documentation', 'Branded provider profile', 'Dedicated account manager'],
  },
] as const;

export default function PricingSection() {
  return (
    <section id="pricing" className="section-py" aria-labelledby="pricing-heading">
      <div className="container-xl">
        <div className="text-center mb-10 fade-up">
          <span className="section-label">Pricing</span>
          <h2 id="pricing-heading" className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-sub">
            No hidden fees. No surprises. Participants always free — workers and providers pay only for premium tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start justify-center">
          {plans.map((plan) => (
            <div key={plan.name} className="fade-up">
              <div className={`pricing-card${plan.featured ? ' featured' : ''}`}>
                {'badge' in plan && plan.badge && (
                  <div style={{ background: 'var(--clr-primary)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 16px', borderRadius: 100, display: 'inline-block', marginBottom: 18, letterSpacing: 0.5 }} aria-label="Most popular plan">
                    {plan.badge}
                  </div>
                )}
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--clr-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1 mb-2">
                  <div className="pricing-price" style={{ color: plan.featured ? 'var(--clr-primary)' : 'var(--clr-text)' }}>{plan.price}</div>
                  {plan.period && <span style={{ fontSize: 16, color: 'var(--clr-muted)', fontWeight: 600, marginBottom: 8 }}>{plan.period}</span>}
                </div>
                <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 24, lineHeight: 1.65 }}>{plan.desc}</p>
                <a href={plan.href} className={`w-full mb-4 ${plan.featured ? 'btn-shiftify' : 'btn-outline-shiftify'}`} style={{ fontSize: 15, padding: '13px 0', justifyContent: 'center', display: 'flex' }}>
                  {plan.cta}
                </a>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 14, color: 'var(--clr-text)' }}>
                      <i className="bi bi-check-circle-fill feature-check" style={{ color: plan.featured ? 'var(--clr-primary)' : '#16A34A', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-4 fade-up" style={{ fontSize: 13, color: 'var(--clr-muted)' }}>
          All plans include a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
