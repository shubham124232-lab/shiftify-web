interface Story { tag: string; quote: string; who: string }

/* SAMPLE copy, taken from the design mock — not yet approved testimonials.
   Swap each quote/who for a real, consented one before launch. */
const stories: Story[] = [
  {
    tag: 'Participant',
    quote: 'I found support that fits my routine—and I stayed in control of the choice.',
    who: 'Sarah · VIC',
  },
  {
    tag: 'Support Worker',
    quote: 'Shiftify makes it easier to find opportunities that match my skills and availability.',
    who: 'Daniel · NSW',
  },
  {
    tag: 'Provider',
    quote: 'We can connect with the right people without losing the human side of support.',
    who: 'Amelia · QLD',
  },
];

const assurances = [
  { icon: 'bi-people-fill',            label: 'Verified community stories' },
  { icon: 'bi-geo-alt-fill',           label: 'Australia-wide connections' },
  { icon: 'bi-heart-fill',             label: 'Support built around choice' },
];

function Avatar() {
  return (
    <span className="sf-story-avatar" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6">
        <circle cx="32" cy="24" r="10" />
        <path d="M13 53c0-10.5 8.5-17 19-17s19 6.5 19 17" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function CommunityStoriesSection() {
  return (
    <section id="stories" className="sf-section sf-stories" aria-labelledby="sf-stories-heading">
      <div className="sf-wrap">

        <div className="sf-stories-head">
          <span className="sf-eyebrow">Community stories</span>
          <h2 id="sf-stories-heading" className="sf-h2">Real experiences. Meaningful connections.</h2>
          <p className="sf-lede">Hear from people who use Shiftify to find, coordinate and deliver support.</p>
        </div>

        <div className="sf-stories-grid">
          {stories.map((s) => (
            <article key={s.tag} className="sf-story-card">
              <span className="sf-story-quote" aria-hidden="true">&ldquo;</span>
              <span className="sf-story-avatar-ring"><Avatar /></span>
              <span className="sf-story-tag">{s.tag}</span>
              <p className="sf-story-text">&ldquo;{s.quote}&rdquo;</p>
              <span className="sf-story-rule" aria-hidden="true" />
              <p className="sf-story-who">{s.who}</p>
            </article>
          ))}
        </div>

        <ul className="sf-stories-bar">
          {assurances.map((a) => (
            <li key={a.label}>
              <span className="sf-stories-bar-ico"><i className={`bi ${a.icon}`} aria-hidden="true" /></span>
              {a.label}
            </li>
          ))}
        </ul>

        <a href="/stories" className="sf-story-all">
          Read community stories
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </a>

      </div>
    </section>
  );
}
