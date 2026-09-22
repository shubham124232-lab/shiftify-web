import { Fragment, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" />
    <circle cx="12" cy="12" r="3.2" />
  </Svg>
);

const IconPeople = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10" cy="8.4" r="3.4" />
    <path d="M4 19.6v-.6a6 6 0 0 1 12 0v.6" />
    <path d="M17.4 6.2a3 3 0 0 1 0 5.6M18.4 19.6v-.6a5 5 0 0 0-2.2-4" />
  </Svg>
);

const IconRotate = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.6 12a8.4 8.4 0 0 1 14.3-6" />
    <path d="M20.4 12a8.4 8.4 0 0 1-14.3 6" />
    <path d="M18.2 2.6v3.6h-3.6M5.8 21.4v-3.6h3.6" />
  </Svg>
);

const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.6 4.4h6v6" />
    <path d="M19.6 4.4 11 13" />
    <path d="M18.2 14.4v4.2a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8V7.6a1.8 1.8 0 0 1 1.8-1.8h4.2" />
  </Svg>
);

const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8 4.6 5.8v5.4c0 4.5 3.1 8.4 7.4 9.9 4.3-1.5 7.4-5.4 7.4-9.9V5.8Z" />
    <path d="m8.6 11.8 2.4 2.4 4.4-4.6" />
  </Svg>
);

const IconSend = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 3 10.6 13.4" />
    <path d="M21 3l-6.6 18-3.8-7.6L3 9.6Z" />
  </Svg>
);

interface Point { Icon: (p: IconProps) => JSX.Element; lead: string; tail?: string; chip: string }

const points: Point[] = [
  { Icon: IconEye,      lead: 'Sticky visibility for 30 days',          chip: '30 days'   },
  { Icon: IconPeople,   lead: 'Only 3 Platinum businesses', tail: ' displayed at a time', chip: '3 max' },
  { Icon: IconRotate,   lead: 'Equal rotating exposure', tail: ' — no permanent first position', chip: 'Auto' },
  { Icon: IconExternal, lead: 'Direct link to your business profile',   chip: 'One tap'   },
];

/* Placeholder repeats: two filter groups and two shift cards. */
const TWO = [0, 1];
const SHIFT_LANES = ['rapid', 'urgent'];

export default function PlatinumPlacementSection() {
  return (
    <section id="platinum-placement" className="sf-section sf-place" aria-labelledby="sf-place-heading">
      <div className="sf-wrap">
        <div className="sf-place-grid">

          <div className="sf-place-copy">
            <span className="sf-eyebrow">Platinum business placement</span>
            <h2 id="sf-place-heading" className="sf-h2">
              Stay visible while<br />the <span className="sf-place-accent">Shiftboard moves.</span>
            </h2>
            <p className="sf-lede">
              Put your business in front of participants, support coordinators, providers and
              support workers every time they visit the Live Shiftboard.
            </p>

            <ul className="sf-place-points">
              {points.map(({ Icon, lead, tail, chip }, i) => (
                <li key={lead} className="sf-place-point">
                  <span className="sf-place-point-rail" aria-hidden="true" />
                  <span className="sf-place-point-icon" aria-hidden="true"><Icon /></span>
                  <span className="sf-place-point-text">
                    <span className="sf-place-point-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <strong>{lead}</strong>{tail}
                  </span>
                  <span className="sf-place-point-chip">{chip}</span>
                </li>
              ))}
            </ul>

            <div className="sf-place-fair">
              <span className="sf-place-fair-rail" aria-hidden="true" />
              <span className="sf-place-fair-icon" aria-hidden="true"><IconShieldCheck /></span>
              <div className="sf-place-fair-copy">
                <h3 className="sf-place-fair-title">
                  Fair visibility
                  <span className="sf-place-fair-tag">Built in</span>
                </h3>
                <p className="sf-place-fair-text">
                  All three Platinum businesses rotate automatically, with exposure balanced
                  across the 30-day placement.
                </p>
              </div>
            </div>

            <div className="sf-place-actions">
              <a href="/platinum/availability" className="sf-place-btn">
                <IconSend className="sf-place-btn-icon" />
                Check availability
              </a>
              <a href="/platinum" className="sf-place-link">
                View placement details
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </a>
            </div>
            <p className="sf-place-fineprint">Limited to three active placements per cycle.</p>
          </div>

          <div className="sf-place-media">
            <div className="sf-laptop">
              <div className="sf-laptop-lid">
                <span className="sf-laptop-cam" aria-hidden="true" />
                <div className="sf-laptop-screen">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/liveshiftboard.png"
                    alt="The Live Shiftboard showing three rotating Platinum business placements above available shifts"
                    loading="lazy"
                  />
                  {/* Skeleton continues the board's three columns below the screenshot. */}
                  <div className="sf-place-skel" aria-hidden="true">
                    <div className="sf-place-skel-col is-filters">
                      <div className="sf-place-skel-card">
                        {TWO.map((i) => (
                          <Fragment key={i}>
                            <div className="sf-place-skel-chips">
                              <span className={`sf-place-skel-chip ${i === 1 ? 'is-pink' : ''}`} />
                              <span className="sf-place-skel-chip" />
                              <span className={`sf-place-skel-chip ${i === 0 ? 'is-on' : ''}`} />
                              {i % 2 === 0 && <span className="sf-place-skel-chip" />}
                            </div>
                            <span className="sf-place-skel-rule" />
                            <span className={`sf-place-skel-bar is-head ${i % 2 ? 'is-w35' : 'is-w25'}`} />
                          </Fragment>
                        ))}
                        <span className="sf-place-skel-input" />
                      </div>
                    </div>

                    <div className="sf-place-skel-col is-shifts">
                      <div className="sf-place-skel-card">
                        {SHIFT_LANES.map((lane) => (
                          <div key={lane} className={`sf-place-skel-shift is-${lane}`}>
                            <span className="sf-place-skel-dot" />
                            <span className="sf-place-skel-lines">
                              <span className="sf-place-skel-bar is-head is-w35" />
                              <span className="sf-place-skel-bar is-w55" />
                              <span className="sf-place-skel-bar is-w45" />
                            </span>
                            <span className="sf-place-skel-btn" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sf-place-skel-col is-side">
                      <div className="sf-place-skel-card is-closed">
                        <span className="sf-place-skel-bar is-head is-w55" />
                        <span className="sf-place-skel-bar is-w90" />
                        <span className="sf-place-skel-btn is-wide" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sf-laptop-base" aria-hidden="true">
                <span className="sf-laptop-notch" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
