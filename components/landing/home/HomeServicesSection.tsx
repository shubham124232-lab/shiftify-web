const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;

interface Service { title: string; blurb: string; photo: string; alt: string }

/* The tall feature card on the left. */
const feature: Service = {
  title: 'Personal Care',
  blurb: 'Support with daily personal needs.',
  photo: img('1576091160399-112ba8d25d1d'),
  alt: 'A support worker helping a participant at home',
};

/* Top strip — three wider cards beside the feature card. */
const rowOne: Service[] = [
  {
    title: 'Daily Living',
    blurb: 'Build independence at home.',
    photo: img('1584515933487-779824d29309'),
    alt: 'A participant preparing a meal in the kitchen',
  },
  {
    title: 'Community Access',
    blurb: 'Get out and be part of your community.',
    photo: img('1522202176988-66273c2fd55f'),
    alt: 'Two people out together by the harbour',
  },
  {
    title: 'Social & Recreational',
    blurb: 'Pursue what you enjoy.',
    photo: img('1494790108377-be9c29b29330'),
    alt: 'A woman listening to music outdoors',
  },
];

/* Bottom strip — four narrower cards. */
const rowTwo: Service[] = [
  {
    title: 'Specialist Support',
    blurb: 'Tailored help for your goals.',
    photo: img('1503454537195-1dcabb73ffb9'),
    alt: 'A young person working on a creative project',
  },
  {
    title: 'Disability Transport',
    blurb: 'Safe travel, more freedom.',
    photo: img('1454165804606-c3d57bc86b40'),
    alt: 'A wheelchair user boarding an accessible van',
  },
  {
    title: 'Nursing & Complex Care',
    blurb: 'Clinical support you can trust.',
    photo: img('1516574187841-cb9cc2ca948b'),
    alt: 'A nurse speaking with an older participant',
  },
  {
    title: 'Support Coordination',
    blurb: 'Navigate your supports with confidence.',
    photo: img('1531482615713-2afd69097998'),
    alt: 'A coordinator reviewing a plan with a participant',
  },
];

const slug = (t: string) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

function Card({ s, feature = false }: { s: Service; feature?: boolean }) {
  return (
    <a href={`/services/${slug(s.title)}`} className={`sf-scard${feature ? ' sf-scard-feature' : ''}`}>
      <span className="sf-scard-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.photo} alt={s.alt} loading="lazy" />
      </span>
      <span className="sf-scard-body">
        <span className="sf-scard-dash" aria-hidden="true" />
        <span className="sf-scard-copy">
          <span className="sf-scard-title">{s.title}</span>
          <span className="sf-scard-blurb">{s.blurb}</span>
        </span>
        <i className="bi bi-arrow-right" aria-hidden="true" />
      </span>
    </a>
  );
}

export default function HomeServicesSection() {
  return (
    <section id="services" className="sf-section sf-services" aria-labelledby="sf-services-heading">
      <div className="sf-wrap">

        <div className="sf-svc-head">
          <span className="sf-eyebrow">Support services</span>
          <h2 id="sf-services-heading" className="sf-h2">Support for everyday life.</h2>
          <p className="sf-lede">Explore support that fits your needs, goals and routine.</p>
        </div>

        <div className="sf-svc-grid">
          <Card s={feature} feature />

          <div className="sf-svc-stack">
            <div className="sf-svc-row sf-svc-row-3">
              {rowOne.map((s) => <Card key={s.title} s={s} />)}
            </div>
            <div className="sf-svc-row sf-svc-row-4">
              {rowTwo.map((s) => <Card key={s.title} s={s} />)}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
