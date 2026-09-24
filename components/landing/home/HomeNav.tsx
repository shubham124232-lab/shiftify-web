'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

// Role links follow the footer's Users order. Anchors are rooted at "/" so
// they still reach the home page sections from /shiftboard.
const links = [
  { label: 'How it works',         href: '/#how-it-works' },
  { label: 'Providers',            href: '/#roles' },
  { label: 'Support Workers',      href: '/#roles' },
  { label: 'Support Coordinators', href: '/#roles' },
  { label: 'Participants',         href: '/#roles' },
  { label: 'Plan Managers',        href: '/#roles' },
] as const;

/* `hideBoardLink` drops the Live shiftboard shortcut on the board page itself. */
export default function HomeNav({ hideBoardLink = false }: { hideBoardLink?: boolean }) {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Once the page scrolls, the top strip folds away and the bar tightens. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  /* A single pill glides to whichever link is hovered or focused. */
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const movePill = (el: HTMLElement) => setPill({ x: el.offsetLeft, w: el.offsetWidth });

  return (
    <div className={`sf-nav-shell${scrolled ? ' scrolled' : ''}`}>
      <div className="sf-topbar">
        <div className="sf-topbar-inner">
          <span className="sf-topbar-live">
            <span className="sf-live-dot" aria-hidden="true" />
            <span className="sf-topbar-live-word">24/7 Live</span>
          </span>
          <span className="sf-topbar-note">0% platform commission</span>
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
                {l.label}
              </a>
            ))}
          </div>

          <div className="sf-nav-actions">
            {!hideBoardLink && (
              <a href="/shiftboard" className="sf-nav-board">
                <i className="bi bi-broadcast-pin" aria-hidden="true" />
                Live shiftboard
              </a>
            )}
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
          {!hideBoardLink && <a href="/shiftboard" onClick={() => setOpen(false)}>Live shiftboard</a>}
          <a href="/register" className="sf-btn sf-btn-pink">Request support</a>
        </div>
      </div>
    </div>
  );
}
