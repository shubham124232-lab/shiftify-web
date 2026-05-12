// components/TrustSection.jsx
const trustItems = [
  {
    icon: 'bi-patch-check-fill',
    color: '#2563EB',
    title: 'Verified Workers',
    desc: 'Every support worker undergoes identity verification, reference checks, and NDIS worker screening before joining.',
  },
  {
    icon: 'bi-shield-fill-check',
    color: '#16A34A',
    title: 'NDIS Compliant',
    desc: 'Fully compliant with NDIS Quality and Safeguards Commission requirements. All providers are NDIS-registered.',
  },
  {
    icon: 'bi-star-fill',
    color: '#F59E0B',
    title: 'Ratings & Reviews',
    desc: 'Transparent two-way reviews build accountability. See real feedback from real participants before you book.',
  },
  {
    icon: 'bi-lightning-fill',
    color: '#C2185B',
    title: 'Emergency Response',
    desc: 'Average emergency shift match in under 4 minutes. Our dedicated response team is on standby 24 hours a day.',
  },
  {
    icon: 'bi-person-vcard-fill',
    color: '#7C3AED',
    title: 'Background Checked',
    desc: 'Police checks, Working with Children checks, and NDIS Worker Screening Clearance for every single worker.',
  },
  {
    icon: 'bi-lock-fill',
    color: '#0D9488',
    title: 'Secure Messaging',
    desc: 'End-to-end encrypted messaging keeps your conversations private and your personal information safe.',
  },
];

export default function TrustSection() {
  return (
    <section id="trust" className="section-py" aria-labelledby="trust-heading">
      <div className="container-xl">
        <div className="row align-items-center g-5">

          {/* Left: Header + stats */}
          <div className="col-lg-4 fade-up">
            <span className="section-label">Trust & Safety</span>
            <h2 id="trust-heading" className="section-title">Your Safety Is Our Priority</h2>
            <p style={{ fontSize: 16, color: 'var(--clr-muted)', lineHeight: 1.75, marginBottom: 32 }}>
              Shiftify&apos;s multi-layered safety framework means you can find support with confidence,
              knowing every worker is verified, insured, and NDIS-compliant.
            </p>

            <div className="row g-3">
              {[
                { num: '8,200+', label: 'Verified Workers' },
                { num: '99.2%', label: 'Safety Record' },
                { num: '<4min', label: 'Emergency Match' },
                { num: '4.9★', label: 'Avg Rating' },
              ].map(({ num, label }) => (
                <div key={label} className="col-6">
                  <div style={{ background: 'var(--clr-primary-xlight)', borderRadius: 14, padding: '16px 18px' }}>
                    <div className="stat-number" style={{ fontSize: 28 }}>{num}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-muted)', fontWeight: 700 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Trust items grid */}
          <div className="col-lg-8">
            <div className="row g-3">
              {trustItems.map((item) => (
                <div key={item.title} className="col-12 col-sm-6 fade-up">
                  <div className="trust-item" role="article">
                    <div
                      className="trust-icon"
                      style={{ background: `${item.color}18`, color: item.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 5, color: 'var(--clr-text)' }}>{item.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--clr-muted)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
