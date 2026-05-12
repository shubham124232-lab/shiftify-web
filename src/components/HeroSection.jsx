// components/HeroSection.jsx
export default function HeroSection() {
  return (
    <section
      id="main-content"
      className="hero-section bg-hero"
      aria-labelledby="hero-heading"
    >
      <div className="container-xl">
        <div className="row align-items-center g-5">

          {/* Left: Text */}
          <div className="col-lg-6">
            {/* Live badge */}
            <div className="badge-pink mb-4 d-inline-flex" role="status" aria-live="polite">
              <span className="dot" style={{ width:8, height:8, background:'var(--clr-primary)', borderRadius:'50%', animation:'blink 1.5s infinite', flexShrink:0 }} aria-hidden="true"></span>
              <span>2,400+ Active Support Workers Available Now</span>
            </div>

            <h1 id="hero-heading" className="hero-title fade-up">
              Disability Support,<br />
              <span className="highlight">When Every</span><br />
              Minute Matters
            </h1>

            <p className="hero-sub fade-up">
              Australia&apos;s trusted NDIS marketplace connecting participants with
              verified support workers, providers, and coordinators — instantly.
              Emergency help available 24/7.
            </p>

            {/* CTAs */}
            <div className="d-flex flex-wrap gap-3 mb-4 fade-up">
              <a href="#marketplace" className="btn btn-shiftify" style={{ padding: '14px 28px', fontSize: 16 }}>
                <i className="bi bi-search me-2" aria-hidden="true"></i>
                Find Support Now
              </a>
              <a href="#emergency" className="btn btn-emergency" style={{ padding: '14px 28px', fontSize: 16 }}>
                <span className="dot" aria-hidden="true"></span>
                Post Emergency Shift
              </a>
            </div>

            {/* Trust badges */}
            <div className="d-flex flex-wrap gap-3 mt-2 fade-up">
              {[
                { icon: 'bi-shield-check', text: 'NDIS Registered' },
                { icon: 'bi-patch-check', text: 'Police Checked' },
                { icon: 'bi-clock', text: '24/7 Support' },
                { icon: 'bi-star-fill', text: '4.9★ Rated' },
              ].map(({ icon, text }) => (
                <div key={text} className="d-flex align-items-center gap-2" style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-muted)' }}>
                  <i className={`${icon} text-success`} aria-hidden="true"></i>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="col-lg-6 d-none d-lg-block">
            <div className="hero-visual position-relative" style={{ minHeight: 480 }}>

              {/* Main dashboard preview card */}
              <div className="main-visual-card">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-muted)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Available Nearby</p>
                    <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Support Workers</p>
                  </div>
                  <span className="badge-emergency" role="status">
                    <span style={{ width:6, height:6, background:'#B91C1C', borderRadius:'50%', animation:'blink 1s infinite' }} aria-hidden="true"></span>
                    3 Emergency
                  </span>
                </div>

                {[
                  { name: 'Sarah M.', role: 'Personal Care', rating: 4.9, distance: '1.2km', avail: 'Available Now', color: '#7C3AED', initials: 'SM' },
                  { name: 'David K.', role: 'Daily Living', rating: 4.8, distance: '2.1km', avail: 'In 30 min', color: '#0D9488', initials: 'DK' },
                  { name: 'Priya R.', role: 'Overnight Care', rating: 5.0, distance: '0.8km', avail: 'Available Now', color: '#C2185B', initials: 'PR' },
                ].map((w) => (
                  <div key={w.name} className="marketplace-card mb-2" role="article">
                    <div className="worker-avatar" style={{ background: w.color, fontSize: 14 }}>{w.initials}</div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{w.name}</span>
                        <i className="bi bi-patch-check-fill" style={{ color:'#2563EB', fontSize:13 }} aria-label="Verified"></i>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--clr-muted)', margin: 0 }}>{w.role} · {w.distance} away</p>
                    </div>
                    <div className="text-end">
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#16A34A' }}>{w.avail}</div>
                      <div style={{ fontSize: 12, color: 'var(--clr-muted)' }}>★ {w.rating}</div>
                    </div>
                  </div>
                ))}

                <button className="btn btn-shiftify w-100 mt-3" style={{ fontSize: 14 }}>
                  View All Workers <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
                </button>
              </div>

              {/* Floating stat cards */}
              <div className="float-card top-left" role="status" aria-label="Response time stat">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Avg Response</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--clr-primary)' }}>4 min</div>
                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>↑ Emergency shifts</div>
              </div>

              <div className="float-card mid-right" role="status" aria-label="New request notification">
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width:36, height:36, background:'#FEE2E2', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#DC2626' }}>🆘</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>New Emergency</div>
                    <div style={{ fontSize: 12, color:'var(--clr-muted)' }}>Personal care · Now</div>
                  </div>
                </div>
              </div>

              <div className="float-card bot-left" role="status" aria-label="Shift matched notification">
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width:36, height:36, background:'#D1FAE5', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>Shift Matched!</div>
                    <div style={{ fontSize: 12, color:'var(--clr-muted)' }}>2 mins ago · Maria J.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
