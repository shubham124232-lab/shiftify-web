import Image from 'next/image';

const columns: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'Platform',
    links: [
      ['How it works',    '#how-it-works'],
      ['Live shiftboard', '#shiftboard'],
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
      ['Help centre',        '/help'],
      ['Contact us',         '/contact'],
      ['Safety',             '/safety'],
      ['Become a partner',   '/partners'],
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

export default function HomeFooter() {
  return (
    <footer className="sf-footer" role="contentinfo">
      <div className="sf-wrap">
        <div className="sf-footer-grid">

          <div>
            <span className="sf-footer-brand">
              <Image src="/images/logo.png" alt="Shiftify" width={466} height={265} />
            </span>
            <p className="sf-footer-tag">A more connected tomorrow.</p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4>{col.heading}</h4>
              <nav aria-label={col.heading}>
                {col.links.map(([label, href]) => (
                  <a key={label} href={href}>{label}</a>
                ))}
              </nav>
            </div>
          ))}

          <div>
            <h4>Follow us</h4>
            <div className="sf-footer-social">
              {socials.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} rel="noopener noreferrer">
                  <i className={`bi ${s.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="sf-footer-aus" style={{ marginTop: 16 }}>
              <i className="bi bi-patch-check-fill" aria-hidden="true" />
              Proudly Australian
            </p>
            <p className="sf-script sf-footer-script">Built for a more<br />inclusive Australia.</p>
          </div>

        </div>

        <div className="sf-footer-bottom">
          © {new Date().getFullYear()} Shiftify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
