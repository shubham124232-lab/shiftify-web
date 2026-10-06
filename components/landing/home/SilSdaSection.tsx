import Image from 'next/image';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

const IconBars = (p: IconProps) => (
  <Svg {...p}><path d="M5.4 19.4v-5.2M12 19.4V5.4M18.6 19.4v-8.6" /></Svg>
);
const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.4 12S6 5.8 12 5.8 21.6 12 21.6 12 18 18.2 12 18.2 2.4 12 2.4 12Z" />
    <circle cx="12" cy="12" r="3.1" />
  </Svg>
);
const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.4 12.6 11 5h6.6a1.4 1.4 0 0 1 1.4 1.4V13l-7.6 7.6a1.4 1.4 0 0 1-2 0l-6-6a1.4 1.4 0 0 1 0-2Z" />
    <path d="M15.4 8.8h.01" />
  </Svg>
);
const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.6" />
    <path d="m20.4 20.4-4.6-4.6" />
  </Svg>
);
const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21.2s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

const boostPoints = [
  { Icon: IconBars, text: 'Appears above standard SIL & SDA results' },
  { Icon: IconEye,  text: 'Shown on the Live Shiftboard with the SIL & SDA filter' },
  { Icon: IconTag,  text: 'Clearly labelled Sponsored' },
];

/* A miniature of the search results, so the benefit is visible rather than described. */
function BoostPreview() {
  return (
    <div className="sf-lb" aria-hidden="true">
      <div className="sf-lb-search">
        <IconSearch />
        <span className="sf-lb-query">SDA vacancies near Melbourne</span>
        <span className="sf-lb-chip">Filters</span>
      </div>

      <div className="sf-lb-row sf-lb-row-sponsored">
        <span className="sf-lb-boosted"><i className="bi bi-arrow-up" />Featured listing</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo('1600596542815-ffad4c1539a9')} alt="" loading="lazy" />
        <div className="sf-lb-body">
          <p className="sf-lb-meta">
            <b>Sponsored</b>
            <em>·</em>
            shiftify.com.au › sil-sda › melbourne
          </p>
          <p className="sf-lb-title">SDA Home — High Physical Support</p>
          <p className="sf-lb-loc"><IconPin /> Melbourne, VIC</p>
          <p className="sf-lb-tags">
            <span>3 bedrooms</span>
            <span>2 bathrooms</span>
            <span>Vacancy</span>
          </p>
        </div>
      </div>

      <p className="sf-lb-label"><span /> Standard listings</p>

      {['1570129477492-45c003edd2be', '1568605114967-8130f3a36994'].map((id) => (
        <div key={id} className="sf-lb-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo(id)} alt="" loading="lazy" />
          <div className="sf-lb-body">
            <span className="sf-lb-line is-mid" />
            <span className="sf-lb-line" />
            <span className="sf-lb-line-row"><IconPin /><span className="sf-lb-line is-short" /></span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SilSdaSection() {
  return (
    <section id="sil-sda" className="sf-sil" aria-labelledby="sf-sil-heading">
      <div className="sf-wrap">
        <div className="sf-sil-grid">

          <div className="sf-sil-copy">
            <span className="sf-eyebrow">Specialist disability accommodation</span>
            <h2 id="sf-sil-heading" className="sf-h2">Discover SIL &amp; SDA opportunities.</h2>
            <p className="sf-lede" style={{ marginBottom: 22 }}>
              Connect vacancies, homes and suitable participants through one trusted marketplace.
            </p>
            <div className="sf-sil-actions">
              <a href="/sil-sda" className="sf-btn sf-btn-outline">Explore SIL &amp; SDA →</a>
              <p className="sf-script sf-sil-script">More than support.<br />A place to belong.</p>
            </div>
          </div>

          <div className="sf-sil-media">
            <Image
              src="/images/house.png"
              alt="Illustration of a modern two-storey home"
              width={1774}
              height={887}
              sizes="720px"
              className="sf-sil-img"
            />
          </div>

        </div>

        {/* Listing Boost — providers can lift one property above standard results. */}
        <div className="sf-boostcard">
          <div className="sf-boostcard-copy">
            <span className="sf-boostcard-badge">For providers</span>
            <h3 className="sf-boostcard-title">Give your SIL or SDA<br />listing more visibility.</h3>
            <p className="sf-boostcard-sub">
              Promote one property listing above standard results and reach people searching
              for suitable accommodation.
            </p>

            <ul className="sf-boostcard-points">
              {boostPoints.map(({ Icon, text }) => (
                <li key={text}>
                  <span className="sf-boostcard-icon" aria-hidden="true"><Icon /></span>
                  {text}
                </li>
              ))}
            </ul>

            <a href="/sil-sda/listing-boost" className="sf-boostcard-btn">
              Get a Featured Listing
              <span className="sf-boostcard-go" aria-hidden="true"><i className="bi bi-arrow-right" /></span>
            </a>
          </div>

          <BoostPreview />
        </div>

      </div>
    </section>
  );
}
