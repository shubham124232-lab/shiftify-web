'use client';
import Image from 'next/image';
import logoImg from '@/public/images/logo.png';

const navLinks = [
  ['How It Works', '#how-it-works'],
  ['Services',     '#services'],
  ['Marketplace',  '#marketplace'],
  ['Pricing',      '#pricing'],
  ['About',        '#about'],
] as const;

export default function Header() {
  return (
    <header className="site-header" role="banner">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="container-xl">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a href="/" className="header-logo flex items-center gap-2 no-underline" aria-label="Shiftify Home">
            <Image src={logoImg.src} alt="Shiftify" width={160} height={55} priority />
          </a>

          {/* Nav */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {navLinks.map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', padding: '8px 14px', borderRadius: 9, transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--clr-primary)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--clr-primary-xlight)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--clr-text)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a href="/login" className="btn-shiftify-black hidden md:inline-flex" style={{ padding: '9px 20px', fontSize: 14 }}>
              Log In
            </a>
            <a href="/register" className="btn-shiftify" style={{ padding: '9px 20px', fontSize: 14 }}>
              Get Started
            </a>
            <a href="#emergency" className="btn-emergency ml-1" style={{ padding: '9px 18px', fontSize: 13 }} aria-label="Emergency Support — Get help immediately">
              <span className="dot" aria-hidden="true" />
              Emergency
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
