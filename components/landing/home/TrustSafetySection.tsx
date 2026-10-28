import {
  IconScreening, IconPoliceCheck, IconFirstAid, IconInsurance, IconConduct,
} from './PremiumIcons';
import type { SVGProps } from 'react';

type Ico = (p: SVGProps<SVGSVGElement>) => JSX.Element;

interface Check { Icon: Ico; title: string; desc: string }

const checks: Check[] = [
  {
    Icon: IconScreening,
    title: 'NDIS Worker Screening',
    desc: 'A current clearance is checked before any profile goes live.',
  },
  {
    Icon: IconPoliceCheck,
    title: 'National Police Check',
    desc: 'Identity and police history verified, then re-checked yearly.',
  },
  {
    Icon: IconFirstAid,
    title: 'First Aid & CPR',
    desc: 'Certificates sighted and expiry dates tracked automatically.',
  },
  {
    Icon: IconInsurance,
    title: 'Insurance Cover',
    desc: 'Public liability and professional indemnity confirmed.',
  },
  {
    Icon: IconConduct,
    title: 'NDIS Code of Conduct',
    desc: 'Every worker agrees to the Code before they can apply.',
  },
];

export default function TrustSafetySection() {
  return (
    <section id="trust" className="sf-section sf-trust" aria-labelledby="sf-trust-heading">
      <div className="sf-wrap">

        <div className="sf-trust-grid">

          <div className="sf-trust-intro">
            <span className="sf-eyebrow">Safety first</span>
            <h2 id="sf-trust-heading" className="sf-h2">
              Verified before they reach the board.
            </h2>
            <p className="sf-lede">
              No one appears on Shiftify until every check below is complete and current.
              Expired documents pull a worker off the board automatically.
            </p>
            <a href="/safety" className="sf-trust-link">
              How we verify workers
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>
          </div>

          <ul className="sf-trust-list" role="list">
            {checks.map(({ Icon, title, desc }) => (
              <li key={title} className="sf-trust-item">
                <span className="sf-trust-ico" aria-hidden="true">
                  <Icon width={22} height={22} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                <i className="bi bi-check-lg sf-trust-tick" aria-hidden="true" />
              </li>
            ))}
          </ul>

        </div>
      </div>
    </section>
  );
}
