// components/landing/DispatchEngineSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { FiBell, FiRadio, FiMessageCircle, FiCheckCircle, FiArrowRight, FiMapPin } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface Step {
  key: string;
  tag: string;
  title: string;
  desc: string;
  Icon: IconType;
  color: string;
  glow: string;
  rightTag: string;
  rightTitle: string;
  rightSub: string;
  progress: number;
}

const steps: Step[] = [
  {
    key: 'signal', tag: 'POST', title: 'Signal', Icon: FiBell,
    desc: 'Participant, coordinator or provider posts a shift, request or cancellation. Workers post live availability.',
    color: '#F87171', glow: 'rgba(239,68,68,0.45)',
    rightTag: '01 · SIGNAL', rightTitle: 'New signal received', rightSub: 'Broadcasting to eligible workers nearby', progress: 25,
  },
  {
    key: 'dispatch', tag: 'SCORE', title: 'Dispatch', Icon: FiRadio,
    desc: 'Hard filters (service, radius, delivery mode) plus scoring by urgency, overlap quality and response history.',
    color: '#FBBF24', glow: 'rgba(245,158,11,0.45)',
    rightTag: '02 · DISPATCH', rightTitle: 'Scoring & shortlisting', rightSub: 'Ranking by proximity, skills and response history', progress: 50,
  },
  {
    key: 'match', tag: 'THREAD', title: 'Match', Icon: FiMessageCircle,
    desc: 'Threads open per shift. Participants confirm directly or coordinators confirm on behalf.',
    color: '#F472B6', glow: 'rgba(236,72,153,0.45)',
    rightTag: '03 · MATCH', rightTitle: 'Thread opened', rightSub: 'Worker and participant confirming details live', progress: 75,
  },
  {
    key: 'confirm', tag: 'SYNC', title: 'Confirm', Icon: FiCheckCircle,
    desc: 'Requested → Proposed → Confirmed → Completed. All parties stay in sync with live status.',
    color: '#34D399', glow: 'rgba(16,185,129,0.45)',
    rightTag: '04 · CONFIRMED', rightTitle: 'Booking locked', rightSub: 'Everyone in the thread sees status live', progress: 100,
  },
];

const CYCLE_MS = 3200;

export default function DispatchEngineSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % steps.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const active = steps[activeIdx];

  return (
    <section id="dispatch-engine" className="section-py dispatch-engine-bg" aria-labelledby="de-heading">
      <div className="container-xl">
        <div className="de-frame fade-up">
          <div className="de-frame-inner">

            {/* window chrome bar */}
            <div className="de-chrome">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="dispatch-dot" style={{ background: '#F87171' }} />
                  <span className="dispatch-dot" style={{ background: '#FBBF24' }} />
                  <span className="dispatch-dot" style={{ background: '#34D399' }} />
                </div>
                <span className="de-chrome-label">Dispatch Engine · Live</span>
              </div>
              <span className="de-live-dot-badge">
                <span className="de-live-dot" aria-hidden="true" />
                Live
              </span>
            </div>

            <div className="de-body">
              <div className="flex justify-end mb-6">
                <a href="#how-it-works" className="de-workflow-btn">
                  Full workflow <FiArrowRight size={14} aria-hidden="true" />
                </a>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-stretch">

                {/* Left: heading + timeline + step cards */}
                <div className="lg:col-span-7">
                  <h2 id="de-heading" className="de-heading">
                    Signal <span className="de-arrow">→</span> <em className="de-match-word">match</em> <span className="de-arrow">→</span> confirm.
                  </h2>
                  <p className="de-sub mb-8">
                    Every urgency lane runs on the same four-beat state machine. No screens to
                    learn — just the next action, surfaced when it matters.
                  </p>

                  <div className="de-timeline">
                    <span className="de-timeline-pulse" aria-hidden="true" />
                    {steps.map((s, idx) => (
                      <div
                        key={s.key}
                        className={`de-node${idx === activeIdx ? ' active' : ''}`}
                        style={{ background: s.color, boxShadow: idx === activeIdx ? `0 0 0 8px ${s.glow}` : 'none' }}
                      >
                        <s.Icon size={16} color="#fff" aria-hidden="true" />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                    {steps.map((s, idx) => (
                      <div
                        key={s.key}
                        className={`de-step-card${idx === activeIdx ? ' active' : ''}`}
                        style={{ ...({ '--step-glow': s.glow } as React.CSSProperties) }}
                      >
                        <div className="de-step-topbar" style={{ background: s.color }} aria-hidden="true" />
                        <div className="flex items-center justify-between mb-2">
                          <span className="de-step-num">STEP 0{idx + 1}</span>
                          <span className="de-step-tag" style={{ color: s.color }}>{s.tag}</span>
                        </div>
                        <h3 className="de-step-title">{s.title}</h3>
                        <p className="de-step-desc">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: live status panel, synced to active step */}
                <div className="lg:col-span-5 h-full">
                  <div className="de-status-panel h-full" style={{ ...({ '--panel-glow': active.glow } as React.CSSProperties) }}>
                    <div className="de-status-header">
                      <span className="de-status-tag" style={{ background: `${active.color}22`, color: active.color }}>
                        <span className="dot" style={{ background: active.color }} aria-hidden="true" />
                        {active.rightTag}
                      </span>
                      <span className="de-live-badge">Autoplay</span>
                    </div>

                    <div className="de-radar-wrap">
                      <div className="de-radar-ring r1" style={{ borderColor: active.color }} />
                      <div className="de-radar-ring r2" style={{ borderColor: active.color }} />
                      <div className="de-radar-ring r3" style={{ borderColor: active.color }} />
                      <div className="de-radar-core" style={{ background: active.color, boxShadow: `0 0 60px 12px ${active.glow}` }} />
                    </div>

                    <div className="de-status-body">
                      <h3 className="de-status-title">{active.rightTitle}</h3>
                      <p className="de-status-sub">{active.rightSub}</p>
                    </div>

                    <div className="de-progress-track">
                      <div className="de-progress-fill" style={{ width: `${active.progress}%`, background: active.color }} />
                    </div>

                    <div className="de-status-footer">
                      <span><FiRadio size={12} aria-hidden="true" /> shift.thread/live</span>
                      <span><FiMapPin size={12} aria-hidden="true" /> Parramatta, NSW</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
