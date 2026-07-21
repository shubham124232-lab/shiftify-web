// components/landing/HeroSection.tsx
'use client';

import { useEffect, useState } from 'react';

const trustBadges = [
  { icon: 'bi-shield-check', text: 'NDIS Registered' },
  { icon: 'bi-patch-check',  text: 'Police Checked'  },
  { icon: 'bi-clock',        text: '24/7 Support'    },
  { icon: 'bi-star-fill',    text: '4.9★ Rated'      },
] as const;

const dispatchCategories = [
  { key: 'emergency', pillLabel: 'RIGHT NOW · < 60 MIN',            pillTitle: 'Emergency',              color: '#F87171', bgActive: 'rgba(239,68,68,0.14)',  glow: 'rgba(239,68,68,0.4)'  },
  { key: 'urgent',    pillLabel: 'TODAY · SAME-DAY FILL',           pillTitle: 'Urgent',                 color: '#F472B6', bgActive: 'rgba(236,72,153,0.14)', glow: 'rgba(236,72,153,0.4)' },
  { key: 'lastmin',   pillLabel: 'CANCELLED SHIFT · REASSIGN FAST', pillTitle: 'Last-min cancellation',  color: '#FBBF24', bgActive: 'rgba(245,158,11,0.14)', glow: 'rgba(245,158,11,0.4)' },
] as const;

const tagColors = {
  emergency: { accent: '#EF4444', chipBg: 'rgba(239,68,68,0.16)',  chipText: '#FCA5A5', glow: 'rgba(239,68,68,0.35)'  },
  urgent:    { accent: '#EC4899', chipBg: 'rgba(236,72,153,0.16)', chipText: '#F9A8D4', glow: 'rgba(236,72,153,0.35)' },
  lastmin:   { accent: '#F59E0B', chipBg: 'rgba(245,158,11,0.16)', chipText: '#FCD34D', glow: 'rgba(245,158,11,0.35)' },
  live:      { accent: '#10B981', chipBg: 'rgba(16,185,129,0.16)', chipText: '#6EE7B7', glow: 'rgba(16,185,129,0.35)' },
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

  return (
    <section id="main-content" className="hero-section bg-hero" aria-labelledby="hero-heading">
      <span className="hero-orb hero-orb-a" aria-hidden="true" />
      <span className="hero-orb hero-orb-b" aria-hidden="true" />
      <div className="container-xl">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-12 items-center">

          {/* Left: Text */}
          <div className="hero-left">
            <div className="badge-pink mb-4 inline-flex" role="status" aria-live="polite">
              <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', animation: 'blink 1.5s infinite', flexShrink: 0 }} aria-hidden="true" />
              <span>2,400+ Active Support Workers Available Now</span>
            </div>

            <h1 id="hero-heading" className="hero-title fade-up">
              Disability Support,<br />
              <span className="highlight">When Every</span><br />
              Minute Matters
            </h1>

            <p className="hero-sub fade-up">
              Australia&apos;s trusted NDIS marketplace connecting participants with
              verified support workers, providers, and coordinators — instantly.
              Emergency help available 24/7.
            </p>

            <div className="flex flex-wrap gap-3 mb-5 fade-up" role="group" aria-label="Live shift categories">
              {dispatchCategories.map((cat, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={cat.key}
                    className={`stat-pill${isActive ? ' active' : ''}`}
                    style={{
                      borderColor: isActive ? cat.color : 'rgba(248,250,252,0.14)',
                      background: isActive ? cat.bgActive : 'rgba(248,250,252,0.04)',
                      boxShadow: isActive ? `0 10px 28px -6px ${cat.glow}` : 'none',
                      ...({ '--pulse-glow': cat.glow } as React.CSSProperties),
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: isActive ? cat.color : 'var(--clr-muted)' }}>
                      {cat.pillLabel}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, color: isActive ? cat.color : 'var(--clr-text)' }}>
                      {cat.pillTitle}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 mb-4 fade-up">
              <a href="#marketplace" className="btn-shiftify" style={{ padding: '14px 28px', fontSize: 16 }}>
                <i className="bi bi-search mr-2" aria-hidden="true" />
                Find Support Now
              </a>
              <a href="#emergency" className="btn-emergency" style={{ padding: '14px 28px', fontSize: 16 }}>
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                Post Emergency Shift
              </a>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 fade-up">
              {trustBadges.map(({ icon, text }) => (
                <div key={text} className="trust-chip" style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text)' }}>
                  <span className="trust-chip-icon">
                    <i className={icon} aria-hidden="true" />
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Dispatch panel */}
          <div className="hidden lg:block">
            <div className="dispatch-frame">
            <div className="dispatch-panel">
              <div className="dispatch-header">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="dispatch-dot" style={{ background: '#D32F2F' }} />
                    <span className="dispatch-dot" style={{ background: '#D97706' }} />
                    <span className="dispatch-dot" style={{ background: '#16A34A' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--clr-muted)', textTransform: 'uppercase' }}>
                    Shiftify · Live Dispatch
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
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--clr-muted)' }}>{t.sub}</div>
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
