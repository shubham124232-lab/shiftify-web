'use client';

import { useEffect, useReducer, useState } from 'react';
import { ChevronRight, Crown, RotateCw } from 'lucide-react';

interface PlatinumBusiness {
  name: string;
  initials: string;
  tagline: string;
  href: string;
}

// Sample placements matching the approved design. There is no placements
// endpoint yet — swap this list for API data once one exists.
const BUSINESSES: PlatinumBusiness[] = [
  { name: 'CareBridge Supports', initials: 'CB', tagline: 'In-home & community support', href: '/platinum' },
  { name: 'Everyday Ability',    initials: 'EA', tagline: 'Complex care & daily living', href: '/platinum' },
  { name: 'BrightPath Care',     initials: 'BC', tagline: 'Behaviour & social support',  href: '/platinum' },
];

// Seconds each placement stays highlighted before the spotlight moves on.
const ROTATE_EVERY = 4;

export function PlatinumBusinesses() {
  const [{ active, left }, step] = useReducer(
    (s: { active: number; left: number }, action: 'tick' | 'rotate') =>
      action === 'tick' && s.left > 1
        ? { ...s, left: s.left - 1 }
        : { active: (s.active + 1) % BUSINESSES.length, left: ROTATE_EVERY },
    { active: 0, left: ROTATE_EVERY },
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => step('tick'), 1000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      className="sf-sb-plat"
      aria-labelledby="sf-sb-plat-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="sf-sb-plat-head">
        <h2 id="sf-sb-plat-title">
          <Crown aria-hidden="true" strokeWidth={2} fill="currentColor" />
          Platinum businesses
        </h2>
        <p>
          <span>Sponsored · rotates in {left}s</span>
          <button type="button" onClick={() => step('rotate')}>
            <RotateCw aria-hidden="true" strokeWidth={2.6} />
            Rotate
          </button>
        </p>
      </div>

      <ol className="sf-sb-plat-list">
        {BUSINESSES.map(({ name, initials, tagline, href }, i) => (
          <li key={name}>
            <a
              href={href}
              className={`sf-sb-plat-item${i === active ? ' active' : ''}`}
              aria-label={`${name} — ${tagline}`}
            >
              <span className="sf-sb-plat-rank" aria-hidden="true">{i + 1}</span>
              <span className="sf-sb-plat-logo" aria-hidden="true">{initials}</span>
              <span className="sf-sb-plat-text">
                <strong>{name}</strong>
                <small>{tagline}</small>
              </span>
              <ChevronRight className="sf-sb-plat-go" aria-hidden="true" strokeWidth={2.2} />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
