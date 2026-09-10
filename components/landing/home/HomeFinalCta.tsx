export default function HomeFinalCta() {
  return (
    <section className="sf-final" aria-labelledby="sf-final-heading">
      <div className="sf-wrap">
        <div className="sf-final-grid">
          <div>
            <span className="sf-eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>
              A stronger, more connected NDIS community
            </span>
            <h2 id="sf-final-heading">
              Ready to make the <em>right</em>{' '}connection?
            </h2>
            <p>
              Join thousands of Australians using Shiftify for flexible, reliable and trusted NDIS support.
            </p>
          </div>

          <div className="sf-final-actions">
            <a href="/register" className="sf-btn sf-btn-pink">
              <i className="bi bi-send-fill" aria-hidden="true" />
              Request support
            </a>
            <a href="/marketplace" className="sf-btn sf-btn-ghost-dark">
              <i className="bi bi-search" aria-hidden="true" />
              Find shifts
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
