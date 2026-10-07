// components/landing/WorkerCommissionCtaSection.tsx
import { FiArrowRight, FiPercent } from 'react-icons/fi';

export default function WorkerCommissionCtaSection() {
  return (
    <section id="worker-commission" className="commission-cta" aria-labelledby="commission-cta-heading">
      <img
        src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1920&q=80&auto=format&fit=crop"
        alt=""
        className="commission-cta-img"
        aria-hidden="true"
        loading="lazy"
      />
      <div className="commission-cta-overlay" aria-hidden="true" />

      <div className="commission-cta-body container-xl">
        <div className="commission-cta-text">
          <span className="commission-cta-eyebrow">FOR SUPPORT WORKERS</span>
          <h2 id="commission-cta-heading" className="commission-cta-title">
            0% Commission, <em>Always</em>.
          </h2>
          <p className="commission-cta-sub">
            Flat subscription, no per-shift cut — support workers keep 100% of their pay.
          </p>
          <a href="/register" className="commission-cta-btn">
            Join as a Support Worker <FiArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="commission-cta-stat" role="status">
          <FiPercent size={16} aria-hidden="true" />
          <span className="commission-cta-stat-num">0%</span>
          <span className="commission-cta-stat-label">Platform commission, every shift</span>
        </div>
      </div>
    </section>
  );
}
