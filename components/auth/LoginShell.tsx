'use client';
import Link from 'next/link';
import './login-shell.css';

// Login-only page frame. Register / forgot-password keep using AuthLayout.
export default function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg-page">
      <div className="lg-topbar">
        <span className="lg-live"><i /> 24/7 Live</span>
        <span>0% Platform commission</span>
      </div>
      <header className="lg-header" role="banner">
        <Link href="/" aria-label="Shiftify Home">
          <img src="/images/logo-wordmark.png" alt="Shiftify" />
        </Link>
        <Link href="/" className="lg-back"><i className="bi bi-arrow-left" /> Back to homepage</Link>
      </header>
      <main id="main-content" className="lg-main">
        <div className="lg-card">
          <img className="lg-icon" src="/images/logo-mark.png" alt="" />
          {children}
        </div>
        <div className="lg-footer">
          <a href="mailto:support@shiftify.com.au">Help &amp; support</a><span>•</span>
          <Link href="/privacy">Privacy</Link><span>•</span>
          <Link href="/terms">Terms</Link>
        </div>
      </main>
    </div>
  );
}
