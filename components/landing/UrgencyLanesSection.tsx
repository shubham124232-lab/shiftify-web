// components/landing/UrgencyLanesSection.tsx
import { FiAlertTriangle, FiZap, FiRefreshCw, FiClock, FiCheckCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface Lane {
  id: string;
  Icon: IconType;
  window: string;
  eyebrow: string;
  title: string;
  desc: string;
  statNum: string;
  statLabel: string;
  liveText: string;
  items: string[];
  accent: string;
  accentBg: string;
  glow: string;
}

const lanes: Lane[] = [
  {
    id: 'emergency',
    Icon: FiAlertTriangle,
    window: '< 60 MIN',
    eyebrow: 'Right now',
    title: 'Emergency Shift',
    desc: 'Worker no-show, participant in unsafe conditions, or acute clinical need. One tap fires an alert to verified workers on live availability within radius.',
    statNum: '09m',
    statLabel: 'Median match',
    liveText: '142 live now',
    items: ['Push + SMS blast to eligible workers', 'Auto-shortlist by proximity & skills', 'Direct-book if worker enabled'],
    accent: '#DC2626',
    accentBg: '#FEF2F2',
    glow: 'rgba(220,38,38,0.3)',
  },
  {
    id: 'urgent',
    Icon: FiZap,
    window: '1 – 4 HRS',
    eyebrow: 'Same day',
    title: 'Urgent Shift',
    desc: 'Support gaps that need filling before the shift starts today. Higher rate cards, faster confirmations, and coordinator-side shortlisting.',
    statNum: '38m',
    statLabel: 'Avg fill',
    liveText: '318 live today',
    items: ['Urgent board with countdown timers', 'Premium rate cards', 'Coordinator can confirm on behalf'],
    accent: '#C2185B',
    accentBg: '#FFF0F5',
    glow: 'rgba(194,24,91,0.3)',
  },
  {
    id: 'lastmin',
    Icon: FiRefreshCw,
    window: '24 – 48 HRS',
    eyebrow: 'Cancellation',
    title: 'Last-minute cancellation Shift',
    desc: 'A booking just fell through. Convert the cancelled shift into a rebooking request and reoffer it to matched workers or nearby providers in seconds.',
    statNum: '98%',
    statLabel: 'Refilled',
    liveText: '76 rebooks / day',
    items: ['One-click reoffer of cancelled shift', 'Rebook via provider capacity board', 'Auto-notify saved-search followers'],
    accent: '#D97706',
    accentBg: '#FFFBEB',
    glow: 'rgba(217,119,6,0.3)',
  },
];

export default function UrgencyLanesSection() {
  return (
    <section id="urgency-lanes" className="section-py urgency-section-bg" aria-labelledby="urgency-heading">
      <span className="urgency-orb urgency-orb-a" aria-hidden="true" />
      <span className="urgency-orb urgency-orb-b" aria-hidden="true" />
      <div className="container-xl">

        <div className="grid lg:grid-cols-12 gap-5 items-start mb-10 fade-up">
          <div className="lg:col-span-7">
            <span className="section-label">Three Urgency Lanes · One Dispatch Engine</span>
            <h2 id="urgency-heading" className="section-title">
              Engineered for the minutes<br />
              <em style={{ fontStyle: 'italic', color: 'var(--clr-primary)' }}>after</em> the cancellation.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="section-sub text-left" style={{ maxWidth: '100%', margin: 0 }}>
              Most NDIS platforms treat urgency as an afterthought. We built the whole product
              around three windows — and one dispatch engine underneath.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {lanes.map((lane) => (
            <div key={lane.id} className="fade-up">
              <div
                className="urgency-card"
                role="article"
                aria-label={lane.title}
                style={{ ...({ '--card-glow': lane.glow } as React.CSSProperties) }}
              >
                <div className="urgency-topbar" style={{ background: lane.accent, boxShadow: `0 0 16px ${lane.glow}` }} aria-hidden="true" />

                <div className="flex items-center justify-between mb-4">
                  <span className="urgency-badge-pill" style={{ background: lane.accentBg, color: lane.accent }}>
                    <FiClock size={12} aria-hidden="true" />
                    {lane.window}
                  </span>
                  <div className="urgency-icon-badge" style={{ background: lane.accentBg, color: lane.accent }} aria-hidden="true">
                    <lane.Icon size={18} strokeWidth={2} />
                  </div>
                </div>

                <span className="urgency-eyebrow" style={{ color: lane.accent }}>{lane.eyebrow}</span>
                <h3 className="urgency-title">{lane.title}</h3>
                <p className="urgency-desc">{lane.desc}</p>

                <div className="urgency-stat-box">
                  <div>
                    <div className="urgency-stat-num" style={{ color: lane.accent }}>{lane.statNum}</div>
                    <div className="urgency-stat-label">{lane.statLabel}</div>
                  </div>
                  <div className="urgency-live-pill">
                    <span className="dot" style={{ background: lane.accent }} aria-hidden="true" />
                    {lane.liveText}
                  </div>
                </div>

                <ul className="urgency-check-list">
                  {lane.items.map((item) => (
                    <li key={item}>
                      <FiCheckCircle size={16} style={{ color: lane.accent, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
