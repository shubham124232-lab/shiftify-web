import Image from 'next/image';
import type { SVGProps } from 'react';

const columns: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'Platform',
    links: [
      ['How it works',    '#how-it-works'],
      ['Live Shiftboard', '/shiftboard'],
      ['SIL & SDA',       '/sil-sda'],
      ['Pricing',         '#pricing'],
    ],
  },
  {
    heading: 'Users',
    links: [
      ['Participants',         '/register?role=PARTICIPANT'],
      ['Support workers',      '/register?role=SUPPORT_WORKER'],
      ['Support coordinators', '/register?role=COORDINATOR'],
      ['Providers',            '/register?role=PROVIDER'],
    ],
  },
  {
    heading: 'Support',
    links: [
      ['Help centre',      '/help'],
      ['Contact us',       '/contact'],
      ['Safety',           '/safety'],
      ['Become a partner', '/partners'],
    ],
  },
  {
    heading: 'Legal',
    links: [
      ['Terms of service', '/terms'],
      ['Privacy policy',   '/privacy'],
      ['Cookie policy',    '/cookies'],
      ['Accessibility',    '/accessibility'],
    ],
  },
];

const socials = [
  { icon: 'bi-linkedin',  href: 'https://linkedin.com/company/shiftify', label: 'LinkedIn'  },
  { icon: 'bi-facebook',  href: 'https://facebook.com/shiftify',         label: 'Facebook'  },
  { icon: 'bi-instagram', href: 'https://instagram.com/shiftify',        label: 'Instagram' },
  { icon: 'bi-youtube',   href: 'https://youtube.com/@shiftify',         label: 'YouTube'   },
] as const;

/* A simplified Australia mark — used beside the locale and trust lines. */
const IconAus = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 18" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4.6 5.1c1-.6 2.3-.9 3.5-.6.6.1 1.2.5 1.8.4.7-.1 1.2-.7 1.9-.9 1-.3 2 .2 3 .5.9.2 1.9.1 2.7.6.9.5 1.4 1.6 2.1 2.4.5.6 1.2 1.1 1.4 1.8.2.8-.3 1.6-.8 2.2-.6.8-1.4 1.6-2.4 1.9-.8.2-1.6-.1-2.4 0-.9.1-1.6.8-2.4 1.1-1 .4-2.1.4-3.1.1-.9-.2-1.7-.8-2.6-1-.9-.2-1.9 0-2.7-.4-1-.5-1.6-1.6-2-2.6-.4-1-.7-2.1-.4-3.1.3-1 1-1.8 1.9-2.4Z" />
    <path d="M19.8 15.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
  </svg>
);

export default function SiteFooter() {
  return (
    <footer className="sf-ft" role="contentinfo">
      <div className="sf-wrap">

        {/* Closing call to action */}
        <section className="sf-ft-cta" aria-labelledby="sf-ft-cta-heading">
          <div className="sf-ft-cta-copy">
            <span className="sf-ft-cta-eyebrow">A stronger, more connected NDIS community</span>
            <h2 id="sf-ft-cta-heading" className="sf-ft-cta-title">
              Ready to make the <em>right</em> connection?
            </h2>
            <p className="sf-ft-cta-sub">
              Join thousands of Australians using Shiftify for flexible, reliable and trusted NDIS support.
            </p>
          </div>
          <div className="sf-ft-cta-actions">
            <a href="/register" className="sf-ft-btn">
              <i className="bi bi-send-fill" aria-hidden="true" />
              Request support
            </a>
            <a href="/marketplace" className="sf-ft-btn sf-ft-btn-ghost">
              <i className="bi bi-search" aria-hidden="true" />
              Find shifts
            </a>
          </div>
        </section>

        {/* Directory */}
        <div className="sf-ft-grid">
          <div className="sf-ft-brand-col">
            <span className="sf-ft-logo">
              <Image src="/images/logo.png" alt="Shiftify" width={466} height={265} />
            </span>
            <p className="sf-ft-tag">A more connected tomorrow.</p>
          </div>

          {columns.map((col) => (
            <div key={col.heading} className="sf-ft-col">
              <h3 className="sf-ft-heading">{col.heading}</h3>
              <nav aria-label={col.heading} className="sf-ft-links">
                {col.links.map(([label, href]) => (
                  <a key={label} href={href}>{label}</a>
                ))}
              </nav>
            </div>
          ))}

          <div className="sf-ft-col">
            <h3 className="sf-ft-heading">Follow us</h3>
            <div className="sf-ft-social">
              {socials.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} rel="noopener noreferrer">
                  <i className={`bi ${s.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="sf-script sf-ft-aus">
              <IconAus className="sf-ft-aus-icon" />
              Proudly Australian
            </p>
            <p className="sf-script sf-ft-note">Built for a more<br />inclusive Australia.</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sf-ft-bottom">
          <p>© {new Date().getFullYear()} Shiftify. All rights reserved.</p>
          <p className="sf-ft-locale">
            <IconAus className="sf-ft-aus-icon" />
            <span className="sf-ft-locale-div" aria-hidden="true" />
            Australia
          </p>
        </div>

      </div>
    </footer>
  );
}
