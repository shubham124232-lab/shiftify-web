// components/landing/EcosystemRolesSection.tsx
import { FiHeart, FiUsers, FiHome, FiBriefcase, FiCalendar } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface Role {
  key: string;
  title: string;
  desc: string;
  linkText: string;
  href: string;
  Icon: IconType;
  color: string;
  image?: string;
  imageAlt?: string;
}

const roles: Role[] = [
  {
    key: 'participants',
    title: 'Participants',
    desc: 'Post requests, find emergency support, message providers.',
    linkText: 'Find support',
    href: '#marketplace',
    Icon: FiHeart,
    color: '#DB2777',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80&auto=format&fit=crop',
    imageAlt: 'Participant with their support worker',
  },
  {
    key: 'coordinators',
    title: 'Coordinators',
    desc: 'Shortlist, compare and confirm bookings on behalf of your caseload.',
    linkText: 'Coordinator tools',
    href: '/register',
    Icon: FiUsers,
    color: '#F97316',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80&auto=format&fit=crop',
    imageAlt: 'Coordinator reviewing a caseload on a laptop',
  },
  {
    key: 'providers',
    title: 'Providers',
    desc: 'Post shifts, live capacity, SIL/SDA vacancies. Console-grade ops.',
    linkText: 'For providers',
    href: '/register',
    Icon: FiHome,
    color: '#2563EB',
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&q=80&auto=format&fit=crop',
    imageAlt: 'Provider managing operations at a desk',
  },
  {
    key: 'support-workers',
    title: 'Support workers',
    desc: 'Set live availability. Pick up urgent, premium-rate shifts nearby.',
    linkText: 'Find shifts',
    href: '/register',
    Icon: FiBriefcase,
    color: '#059669',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&q=80&auto=format&fit=crop',
    imageAlt: 'Support worker checking shifts on their phone',
  },
  {
    key: 'plan-managers',
    title: 'Plan managers',
    desc: 'See where funding lands. Reference-only visibility in MVP.',
    linkText: 'Learn more',
    href: '/register',
    Icon: FiCalendar,
    color: '#7C3AED',
  },
];

export default function EcosystemRolesSection() {
  return (
    <section id="ecosystem-roles" className="section-py roles-grid-bg" aria-labelledby="roles-grid-heading">
      <div className="container-xl">

        <div className="grid lg:grid-cols-12 gap-5 items-start mb-8 fade-up">
          <div className="lg:col-span-8">
            <span className="section-label">Built for the whole NDIS ecosystem</span>
            <h2 id="roles-grid-heading" className="section-title" style={{ marginBottom: 0 }}>
              Five roles. One <em style={{ fontStyle: 'italic', color: 'var(--clr-primary)' }}>live</em> exchange.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="section-sub text-left" style={{ maxWidth: '100%', margin: 0 }}>
              Participants, coordinators, providers, workers and plan managers — each with
              their own operational surface, all wired to the same real-time board.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {roles.map((role) => (
            <div key={role.key} className="fade-up">
              <a href={role.href} className="role-grid-card">
                <div
                  className="role-grid-image-wrap"
                  style={!role.image ? { background: `linear-gradient(160deg, ${role.color}, #1A1A2E)` } : undefined}
                >
                  {role.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={role.image} alt={role.imageAlt} className="role-grid-image" loading="lazy" />
                  )}
                  <span className="role-grid-icon" style={{ background: role.color }}>
                    <role.Icon size={16} color="#fff" strokeWidth={2} />
                  </span>
                </div>
                <div className="role-grid-body">
                  <h3 className="role-grid-title">{role.title}</h3>
                  <p className="role-grid-desc">{role.desc}</p>
                  <span className="role-grid-link" style={{ color: role.color }}>
                    {role.linkText} <span aria-hidden="true">›</span>
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
