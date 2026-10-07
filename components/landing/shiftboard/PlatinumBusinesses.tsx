'use client';

import { useEffect, useReducer, useState } from 'react';
import { ChevronRight, Gem } from 'lucide-react';

interface PlatinumBusiness {
  name: string;
  initials: string;
  tagline: string;
  href: string;
}

// Sample placements with initials as logos. There is no placements endpoint yet —
// swap this list for API data once one exists.
const BUSINESSES: PlatinumBusiness[] = [
  { name: 'CareBridge Supports', initials: 'CB', tagline: 'In-home & community support', href: '/platinum' },
  { name: 'Everyday Ability',    initials: 'EA', tagline: 'Complex care & daily living', href: '/platinum' },
  { name: 'BrightPath Care',     initials: 'BP', tagline: 'Behaviour & social support',  href: '/platinum' },
];

// Seconds each placement stays highlighted before the spotlight moves on.
const ROTATE_EVERY = 4;

export function PlatinumBusinesses() {
  const [active, next] = useReducer((i: number) => (i + 1) % BUSINESSES.length, 0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, ROTATE_EVERY * 1000);
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
          <Gem aria-hidden="true" strokeWidth={2} />
          Platinum businesses
        </h2>
        <span className="sf-sb-plat-note">Sponsored · rotates monthly</span>
      </div>

      <ol className="sf-sb-plat-list">
        {BUSINESSES.map(({ name, initials, tagline, href }, i) => (
          <li key={name}>
            <a
              href={href}
              className={`sf-sb-plat-item${i === active ? ' active' : ''}`}
              aria-label={`${name} — ${tagline}`}
            >
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
