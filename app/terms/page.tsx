import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

export const metadata = { title: 'Terms of Service — Shiftify' };

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container-xl" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 20px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--clr-text)', marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: 'var(--clr-muted)', marginBottom: 32 }}>
          Last updated: placeholder — this page has not yet been reviewed by legal counsel.
        </p>

        <div style={{ background: '#FFF9C4', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#78350f', marginBottom: 36 }}>
          <strong>Placeholder copy.</strong> This is draft content standing in so the Terms link isn't broken. It will
          be replaced with lawyer-reviewed copy before public launch.
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--clr-text)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section>
            <h2 style={sectionHeading}>1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Shiftify (the &ldquo;Platform&rdquo;), you agree to be bound by these Terms
              of Service. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>2. What Shiftify Is</h2>
            <p>
              Shiftify is a marketplace connecting NDIS participants, support workers, support coordinators, providers
              and plan managers. Shiftify does not employ support workers, does not provide disability support itself,
              and is not a registered NDIS provider. Arrangements for support are made directly between the parties
              using the Platform.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>3. Accounts &amp; Eligibility</h2>
            <p>
              You must provide accurate information when registering and keep your profile up to date. Support
              workers, coordinators, providers and plan managers must submit the compliance documents required for
              their role before posting or accepting jobs. Submission of a document does not guarantee the accuracy
              of its contents — you are responsible for holding valid, current credentials.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>4. Subscriptions &amp; Payments</h2>
            <p>
              Certain roles require an active subscription to post or apply for jobs, as described on the
              Subscription page. Invoices generated in-app are records between parties only — Shiftify does not
              process payment for support delivered; that is arranged directly between the parties involved.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>5. Conduct</h2>
            <p>
              You agree not to misuse the Platform, misrepresent your identity or qualifications, or use the
              messaging or job systems for any unlawful purpose. Incidents can be reported directly from a job page;
              serious safety concerns should also be reported to the relevant authorities.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>6. Limitation of Liability</h2>
            <p>
              Shiftify is provided on an &ldquo;as is&rdquo; basis. To the extent permitted by law, Shiftify is not
              liable for the conduct, quality of support, or actions of any user of the Platform.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>7. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Platform after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>8. Contact</h2>
            <p>
              Questions about these Terms can be sent to{' '}
              <a href="mailto:support@shiftify.com.au" style={{ color: 'var(--clr-primary)' }}>support@shiftify.com.au</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: 17, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8,
};
