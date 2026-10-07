/* Native <details> so the accordion works with keyboard, screen readers and
   with JavaScript switched off. */

interface Faq { q: string; a: string }

const faqs: Faq[] = [
  {
    q: 'Is Shiftify operated or approved by the NDIA or NDIS?',
    a: 'No. Shiftify is independent and is not operated, endorsed or approved by the NDIA or the NDIS. We are a technology platform that connects participants, support coordinators, providers and support workers. We do not deliver support ourselves, and each provider’s registration status is shown on their own profile.',
  },
  {
    q: 'What do support workers submit before they can accept shifts?',
    a: 'Workers submit their Worker Screening Check, a National Police Check, First Aid and CPR certificates, and insurance details. Expiry dates are tracked, and an expired document counts as not submitted. Shiftify does not guarantee the accuracy of submitted documents, so review each profile and make your own checks.',
  },
  {
    q: 'Can I use Shiftify with my plan type?',
    a: 'Yes — self-managed and plan-managed participants can book directly. Agency-managed participants can browse and connect with registered providers only, and your coordinator can arrange bookings on your behalf. Eligibility depends on your individual plan and the applicable rules.',
  },
  {
    q: 'Who sets the rates?',
    a: 'Rates are agreed between the people involved, not set by Shiftify. If you are using plan funding, check that a rate fits your plan and the applicable price limits. Funding eligibility depends on your individual plan and the applicable rules.',
  },
  {
    q: 'What does Shiftify cost?',
    a: 'Participants do not pay to use Shiftify. Support Workers, Support Coordinators and Providers each get 10 introductory actions, then choose a subscription or pass — see Pricing for the costs. Shiftify charges 0% commission per shift; subscription, pass and any optional add-on fees are separate.',
  },
  {
    q: 'What happens if a worker cancels?',
    a: 'A cancelled shift can be re-posted as a Rapid request in one tap. Eligible workers on live availability nearby may be alerted, and you review the responses and confirm a replacement yourself. A post does not guarantee a response or cover.',
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="sf-section sf-faq" aria-labelledby="sf-faq-heading">
      <div className="sf-wrap">

        <div className="sf-faq-grid">

          <div className="sf-faq-intro">
            <span className="sf-eyebrow">Questions, answered</span>
            <h2 id="sf-faq-heading" className="sf-h2">Before you sign up.</h2>
            <p className="sf-lede">
              The things people ask us most. Still unsure about something?
            </p>
            <a href="/contact" className="sf-btn sf-btn-outline">
              Talk to our team
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>
          </div>

          <div className="sf-faq-list">
            {faqs.map((f, i) => (
              <details key={f.q} className="sf-faq-item" open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <i className="bi bi-plus-lg" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
