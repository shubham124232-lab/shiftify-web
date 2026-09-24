'use client';

import { useEffect, useState } from 'react';
import { IconRapid } from './PremiumIcons';
import { LaneIcon } from '../shiftboard/rowIcons';

/* The word that swaps inside the headline — one per timing lane, each in its
   own tier colour. */
/* `glow` repeats the token value as a literal so the registered
   --hero-accent property can animate between lanes. */
const rotatingWords = [
  { word: 'rapid',     color: 'var(--sf-rapid-core)',   glow: '#FF2340' },
  { word: 'urgent',    color: 'var(--sf-urgent-core)',  glow: '#FF8500' },
  { word: 'last min',  color: 'var(--sf-lastmin-core)', glow: '#00A06A' },
  { word: 'routine',   color: 'var(--sf-routine-core)', glow: '#547FC4' },
] as const;

const tabs = [
  { label: 'Rapid',       board: 'Rapid',       sub: 'Now · 6 hours',   key: 'rapid',   accent: 'var(--sf-rapid)',   urgency: 'RAPID'       },
  { label: 'Urgent',      board: 'Urgent',      sub: '6 – 48 hours',    key: 'urgent',  accent: 'var(--sf-urgent)',  urgency: 'URGENT'      },
  { label: 'Last-minute', board: 'Last Minute', sub: '4 – 48 hours',    key: 'lastmin', accent: 'var(--sf-lastmin)', urgency: 'LAST_MINUTE' },
  { label: 'Routine',     board: 'Routine',     sub: 'Beyond 48 hours', key: 'routine', accent: 'var(--sf-routine)', urgency: 'ROUTINE'     },
] as const;

type LaneKey = (typeof tabs)[number]['key'];
const laneByKey = Object.fromEntries(tabs.map((t) => [t.key, t])) as Record<LaneKey, (typeof tabs)[number]>;

type Shift = {
  lane: LaneKey;
  suburb: string;
  km: number;
  service: string;
  detail: string;
  serviceIcon: 'people' | 'house';
  day: 'Today' | 'Tomorrow';
  time: string;
};

const shifts: Shift[] = [
  { lane: 'rapid',   suburb: 'Parramatta',   km: 2,  service: 'Community Access',      detail: 'Social outing',            serviceIcon: 'people', day: 'Today',    time: '10:00am – 2:00pm' },
  { lane: 'urgent',  suburb: 'Penrith',      km: 18, service: 'Daily Living',          detail: 'Personal care',            serviceIcon: 'house',  day: 'Today',    time: '4:00pm – 10:00pm' },
  { lane: 'lastmin', suburb: 'Liverpool',    km: 14, service: 'Community Access',      detail: 'Appointments',             serviceIcon: 'people', day: 'Today',    time: '1:00pm – 5:00pm'  },
  { lane: 'routine', suburb: 'Blacktown',    km: 12, service: 'Social & Recreational', detail: 'Group activity',           serviceIcon: 'people', day: 'Tomorrow', time: '9:00am – 3:00pm'  },
  { lane: 'rapid',   suburb: 'Campbelltown', km: 28, service: 'High Support Needs',    detail: 'In-home support',          serviceIcon: 'people', day: 'Today',    time: '6:00pm – 11:00pm' },
  { lane: 'urgent',  suburb: 'North Shore',  km: 10, service: 'Daily Living',          detail: 'Meal prep & household',    serviceIcon: 'house',  day: 'Tomorrow', time: '7:00am – 11:00am' },
  { lane: 'lastmin', suburb: 'Cronulla',     km: 24, service: 'Community Access',      detail: 'Beach / outdoor activity', serviceIcon: 'people', day: 'Today',    time: '3:00pm – 7:00pm'  },
  { lane: 'routine', suburb: 'Castle Hill',  km: 15, service: 'Behaviour Support',     detail: 'In-home support',          serviceIcon: 'people', day: 'Tomorrow', time: '2:00pm – 8:00pm'  },
  { lane: 'rapid',   suburb: 'Bankstown',    km: 6,  service: 'Daily Living',          detail: 'Personal care',            serviceIcon: 'house',  day: 'Today',    time: '12:00pm – 4:00pm' },
  { lane: 'urgent',  suburb: 'Ryde',         km: 8,  service: 'Daily Living',          detail: 'Evening personal care',    serviceIcon: 'house',  day: 'Today',    time: '7:00pm – 10:00pm' },
  { lane: 'rapid',   suburb: 'Hornsby',      km: 19, service: 'Community Access',      detail: 'Medical appointment',      serviceIcon: 'people', day: 'Today',    time: '2:30pm – 6:30pm'  },
  { lane: 'urgent',  suburb: 'Bondi',        km: 16, service: 'Social & Recreational', detail: 'Community outing',         serviceIcon: 'people', day: 'Tomorrow', time: '8:00am – 12:00pm' },
];

