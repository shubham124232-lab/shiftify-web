const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

interface Service { title: string; photo: string; alt: string }

const services: Service[] = [
  {
    title: 'Personal Care',
    photo: img('1576091160399-112ba8d25d1d'),
    alt: 'A support worker helping a participant at home',
  },
  {
    title: 'Daily Living',
    photo: img('1584515933487-779824d29309'),
    alt: 'A participant and worker preparing a meal together',
  },
  {
    title: 'Community Access',
    photo: img('1522202176988-66273c2fd55f'),
    alt: 'Two people out together by the harbour',
  },
  {
    title: 'Social & Recreational',
    photo: img('1494790108377-be9c29b29330'),
    alt: 'People enjoying a creative art session',
  },
  {
    title: 'Overnight Care',
    photo: img('1519494026892-80bbd2d6fd0d'),
    alt: 'A quiet home at night',
  },
  {
    title: 'Disability Transport',
    photo: img('1454165804606-c3d57bc86b40'),
    alt: 'Accessible transport on the road',
  },
  {
    title: 'Nursing & Complex Care',
    photo: img('1516574187841-cb9cc2ca948b'),
    alt: 'A clinician preparing care equipment',
  },
  {
    title: 'Support Coordination',
    photo: img('1531482615713-2afd69097998'),
    alt: 'A coordinator reviewing a plan on a laptop',
  },
];

const slug = (t: string) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function HomeServicesSection() {
  return (
    <section id="services" className="sf-section sf-services" aria-labelledby="sf-services-heading">
      <div className="sf-wrap">

        <div className="sf-svc-head">
          <span className="sf-eyebrow">Support services</span>
          <h2 id="sf-services-heading" className="sf-h2">Support for everyday life.</h2>
          <p className="sf-lede">Explore support that matches your needs, goals and routine.</p>
        </div>

        <div className="sf-svc-grid">
          {services.map((s) => (
            <a key={s.title} href={`/services/${slug(s.title)}`} className="sf-scard">
              <span className="sf-scard-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.photo} alt={s.alt} loading="lazy" />
              </span>
              <span className="sf-scard-bar">
                <span className="sf-scard-title">{s.title}</span>
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>

        <a href="/services" className="sf-svc-all">
          Explore all services
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </a>

      </div>
    </section>
  );
}
