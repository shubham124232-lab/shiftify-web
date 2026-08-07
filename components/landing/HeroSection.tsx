// components/landing/HeroSection.tsx
'use client';

const quickSupport = [
  { icon: 'bi-exclamation-triangle-fill', title: 'Rapid Replacement',     desc: 'A worker has cancelled',       color: '#DC2626', href: '#emergency'   },
  { icon: 'bi-clock-fill',                title: 'Urgent Support',        desc: 'Needed within a few hours',     color: '#7C3AED', href: '#marketplace' },
  { icon: 'bi-calendar-check-fill',       title: 'Last-Minute Support',   desc: 'Needed today or soon',          color: '#EA580C', href: '#marketplace' },
  { icon: 'bi-people-fill',               title: 'Regular Support',       desc: 'Future or recurring',           color: '#C2185B', href: '#marketplace' },
] as const;

const roles = [
  { icon: 'bi-people-fill',        title: 'Participant',         desc: 'Find and book the right support for you',        color: '#DB2777', bg: 'rgba(219,39,119,0.1)' },
  { icon: 'bi-person-fill',        title: 'Support Worker',      desc: 'Find shifts that match your skills & availability', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  { icon: 'bi-diagram-3-fill',     title: 'Support Coordinator', desc: 'Manage and coordinate participant supports',     color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  { icon: 'bi-building-fill',      title: 'Provider',            desc: 'Find workers and grow your services',            color: '#EA580C', bg: 'rgba(234,88,12,0.1)'  },
  { icon: 'bi-wallet2',            title: 'Plan Manager',        desc: 'Review and manage supports & budgets',           color: '#2563EB', bg: 'rgba(37,99,235,0.1)'  },
] as const;

export default function HeroSection() {
  return (
    <section id="main-content" className="hero-section" aria-labelledby="hero-heading">
      <div className="container-xl">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-12 items-start">

          {/* Left: Text */}
          <div className="hero-left">
            <div className="badge-pink mb-4 inline-flex" role="status" aria-live="polite">
              <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', animation: 'blink 1.5s infinite', flexShrink: 0 }} aria-hidden="true" />
              <span>2,400+ Active Support Workers Available Now</span>
            </div>

            <h1 id="hero-heading" className="hero-title fade-up">
              Support when it<br />
              <span className="highlight">matters most</span>
            </h1>
            <span className="hero-title-underline" aria-hidden="true" />

            <p className="hero-sub fade-up">
              Connecting participants, workers and NDIS organisations<br />
              for urgent, last-minute and ongoing support.
            </p>

            <div className="flex flex-wrap gap-3 mb-4 fade-up">
              <a href="#emergency" className="btn-shiftify">I NEED SUPPORT</a>
              <a href="#marketplace" className="btn-outline-navy">I PROVIDE SUPPORT</a>
            </div>

            <a href="#coordinator" className="hero-coordinator-link fade-up">
              I coordinate or manage participant supports
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>

            <span className="hero-quick-label fade-up">NEED SUPPORT QUICKLY?</span>

            <div className="hero-quick-grid fade-up">
              {quickSupport.map((item) => (
                <a key={item.title} href={item.href} className="hero-quick-card" style={{ borderTopColor: item.color }}>
                  <span className="quick-card-icon" style={{ background: item.color, color: '#fff' }}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                  </span>
                  <h3 className="quick-card-title">{item.title}</h3>
                  <p className="quick-card-desc">{item.desc}</p>
                  <i className="bi bi-arrow-right quick-card-arrow" aria-hidden="true" style={{ color: item.color }} />
                </a>
              ))}
            </div>
          </div>

          {/* Right: Role selection panel */}
          <div className="hero-role-panel">
            <h2 className="hero-role-title">HOW WILL YOU USE SHIFTIFY?</h2>

            <div className="hero-role-list" role="list">
              {roles.map((role) => (
                <a key={role.title} href="#" className="hero-role-row" role="listitem">
                  <span className="hero-role-icon" style={{ background: role.bg, color: role.color }}>
                    <i className={`bi ${role.icon}`} aria-hidden="true" />
                  </span>
                  <span className="hero-role-text">
                    <span className="hero-role-name">{role.title}</span>
                    <span className="hero-role-desc">{role.desc}</span>
                  </span>
                  <i className="bi bi-chevron-right hero-role-chevron" aria-hidden="true" />
                </a>
              ))}
            </div>

            <div className="hero-role-footer">
              <i className="bi bi-shield-check" aria-hidden="true" />
              Choose your role to see the right journey for you.
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
