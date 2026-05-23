import { FiAlertTriangle, FiSearch, FiUserCheck, FiBriefcase, FiBarChart2, FiArrowRight } from 'react-icons/fi';

const actions = [
  {
    id: 'emergency',
    Icon: FiAlertTriangle,
    label: '24 / 7 Live',
    title: 'Need Emergency Support?',
    desc: 'Verified workers respond within minutes. Always available, day or night — no matter the situation.',
    href: '#emergency',
    gradient: 'linear-gradient(145deg, #7F0000 0%, #B71C1C 50%, #D32F2F 100%)',
    iconGlow: 'rgba(255,80,80,0.35)',
    pulse: true,
  },
  {
    id: 'find',
    Icon: FiSearch,
    label: 'Marketplace',
    title: 'Find Support Workers',
    desc: 'Browse 8,000+ NDIS-verified workers by skill, distance, and live availability.',
    href: '#marketplace',
    gradient: 'linear-gradient(145deg, #880E4F 0%, #C2185B 100%)',
    iconGlow: 'rgba(194,24,91,0.35)',
  },
  {
    id: 'worker',
    Icon: FiUserCheck,
    label: 'Join Today',
    title: 'Become a Worker',
    desc: 'Set your schedule, grow your income on your own terms.',
    href: '/register-worker',
    gradient: 'linear-gradient(145deg, #5B21B6 0%, #7C3AED 100%)',
    iconGlow: 'rgba(124,58,237,0.35)',
  },
  {
    id: 'providers',
    Icon: FiBriefcase,
    label: 'NDIS Registered',
    title: 'Find Providers',
    desc: 'Connect with registered providers for specialist and ongoing care.',
    href: '/providers',
    gradient: 'linear-gradient(145deg, #065F46 0%, #0D9488 100%)',
    iconGlow: 'rgba(13,148,136,0.35)',
  },
  {
    id: 'plan',
    Icon: FiBarChart2,
    label: 'NDIS Plans',
    title: 'Manage Your Plan',
    desc: 'Coordinators & managers: simplify NDIS workflows in one dashboard.',
    href: '/plan-management',
    gradient: 'linear-gradient(145deg, #92400E 0%, #D97706 100%)',
    iconGlow: 'rgba(217,119,6,0.35)',
  },
];

/* Shared image-area blob decorations */
function Blobs({ sm }) {
  return (
    <>
      <div className="qa-blob qa-blob-a" aria-hidden="true" />
      {!sm && <div className="qa-blob qa-blob-b" aria-hidden="true" />}
    </>
  );
}

export default function QuickActionSection() {
  const [emergency, find, ...smActions] = actions;

  const EmergencyIcon = emergency.Icon;
  const FindIcon      = find.Icon;

  return (
    <section id="quick-actions" className="section-py qa-section" aria-labelledby="qa-heading">
      <div className="container-xl">

        <div className="text-center mb-5 fade-up">
          <span className="section-label">Quick Actions</span>
          <h2 id="qa-heading" className="section-title">
            What do you <span style={{ color: 'var(--clr-primary)' }}>need today?</span>
          </h2>
          <p className="section-sub">Choose your path — help is always a tap away.</p>
        </div>

        {/* ── Bento Grid ── */}
        <div className="qa-bento fade-up">

          {/* ─ Emergency — tall left card (spans 2 rows) ─ */}
          <a href={emergency.href} className="qa-card qa-card-tall" aria-label={emergency.title}>
            <div className="qa-img-area" style={{ background: emergency.gradient }}>
              <Blobs />
              <span className="qa-img-label">{emergency.label}</span>
              <div
                className="qa-big-icon-wrap"
                style={{ boxShadow: `0 0 40px ${emergency.iconGlow}` }}
              >
                <EmergencyIcon size={52} color="#fff" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="qa-pulse-ring" aria-hidden="true" />
            </div>
            <div className="qa-content">
              <h3 className="qa-card-title">{emergency.title}</h3>
              <p className="qa-card-desc">{emergency.desc}</p>
              <div className="qa-arrow">
                <FiArrowRight size={20} aria-hidden="true" />
              </div>
            </div>
          </a>

          {/* ─ Find Workers — wide top-right card ─ */}
          <a href={find.href} className="qa-card qa-card-wide" aria-label={find.title}>
            <div className="qa-img-area" style={{ background: find.gradient }}>
              <Blobs />
              <span className="qa-img-label">{find.label}</span>
              <div
                className="qa-big-icon-wrap"
                style={{ boxShadow: `0 0 40px ${find.iconGlow}` }}
              >
                <FindIcon size={44} color="#fff" strokeWidth={1.5} aria-hidden="true" />
              </div>
            </div>
            <div className="qa-content">
              <h3 className="qa-card-title">{find.title}</h3>
              <p className="qa-card-desc">{find.desc}</p>
              <div className="qa-arrow">
                <FiArrowRight size={18} aria-hidden="true" />
              </div>
            </div>
          </a>

          {/* ─ 3 smaller bottom-right cards ─ */}
          {smActions.map((action) => {
            const ActionIcon = action.Icon;
            return (
              <a key={action.id} href={action.href} className="qa-card qa-card-sm" aria-label={action.title}>
                <div className="qa-img-area qa-img-sm" style={{ background: action.gradient }}>
                  <Blobs sm />
                  <span className="qa-img-label qa-label-sm">{action.label}</span>
                  <div
                    className="qa-big-icon-wrap qa-icon-sm"
                    style={{ boxShadow: `0 0 28px ${action.iconGlow}` }}
                  >
                    <ActionIcon size={32} color="#fff" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                </div>
                <div className="qa-content qa-content-sm">
                  <h3 className="qa-card-title" >{action.title}</h3>
                  <p className="qa-card-desc" >{action.desc}</p>
                  <div className="qa-arrow">
                    <FiArrowRight size={16} aria-hidden="true" />
                  </div>
                </div>
              </a>
            );
          })}

        </div>
      </div>
    </section>
  );
}
