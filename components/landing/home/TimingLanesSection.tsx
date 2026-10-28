import { IconRapid, IconUrgent, IconLastMinute, IconRoutine } from './PremiumIcons';
import type { SVGProps } from 'react';

interface Lane {
  Icon: (p: SVGProps<SVGSVGElement>) => JSX.Element;
  title: string;
  meta: string;
  desc: string;
  accent: string;
}

const lanes: Lane[] = [
  {
    Icon: IconRapid,
    title: 'Rapid',
    meta: 'Immediate replacement',
    desc: 'When support falls through, find available workers quickly.',
    accent: 'var(--sf-rapid)',
  },
  {
    Icon: IconUrgent,
    title: 'Urgent',
    meta: 'Support needed within hours',
    desc: 'Get matched with available workers for today.',
    accent: 'var(--sf-urgent)',
  },
  {
    Icon: IconLastMinute,
    title: 'Last Minute',
    meta: 'Support within 4 – 48 hours',
    desc: 'Find the right support for upcoming needs.',
    accent: 'var(--sf-lastmin)',
  },
  {
    Icon: IconRoutine,
    title: 'Routine',
    meta: 'Planned or recurring support',
    desc: 'Build ongoing support arrangements.',
    accent: 'var(--sf-routine)',
  },
];

export default function TimingLanesSection() {
  return (
    <section id="timing" className="sf-section sf-lanes" aria-labelledby="sf-lanes-heading">
      <div className="sf-wrap">

        <div className="sf-head-row">
          <div>
            <span className="sf-eyebrow">Flexible. Responsive. Real support.</span>
            <h2 id="sf-lanes-heading" className="sf-h2">Support that moves at your pace.</h2>
          </div>
          <p className="sf-lede">
            Different needs. Different timelines.<br />
            The same trusted network.
          </p>
        </div>

        <div className="sf-card-grid">
          {lanes.map(({ Icon, ...lane }) => (
            <a
              key={lane.title}
              href="#shiftboard"
              className="sf-lane-card"
              style={{ ['--tile-accent' as string]: lane.accent }}
            >
              <div className="sf-lane-card-top">
                <Icon className="sf-lane-card-icon" strokeWidth={1.8} />
                <div className="sf-lane-card-head">
                  <h3 className="sf-lane-card-title">{lane.title}</h3>
                  <p className="sf-lane-card-meta">{lane.meta}</p>
                </div>
                <i className="bi bi-chevron-right sf-lane-card-chev" aria-hidden="true" />
              </div>

              <p className="sf-lane-card-desc">{lane.desc}</p>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
