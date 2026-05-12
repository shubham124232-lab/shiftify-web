'use client';
// components/AuthLayout.jsx
// Reusable split-panel layout for Login & Register pages
// Left: branded gradient panel | Right: form card

import Link from 'next/link';

export default function AuthLayout({ children, mode = 'login' }) {
  const isLogin = mode === 'login';

  const trustBadges = [
    { icon: 'bi-shield-fill-check', label: 'NDIS Registered & Compliant', sub: 'Fully certified platform' },
    { icon: 'bi-patch-check-fill',  label: 'Verified Support Workers',    sub: '100% background checked' },
    { icon: 'bi-lightning-charge-fill', label: 'Emergency Response 24/7', sub: 'Average 8-min response' },
  ];

  const stats = [
    { num: '12K+', lbl: 'Support Workers' },
    { num: '98%',  lbl: 'Satisfaction Rate' },
    { num: '24/7', lbl: 'Emergency Cover' },
  ];

  return (
    <div className="auth-page-root">

      {/* ─── Minimal Auth Header ─── */}
      <header className="auth-mini-header" role="banner">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between">

            {/* Logo */}
            <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none" aria-label="Shiftify Home">
              <div style={{
                width: 38, height: 38,
                background: 'var(--clr-primary)',
                borderRadius: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-heart-pulse-fill text-white" style={{ fontSize: 18 }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 800,
                color: 'var(--clr-primary)',
                letterSpacing: '-0.5px',
              }}>Shiftify</span>
            </Link>

            {/* Switch between Login / Register */}
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 14, color: 'var(--clr-muted)', fontWeight: 500 }}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </span>
              <Link
                href={isLogin ? '/register' : '/login'}
                className="btn btn-shiftify btn-sm"
                style={{ fontSize: 13, padding: '8px 18px' }}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* ─── Split Body ─── */}
      <main id="main-content" className="auth-split-body">

        {/* LEFT — Branded Panel */}
        <aside className="auth-left-panel" aria-hidden="true">

          {/* decorative blobs */}
          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
          <div className="auth-blob auth-blob-3" />

          <div className="auth-left-inner">

            {/* Tagline */}
            <div className="auth-left-tag">
              <span className="dot" />
              Trusted NDIS Marketplace
            </div>

            <h2 className="auth-left-heading">
              Support when <span>every minute</span> matters
            </h2>
            <p className="auth-left-sub">
              Connecting participants, support workers, and providers across Australia — fast, safe, and NDIS compliant.
            </p>

            {/* Trust Badges */}
            <div className="auth-trust-list">
              {trustBadges.map((b) => (
                <div key={b.label} className="auth-trust-badge">
                  <div className="auth-trust-icon">
                    <i className={`bi ${b.icon}`} />
                  </div>
                  <div>
                    <div className="auth-trust-label">{b.label}</div>
                    <div className="auth-trust-sub">{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="auth-stats-row">
              {stats.map((s) => (
                <div key={s.lbl} className="auth-stat">
                  <div className="auth-stat-num">{s.num}</div>
                  <div className="auth-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Live Activity Chip */}
            <div className="auth-live-chip">
              <span className="dot" />
              <span>247 support requests active right now</span>
            </div>

          </div>
        </aside>

        {/* RIGHT — Form Panel */}
        <section className="auth-right-panel">
          <div className="auth-form-wrap">
            {children}
          </div>
        </section>

      </main>

      {/* ─── Sticky Emergency FAB ─── */}
      <button
        className="emergency-fab"
        aria-label="Emergency Support — Get immediate help"
        onClick={() => window.location.href = '/#emergency'}
      >
        <span className="dot" aria-hidden="true" />
        Emergency Support
      </button>

      {/* ─── Auth Page Styles ─── */}
      <style jsx>{`

        /* Root */
        .auth-page-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--clr-bg);
        }

        /* Mini Header */
        .auth-mini-header {
          position: sticky; top: 0; z-index: 999;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--clr-border);
          height: 68px;
          display: flex;
          align-items: center;
        }

        /* Split body */
        .auth-split-body {
          flex: 1;
          display: flex;
          min-height: calc(100vh - 68px);
        }

        /* ── Left Panel ── */
        .auth-left-panel {
          flex: 0 0 44%;
          background: linear-gradient(145deg, #5D0030 0%, #880E4F 30%, #C2185B 65%, #E91E8C 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 60px 52px;
        }

        /* blobs */
        .auth-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .auth-blob-1 {
          width: 380px; height: 380px;
          background: rgba(255,255,255,0.05);
          top: -120px; right: -80px;
        }
        .auth-blob-2 {
          width: 280px; height: 280px;
          background: rgba(255,255,255,0.04);
          bottom: -80px; left: -60px;
        }
        .auth-blob-3 {
          width: 180px; height: 180px;
          background: rgba(255,255,255,0.04);
          top: 45%; left: 70%;
        }

        .auth-left-inner {
          position: relative;
          z-index: 1;
          width: 100%;
        }

        /* "Trusted NDIS Marketplace" chip */
        .auth-left-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 100px;
          padding: 7px 16px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 28px;
        }

        .auth-left-heading {
          font-family: var(--font-display);
          font-size: clamp(26px, 2.8vw, 38px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -1px;
          color: #fff;
          margin-bottom: 16px;
        }
        .auth-left-heading span { color: #FFCDD2; }

        .auth-left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.78);
          line-height: 1.75;
          font-weight: 500;
          margin-bottom: 36px;
          max-width: 360px;
        }

        /* Trust badges */
        .auth-trust-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 36px;
        }
        .auth-trust-badge {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(8px);
          border-radius: 14px;
          padding: 14px 16px;
          transition: background 0.22s;
        }
        .auth-trust-badge:hover { background: rgba(255,255,255,0.16); }
        .auth-trust-icon {
          width: 38px; height: 38px;
          background: rgba(255,255,255,0.18);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #fff;
          flex-shrink: 0;
        }
        .auth-trust-label {
          font-size: 13px; font-weight: 700; color: #fff; line-height: 1.2;
        }
        .auth-trust-sub {
          font-size: 11px; color: rgba(255,255,255,0.60); margin-top: 2px; font-weight: 500;
        }

        /* Stats row */
        .auth-stats-row {
          display: flex;
          gap: 24px;
          padding: 20px 22px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .auth-stat { text-align: center; flex: 1; }
        .auth-stat-num {
          font-family: var(--font-display);
          font-size: 26px; font-weight: 800; color: #fff; line-height: 1;
        }
        .auth-stat-lbl {
          font-size: 11px; color: rgba(255,255,255,0.60);
          font-weight: 600; margin-top: 4px;
        }

        /* Live chip */
        .auth-live-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        /* ── Right Panel ── */
        .auth-right-panel {
          flex: 1;
          background: #F8F8FB;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
        }
        .auth-form-wrap {
          width: 100%;
          max-width: 480px;
        }

        /* ── Responsive ── */
        @media (max-width: 991px) {
          .auth-left-panel { display: none; }
          .auth-right-panel { padding: 40px 24px; background: #fff; }
        }
        @media (max-width: 575px) {
          .auth-right-panel { padding: 32px 16px; }
        }
      `}</style>
    </div>
  );
}