const laneCount = (key: LaneKey) => shifts.filter((s) => s.lane === key).length;

/* "All shifts" is a teaser of the mix, not the full list. */
const ALL_LIMIT = 6;
const allShifts = shifts.slice(0, ALL_LIMIT);

export default function HomeHero() {
  const [index, setIndex] = useState(0);
  const [out, setOut] = useState(false);
  const [laneIndex, setLaneIndex] = useState(-1); // -1 = the full list

  useEffect(() => {
    const swap = setInterval(() => {
      setOut(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % rotatingWords.length);
        setOut(false);
      }, 280);
    }, 2200);
    return () => clearInterval(swap);
  }, []);

  const current    = rotatingWords[index];
  const activeLane = laneIndex < 0 ? null : tabs[laneIndex].key;
  const visibleShifts = activeLane === null ? allShifts : shifts.filter((s) => s.lane === activeLane);

  /* Lanes hold different numbers of shifts, so the list is padded out to ALL_LIMIT
     with hidden copies of a real row — the board keeps one height on every tab. */
  const rows = [
    ...visibleShifts.map((s) => ({ shift: s, key: s.suburb, ghost: false })),
    ...Array.from({ length: Math.max(0, ALL_LIMIT - visibleShifts.length) }, (_, i) => ({
      shift: shifts[i % shifts.length],
      key: `ghost-${i}`,
      ghost: true,
    })),
  ];

  const pickLane = (i: number) => setLaneIndex(i);

  return (
    <section
      className="sf-hero"
      id="main-content"
      aria-labelledby="sf-hero-heading"
      style={{ ['--hero-accent' as string]: current.glow }}
    >
      <div className="sf-wrap">
        <div className="sf-hero-grid">

          {/* ---- Left ---- */}
          <div>
            <p className="sf-script sf-hero-script">Support, right<br />where it&apos;s needed.</p>

            <span className="sf-live-pill">
              <span className="sf-live-dot" aria-hidden="true" />
              Live shiftboard · Australia-wide
            </span>

            <h1 id="sf-hero-heading" className="sf-hero-title">
              NDIS support,<br />
              matched to the<br />
              <span
                className={`sf-rotate${out ? ' out' : ''}`}
                style={{ color: current.color }}
                aria-live="polite"
              >
                {current.word}
              </span>{' '}
              timing.
            </h1>

            <p className="sf-hero-sub">
              One live board for every support request — from rapid replacements to recurring
              weekly support. Four timing lanes, one verified network, direct connection.
            </p>

            <div className="sf-hero-cta">
              <a href="/register" className="sf-btn sf-btn-pink">
                <i className="bi bi-send-fill" aria-hidden="true" />
                Request support
              </a>
              <a href="/register?role=SUPPORT_WORKER" className="sf-btn sf-btn-ghost-dark">
                <i className="bi bi-person-fill" aria-hidden="true" />
                I&apos;m a support worker
              </a>
            </div>
          </div>

          {/* ---- Right: live shiftboard ---- */}
          <div id="shiftboard" className="sf-hero-board">
            <div className="sf-board" role="region" aria-label="Live shiftboard preview">
              <div className="sf-board-bar">
                <span className="sf-board-dots" aria-hidden="true">
                  <i style={{ background: 'var(--sf-pink)' }} />
                  <i style={{ background: 'var(--sf-line)' }} />
                  <i style={{ background: 'var(--sf-line-soft)' }} />
                </span>
                <span className="sf-board-title">Live Shiftboard</span>
                <span className="sf-board-region">AUSTRALIA</span>
                <span className="sf-board-updated">
                  <span className="sf-live-dot" style={{ background: 'var(--sf-live)' }} aria-hidden="true" />
                  Updated now
                </span>
              </div>

              {/* Filter chips — share state with the lane selector on the left */}
              <div className="sf-board-filters" role="group" aria-label="Filter shifts by timing lane">
                <button
                  type="button"
                  className={`sf-board-filter${activeLane === null ? ' active' : ''}`}
                  style={{ ['--lane-accent' as string]: 'var(--sf-pink)' }}
                  aria-pressed={activeLane === null}
                  onClick={() => pickLane(-1)}
                >
                  <IconRapid className="sf-board-filter-icon" />
                  All shifts ({allShifts.length})
                </button>
                {tabs.map((t, i) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`sf-board-filter${laneIndex === i ? ' active' : ''}`}
                    style={{ ['--lane-accent' as string]: t.accent }}
                    aria-pressed={laneIndex === i}
                    onClick={() => pickLane(i)}
                  >
                    <LaneIcon urgency={t.urgency} className="sf-board-filter-icon" />
                    {t.board} ({laneCount(t.key)})
                  </button>
                ))}
              </div>

              <ul className="sf-board-list">
                {rows.map(({ shift: s, key, ghost }) => {
                  const lane = laneByKey[s.lane];
                  return (
                    <li
                      key={key}
                      className={`sf-shift${ghost ? ' sf-shift-ghost' : ''}`}
                      aria-hidden={ghost || undefined}
                      style={{ ['--row-accent' as string]: lane.accent }}
                    >
                      <span className="sf-shift-lane" title={lane.board}>
                        <LaneIcon urgency={lane.urgency} className="sf-shift-lane-icon" />
                      </span>

                      <span className="sf-shift-place">
                        <b>{s.suburb}</b>
                        <em>{s.km} km away</em>
                      </span>

                      <span className="sf-shift-cell sf-shift-service">
                        <i className={`bi ${s.serviceIcon === 'house' ? 'bi-house' : 'bi-people'}`} aria-hidden="true" />
                        <span><b>{s.service}</b><em>{s.detail}</em></span>
                      </span>

                      <span className="sf-shift-cell sf-shift-when">
                        <i className="bi bi-calendar3" aria-hidden="true" />
                        <span><b>{s.day}</b><em>{s.time}</em></span>
                      </span>

                      <a
                        href="/register?role=SUPPORT_WORKER"
                        className="sf-shift-btn"
                        aria-label={`View details: ${lane.board} shift in ${s.suburb}`}
                      >
                        View details
                      </a>
                      <i className="bi bi-chevron-right sf-shift-chev" aria-hidden="true" />
                    </li>
                  );
                })}
              </ul>

              <div className="sf-board-foot">
                <div className="sf-board-stat"><b>24/7</b><span>Board live</span></div>
                <div className="sf-board-stat"><b>102</b><span>Active shifts</span></div>
                <div className="sf-board-stat"><b>0%</b><span>Commission</span></div>
              </div>

              <a href="/shiftboard" className="sf-board-cta">
                See the full live shiftboard
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </a>
            </div>

            <p className="sf-script sf-board-note">One board.<br />Four timing lanes.</p>
          </div>

        </div>
      </div>
    </section>
  );
}
