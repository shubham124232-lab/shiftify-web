'use client';

import { useEffect, useReducer, useState } from 'react';
import { ChevronRight, Crown, RotateCw } from 'lucide-react';

interface PlatinumBusiness {
  name: string;
  logo: string;
  tagline: string;
  href: string;
}

// Sample placements with dummy logos. There is no placements endpoint yet —
// swap this list for API data once one exists.
const BUSINESSES: PlatinumBusiness[] = [
  { name: 'CareBridge Supports', logo: '/images/platinum/carebridge.svg',       tagline: 'In-home & community support', href: '/platinum' },
  { name: 'Everyday Ability',    logo: '/images/platinum/everyday-ability.svg', tagline: 'Complex care & daily living', href: '/platinum' },
  { name: 'BrightPath Care',     logo: '/images/platinum/brightpath.svg',       tagline: 'Behaviour & social support',  href: '/platinum' },
];

// Seconds each placement stays highlighted before the spotlight moves on.
const ROTATE_EVERY = 4;

export function PlatinumBusinesses() {
  const [{ active }, step] = useReducer(
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
          <button type="button" onClick={() => step('rotate')}>
            <RotateCw aria-hidden="true" strokeWidth={2.6} />
            Rotate
          </button>
        </p>
      </div>

      <ol className="sf-sb-plat-list">
        {BUSINESSES.map(({ name, logo, tagline, href }, i) => (
          <li key={name}>
            <a
              href={href}
              className={`sf-sb-plat-item${i === active ? ' active' : ''}`}
              aria-label={`${name} — ${tagline}`}
            >
              <img className="sf-sb-plat-logo" src={logo} alt="" width={44} height={44} />
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
