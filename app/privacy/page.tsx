import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

export const metadata = { title: 'Privacy Policy — Shiftify' };

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container-xl" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 20px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--clr-text)', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: 'var(--clr-muted)', marginBottom: 32 }}>
          Last updated: placeholder — this page has not yet been reviewed by legal counsel.
        </p>

        <div style={{ background: '#FFF9C4', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#78350f', marginBottom: 36 }}>
          <strong>Placeholder copy.</strong> This is draft content standing in so the Privacy Policy link isn't broken.
          It will be replaced with lawyer-reviewed copy before public launch.
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--clr-text)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section>
            <h2 style={sectionHeading}>1. What We Collect</h2>
            <p>
              We collect the information you provide when registering and building your profile (name, contact
              details, address/suburb, role-specific profile fields), compliance documents you upload, and records of
              your activity on the Platform (job posts, applications, messages, reviews, invoices, subscriptions).
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>2. How We Use It</h2>
            <p>
              We use your information to operate the marketplace: matching participants with workers, coordinators,
              providers and plan managers; verifying compliance document submission; processing subscriptions;
              sending notifications relevant to your jobs and account; and improving the Platform.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>3. Compliance Documents</h2>
            <p>
              Documents you upload (e.g. police checks, insurance, qualifications) are stored securely and used only
              to confirm the required documents for your role have been submitted. Access is restricted to
              administrators and, where relevant, the parties you transact with on a job.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>4. Sharing</h2>
            <p>
              We do not sell your personal information. Profile details relevant to a job (e.g. name, ratings,
              service area) are shared with the other party to that job so the marketplace can function. We may share
              information where required by law.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>5. Data Retention &amp; Security</h2>
            <p>
              We retain account and job information for as long as your account is active and as needed to meet legal
              obligations. We use industry-standard measures to protect your data, but no system is completely
              secure.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>6. Your Rights</h2>
            <p>
              You can access and update most of your information from your profile. To request a copy of your data or
              ask us to delete your account, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use of the Platform after changes take
              effect constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>8. Contact</h2>
            <p>
              Questions about this Privacy Policy can be sent to{' '}
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
