'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  FiUser, FiSearch, FiMessageSquare, FiCheckCircle,
  FiShield, FiCalendar, FiZap, FiDollarSign,
  FiArrowRight, FiUserCheck, FiUsers,
  FiStar, FiClock, FiMapPin,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface Step { step: number; Icon: IconType; title: string; desc: string; }
interface FlowMap { participant: Step[]; worker: Step[]; }

const flows: FlowMap = {
  participant: [
    { step: 1, Icon: FiUser,          title: 'Create Your Profile', desc: 'Tell us about your support needs, NDIS plan details, and location in minutes.' },
    { step: 2, Icon: FiSearch,        title: 'Search & Browse',     desc: 'Find verified workers filtered by service type, distance, availability, and reviews.' },
    { step: 3, Icon: FiMessageSquare, title: 'Connect & Book',      desc: 'Message workers directly, agree on details, and confirm shifts securely in-app.' },
    { step: 4, Icon: FiCheckCircle,   title: 'Get Support',         desc: 'Your worker arrives, delivers care, and you rate the experience. Simple as that.' },
  ],
  worker: [
    { step: 1, Icon: FiShield,     title: 'Sign Up & Verify',  desc: 'Complete your profile, upload qualifications, and pass our background check.' },
    { step: 2, Icon: FiCalendar,   title: 'Set Your Schedule', desc: 'Choose when and where you work. Full-time, part-time, or emergency shifts — your call.' },
    { step: 3, Icon: FiZap,        title: 'Get Matched',       desc: 'Participants find you via search or Shiftify matches you to urgent nearby requests.' },
    { step: 4, Icon: FiDollarSign, title: 'Deliver & Earn',    desc: 'Complete shifts, get 5-star reviews, and receive fast, secure NDIS-compliant payments.' },
  ],
};

const splashStats = [
  { Icon: FiStar,   value: '4.9/5',  label: 'Average Rating',   color: '#F59E0B' },
  { Icon: FiClock,  value: '<30 min', label: 'Avg. Match Time',  color: '#3B82F6' },
  { Icon: FiUsers,  value: '2,400+', label: 'Verified Workers',  color: '#10B981' },
  { Icon: FiMapPin, value: '50+',    label: 'Cities Covered',    color: '#8B5CF6' },
];

type TabKey = 'participant' | 'worker';

export default function HowItWorksSection() {
  const [tab, setTab] = useState<TabKey>('participant');

  return (
    <section id="how-it-works" className="section-py hiw-section" aria-labelledby="hiw-heading">
      <div className="container-xl">

        <div className="text-center mb-10 fade-up">
          <span className="section-label">How It Works</span>
          <h2 id="hiw-heading" className="section-title">
            Up and Running <span style={{ color: 'var(--clr-primary)' }}>in Minutes</span>
          </h2>
          <p className="section-sub">Two journeys, one simple platform. See how Shiftify works for you.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-10 fade-up">
          <div role="tablist" aria-label="User type" className="hiw-tab-group">
            {([
              { key: 'participant' as TabKey, label: 'I Need Support', Icon: FiUserCheck },
              { key: 'worker'      as TabKey, label: 'I Give Support', Icon: FiUsers    },
            ]).map(({ key, label, Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                aria-controls={`tab-panel-${key}`}
                onClick={() => setTab(key)}
                className={`hiw-tab-btn${tab === key ? ' active' : ''}`}
              >
                <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Steps + Splash */}
        <div className="grid lg:grid-cols-12 gap-4 items-stretch">

          {/* Steps Grid */}
          <div className="lg:col-span-7">
            <div id={`tab-panel-${tab}`} role="tabpanel" aria-label={tab === 'participant' ? 'Participant steps' : 'Worker steps'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flows[tab].map((step) => (
                  <div key={step.step} className="fade-up">
                    <div className="hiw-step-card">
                      <div className="hiw-step-head">
                        <div className="hiw-step-num">{step.step}</div>
                        <div className="hiw-step-icon-wrap">
                          <step.Icon size={20} strokeWidth={2} aria-hidden="true" />
                        </div>
                      </div>
                      <h3 className="hiw-step-title">{step.title}</h3>
                      <p className="hiw-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 fade-up">
                <a
                  href={tab === 'participant' ? '/register' : '/register'}
                  className="btn-shiftify"
                  style={{ padding: '14px 32px', fontSize: 16 }}
                >
                  {tab === 'participant' ? 'Find My Support Now' : 'Join as a Worker'}
                  <FiArrowRight className="ml-2" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Splash Visual */}
          <div className="lg:col-span-5 fade-up">
            <div className="hiw-splash-panel">
              <div className="hiw-blob hiw-blob-1" aria-hidden="true" />
              <div className="hiw-blob hiw-blob-2" aria-hidden="true" />
              <div className="hiw-splash-img-wrap">
                <Image
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80&auto=format&fit=crop"
                  alt="Support worker helping a participant"
                  className="hiw-splash-img"
                  width={600} height={460}
                  loading="lazy"
                />
                <div className="hiw-splash-img-overlay" />
              </div>
              <div className="hiw-stats-grid">
                {splashStats.map(({ Icon, value, label, color }) => (
                  <div key={label} className="hiw-stat-chip">
                    <div className="hiw-stat-icon" style={{ background: `${color}22`, color }}>
                      <Icon size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="hiw-stat-value" style={{ color }}>{value}</div>
                      <div className="hiw-stat-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hiw-splash-badge">
                <FiCheckCircle size={16} color="#10B981" strokeWidth={2.5} />
                <span>NDIS Registered &amp; Verified Platform</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
