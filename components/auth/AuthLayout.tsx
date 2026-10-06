'use client';
import Link from 'next/link';
import Image from 'next/image';
import logoImg from '@/public/images/logo.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  mode?: 'login' | 'register';
  /** 'split' keeps the branded left panel (login). 'centered' drops it and
   *  centres the form on the theme-grey canvas (register). */
  variant?: 'split' | 'centered';
  /** Centered variant only: journey title + step rail rendered above the card. */
  head?: React.ReactNode;
  /** Centered variant only: width of the centred column. */
  maxWidth?: number;
  /** Drops the card's own padding so children can run edge to edge. */
  flush?: boolean;
}

const trustBadges = [
  { icon: 'bi-shield-fill-check',       label: 'Independent Platform',        sub: 'Not endorsed by the NDIA or NDIS' },
  { icon: 'bi-patch-check-fill',         label: 'Credentials on Profiles',     sub: 'Workers submit required documents' },
  { icon: 'bi-lightning-charge-fill',    label: 'Live Shiftboard',             sub: 'Post, find and respond to shifts'  },
] as const;

const stats = [
  { num: '4',  lbl: 'Job priority labels' },
  { num: '5',  lbl: 'Account types'       },
  { num: '0%', lbl: 'Shift commission'    },
] as const;

export default function AuthLayout({ children, mode = 'login', variant = 'split', head, maxWidth = 720, flush = false }: AuthLayoutProps) {
  const isLogin  = mode === 'login';
  const centered = variant === 'centered';

  return (
    <div
      className={centered ? 'td-auth' : undefined}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: centered ? 'var(--td-light-bg-1)' : 'var(--clr-bg)' }}
    >

      {/* Mini Header */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: centered ? 'var(--td-white)' : 'rgba(255,255,255,0.96)',
          backdropFilter: centered ? undefined : 'blur(12px)',
          borderBottom: '1px solid var(--clr-border)',
          height: 68, display: 'flex', alignItems: 'center',
        }}
        role="banner"
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div style={{ width: '100%', padding: '0 1.5rem' }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 no-underline header-logo" aria-label="Shiftify Home">
              <Image src={logoImg.src} alt="Shiftify" width={160} height={55} priority />
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline" style={{ fontSize: 14, color: 'var(--clr-muted)', fontWeight: 500 }}>
                {isLogin ? 'Don’t have an account?' : 'Already have an account?'}
              </span>
              <Link href={isLogin ? '/register' : '/login'} className="btn-shiftify" style={{ fontSize: 13, padding: '8px 18px' }}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {centered ? (
        /* Centered: a single column on the theme-grey canvas — no branded side panel */
        <main id="main-content" className="auth-centered">
          <div className="auth-shell" style={{ maxWidth }}>
            {head}
            <div className={flush ? 'auth-card is-flush' : 'auth-card'}>{children}</div>
          </div>
        </main>
      ) : (
      /* Split Body */
      <main id="main-content" style={{ flex: 1, display: 'flex', minHeight: 'calc(100vh - 68px)' }}>

        {/* Left: Branded Panel */}
        <aside
          className="hidden lg:flex"
          style={{ flex: '0 0 44%', background: 'linear-gradient(145deg, #5D0030 0%, #880E4F 30%, #C2185B 65%, #E91E8C 100%)', position: 'relative', overflow: 'hidden', alignItems: 'center', padding: '60px 52px' }}
          aria-hidden="true"
        >
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', width: 380, height: 380, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', top: -120, right: -80, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 280, height: 280, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', bottom: -80, left: -60, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 180, height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', top: '45%', left: '70%', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: '#fff', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%', animation: 'blink 1.5s infinite' }} />
              Independent Support Platform
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: -1, color: '#fff', marginBottom: 16 }}>
              Support, <span style={{ color: '#FFCDD2' }}>right where</span> it&apos;s needed
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, fontWeight: 500, marginBottom: 36, maxWidth: 360 }}>
              An independent technology platform connecting participants, support coordinators, providers and support workers across Australia&apos;s disability support community.
            </p>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {trustBadges.map((b) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', flexShrink: 0 }}>
                    <i className={`bi ${b.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{b.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', marginTop: 2, fontWeight: 500 }}>{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 24, padding: '20px 22px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 16, marginBottom: 20 }}>
              {stats.map((s) => (
                <div key={s.lbl} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', fontWeight: 600, marginTop: 4 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Live chip */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 100, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
              <span style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%', animation: 'blink 1.5s infinite' }} />
              Live Shiftboard · Australia-wide
            </div>
          </div>
        </aside>

        {/* Right: Form Panel */}
        <section style={{ flex: 1, background: '#F8F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            {children}
          </div>
        </section>

      </main>
      )}

      <p role="note" style={{ margin: 0, padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--clr-muted)' }}>
        Shiftify is not an emergency service. If someone is in immediate danger, call 000.
      </p>

    </div>
  );
}
