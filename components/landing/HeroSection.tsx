// components/landing/HeroSection.tsx
'use client';

const quickSupport = [
  { icon: 'bi-exclamation-triangle-fill', title: 'Rapid',                 desc: 'A worker has cancelled',       color: 'var(--td-pink)', href: '#emergency',   time: '< 60 mins' },
  { icon: 'bi-clock-fill',                title: 'Urgent Support',        desc: 'Needed within a few hours',     color: 'var(--td-black)', href: '#marketplace', time: '1-4 hrs'            },
  { icon: 'bi-calendar-check-fill',       title: 'Last-Minute Support',   desc: 'Needed today or soon',          color: 'var(--td-dark-text)', href: '#marketplace', time: '24-48 hrs'          },
  { icon: 'bi-people-fill',               title: 'Regular Support',       desc: 'Future or recurring',           color: 'var(--td-dark-text-soft)', href: '#marketplace', time: 'Routine'            },
] as const;

const roles = [
  { icon: 'bi-people-fill',        title: 'Participant',         desc: 'Find and book the right support for you', roleValue: 'PARTICIPANT', tone: 'pink' },
  { icon: 'bi-person-fill',        title: 'Support Worker',      desc: 'Find shifts that match your skills & availability', roleValue: 'SUPPORT_WORKER', tone: 'light' },
  { icon: 'bi-diagram-3-fill',     title: 'Support Coordinator', desc: 'Manage and coordinate participant supports', roleValue: 'COORDINATOR', tone: 'grey' },
  { icon: 'bi-building-fill',      title: 'Provider',            desc: 'Find workers and grow your services', roleValue: 'PROVIDER', tone: 'light' },
  { icon: 'bi-wallet2',            title: 'Plan Manager',        desc: 'Review and manage supports & budgets', roleValue: 'PLAN_MANAGER', tone: 'grey' },
] as const;

export default function HeroSection() {
  return (
    <section id="main-content" className="hero-section" aria-labelledby="hero-heading">
      <div className="container-xl">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-12 items-start">

          {/* Left: Text */}
          <div className="hero-left">
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
                  <span
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      fontSize: 10.5, fontWeight: 700, color: item.color,
                      background: `color-mix(in srgb, ${item.color} 10%, var(--td-white))`, padding: '4px 11px', borderRadius: 100,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.time}
                  </span>
                  <span className="quick-card-icon" style={{ background: item.color, color: 'var(--td-white)' }}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                  </span>
                  <h3 className="quick-card-title">{item.title}</h3>
                  <p className="quick-card-desc">{item.desc}</p>
                  <i className="bi bi-arrow-right quick-card-arrow" aria-hidden="true" style={{ color: item.color }} />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 fade-up">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--td-pink)', background: 'color-mix(in srgb, var(--td-pink) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--td-pink) 25%, transparent)', padding: '6px 14px', borderRadius: 100 }}>
                <i className="bi bi-clock-history" style={{ color: 'var(--td-pink)', fontSize: 15 }} aria-hidden="true" />
                24/7
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--td-pink)', background: 'color-mix(in srgb, var(--td-pink) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--td-pink) 25%, transparent)', padding: '6px 14px', borderRadius: 100 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>0%</span>
                Platform Commission
              </span>
            </div>
          </div>

          {/* Right: Role selection panel */}
          <div className="hero-role-panel">
            <span className="hero-role-eyebrow">Choose your role</span>
            <h2 className="hero-role-title">How will you use Shiftify?</h2>

            <div className="hero-role-list" role="list">
              {roles.map((role) => (
                <a key={role.title} href={`/register?role=${role.roleValue}`} className={`hero-role-row hero-role-row--${role.tone}`} role="listitem">
                  <span className="hero-role-icon">
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
