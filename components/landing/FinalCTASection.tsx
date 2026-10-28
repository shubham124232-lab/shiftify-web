'use client';
// components/landing/FinalCTASection.tsx
const contacts = [
  { icon: 'bi-telephone-fill', text: '1800 SHIFT IT',        href: 'tel:1800744348' },
  { icon: 'bi-chat-dots-fill', text: 'Live Chat Now',         href: '#chat'          },
  { icon: 'bi-envelope-fill',  text: 'help@shiftify.com.au', href: 'mailto:help@shiftify.com.au' },
] as const;

export default function FinalCTASection() {
  return (
    <section
      id="emergency"
      className="section-py"
      style={{ background: 'var(--td-pink)', color: 'var(--td-white)' }}
      aria-labelledby="cta-heading"
    >
      <div className="container-xl">
        <div className="flex justify-center">
          <div className="text-center" style={{ maxWidth: 640 }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'color-mix(in srgb, var(--td-white) 18%, transparent)', border: '1.5px solid color-mix(in srgb, var(--td-white) 30%, transparent)', borderRadius: 100, padding: '6px 18px', fontSize: 13, fontWeight: 700, marginBottom: 28 }} role="status" aria-live="polite">
              <span style={{ width: 8, height: 8, background: 'var(--td-white)', borderRadius: '50%', animation: 'blink 1.5s infinite' }} aria-hidden="true" />
              Available 24/7 — Emergency Team On Standby
            </div>

            <h2 id="cta-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: -1.5 }}>
              Support When Every<br />Minute Matters
            </h2>

            <p style={{ fontSize: 18, opacity: 0.88, lineHeight: 1.75, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
              Don&apos;t wait. Whether it&apos;s an emergency or ongoing care, thousands of
              verified support workers are available across Australia right now.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <a
                href="#emergency-form"
                className="btn-emergency"
                style={{ borderRadius: 14, padding: '16px 32px', fontSize: 17, fontWeight: 800, border: '2px solid color-mix(in srgb, var(--td-white) 25%, transparent)' }}
                aria-label="Get Emergency Support — immediate response"
              >
                <span style={{ width: 10, height: 10, background: 'var(--td-white)', borderRadius: '50%', animation: 'blink 1s infinite', flexShrink: 0 }} aria-hidden="true" />
                Get Emergency Support Now
              </a>
              <a
                href="/register"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'color-mix(in srgb, var(--td-white) 15%, transparent)', color: 'var(--td-white)', border: '2px solid color-mix(in srgb, var(--td-white) 40%, transparent)', borderRadius: 14, padding: '16px 32px', fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-body)', backdropFilter: 'blur(4px)', textDecoration: 'none' }}
              >
                Create Free Account
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {contacts.map(({ icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'color-mix(in srgb, var(--td-white) 85%, transparent)', fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--td-white)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'color-mix(in srgb, var(--td-white) 85%, transparent)'; }}
                >
                  <i className={`bi ${icon}`} aria-hidden="true" />
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
