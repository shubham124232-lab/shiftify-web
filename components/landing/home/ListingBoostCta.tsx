import type { SVGProps } from 'react';

const IconHouse = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M2.6 11.2 12 3.2l9.4 8" />
    <path d="M4.8 9.4v10.4a1 1 0 0 0 1 1h12.4a1 1 0 0 0 1-1V9.4" />
    <path d="M9.4 20.8v-6.2h5.2v6.2" />
    <path d="M16.6 4.6h2.2v2.6" />
  </svg>
);

export default function ListingBoostCta() {
  return (
    <section className="sf-boost-cta" aria-labelledby="sf-boost-cta-heading">

      {/* Dark band — Listing Boost */}
      <div className="sf-boost-band">
        <div className="sf-wrap sf-boost-band-in">
          <span className="sf-boost-house" aria-hidden="true"><IconHouse /></span>
          <div className="sf-boost-copy">
            <span className="sf-boost-eyebrow">Promote the right thing</span>
            <h2 id="sf-boost-cta-heading" className="sf-boost-title">Promoting a SIL or SDA property?</h2>
            <p className="sf-boost-sub">
              Use a Featured Listing to give one accommodation listing greater visibility in relevant SIL/SDA results.
            </p>
          </div>
          <div className="sf-boost-actions">
            <a href="/sil-sda/listing-boost" className="sf-boost-cta-btn">Explore Featured Listing</a>
            <a href="/sil-sda/options" className="sf-boost-cta-link">
              See SIL &amp; SDA options
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Light band — marketplace */}
      <div className="sf-boost-strip">
        <div className="sf-wrap sf-boost-strip-in">
          <div className="sf-boost-strip-copy">
            <span className="sf-eyebrow">SIL &amp; SDA marketplace</span>
            <h3 className="sf-boost-strip-title">Find your next home.</h3>
            <p className="sf-boost-strip-sub">Explore SIL and SDA properties across Australia.</p>
          </div>
          <div className="sf-boost-actions">
            <a href="/sil-sda/search" className="sf-boost-strip-btn">Search SIL &amp; SDA</a>
            <a href="/sil-sda/list" className="sf-boost-strip-link">
              List a property
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
