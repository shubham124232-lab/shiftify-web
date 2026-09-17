import type { CSSProperties } from 'react';
import { ChevronRight, Crown, HandHeart, MapPin, Pin, Sprout, Sunrise, type LucideIcon } from 'lucide-react';

interface PlatinumBusiness {
  name: string;
  tagline: string;
  area: string;
  href: string;
  Icon: LucideIcon;
  color: string;
}

// Sample placements matching the approved design. There is no placements
// endpoint yet — swap this list for API data once one exists.
const BUSINESSES: PlatinumBusiness[] = [
  { name: 'CareBridge Supports', tagline: 'In-home & community support', area: 'Western Sydney', href: '/platinum', Icon: HandHeart, color: 'var(--sf-pink)' },
  { name: 'Everyday Ability',    tagline: 'Complex care & daily living', area: 'Sydney-wide',    href: '/platinum', Icon: Sprout,    color: 'var(--sf-lastmin)' },
  { name: 'BrightPath Care',     tagline: 'Behaviour & social support',  area: 'Greater Sydney', href: '/platinum', Icon: Sunrise,   color: 'var(--sf-urgent)' },
];

export function PlatinumBusinesses() {
  return (
    <section className="sf-sb-plat" aria-labelledby="sf-sb-plat-title">
      <div className="sf-sb-plat-head">
        <h2 id="sf-sb-plat-title" className="sf-sb-plat-title">
          <Crown aria-hidden="true" strokeWidth={1.75} />
          <span>Platinum businesses</span>
        </h2>
        <p className="sf-sb-mono sf-sb-plat-tag">
          Sponsored · 30-day placement
          <Pin aria-hidden="true" strokeWidth={1.75} />
        </p>
      </div>

      <div className="sf-sb-plat-grid">
        {BUSINESSES.map(({ name, tagline, area, href, Icon, color }, i) => (
          // Sweep delays are staggered so the light travels tile to tile.
          <article key={name} className="sf-sb-plat-card" style={{ '--c': color, '--sweep-delay': `${i * 0.7}s` } as CSSProperties}>
            <Icon className="sf-sb-plat-logo" aria-hidden="true" strokeWidth={1.5} />
            <div className="sf-sb-plat-body">
              <span className="sf-sb-plat-kicker">
                <Crown aria-hidden="true" strokeWidth={2} />
                Platinum partner
              </span>
              <h3>{name}</h3>
              <p>{tagline}</p>
              <span className="sf-sb-plat-loc">
                <MapPin aria-hidden="true" strokeWidth={2} fill="currentColor" stroke="var(--sf-white)" />
                {area}
              </span>
            </div>
            <a href={href} className="sf-sb-plat-btn" aria-label={`View ${name} profile`}>
              View profile
              <ChevronRight aria-hidden="true" strokeWidth={2} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
