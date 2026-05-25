// components/landing/MarketplaceSection.tsx
const listings = [
  { type: 'emergency', title: 'Emergency — Personal Care',     location: 'Melbourne, VIC', time: 'Needed ASAP',          rate: '$45/hr', tags: ['Urgent', 'NDIS Funded'], initials: 'TW', color: '#DC2626', name: 'Thomas W.' },
  { type: 'regular',   title: 'Daily Living Assistance',       location: 'Sydney, NSW',    time: 'Mon–Fri, 9am–1pm',    rate: '$38/hr', tags: ['Ongoing', 'NDIS Funded'], initials: 'LA', color: '#7C3AED', name: 'Laura A.'  },
  { type: 'regular',   title: 'Overnight Support Worker',      location: 'Brisbane, QLD',  time: 'Fri & Sat nights',    rate: '$52/hr', tags: ['Sleepover', 'Complex Care'], initials: 'MK', color: '#0D9488', name: 'Michael K.' },
  { type: 'emergency', title: 'Emergency — Community Access',  location: 'Perth, WA',      time: 'Today, 2pm–6pm',      rate: '$44/hr', tags: ['Urgent', 'Community'],   initials: 'SR', color: '#DC2626', name: 'Susan R.'  },
  { type: 'regular',   title: 'Disability Transport',          location: 'Adelaide, SA',   time: 'Tue & Thu mornings',  rate: '$35/hr', tags: ['Transport', 'Ongoing'],  initials: 'JP', color: '#C2185B', name: 'James P.'  },
  { type: 'regular',   title: 'Therapy Support — OT',          location: 'Canberra, ACT',  time: 'Flexible schedule',   rate: '$65/hr', tags: ['Allied Health', 'NDIS'], initials: 'AH', color: '#1D4ED8', name: 'Aisha H.'  },
] as const;

export default function MarketplaceSection() {
  return (
    <section id="marketplace" className="section-py bg-gray-soft" aria-labelledby="market-heading">
      <div className="container-xl">
        <div className="text-center mb-10 fade-up">
          <span className="section-label">Live Marketplace</span>
          <h2 id="market-heading" className="section-title">Active Shifts &amp; Opportunities</h2>
          <p className="section-sub">Browse real-time support requests posted by participants across Australia.</p>
        </div>

        {/* Search Bar */}
        <div className="fade-up mb-10">
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--clr-border)', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
              <i className="bi bi-search" style={{ color: 'var(--clr-muted)', fontSize: 16 }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search support type, location..."
                aria-label="Search support type or location"
                style={{ border: 'none', outline: 'none', fontSize: 14, color: 'var(--clr-text)', background: 'transparent', width: '100%', fontFamily: 'var(--font-body)' }}
              />
            </div>
            <select aria-label="Filter by service type" style={{ border: '1.5px solid var(--clr-border)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', fontFamily: 'var(--font-body)', background: 'var(--clr-surface)' }}>
              <option>All Services</option>
              <option>Personal Care</option>
              <option>Daily Living</option>
              <option>Emergency</option>
              <option>Overnight</option>
              <option>Transport</option>
            </select>
            <select aria-label="Filter by state" style={{ border: '1.5px solid var(--clr-border)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', fontFamily: 'var(--font-body)', background: 'var(--clr-surface)' }}>
              <option>All States</option>
              <option>NSW</option><option>VIC</option><option>QLD</option>
              <option>WA</option><option>SA</option><option>ACT</option>
            </select>
            <button className="btn-shiftify" style={{ fontSize: 14, padding: '9px 22px' }}>Search</button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item) => (
            <div key={item.title} className="fade-up">
              <div className="card-shiftify" style={{ cursor: 'pointer' }} role="article" tabIndex={0} aria-label={`${item.title} in ${item.location}, ${item.time}, ${item.rate}`}>
                {item.type === 'emergency' && (
                  <div className="badge-emergency mb-3" role="status">
                    <span style={{ width: 6, height: 6, background: '#B91C1C', borderRadius: '50%', animation: 'blink 1s infinite' }} aria-hidden="true" />
                    Emergency
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="worker-avatar" style={{ background: item.color, width: 42, height: 42, fontSize: 14 }}>{item.initials}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-muted)' }}>
                      <i className="bi bi-geo-alt mr-1" aria-hidden="true" />{item.location}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--clr-primary)' }}>{item.rate}</div>
                    <div style={{ fontSize: 11, color: 'var(--clr-muted)' }}>NDIS Rate</div>
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--clr-muted)', marginBottom: 14 }}>
                  <i className="bi bi-clock mr-1" aria-hidden="true" />{item.time}
                </p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {item.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', background: tag === 'Urgent' ? '#FEE2E2' : 'var(--clr-primary-xlight)', color: tag === 'Urgent' ? '#B91C1C' : 'var(--clr-primary)', borderRadius: 100, border: `1px solid ${tag === 'Urgent' ? '#FECACA' : 'var(--clr-primary-light)'}` }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  className={`w-full ${item.type === 'emergency' ? 'btn-emergency' : 'btn-shiftify'}`}
                  style={{ fontSize: 13, padding: '10px 0', justifyContent: 'center' }}
                  aria-label={`Apply for ${item.title}`}
                >
                  {item.type === 'emergency'
                    ? <><span className="dot" aria-hidden="true" />Respond Now</>
                    : 'Apply for Shift'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 fade-up">
          <a href="/marketplace" className="btn-outline-shiftify">
            View All Listings <i className="bi bi-arrow-right ml-2" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
