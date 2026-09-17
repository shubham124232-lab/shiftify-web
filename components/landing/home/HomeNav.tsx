'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

/* Role links carry the same colour as their tile in the roles strip. */
const links = [
  { label: 'How it works', href: '#how-it-works', dot: null                },
  { label: 'Participants', href: '#roles',        dot: 'var(--sf-pink)'    },
  { label: 'Coordinators', href: '#roles',        dot: 'var(--sf-routine)' },
  { label: 'Providers',    href: '#roles',        dot: 'var(--sf-ink)'     },
  { label: 'Workers',      href: '#roles',        dot: 'var(--sf-urgent)'  },
] as const;

/* Top strip: one timing lane at a time, then the full legend on the right. */
const lanes = [
  { key: 'rapid',   label: 'Rapid',    ticker: 'Rapid · now to 60 minutes',  color: 'var(--sf-rapid)'   },
  { key: 'urgent',  label: 'Urgent',   ticker: 'Urgent · 1 to 4 hours',      color: 'var(--sf-urgent)'  },
  { key: 'lastmin', label: 'Last-min', ticker: 'Last-minute · 4 to 48 hours', color: 'var(--sf-lastmin)' },
  { key: 'routine', label: 'Routine',  ticker: 'Routine · 48 hours +',       color: 'var(--sf-routine)' },
] as const;

const TICK = 3200;

export default function HomeNav() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tick, setTick]         = useState(0);

  /* Once the page scrolls, the top strip folds away and the bar tightens. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setTick((i) => (i + 1) % lanes.length), TICK);
    return () => clearInterval(t);
  }, []);

  const lane = lanes[tick];

  /* A single pill glides to whichever link is hovered or focused. */
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const movePill = (el: HTMLElement) => setPill({ x: el.offsetLeft, w: el.offsetWidth });

  return (
    <div className={`sf-nav-shell${scrolled ? ' scrolled' : ''}`}>
      <div className="sf-topbar">
        <div className="sf-topbar-inner">
          <span className="sf-topbar-live">
            <span className="sf-live-dot" aria-hidden="true" />
            <span className="sf-topbar-live-word">Live</span>
            <span className="sf-topbar-sep" aria-hidden="true">·</span>
            <span key={lane.key} className="sf-topbar-ticker">
              {lane.ticker}
            </span>
          </span>
          <span className="sf-topbar-legend" aria-label="Timing lanes">
            {lanes.map((l) => (
              <span key={l.key} className="sf-topbar-lane">
                <span className="sf-topbar-dot" style={{ background: l.color }} aria-hidden="true" />
                {l.label}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="sf-nav-inner">
        <nav className="sf-nav" aria-label="Main navigation">
          <a href="/" className="sf-nav-brand" aria-label="Shiftify home">
            <Image src="/images/logo.png" alt="Shiftify" width={466} height={265} priority />
          </a>

          <div
            className="sf-nav-links"
            onMouseLeave={() => setPill(null)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPill(null); }}
          >
            <span
              className={`sf-nav-pill${pill ? ' on' : ''}`}
              style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w } : undefined}
              aria-hidden="true"
            />
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onMouseEnter={(e) => movePill(e.currentTarget)}
                onFocus={(e) => movePill(e.currentTarget)}
              >
                {l.dot && <span className="sf-nav-dot" style={{ background: l.dot }} aria-hidden="true" />}
                {l.label}
              </a>
            ))}
          </div>

          <div className="sf-nav-actions">
            <a href="/shiftboard" className="sf-nav-board">
              <i className="bi bi-broadcast-pin" aria-hidden="true" />
              Live shiftboard
            </a>
            <a href="/register" className="sf-btn sf-btn-pink sf-btn-sm">
              <i className="bi bi-send-fill" aria-hidden="true" />
              Request support
            </a>
            <button
              type="button"
              className="sf-nav-toggle"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
            </button>
          </div>
        </nav>

        <div className={`sf-nav-mobile${open ? ' open' : ''}`}>
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href="/shiftboard" onClick={() => setOpen(false)}>Live shiftboard</a>
          <a href="/register" className="sf-btn sf-btn-pink">Request support</a>
        </div>
      </div>
    </div>
  );
}
