import Image from 'next/image';

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
              src="/images/house-line.png"
              alt="Line illustration of a modern two-storey home"
              width={1518}
              height={887}
              sizes="546px"
              className="sf-sil-img"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
