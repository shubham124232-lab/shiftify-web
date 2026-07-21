// components/landing/MarketplaceSection.tsx
'use client';

import { useState } from 'react';

const listings = [
  { type: 'emergency', title: 'Emergency — Personal Care',           location: 'Melbourne, VIC', time: 'Needed ASAP',            rate: '$45/hr', tags: ['Urgent', 'NDIS Funded'],   initials: 'TW', color: '#DC2626', name: 'Thomas W.' },
  { type: 'regular',   title: 'Daily Living Assistance',             location: 'Sydney, NSW',    time: 'Mon–Fri, 9am–1pm',       rate: '$38/hr', tags: ['Ongoing', 'NDIS Funded'],   initials: 'LA', color: '#7C3AED', name: 'Laura A.'  },
  { type: 'regular',   title: 'Overnight Support Worker',            location: 'Brisbane, QLD',  time: 'Fri & Sat nights',       rate: '$52/hr', tags: ['Sleepover', 'Complex Care'], initials: 'MK', color: '#0D9488', name: 'Michael K.' },
  { type: 'emergency', title: 'Emergency — Community Access',        location: 'Perth, WA',      time: 'Today, 2pm–6pm',         rate: '$44/hr', tags: ['Urgent', 'Community'],      initials: 'SR', color: '#DC2626', name: 'Susan R.'  },
  { type: 'regular',   title: 'Disability Transport',                location: 'Adelaide, SA',   time: 'Tue & Thu mornings',     rate: '$35/hr', tags: ['Transport', 'Ongoing'],     initials: 'JP', color: '#C2185B', name: 'James P.'  },
  { type: 'regular',   title: 'Therapy Support — OT',                location: 'Canberra, ACT',  time: 'Flexible schedule',      rate: '$65/hr', tags: ['Allied Health', 'NDIS'],    initials: 'AH', color: '#1D4ED8', name: 'Aisha H.'  },
  { type: 'urgent',    title: 'Urgent — Same-Day Personal Care',     location: 'Newcastle, NSW', time: 'Today, 4pm start',       rate: '$42/hr', tags: ['Urgent', 'Same-Day'],       initials: 'RK', color: '#7C3AED', name: 'Ravi K.'   },
  { type: 'lastmin',   title: 'Last-Min Cancellation — Domestic',    location: 'Geelong, VIC',   time: 'Cancelled · rebook ASAP', rate: '$36/hr', tags: ['Cancellation', 'Rebook'],   initials: 'EN', color: '#EA580C', name: 'Ella N.'   },
] as const;

const filters = [
  { key: 'all',       label: 'All',                     icon: 'bi-grid-fill',              color: '#1A1A2E' },
  { key: 'emergency', label: 'Emergency',                icon: 'bi-lightning-charge-fill',  color: '#DC2626' },
  { key: 'urgent',    label: 'Urgent',                   icon: 'bi-alarm-fill',             color: '#7C3AED' },
  { key: 'lastmin',   label: 'Last-min cancellation',    icon: 'bi-arrow-repeat',           color: '#EA580C' },
] as const;

export default function MarketplaceSection() {
  const [activeFilter, setActiveFilter] = useState<typeof filters[number]['key']>('all');

  return (
    <section id="marketplace" className="section-py market-section-bg" aria-labelledby="market-heading">
      <div className="container-xl">
        <div className="flex items-center justify-center gap-3 mb-4 fade-up">
          <span className="section-label" style={{ marginBottom: 0 }}>Live Marketplace</span>
          <span className="market-live-pill" role="status">
            <span className="dot" aria-hidden="true" />
            Live · updating now
          </span>
        </div>
        <div className="text-center mb-10 fade-up">
          <h2 id="market-heading" className="section-title">Active Shifts &amp; Opportunities</h2>
          <p className="section-sub">Browse real-time support requests posted by participants across Australia.</p>
        </div>

        {/* Search Bar */}
        <div className="fade-up mb-10">
          <div className="market-search-bar">
            <div className="market-search-input">
              <i className="bi bi-search" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search support type, location..."
                aria-label="Search support type or location"
              />
            </div>
            <select aria-label="Filter by service type" className="market-select">
              <option>All Services</option>
              <option>Personal Care</option>
              <option>Daily Living</option>
              <option>Emergency</option>
              <option>Overnight</option>
              <option>Transport</option>
            </select>
            <select aria-label="Filter by state" className="market-select">
              <option>All States</option>
              <option>NSW</option><option>VIC</option><option>QLD</option>
              <option>WA</option><option>SA</option><option>ACT</option>
            </select>
            <button className="btn-shiftify" style={{ fontSize: 14, padding: '11px 26px' }}>Search</button>
          </div>
        </div>

        {/* Urgency Filters */}
        <div className="market-filter-row fade-up mb-6" role="group" aria-label="Filter by urgency">
          {filters.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                className={`market-filter-btn${isActive ? ' active' : ''}`}
                style={{
                  background: isActive ? f.color : `${f.color}14`,
                  borderColor: isActive ? f.color : `${f.color}33`,
                  color: isActive ? '#fff' : f.color,
                }}
                onClick={() => setActiveFilter(f.key)}
              >
                <i className={`bi ${f.icon}`} aria-hidden="true" />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item) => (
            <div
              key={item.title}
              className="fade-up"
              style={{ display: activeFilter === 'all' || item.type === activeFilter ? undefined : 'none' }}
            >
              <div
                className={`market-card${item.type === 'emergency' ? ' emergency' : ''}`}
                role="article"
                tabIndex={0}
                aria-label={`${item.title} in ${item.location}, ${item.time}, ${item.rate}`}
              >
                {item.type === 'emergency' && (
                  <div className="badge-emergency mb-3" role="status">
                    <span style={{ width: 6, height: 6, background: '#B91C1C', borderRadius: '50%', animation: 'blink 1s infinite' }} aria-hidden="true" />
                    Emergency
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="market-avatar-ring" style={{ ...({ '--ring-color': item.color } as React.CSSProperties) }}>
                      <div className="worker-avatar" style={{ background: item.color }}>{item.initials}</div>
                    </div>
                    <div>
                      <div className="market-name">{item.name}</div>
                      <div className="market-location">
                        <i className="bi bi-geo-alt" aria-hidden="true" />{item.location}
                      </div>
                    </div>
                  </div>
                  <div className="market-rate-pill" style={{ background: `${item.color}14`, color: item.color }}>
                    <div className="market-rate">{item.rate}</div>
                    <div className="market-rate-label">NDIS Rate</div>
                  </div>
                </div>
                <h3 className="market-title">{item.title}</h3>
                <p className="market-time">
                  <i className="bi bi-clock" aria-hidden="true" />{item.time}
                </p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {item.tags.map((tag) => (
                    <span key={tag} className={`market-tag${tag === 'Urgent' ? ' urgent' : ''}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  className={`w-full mt-auto ${item.type === 'emergency' ? 'btn-emergency' : 'btn-shiftify'}`}
                  style={{ fontSize: 13, padding: '10px 0', justifyContent: 'center' }}
                  aria-label={`Apply for ${item.title}`}
                >
                  {item.type === 'emergency'
                    ? <><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />Respond Now</>
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
