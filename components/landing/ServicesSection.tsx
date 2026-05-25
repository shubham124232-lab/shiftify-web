import {
  FiAlertTriangle, FiHeart, FiHome, FiUsers, FiMoon, FiTruck,
  FiTool, FiActivity, FiSun, FiClipboard, FiAward, FiMapPin,
  FiArrowRight, FiGrid,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface Service {
  Icon: IconType;
  title: string;
  desc: string;
  accent: string;
  accentBg: string;
}

const services: Service[] = [
  { Icon: FiAlertTriangle, title: 'Emergency Support',       desc: 'Immediate 24/7 crisis support with verified workers dispatched within minutes.',                    accent: '#DC2626', accentBg: '#FEF2F2' },
  { Icon: FiHeart,         title: 'Personal Care',           desc: 'Bathing, grooming, dressing and personal hygiene support tailored to you.',                         accent: '#C2185B', accentBg: '#FFF0F5' },
  { Icon: FiHome,          title: 'Daily Living Support',    desc: 'Help with everyday tasks — meal prep, medication, and household routines.',                          accent: '#2563EB', accentBg: '#EFF6FF' },
  { Icon: FiUsers,         title: 'Community Participation', desc: 'Get out and about — social outings, events, and community connection.',                              accent: '#059669', accentBg: '#ECFDF5' },
  { Icon: FiMoon,          title: 'Overnight Care',          desc: 'Awake or sleepover overnight support for safety and peace of mind.',                                 accent: '#7C3AED', accentBg: '#F5F3FF' },
  { Icon: FiTruck,         title: 'Disability Transport',    desc: 'Accessible, reliable transport to appointments, shopping, and activities.',                          accent: '#D97706', accentBg: '#FFFBEB' },
  { Icon: FiTool,          title: 'Domestic Assistance',     desc: 'Housekeeping, laundry, grocery assistance, and home maintenance.',                                   accent: '#0891B2', accentBg: '#ECFEFF' },
  { Icon: FiActivity,      title: 'Nursing & Complex Care',  desc: 'Skilled nursing for complex medical needs, wound care, and medication management.',                  accent: '#DC2626', accentBg: '#FEF2F2' },
  { Icon: FiSun,           title: 'Respite Care',            desc: 'Short-term relief for carers — planned or emergency, in-home or residential.',                      accent: '#EA580C', accentBg: '#FFF7ED' },
  { Icon: FiClipboard,     title: 'Support Coordination',    desc: 'Expert coordinators to navigate your NDIS plan and connect you to services.',                       accent: '#C2185B', accentBg: '#FFF0F5' },
  { Icon: FiAward,         title: 'Therapy & Allied Health', desc: 'OT, physio, speech therapy, and psychology from qualified NDIS therapists.',                        accent: '#059669', accentBg: '#ECFDF5' },
  { Icon: FiMapPin,        title: 'SIL / SDA Accommodation', desc: 'Supported independent living and specialist disability accommodation.',                              accent: '#7C3AED', accentBg: '#F5F3FF' },
];

export default function ServicesSection() {
  return (
    <section id="services" className="section-py services-section-bg" aria-labelledby="services-heading">
      <div className="container-xl">

        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-5 items-center mb-10 fade-up">
          <div className="lg:col-span-7">
            <span className="section-label">NDIS Services</span>
            <h2 id="services-heading" className="section-title mb-3">
              Everything You Need,<br />
              <span style={{ color: 'var(--clr-primary)' }}>In One Place</span>
            </h2>
            <p className="section-sub text-left" style={{ maxWidth: '100%' }}>
              From daily assistance to complex care — Shiftify connects you to the right support, right now.
            </p>
          </div>
          <div className="lg:col-span-5 hidden lg:flex justify-end">
            <div className="services-stat-cluster">
              {[
                { Icon: FiGrid,     color: 'var(--clr-primary)', num: '12+',   label: 'Service Types'    },
                { Icon: FiUsers,    color: '#059669',            num: '2,400+', label: 'Verified Workers' },
                { Icon: FiActivity, color: '#2563EB',            num: '24/7',   label: 'Available Support' },
              ].map(({ Icon, color, num, label }) => (
                <div key={label} className="svc-stat-card">
                  <Icon size={22} color={color} aria-hidden="true" />
                  <div>
                    <div className="svc-stat-num" style={{ color }}>{num}</div>
                    <div className="svc-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <div key={s.title} className="fade-up">
              <div className="svc-card" role="article" tabIndex={0} aria-label={`${s.title}: ${s.desc}`}>
                <div className="svc-icon-wrap" style={{ background: s.accentBg, color: s.accent }} aria-hidden="true">
                  <s.Icon size={22} strokeWidth={2} />
                </div>
                <h3 className="svc-card-title">{s.title}</h3>
                <p className="svc-card-desc">{s.desc}</p>
                <a
                  href={`/services/${s.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  className="svc-learn-link"
                  style={{ color: s.accent }}
                >
                  Learn more <FiArrowRight size={14} aria-hidden="true" />
                </a>
                <div className="svc-accent-bar" style={{ background: s.accent }} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 pt-2 fade-up">
          <a href="/services" className="btn-outline-shiftify">
            View All Services <FiArrowRight className="ml-2" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
