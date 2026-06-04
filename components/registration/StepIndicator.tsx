'use client';

import type { StepConfig } from '@/lib/registration/types';

interface Props {
  steps:        StepConfig[];
  currentStep:  number;
  savedSteps:   number[];
}

export function StepIndicator({ steps, currentStep, savedSteps }: Props) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 8 }}>
      {/* Mobile: numbered pills in a row */}
      <div className="step-pills" style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', minWidth: 'max-content', margin: '0 auto' }}>
        {steps.map((step, i) => {
          const done    = savedSteps.includes(i);
          const active  = i === currentStep;
          const future  = i > currentStep && !done;

          return (
            <div key={step.index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                title={step.title}
                style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: done
                    ? '#22c55e'
                    : active
                    ? 'var(--clr-primary)'
                    : future
                    ? 'var(--clr-surface)'
                    : 'var(--clr-border)',
                  color: done || active ? '#fff' : 'var(--clr-muted)',
                  border: active ? '2px solid var(--clr-primary)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
              >
                {done ? <i className="bi bi-check-lg" style={{ fontSize: 12 }} /> : i + 1}
              </div>

              {/* Connector line between steps */}
              {i < steps.length - 1 && (
                <div style={{
                  width: 20, height: 2,
                  background: done ? '#22c55e' : 'var(--clr-border)',
                  borderRadius: 2,
                  transition: 'background 0.2s ease',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Active step label */}
      <p style={{
        textAlign: 'center', fontSize: 11, color: 'var(--clr-muted)',
        marginTop: 8, marginBottom: 0,
      }}>
        Step {currentStep + 1} of {steps.length} — <strong style={{ color: 'var(--clr-text)' }}>{steps[currentStep]?.title}</strong>
      </p>
    </div>
  );
}
