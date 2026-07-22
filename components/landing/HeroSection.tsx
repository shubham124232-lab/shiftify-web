// components/landing/HeroSection.tsx
'use client';

import { useEffect, useState } from 'react';

const trustBadges = [
  { icon: 'bi-percent',      text: '0% Commission',   color: '#B45309' },
  { icon: 'bi-shield-check', text: 'NDIS Registered', color: '#16A34A' },
  { icon: 'bi-patch-check',  text: 'Police Checked',  color: '#2563EB' },
  { icon: 'bi-clock',        text: '24/7 Support',    color: '#7C3AED' },
] as const;

const dispatchCategories = [
  { key: 'emergency', icon: 'bi-exclamation-triangle-fill', pillLabel: 'RIGHT NOW · < 60 MIN',        pillTitle: 'Emergency',              blurb: 'Immediate response',              href: '#emergency',   color: '#DC2626', bgActive: 'rgba(220,38,38,0.08)',  glow: 'rgba(220,38,38,0.3)'  },
  { key: 'urgent',    icon: 'bi-alarm-fill',            pillLabel: 'TODAY · SAME-DAY FILL',           pillTitle: 'Urgent',                 blurb: 'Quick support',                   href: '#marketplace', color: '#7C3AED', bgActive: 'rgba(124,58,237,0.08)', glow: 'rgba(124,58,237,0.3)' },
  { key: 'lastmin',   icon: 'bi-arrow-repeat',          pillLabel: 'CANCELLED SHIFT · REASSIGN FAST', pillTitle: 'Last-min cancellation',  blurb: "We'll find a replacement — fast", href: '#emergency',   color: '#EA580C', bgActive: 'rgba(234,88,12,0.08)',  glow: 'rgba(234,88,12,0.3)'  },
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

const CYCLE_SECONDS = 4;

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

            <div className="grid grid-cols-3 gap-3 mb-4 fade-up" role="group" aria-label="Live shift categories">
              {dispatchCategories.map((cat, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <a
                    key={cat.key}
                    href={cat.href}
                    className={`hero-cat-card${isActive ? ' active' : ''}`}
                    style={{
                      borderColor: cat.color,
                      background: isActive ? cat.color : undefined,
                      ...({ '--pulse-glow': cat.glow } as React.CSSProperties),
                    }}
                  >
                    <i className={`bi ${cat.icon} hero-cat-card-bg-icon`} aria-hidden="true" style={{ color: isActive ? '#fff' : cat.color }} />
                    <span className="hero-cat-card-dot" style={{ background: isActive ? '#fff' : cat.color }} aria-hidden="true" />
                    <span
                      className={`hero-cat-card-icon-big${cat.key === 'lastmin' ? ' spin' : ' pulse'}`}
                      style={{ background: isActive ? 'rgba(255,255,255,0.2)' : `${cat.color}1A`, color: isActive ? '#fff' : cat.color }}
                    >
                      <i className={`bi ${cat.icon}`} aria-hidden="true" />
                    </span>
                    <span className="hero-cat-card-label" style={{ color: isActive ? 'rgba(255,255,255,0.85)' : undefined }}>{cat.pillLabel}</span>
                    <h3 className="hero-cat-card-title" style={{ color: isActive ? '#fff' : undefined }}>{cat.pillTitle}</h3>
                    <p className="hero-cat-card-sub" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : undefined }}>{cat.blurb}</p>
                    <i className="bi bi-arrow-right hero-cat-card-cta" aria-hidden="true" style={{ color: isActive ? '#fff' : cat.color }} />
                  </a>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 fade-up">
              {trustBadges.map(({ icon, text, color }) => (
                <div key={text} className="hero-trust-card">
                  <span className="hero-trust-card-icon" style={{ background: `${color}1A`, color }}>
                    <i className={icon} aria-hidden="true" />
                  </span>
                  {text}
                </div>
              ))}
              <div className="hero-rating-card">
                <span className="hero-rating-icon"><i className="bi bi-star-fill" aria-hidden="true" /></span>
                <span><strong>4.9</strong>&nbsp;Rated by Providers</span>
              </div>
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
