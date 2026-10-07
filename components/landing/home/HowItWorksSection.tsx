'use client';

import { useEffect, useState } from 'react';
import { IconLastMinute, IconRapid, IconRoutine, IconUrgent } from './PremiumIcons';

/* One entry per timing lane. `onAccent` is the text colour that stays
   readable on the lane's filled button. */
const lanes = [
  {
    key: 'rapid', window: 'Now → 60 min', name: 'Rapid support', Icon: IconRapid,
    accent: 'var(--sf-rapid)', onAccent: '#fff',
    heading: 'Support needed in the next hour. Post it now.',
    body: 'A short request alerts suitable people who are available now and within your chosen area.',
    cta: 'Post rapid request',
    steps: [
      { title: 'Post your immediate need', desc: 'Flag it as Rapid and it goes out right away.' },
      { title: 'Nearby workers are notified first', desc: 'Matching narrows to workers who can start within the hour.' },
      { title: 'Confirm as soon as someone responds', desc: 'Lock in the worker and shift details fast.' },
    ],
  },
  {
    key: 'urgent', window: '1 – 4 hrs', name: 'Urgent support', Icon: IconUrgent,
    accent: 'var(--sf-urgent)', onAccent: 'var(--sf-ink)',
    heading: 'Need someone later today? Get matched fast.',
    body: 'Your request goes straight to shortlisted workers nearby who can start within the next few hours.',
    cta: 'Post urgent request',
    steps: [
      { title: 'Post your request with your timeframe', desc: 'Set the window you need covered.' },
      { title: 'Matching searches a wider pool', desc: 'Workers free in the next few hours are notified.' },
      { title: 'Review responses and confirm', desc: 'Pick the right worker before the window closes.' },
    ],
  },
  {
    key: 'lastmin', window: '4 – 48 hrs', name: 'Last-minute support', Icon: IconLastMinute,
    accent: 'var(--sf-lastmin)', onAccent: '#fff',
    heading: 'Cover for tomorrow? Lock it in today.',
    body: 'Reoffer a cancelled shift or fill a gap before it turns urgent — matched workers nearby respond within hours.',
    cta: 'Post last-minute request',
    steps: [
      { title: 'Post a cancelled shift or short-notice gap', desc: 'Reoffer it before it turns urgent.' },
      { title: 'Nearby workers see it on the live board', desc: 'Anyone free in that window can respond.' },
      { title: 'Confirm and lock it in', desc: 'Matched workers nearby typically respond within hours.' },
    ],
  },
  {
    key: 'routine', window: '48 hrs +', name: 'Routine support', Icon: IconRoutine,
    accent: 'var(--sf-routine)', onAccent: '#fff',
    heading: 'Planning ahead? Build a regular routine.',
    body: 'Set up recurring support and meet workers who fit your schedule, goals and preferences.',
    cta: 'Plan routine support',
    steps: [
      { title: 'Post your upcoming need', desc: 'Set date, time and requirements in advance.' },
      { title: 'Matching runs over a longer window', desc: 'More workers can see and respond.' },
      { title: 'Review, compare and confirm', desc: 'Take your time choosing the right match.' },
    ],
  },
] as const;

/* How long each lane stays up while the panel cycles on its own. */
const DWELL = 4500;

export default function HowItWorksSection() {
  const [active, setActive]     = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused]     = useState(false);

  /* Respect reduced-motion: no auto-cycling at all. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAutoplay(false);
  }, []);

  useEffect(() => {
    if (!autoplay || paused) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % lanes.length), DWELL);
    return () => clearTimeout(t);
  }, [active, autoplay, paused]);

  const pick = (i: number) => { setAutoplay(false); setActive(i); };
  const lane = lanes[active];
  const cycling = autoplay && !paused;

  return (
    <section
      id="how-it-works"
      className="sf-section sf-how"
      aria-labelledby="sf-how-heading"
      style={{ ['--lane-accent' as string]: lane.accent, ['--lane-on' as string]: lane.onAccent }}
    >
      <div className="sf-wrap">
        <div className="sf-how-grid">

          <div>
            <span className="sf-eyebrow">Simple steps. Real connections.</span>
            <h2 id="sf-how-heading" className="sf-h2" style={{ marginBottom: 10 }}>
              How Shiftify works.
            </h2>
            <p className="sf-lede" style={{ maxWidth: 380 }}>
              From meet to confirmed support — all in one place.
            </p>

            {/* The steps follow whichever lane the panel is showing. */}
            <p className="sf-steps-lane">
              <span className="sf-steps-lane-dot" aria-hidden="true" />
              {lane.name} <em>({lane.window})</em>
            </p>

            <div key={lane.key} className="sf-steps">
              {lane.steps.map((s, i) => (
                <div key={s.title} className="sf-step" style={{ animationDelay: `${i * 90}ms` }}>
                  <span className="sf-step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>

            <a href="/how-it-works" className="sf-btn sf-btn-pink" style={{ marginTop: 30 }}>
              See how it works
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>
          </div>

          <div>
            <div
              className="sf-ready"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false); }}
            >
              <span className="sf-ready-eyebrow">
                <span className="sf-live-dot" aria-hidden="true" />
                Ready when you are
              </span>

              <div className="sf-ready-tabs" role="tablist" aria-label="Timing lanes">
                {lanes.map((l, i) => (
                  <button
                    key={l.key}
                    type="button"
                    role="tab"
                    id={`sf-ready-tab-${l.key}`}
                    aria-selected={active === i}
                    aria-controls="sf-ready-panel"
                    className={`sf-ready-tab${active === i ? ' active' : ''}`}
                    style={{ ['--tab-accent' as string]: l.accent }}
                    onClick={() => pick(i)}
                  >
                    <span className="sf-ready-window">{l.window}</span>
                    <span className="sf-ready-name">{l.name}</span>
                    {active === i && cycling && (
                      <span
                        key={active}
                        className="sf-ready-progress"
                        style={{ animationDuration: `${DWELL}ms` }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div
                key={lane.key}
                id="sf-ready-panel"
                role="tabpanel"
                aria-labelledby={`sf-ready-tab-${lane.key}`}
                className="sf-ready-body"
              >
                <h3>{lane.heading}</h3>
                <p>{lane.body}</p>
              </div>

              <div className="sf-ready-ctas">
                <a href="/register" className="sf-ready-btn sf-ready-btn-primary">
                  <lane.Icon width={20} height={20} aria-hidden="true" />
                  {lane.cta}
                </a>
                <a href="#shiftboard" className="sf-ready-btn sf-ready-btn-ghost">
                  <i className="bi bi-broadcast" aria-hidden="true" />
                  Open live board
                </a>
              </div>
            </div>

            <p className="sf-script sf-how-script">
              Real people.<br />Real support.<br />Right timing.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
