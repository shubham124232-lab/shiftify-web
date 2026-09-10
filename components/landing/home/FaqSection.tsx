/* Native <details> so the accordion works with keyboard, screen readers and
   with JavaScript switched off. */

interface Faq { q: string; a: string }

const faqs: Faq[] = [
  {
    q: 'Is Shiftify an NDIS registered provider?',
    a: 'Shiftify is a marketplace, not a service provider. We connect you with registered providers and independent support workers, and we show each one’s registration status on their profile so you always know who you are booking.',
  },
  {
    q: 'How do you check that a support worker is safe?',
    a: 'Before a profile goes live we verify the NDIS Worker Screening Check, a National Police Check, First Aid and CPR certificates, and insurance cover. Expiry dates are tracked, and a worker is taken off the board the day a document lapses.',
  },
  {
    q: 'Can I use Shiftify with my plan type?',
    a: 'Yes — self-managed and plan-managed participants can book directly. Agency-managed participants can browse and connect with registered providers only, and your coordinator can arrange bookings on your behalf.',
  },
  {
    q: 'Are the rates within the NDIS Price Guide?',
    a: 'Every rate shown on the board sits at or below the current NDIS Pricing Arrangements and Price Limits for that support item. Rates for evenings, weekends and public holidays follow the same guide.',
  },
  {
    q: 'What does Shiftify cost?',
    a: 'Participants are always free — no plan step and no payment step. Support Workers, Support Coordinators and Providers each get 10 introductory actions free, then choose a subscription. There is 0% commission per shift, so workers keep 100% of their pay.',
  },
  {
    q: 'What happens if a worker cancels?',
    a: 'Cancelled shifts convert into a Rapid request in one tap. Every eligible worker on live availability nearby is alerted straight away, and you can compare and confirm a replacement from the same screen.',
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
