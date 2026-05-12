'use client';
// components/Header.jsx
import heroImg from '../../public/images/logo.png';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="site-header" role="banner">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="container-xl">
        <div className="d-flex align-items-center justify-content-between">

          {/* Logo */}
          <a href="/" className="header-logo d-flex align-items-center gap-2 text-decoration-none" aria-label="Shiftify Home">
          <Image src={heroImg.src} alt="" />
          </a>

          {/* Nav */}
          <nav aria-label="Main navigation" className="d-none d-lg-flex align-items-center gap-1">
            {[
              ['How It Works', '#how-it-works'],
              ['Services', '#services'],
              ['Marketplace', '#marketplace'],
              ['Pricing', '#pricing'],
              ['About', '#about'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                fontSize:18, fontWeight: 600,
                color: 'var(--clr-text)',
                padding: '8px 14px', borderRadius: 9,
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
                onMouseEnter={e => { e.target.style.color = 'var(--clr-primary)'; e.target.style.background = 'var(--clr-primary-xlight)'; }}
                onMouseLeave={e => { e.target.style.color = 'var(--clr-muted)'; e.target.style.background = 'transparent'; }}
              >{label}</a>
            ))}
          </nav>

          {/* Actions */}
          <div className="d-flex align-items-center gap-2">
            <a href="/login" className="btn-shiftify-black  btn btn-outline-secondary btn-sm d-none d-md-inline-flex" >
              Log In
            </a>
            <a href="/register" className="btn btn-shiftify btn-sm">
              Get Started
            </a>
            <a href="#emergency" className="btn btn-emergency btn-sm ms-1" aria-label="Emergency Support — Get help immediately">
              <span className="dot" aria-hidden="true"></span>
              Emergency
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
