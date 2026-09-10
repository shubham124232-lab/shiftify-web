'use client';

import { useEffect, useRef, useState } from 'react';
import { IconGem, IconSilSda } from './PremiumIcons';

/* Two motion layers:
   1. Reveal — the first time the section scrolls in, each tile rises into
      place and a solid curtain wipes off it.
   2. Scroll-linked — while the section is on screen, `--p` (0 → 1) tracks
      how far it has travelled through the viewport. It drives a glint that
      sweeps across the tiles and a gentle drift of the watermark.
   Nothing is hidden until the component mounts, and reduced-motion users
   get the static layout. */
export default function PlatinumTilesSection() {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    setReady(true);

    let frame = 0;
    const update = () => {
      frame = 0;
      const r  = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p  = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (entry.intersectionRatio >= 0.2) setShown(true);
          window.addEventListener('scroll', onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener('scroll', onScroll);
        }
      },
      { threshold: [0, 0.2] },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`sf-plat${ready ? ' is-ready' : ''}${shown ? ' is-in' : ''}`}
      aria-labelledby="sf-plat-heading"
    >
      <div className="sf-wrap">

        <div className="sf-plat-head">
          <span className="sf-eyebrow">Platinum placement</span>
          <h2 id="sf-plat-heading" className="sf-h2">Be the first home they see.</h2>
        </div>

        <div className="sf-plat-grid">

          <div className="sf-plat-slot">
            <div className="sf-plat-tile sf-plat-promo">
              <span className="sf-plat-curtain" aria-hidden="true" />
              <span className="sf-plat-glint" aria-hidden="true" />
              <IconGem className="sf-plat-watermark" aria-hidden="true" />

              <span className="sf-plat-chip">
                <IconGem width={15} height={15} /> Platinum tile
              </span>
              <h3>Put your business at the top.</h3>
              <p>
                Promote your SIL or SDA service with a Platinum Tile and appear first in relevant
                marketplace results.
              </p>
              <ul className="sf-plat-perks">
                <li><i className="bi bi-check-lg" aria-hidden="true" /> First in relevant results</li>
                <li><i className="bi bi-check-lg" aria-hidden="true" /> Platinum badge on your listing</li>
                <li><i className="bi bi-check-lg" aria-hidden="true" /> From $499.99/month</li>
              </ul>
              <a href="/pricing" className="sf-btn sf-btn-pink">
                Promote your business
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="sf-plat-slot">
            <a href="/sil-sda" className="sf-plat-tile sf-plat-listing">
              <span className="sf-plat-curtain" aria-hidden="true" />
              <span className="sf-plat-glint" aria-hidden="true" />

              <div className="sf-plat-listing-head">
                <span className="sf-plat-chip">
                  <IconGem width={15} height={15} /> Platinum tile
                </span>
                <span className="sf-plat-sponsored">Sponsored</span>
              </div>

              <span className="sf-plat-thumb" aria-hidden="true">
                <IconSilSda width={64} height={64} />
                <span className="sf-plat-thumb-tag">Vacancy</span>
              </span>

              <div className="sf-plat-listing-body">
                <div className="sf-plat-listing-info">
                  <h4>SIL Vacancy</h4>
                  <p className="sf-plat-loc">
                    <i className="bi bi-geo-alt" aria-hidden="true" /> Western Sydney NSW
                  </p>
                  <div className="sf-plat-feats">
                    <span><i className="bi bi-door-closed" aria-hidden="true" /> 3 bedrooms</span>
                    <span><i className="bi bi-droplet" aria-hidden="true" /> 2 bathrooms</span>
                    <span><i className="bi bi-check-circle" aria-hidden="true" /> Improved Liveability</span>
                  </div>
                </div>
                <i className="bi bi-arrow-up-right sf-plat-chev" aria-hidden="true" />
              </div>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
