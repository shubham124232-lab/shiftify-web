'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';

const testimonials = [
  { name: 'Deborah M.', role: 'NDIS Participant · Melbourne, VIC', initials: 'DM', color: '#C2185B', stars: 5, tag: 'Emergency Support',  quote: "My carer cancelled at 9pm and I panicked. Within 6 minutes of posting on Shiftify, a verified worker confirmed. Honestly a lifesaver — I don't know what I would have done without this platform." },
  { name: 'Rachel T.',  role: 'Support Worker · Sydney, NSW',      initials: 'RT', color: '#7C3AED', stars: 5, tag: 'Worker Experience',  quote: "I went from zero clients to full-time hours in 3 weeks. The platform is so professional and NDIS-compliant invoicing has saved me hours every week. I've referred 4 of my colleagues already." },
  { name: 'James & Patricia O.', role: 'Carers of NDIS Participant · Brisbane, QLD', initials: 'JP', color: '#0D9488', stars: 5, tag: 'Family Carers', quote: "We care for our son who has complex needs. Shiftify gives us peace of mind — we can see worker credentials, ratings, and insurance upfront. The emergency feature has saved us multiple times." },
  { name: 'Sandra K.', role: 'Support Coordinator · Perth, WA',    initials: 'SK', color: '#1D4ED8', stars: 5, tag: 'Coordinator',       quote: "I coordinate support for 40+ participants. Shiftify's multi-participant dashboard has cut my admin time by 60%. When a gap appears, I fill it in minutes — not days." },
] as const;

const stats = [
  { num: '47,000+', label: 'Shifts Completed' },
  { num: '8,200+',  label: 'Verified Workers' },
  { num: '12,400+', label: 'Participants'      },
  { num: '4.9 / 5', label: 'Platform Rating'  },
  { num: '<4 min',  label: 'Emergency Match'  },
  { num: '$2.1M+',  label: 'Worker Earnings'  },
] as const;

export default function TestimonialsSection() {
  const [active, setActive]   = useState(0);
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = testimonials.length;

  const goTo = useCallback((idx: number, dir: 'next' | 'prev' = 'next') => {
    setAnimDir(dir);
    setActive(((idx % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(active + 1, 'next'), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, 'prev'), [active, goTo]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setAnimDir('next');
      setActive((i) => (i + 1) % count);
    }, 5200);
  }, [count]);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer]);

  const t = testimonials[active];

  return (
    <section id="testimonials" className="section-py testi-section" aria-labelledby="testi-heading">
      <div className="container-xl">

        {/* Stats row */}
        <div className="testi-stats-row fade-up">
          {stats.map(({ num, label }) => (
            <div key={label} className="testi-stat">
              <div className="testi-stat-num">{num}</div>
              <div className="testi-stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-10 fade-up">
          <span className="section-label">Testimonials</span>
          <h2 id="testi-heading" className="section-title">
            Real People, <span style={{ color: 'var(--clr-primary)' }}>Real Support</span>
          </h2>
          <p className="section-sub">Thousands of Australians trust Shiftify every day for critical disability support.</p>
        </div>

        {/* Slider */}
        <div
          className="testi-slider-wrap fade-up"
          onMouseEnter={stopTimer}
          onMouseLeave={startTimer}
          aria-roledescription="carousel"
          aria-label="Testimonials carousel"
        >
          <button className="testi-nav" onClick={prev} aria-label="Previous testimonial">
            <FiChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <div className="testi-card-area" aria-live="polite" aria-atomic="true">
            <div key={active} className={`testi-card-v2 testi-in-${animDir}`}>
              <div className="testi-card-top">
                <span className="testi-tag" style={{ background: `${t.color}18`, color: t.color, borderColor: `${t.color}30` }}>
                  {t.tag}
                </span>
                <div className="testi-stars" aria-label={`${t.stars} out of 5 stars`}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <FiStar key={i} size={16} fill="#F59E0B" color="#F59E0B" strokeWidth={0} aria-hidden="true" />
                  ))}
                </div>
              </div>

              <div className="testi-quote-mark" aria-hidden="true" style={{ color: `${t.color}25` }}>&ldquo;</div>
              <blockquote className="testi-quote-text">{t.quote}</blockquote>
              <div className="testi-divider" style={{ background: `linear-gradient(90deg, ${t.color}40, transparent)` }} />

              <div className="testi-person">
                <div className="testi-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }} aria-hidden="true">
                  {t.initials}
                </div>
                <div>
                  <div className="testi-person-name">{t.name}</div>
                  <div className="testi-person-role">{t.role}</div>
                </div>
                <div className="testi-verified ml-auto">
                  <i className="bi bi-patch-check-fill" aria-hidden="true" style={{ color: '#10B981' }} />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>

          <button className="testi-nav" onClick={next} aria-label="Next testimonial">
            <FiChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Dots */}
        <div className="testi-dots" role="tablist" aria-label="Testimonial slides">
          {testimonials.map((ti, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to testimonial ${i + 1} — ${ti.name}`}
              className={`testi-dot${i === active ? ' active' : ''}`}
              style={i === active ? { background: t.color, width: 28 } : {}}
              onClick={() => goTo(i, i > active ? 'next' : 'prev')}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
