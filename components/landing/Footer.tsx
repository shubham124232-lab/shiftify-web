import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter, FiShield, FiLock, FiEye } from 'react-icons/fi';

const footerLinks: Record<string, { label: string; href: string }[]> = {
  'For Participants': [
    { label: 'Find Support Workers',   href: '/marketplace' },
    { label: 'Emergency Support',      href: '/emergency'   },
    { label: 'NDIS Services',          href: '/services'    },
    { label: 'Browse Providers',       href: '/providers'   },
    { label: 'How It Works',           href: '#how-it-works'},
    { label: 'Participant Resources',  href: '/resources'   },
  ],
  'For Workers': [
    { label: 'Join as Support Worker', href: '/register'         },
    { label: 'Browse Open Shifts',     href: '/marketplace'      },
    { label: 'Worker Resources',       href: '/worker-resources' },
    { label: 'NDIS Worker Training',   href: '/training'         },
    { label: 'Invoicing & Pay',        href: '/pay'              },
    { label: 'Worker Insurance',       href: '/insurance'        },
  ],
  'Platform': [
    { label: 'About Shiftify',        href: '/about'         },
    { label: 'Pricing',               href: '#pricing'       },
    { label: 'Provider Listings',     href: '/providers'     },
    { label: 'Support Coordination',  href: '/coordinators'  },
    { label: 'Plan Management',       href: '/plan-managers' },
    { label: 'Blog & News',           href: '/blog'          },
  ],
  'Help & Legal': [
    { label: 'Help Centre',              href: '/help'           },
    { label: 'Contact Us',              href: '/contact'         },
    { label: 'Accessibility Statement', href: '/accessibility'   },
    { label: 'Privacy Policy',          href: '/privacy'         },
    { label: 'Terms of Service',        href: '/terms'           },
    { label: 'NDIS Code of Conduct',    href: '/ndis-compliance' },
  ],
};

const socials = [
  { Icon: FiFacebook,  href: 'https://facebook.com/shiftify',         label: 'Facebook'    },
  { Icon: FiInstagram, href: 'https://instagram.com/shiftify',        label: 'Instagram'   },
  { Icon: FiLinkedin,  href: 'https://linkedin.com/company/shiftify', label: 'LinkedIn'    },
  { Icon: FiTwitter,   href: 'https://twitter.com/shiftify',          label: 'X (Twitter)' },
] as const;

const trust = [
  { Icon: FiShield, text: 'NDIS Registered' },
  { Icon: FiLock,   text: 'SSL Secure'       },
  { Icon: FiEye,    text: 'WCAG 2.1 AA'      },
] as const;

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo" aria-label="Site footer">
      <div className="footer-bg-img" aria-hidden="true" />
      <div className="footer-overlay" aria-hidden="true" />

      <div className="footer-content-wrap">
        <div className="container-xl">
          <div className="grid grid-cols-12 gap-8">

            {/* Brand */}
            <div className="col-span-12 lg:col-span-3">
              <div className="footer-brand" aria-label="Shiftify">Shiftify</div>
              <p className="footer-desc">
                Australia&apos;s trusted NDIS marketplace — connecting participants with
                verified support workers 24/7. Emergency help always available.
              </p>
              <div className="footer-emergency-badge" role="status">
                <span className="footer-emergency-dot" aria-hidden="true" />
                Emergency: 1800 SHIFT IT
              </div>
              <div className="flex gap-2 mt-4">
                {socials.map(({ Icon, href, label }) => (
                  <a key={label} href={href} className="social-icon" aria-label={label} rel="noopener noreferrer">
                    <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="col-span-6 md:col-span-3 lg:col-span-2">
                <h3 className="footer-heading">{heading}</h3>
                <nav aria-label={`${heading} links`}>
                  {links.map(({ label, href }) => (
                    <a key={label} href={href} className="footer-link">{label}</a>
                  ))}
                </nav>
              </div>
            ))}

          </div>

          {/* Bottom bar */}
          <div className="footer-bottom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <p style={{ margin: 0 }}>
                  © {new Date().getFullYear()} Shiftify Pty Ltd. All rights reserved. ABN: 12 345 678 901
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  Shiftify connects participants with registered providers and workers.
                </p>
              </div>
              <div className="md:text-right">
                <div className="flex flex-wrap gap-3 md:justify-end items-center">
                  {trust.map(({ Icon, text }) => (
                    <div key={text} className="footer-trust-badge">
                      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
