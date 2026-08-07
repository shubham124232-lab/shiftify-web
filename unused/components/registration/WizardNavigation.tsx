'use client';

interface Props {
  currentStep:  number;
  totalSteps:   number;
  isFinal:      boolean;
  saving:       boolean;
  onBack:       () => void;
  onNext:       () => void;
  lastSavedAt:  string | null;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  isFinal,
  saving,
  onBack,
  onNext,
  lastSavedAt,
}: Props) {
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div style={{ marginTop: 32 }}>
      {/* Progress bar */}
      <div style={{
        height: 4, borderRadius: 4,
        background: 'var(--clr-surface)',
        marginBottom: 16, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width:  `${progress}%`,
          background: 'var(--clr-primary)',
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0 || saving}
          style={{
            height: 42, padding: '0 20px', borderRadius: 'var(--btn-radius)',
            border: '1.5px solid var(--clr-border)', background: '#fff',
            fontSize: 14, fontWeight: 600, color: 'var(--clr-text)',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 ? 0.4 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <i className="bi bi-arrow-left" />
          Back
        </button>

        {/* Auto-save hint */}
        {lastSavedAt && (
          <span style={{ fontSize: 11, color: 'var(--clr-muted)', flex: 1, textAlign: 'center' }}>
            <i className="bi bi-cloud-check" style={{ color: '#22c55e', marginRight: 4 }} />
            Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Next / Finish */}
        <button
          type="submit"
          disabled={saving}
          className="btn-shiftify"
          style={{
            height: 42, padding: '0 24px',
            fontSize: 14, fontWeight: 700,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {saving ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Saving…
            </>
          ) : isFinal ? (
            <>Complete Profile <i className="bi bi-check2-circle" /></>
          ) : (
            <>Save &amp; Continue <i className="bi bi-arrow-right" /></>
          )}
        </button>
      </div>
    </div>
  );
}
