'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Story { tag: string; role: string; quote: string; who: string }

/* Placeholder copy until approved testimonials land. */
const q = 'Approved testimonial to be added';
const who = 'First name · State';

const stories: Story[] = [
  { tag: 'Participant',    role: 'Participant story',    quote: q, who },
  { tag: 'Support Worker', role: 'Support Worker story', quote: q, who },
  { tag: 'Provider',       role: 'Provider story',       quote: q, who },
];

const ROTATE_MS = 7000;

function Avatar({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6">
        <circle cx="32" cy="24" r="10" />
        <path d="M13 53c0-10.5 8.5-17 19-17s19 6.5 19 17" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function VerifiedPill() {
  return (
    <span className="sf-story-pill">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="10" />
        <path d="M6 10.4l2.6 2.6L14.2 7.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified Shiftify user
    </span>
  );
}

export default function CommunityStoriesSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = stories.length;

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, count]);

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  const lead = stories[active];
  const rest = [stories[(active + 1) % count], stories[(active + 2) % count]];

  return (
    <section id="stories" className="sf-section sf-stories" aria-labelledby="sf-stories-heading">
      <div className="sf-wrap">

        <div className="sf-stories-head">
          <div>
            <span className="sf-eyebrow">Community stories</span>
            <h2 id="sf-stories-heading" className="sf-h2">Real experiences. Meaningful connections.</h2>
            <p className="sf-lede">Hear from people who use Shiftify to find, coordinate and deliver support.</p>
          </div>
          <div className="sf-stories-nav">
            <button type="button" className="sf-story-nav" aria-label="Previous story" onClick={() => go(active - 1)}>
              <i className="bi bi-arrow-left" aria-hidden="true" />
            </button>
            <button type="button" className="sf-story-nav" aria-label="Next story" onClick={() => go(active + 1)}>
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="sf-stories-grid"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Featured story */}
          <article className="sf-story-lead" aria-live="polite">
            <span className="sf-story-rail" aria-hidden="true" />
            <span className="sf-story-quote" aria-hidden="true">&ldquo;</span>
            <span className="sf-story-index" aria-hidden="true">
              {String(active + 1).padStart(2, '0')}<em>/{String(count).padStart(2, '0')}</em>
            </span>

            <div key={active} className="sf-story-lead-in">
              <span className="sf-story-avatar-ring">
                <Avatar className="sf-story-avatar sf-story-avatar-lg" />
              </span>
              <div className="sf-story-copy">
                <span className="sf-story-tag">{lead.tag}</span>
                <h3 className="sf-story-role">{lead.role}</h3>
                <p className="sf-story-text">{lead.quote}</p>
                <p className="sf-story-who">{lead.who}</p>
                <VerifiedPill />
              </div>
            </div>
          </article>

          {/* Supporting stories */}
          <div className="sf-story-side">
            {rest.map((s) => {
              const idx = stories.findIndex((x) => x.role === s.role);
              return (
                <article
                  key={s.role}
                  className="sf-story-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`Show ${s.role}`}
                  onClick={() => go(idx)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(idx); } }}
                >
                  <Avatar className="sf-story-avatar" />
                  <div className="sf-story-copy">
                    <span className="sf-story-dash" aria-hidden="true" />
                    <h3 className="sf-story-role">{s.role}</h3>
                    <p className="sf-story-text">{s.quote}</p>
                    <p className="sf-story-who">{s.who}</p>
                    <VerifiedPill />
                  </div>
                  <i className="sf-story-go bi bi-arrow-right" aria-hidden="true" />
                </article>
              );
            })}
          </div>

          {/* Progress dots */}
          <div className="sf-story-dots" role="tablist" aria-label="Community stories">
            {stories.map((s, i) => (
              <button
                key={s.role}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={s.role}
                className={`sf-story-dot${i === active ? ' is-on' : ''}`}
                onClick={() => go(i)}
              >
                <span
                  className="sf-story-dot-fill"
                  style={i === active && !paused ? { animationDuration: `${ROTATE_MS}ms` } : undefined}
                />
              </button>
            ))}
          </div>

          <a href="/stories" className="sf-story-all">
            Read community stories
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
}
