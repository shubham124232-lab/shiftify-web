// components/landing/StoryboardSection.tsx
import { FiArrowRight } from 'react-icons/fi';

interface Persona {
  key: string;
  tag: string;
  color: string;
  colorSoft: string;
  image: string;
  imageAlt: string;
  feeling: string;
  quote: string;
  desc: string;
  linkText: string;
  href: string;
}

const personas: Persona[] = [
  {
    key: 'participants',
    tag: 'Participants',
    color: '#DB2777',
    colorSoft: 'rgba(219,39,119,0.16)',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Person relaxing calmly at home',
    feeling: 'Feeling · Calm',
    quote: '“I posted at 9. I slept by 10.”',
    desc: 'Big buttons. Plain words. Confirm from bed if you have to.',
    linkText: 'Enter participants view',
    href: '/register',
  },
  {
    key: 'coordinators',
    tag: 'Coordinators',
    color: '#D97706',
    colorSoft: 'rgba(217,119,6,0.16)',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Coordinator reviewing a caseload dashboard',
    feeling: 'Feeling · Control',
    quote: '“My whole caseload, one board.”',
    desc: 'Shortlist, compare, confirm on behalf. No CC-all emails.',
    linkText: 'Enter coordinators view',
    href: '/register',
  },
  {
    key: 'providers',
    tag: 'Providers',
    color: '#2563EB',
    colorSoft: 'rgba(37,99,235,0.16)',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Provider connecting with a support worker',
    feeling: 'Feeling · Relief',
    quote: '“Filled before the phone rang.”',
    desc: 'Cancellation → reoffer in one tap. Fill-rate tracked live.',
    linkText: 'Enter providers view',
    href: '/register',
  },
  {
    key: 'support-workers',
    tag: 'Support Workers',
    color: '#059669',
    colorSoft: 'rgba(5,150,105,0.16)',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Support worker checking shift notifications on their phone',
    feeling: 'Feeling · Ready',
    quote: '“Free tonight. Ping me.”',
    desc: 'Toggle available now. Urgent shifts with radius, premium rate.',
    linkText: 'Enter support workers view',
    href: '/register',
  },
];

export default function StoryboardSection() {
  return (
    <section id="storyboard" className="section-py storyboard-section-bg" aria-labelledby="storyboard-heading">
      <div className="container-xl">

        <div className="mb-10 fade-up">
          <span className="section-label">Storyboard · How It Feels</span>
          <h2 id="storyboard-heading" className="section-title" style={{ marginBottom: 12 }}>
            One platform.<br />
            Four <em style={{ fontStyle: 'italic', color: 'var(--clr-primary)' }}>feelings</em> of relief.
          </h2>
          <p className="section-sub text-left" style={{ maxWidth: 560, margin: 0 }}>
            Every role opens Shiftify in a moment of stress. We designed a different kind of
            calm for each.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {personas.map((p) => (
            <div key={p.key} className="fade-up">
              <div className="story-card">
                <div className="story-image-wrap">
                  <span className="story-blob" style={{ background: p.colorSoft }} aria-hidden="true" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.imageAlt} className="story-image" loading="lazy" />
                  <div className="story-image-tint" style={{ background: p.color }} aria-hidden="true" />
                  <span className="story-tag-pill" style={{ background: '#fff', color: p.color }}>{p.tag}</span>
                </div>

                <div className="story-body">
                  <span className="story-feeling" style={{ color: p.color }}>{p.feeling}</span>
                  <h3 className="story-quote">{p.quote}</h3>
                  <p className="story-desc">{p.desc}</p>
                  <a href={p.href} className="story-link" style={{ color: p.color }}>
                    {p.linkText} <FiArrowRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
