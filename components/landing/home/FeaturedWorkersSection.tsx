import { IconStar, IconPin, IconVerified } from './PremiumIcons';

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=400&q=80&auto=format&fit=crop`;

interface Worker {
  name: string;
  headline: string;
  rating: string;
  reviews: number;
  suburb: string;
  distance: string;
  skills: string[];
  available: boolean;
  photo: string;
}

const workers: Worker[] = [
  {
    name: 'Priya M.',
    headline: 'Support Worker · 6 yrs',
    rating: '4.9', reviews: 84,
    suburb: 'Parramatta NSW', distance: '3.2 km',
    skills: ['Personal care', 'Manual handling', 'Hindi'],
    available: true,
    photo: photo('1494790108377-be9c29b29330'),
  },
  {
    name: 'Tom R.',
    headline: 'Support Worker · 4 yrs',
    rating: '4.8', reviews: 51,
    suburb: 'Blacktown NSW', distance: '5.8 km',
    skills: ['Community access', 'Driving', 'Behaviour support'],
    available: true,
    photo: photo('1507003211169-0a1dd7228f2d'),
  },
  {
    name: 'Alicia N.',
    headline: 'Registered Nurse · 9 yrs',
    rating: '5.0', reviews: 37,
    suburb: 'Penrith NSW', distance: '8.1 km',
    skills: ['Complex care', 'PEG feeding', 'Wound care'],
    available: false,
    photo: photo('1438761681033-6461ffad8d80'),
  },
  {
    name: 'Daniel K.',
    headline: 'Support Worker · 3 yrs',
    rating: '4.7', reviews: 29,
    suburb: 'Marrickville NSW', distance: '2.4 km',
    skills: ['Overnight', 'Social support', 'Auslan'],
    available: true,
    photo: photo('1500648767791-00dcc994a43e'),
  },
];

export default function FeaturedWorkersSection() {
  return (
    <section id="workers" className="sf-section sf-workers" aria-labelledby="sf-workers-heading">
      <div className="sf-wrap">

        <div className="sf-head-row">
          <div>
            <span className="sf-eyebrow">The people behind the board</span>
            <h2 id="sf-workers-heading" className="sf-h2">Support workers near you.</h2>
          </div>
          <p className="sf-lede">
            Every profile is screened, rated by the people they support,<br />
            and shows live availability.
          </p>
        </div>

        <div className="sf-worker-grid">
          {workers.map((w) => (
            <a key={w.name} href="/workers/available" className="sf-worker">

              <div className="sf-worker-top">
                <span className="sf-worker-avatar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.photo} alt="" loading="lazy" />
                  <span className="sf-worker-verified" title="Verified worker">
                    <IconVerified width={13} height={13} />
                  </span>
                </span>
                <div className="sf-worker-id">
                  <h3>{w.name}</h3>
                  <p>{w.headline}</p>
                </div>
              </div>

              <div className="sf-worker-meta">
                <span className="sf-worker-rating">
                  <IconStar width={13} height={13} />
                  {w.rating}
                  <em>({w.reviews})</em>
                </span>
                <span className="sf-worker-loc">
                  <IconPin width={13} height={13} />
                  {w.suburb} · {w.distance}
                </span>
              </div>

              <ul className="sf-worker-skills" role="list">
                {w.skills.map((s) => <li key={s}>{s}</li>)}
              </ul>

              <div className="sf-worker-foot">
                <span className={`sf-worker-status${w.available ? ' live' : ''}`}>
                  <span className="sf-worker-status-dot" aria-hidden="true" />
                  {w.available ? 'Available now' : 'Booked this week'}
                </span>
                <span className="sf-worker-cta">
                  View profile
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </span>
              </div>

            </a>
          ))}
        </div>

        <div className="sf-worker-all">
          <a href="/workers/available" className="sf-btn sf-btn-outline">
            Browse all support workers
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
}
