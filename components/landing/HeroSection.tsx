// components/landing/HeroSection.tsx
'use client';

import { useEffect, useState } from 'react';

const trustBadges = [
  { icon: 'bi-shield-check', text: 'NDIS Registered', color: '#16A34A' },
  { icon: 'bi-patch-check',  text: 'Police Checked',  color: '#2563EB' },
  { icon: 'bi-clock',        text: '24/7 Support',    color: '#7C3AED' },
] as const;

const dispatchCategories = [
  { key: 'emergency', icon: 'bi-lightning-charge-fill', pillLabel: 'RIGHT NOW · < 60 MIN',            pillTitle: 'Emergency',              blurb: 'Immediate response',              color: '#C2185B', bgActive: 'rgba(194,24,91,0.08)',  glow: 'rgba(194,24,91,0.3)'  },
  { key: 'urgent',    icon: 'bi-alarm-fill',            pillLabel: 'TODAY · SAME-DAY FILL',           pillTitle: 'Urgent',                 blurb: 'Quick support',                   color: '#7C3AED', bgActive: 'rgba(124,58,237,0.08)', glow: 'rgba(124,58,237,0.3)' },
  { key: 'lastmin',   icon: 'bi-arrow-repeat',          pillLabel: 'CANCELLED SHIFT · REASSIGN FAST', pillTitle: 'Last-min cancellation',  blurb: "We'll find a replacement — fast", color: '#EA580C', bgActive: 'rgba(234,88,12,0.08)',  glow: 'rgba(234,88,12,0.3)'  },
] as const;

const tagColors = {
  emergency: { accent: '#EF4444', chipBg: 'rgba(239,68,68,0.14)',  chipText: '#B91C1C', glow: 'rgba(239,68,68,0.35)'  },
  urgent:    { accent: '#7C3AED', chipBg: 'rgba(124,58,237,0.14)', chipText: '#6D28D9', glow: 'rgba(124,58,237,0.35)' },
  lastmin:   { accent: '#EC4899', chipBg: 'rgba(236,72,153,0.14)', chipText: '#C2185B', glow: 'rgba(236,72,153,0.35)' },
  live:      { accent: '#22C55E', chipBg: 'rgba(34,197,94,0.14)',  chipText: '#15803D', glow: 'rgba(34,197,94,0.35)'  },
} as const;

const tickets = [
  { tag: 'emergency', tagLabel: 'EMERGENCY', time: 'just now', title: 'Sleepover · Parramatta',        sub: 'High-intensity · 20 km radius', stat: '31 ALERTED'    },
  { tag: 'emergency', tagLabel: 'EMERGENCY', time: '4 min',    title: 'Wound care · Liverpool',         sub: 'Nursing support · 15 km radius', stat: '18 ALERTED'    },
  { tag: 'urgent',    tagLabel: 'URGENT',    time: '2 min',    title: 'Personal care · Blacktown',      sub: '3 hrs · today 4pm',             stat: '3 SHORTLISTED' },
  { tag: 'urgent',    tagLabel: 'URGENT',    time: '5 min',    title: 'Overnight care · Mount Druitt',   sub: '8 hrs · tonight 9pm',            stat: '2 SHORTLISTED' },
  { tag: 'lastmin',   tagLabel: 'LAST-MIN',  time: '6 min',    title: 'Community access · Penrith',     sub: 'Cancellation · rebook',          stat: 'REOFFERED · 12'},
  { tag: 'lastmin',   tagLabel: 'LAST-MIN',  time: '11 min',   title: 'Domestic assistance · Campbelltown', sub: 'Cancellation · rebook',      stat: 'REOFFERED · 7' },
  { tag: 'live',      tagLabel: 'LIVE',      time: '9 min',    title: 'SIL room opened · Ryde',         sub: 'High-intensity ready',           stat: '2 ROOMS'       },
] as const;

const CYCLE_SECONDS = 8;

