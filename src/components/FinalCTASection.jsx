'use client';
// components/FinalCTASection.jsx
export default function FinalCTASection() {
  return (
    <section
      id="emergency"
      className="section-py"
      style={{
        background: 'linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #E91E63 100%)',
        color: '#fff',
      }}
      aria-labelledby="cta-heading"
    >
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-lg-8 text-center fade-up">

            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 100, padding: '6px 18px',
                fontSize: 13, fontWeight: 700,
                marginBottom: 28,
              }}
              role="status"
              aria-live="polite"
            >
              <span style={{ width:8, height:8, background:'#fff', borderRadius:'50%', animation:'blink 1.5s infinite' }} aria-hidden="true"></span>
              Available 24/7 — Emergency Team On Standby
            </div>

            <h2
              id="cta-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 20,
                letterSpacing: -1.5,
              }}
            >
              Support When Every<br />Minute Matters
            </h2>

            <p style={{ fontSize: 18, opacity: 0.88, lineHeight: 1.75, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
              Don&apos;t wait. Whether it&apos;s an emergency or ongoing care, thousands of
              verified support workers are available across Australia right now.
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
              <a
                href="#emergency-form"
                className="btn"
                style={{
                  background: '#D32F2F',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderRadius: 14,
                  padding: '16px 32px',
                  fontSize: 17,
                  fontWeight: 800,
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  animation: 'pulse-ring 2s infinite',
                }}
                aria-label="Get Emergency Support — immediate response"
              >
                <span style={{ width:10, height:10, background:'#fff', borderRadius:'50%', animation:'blink 1s infinite', flexShrink:0 }} aria-hidden="true"></span>
                Get Emergency Support Now
              </a>

              <a
                href="/register"
                className="btn"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: 14,
                  padding: '16px 32px',
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Create Free Account
              </a>
            </div>

            {/* Support options */}
            <div className="d-flex flex-wrap justify-content-center gap-4">
              {[
                { icon: 'bi-telephone-fill', text: '1800 SHIFT IT', href: 'tel:1800744348' },
                { icon: 'bi-chat-dots-fill', text: 'Live Chat Now', href: '#chat' },
                { icon: 'bi-envelope-fill', text: 'help@shiftify.com.au', href: 'mailto:help@shiftify.com.au' },
              ].map(({ icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >
                  <i className={`bi ${icon}`} aria-hidden="true"></i>
                  {text}
                </a>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
