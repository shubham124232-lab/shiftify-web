'use client';
import { FiUser, FiHeart, FiBriefcase, FiClipboard, FiBarChart2, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const roles = [
  {
    Icon: FiUser,
    title: 'Participants',
    color: '#C2185B', bg: '#FFF0F5',
    desc: 'Find verified support workers instantly. Browse, book, and manage your NDIS support from one simple dashboard.',
    features: [
      'Search by service, location & availability',
      'Instant emergency shift requests',
      'NDIS plan budget tracking',
      'Secure messaging & scheduling',
    ],
    cta: 'Find Support',
    href: '/register',
  },
  {
    Icon: FiHeart,
    title: 'Support Workers',
    color: '#7C3AED', bg: '#F5F3FF',
    desc: 'Build your own carer business. Set your hours, choose your clients, and grow your reputation on Shiftify.',
    features: [
      'Flexible shift scheduling',
      'Emergency shift alerts nearby',
      'NDIS-compliant invoicing',
      'Performance ratings & rewards',
    ],
    cta: 'Join as Worker',
    href: '/register',
  },
  {
    Icon: FiBriefcase,
    title: 'Providers',
    color: '#0D9488', bg: '#F0FDFA',
    desc: 'Grow your registered provider business. List services, recruit workers, and manage your team in one place.',
    features: [
      'Provider profile & marketplace listing',
      'Team management dashboard',
      'Bulk shift management',
      'Analytics & performance reports',
    ],
    cta: 'List as Provider',
    href: '/register',
  },
  {
    Icon: FiClipboard,
    title: 'Support Coordinators',
    color: '#1D4ED8', bg: '#EFF6FF',
    desc: 'Coordinate support seamlessly across multiple participants. Manage plans, track budgets, and place workers fast.',
    features: [
      'Multi-participant dashboard',
      'Plan budget visibility',
      'Emergency escalation tools',
      'Compliance documentation',
    ],
    cta: 'Coordinator Access',
    href: '/register',
  },
  {
    Icon: FiBarChart2,
    title: 'Plan Managers',
    color: '#D97706', bg: '#FFFBEB',
    desc: 'Simplify NDIS plan management. Handle invoices, payments, and reporting without the administrative chaos.',
    features: [
      'Automated NDIS invoicing',
      'Real-time budget tracking',
      'Participant expense reports',
      'Compliant payment processing',
    ],
    cta: 'Manage Plans',
    href: '/register',
  },
];

export default function RolesSection() {
  return (
    <section id="roles" className="section-py" aria-labelledby="roles-heading">
      <div className="container-xl">

        <div className="text-center mb-5 fade-up">
          <span className="section-label">Who Uses Shiftify</span>
          <h2 id="roles-heading" className="section-title">
            One Platform, <span style={{ color: 'var(--clr-primary)' }}>Every Role</span>
          </h2>
          <p className="section-sub">
            Shiftify is purpose-built for the entire NDIS ecosystem — from participants to plan managers.
          </p>
        </div>

        <div className="row g-4">
          {roles.map((role) => (
            <div key={role.title} className="col-12 col-sm-6 col-lg-4 fade-up">
              <div className="role-card-v2" role="article">

                {/* Top accent strip */}
                <div className="role-v2-strip" style={{ background: role.color }} aria-hidden="true" />

                {/* Icon */}
                <div
                  className="role-v2-icon"
                  style={{ background: role.bg, color: role.color }}
                  aria-hidden="true"
                >
                  <role.Icon size={24} strokeWidth={2} />
                </div>

                <h3 className="role-v2-title" style={{ color: role.color }}>{role.title}</h3>
                <p className="role-v2-desc">{role.desc}</p>

                <ul className="role-v2-features" aria-label={`${role.title} features`}>
                  {role.features.map(f => (
                    <li key={f}>
                      <FiCheckCircle
                        size={14}
                        color={role.color}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        style={{ flexShrink: 0, marginTop: 3 }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={role.href}
                  className="role-v2-cta"
                  style={{ background: role.bg, color: role.color, borderColor: `${role.color}30` }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = role.color;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = role.bg;
                    e.currentTarget.style.color = role.color;
                  }}
                >
                  {role.cta}
                  <FiArrowRight size={15} aria-hidden="true" />
                </a>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