export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(CYCLE_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setActiveIdx((i) => (i + 1) % dispatchCategories.length);
          return CYCLE_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const activeCategory = dispatchCategories[activeIdx];
  const visibleTickets = tickets.filter((t) => t.tag === activeCategory.key);
  const liveTickets = tickets.filter((t) => t.tag === 'live');
  const cancelCategory = dispatchCategories[2];

  return (
    <section id="main-content" className="hero-section bg-hero" aria-labelledby="hero-heading">
      <div className="container-xl">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-12 items-center">

          {/* Left: Text */}
          <div className="hero-left">
            <div className="badge-pink mb-4 inline-flex" role="status" aria-live="polite">
              <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', animation: 'blink 1.5s infinite', flexShrink: 0 }} aria-hidden="true" />
              <span>2,400+ Active Support Workers Available Now</span>
            </div>

            <h1 id="hero-heading" className="hero-title fade-up">
              Australia&apos;s Crisis—<br />
              first <span className="highlight">NDIS Exchange</span>
            </h1>
            <span className="hero-title-underline" aria-hidden="true" />

            <p className="hero-sub fade-up">
              Real-time shifts. Verified workers.<br />
              Faster support for communities that need it most.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3 fade-up" role="group" aria-label="Live shift categories">
              {dispatchCategories.slice(0, 2).map((cat, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div key={cat.key} className={`hero-cat-card${isActive ? ' active' : ''}`}>
                    <div className="hero-cat-card-top">
                      <span className="hero-cat-card-icon" style={{ background: `${cat.color}1A`, color: cat.color }}>
                        <i className={`bi ${cat.icon}`} aria-hidden="true" />
                      </span>
                      <span className="hero-cat-card-label">{cat.pillLabel}</span>
                    </div>
                    <h3 className="hero-cat-card-title" style={{ color: isActive ? cat.color : undefined }}>{cat.pillTitle}</h3>
                    <p className="hero-cat-card-sub">{cat.blurb}</p>
                    <span className="hero-cat-card-bar" style={{ background: cat.color }} />
                  </div>
                );
              })}
            </div>

            <a
              href="#emergency"
              className="hero-cancel-card fade-up"
              style={
                activeIdx === 2
                  ? { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-md)', borderColor: 'rgba(234,88,12,0.35)' }
                  : undefined
              }
            >
              <span className="hero-cancel-card-icon" style={{ background: cancelCategory.color }}>
                <i className={`bi ${cancelCategory.icon}`} aria-hidden="true" />
              </span>
              <div className="hero-cancel-card-body">
                <span className="hero-cancel-card-label" style={{ color: cancelCategory.color }}>{cancelCategory.pillLabel}</span>
                <h3 className="hero-cancel-card-title" style={{ color: activeIdx === 2 ? cancelCategory.color : undefined }}>{cancelCategory.pillTitle}</h3>
                <p className="hero-cancel-card-sub">{cancelCategory.blurb}</p>
              </div>
              <i className="bi bi-chevron-right hero-cancel-card-arrow" aria-hidden="true" />
            </a>

            <div className="grid grid-cols-3 gap-2 mt-4 fade-up">
              {trustBadges.map(({ icon, text, color }) => (
                <div key={text} className="hero-trust-card">
                  <span className="hero-trust-card-icon" style={{ background: `${color}1A`, color }}>
                    <i className={icon} aria-hidden="true" />
                  </span>
                  {text}
                </div>
              ))}
            </div>

            <div className="hero-rating-card fade-up">
              <span className="hero-rating-icon"><i className="bi bi-star-fill" aria-hidden="true" /></span>
              <span><strong>4.9</strong>&nbsp;Rated by Providers</span>
            </div>
          </div>

          {/* Right: Live Dispatch panel */}
          <div className="hidden lg:block">
            <div className="dispatch-frame">
            <div className="dispatch-panel">
              <div className="dispatch-header">
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, letterSpacing: 0, color: 'var(--clr-text)', textTransform: 'uppercase' }}>
                    Live shift
                  </span>
                </div>
                <span className="dispatch-live-badge" role="status">
                  <span className="dot" aria-hidden="true" />
                  Live
                </span>
              </div>

              <div className="dispatch-list">
                {[...visibleTickets, ...liveTickets].map((t) => {
                  const isActive = t.tag === activeCategory.key;
                  const colors = tagColors[t.tag];
                  return (
                    <div
                      key={t.title}
                      className={`dispatch-ticket${isActive ? ' active' : ''}`}
                      style={{ borderLeftColor: colors.accent, ...({ '--pulse-glow': colors.glow } as React.CSSProperties) }}
                      role="article"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="dispatch-tag-chip" style={{ background: colors.chipBg, color: colors.chipText }}>{t.tagLabel}</span>
                          <span style={{ fontSize: 11, color: 'var(--clr-muted)', fontWeight: 700 }}>{t.time}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: colors.chipText }}>{t.stat}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div style={{ fontSize: 16.5, fontWeight: 800 }}>{t.title}</div>
                          <div style={{ fontSize: 13, color: 'var(--clr-muted)' }}>{t.sub}</div>
                        </div>
                        <button className="dispatch-open-btn" type="button">
                          OPEN <i className="bi bi-arrow-right" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="dispatch-footer">
                <span className="flex items-center gap-2">
                  <i className="bi bi-stopwatch" aria-hidden="true" />
                  Next dispatch tick
                </span>
                <span style={{ color: activeCategory.color }}>
                  00:{String(secondsLeft).padStart(2, '0')}s
                </span>
              </div>
            </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
