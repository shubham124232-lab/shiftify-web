'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getPlan } from '@/lib/constants/plans';
import { UserStatus } from '@/lib/types';
import type { DevPayment } from '@/lib/types';

// ─── Card number formatter ────────────────────────────────────────────────────
function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, activeRole, status, activatePlan, error, clearError } = useAuth();

  const planId = searchParams.get('plan') ?? '';

  // Redirect if no plan in URL or already active
  useEffect(() => {
    if (!planId) router.replace('/payment');
    if (status === UserStatus.ACTIVE) router.replace('/dashboard');
  }, [planId, status, router]);

  const plan = activeRole ? getPlan(activeRole, planId) : undefined;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [cardNumber,  setCardNumber]  = useState('');
  const [expiry,      setExpiry]      = useState('');
  const [cvv,         setCvv]         = useState('');
  const [cardName,    setCardName]    = useState('');
  const [processing,  setProcessing]  = useState(false);
  const [receipt,     setReceipt]     = useState<DevPayment | null>(null);

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handlePay(e: FormEvent) {
    e.preventDefault();
    clearError();
    setProcessing(true);
    try {
      const res = await activatePlan(planId);
      setReceipt(res._dev_payment ?? null);
    } finally {
      setProcessing(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div className="card-shiftify" style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 32, color: '#16a34a' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--clr-text)', marginBottom: 8 }}>
            Payment Successful
          </h1>
          <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28 }}>
            Your {plan?.label} plan is now active. Welcome to Shiftify!
          </p>

          {/* Dev receipt */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 12 }}>
              Dev Receipt
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Plan',     receipt.plan],
                ['Amount',   `${receipt.currency} $${receipt.amount.toFixed(2)}`],
                ['Receipt',  receipt.receipt],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--clr-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--clr-text)', fontFamily: k === 'Receipt' ? 'monospace' : undefined, fontSize: k === 'Receipt' ? 11 : 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-shiftify"
            style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700 }}
            onClick={() => router.replace('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Checkout form ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--clr-border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 99 }}>
        <Link href="/payment" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 700, fontSize: 14 }}>
          <i className="bi bi-arrow-left" style={{ fontSize: 16 }} />
          Back to plans
        </Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--clr-primary)' }}>Shiftify</span>
        </div>
        {/* Secure badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--clr-muted)' }}>
          <i className="bi bi-lock-fill" style={{ color: '#16a34a' }} />
          Secure checkout
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>

        {/* Test-mode banner */}
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '10px 18px', maxWidth: 560, width: '100%', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bi bi-lightning-charge-fill" style={{ color: '#ca8a04', fontSize: 16 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#854d0e' }}>
            Test mode — no real charge will be made. Use any card details.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, width: '100%', maxWidth: 560 }}>

          {/* Order summary */}
          {plan && (
            <div className="card-shiftify" style={{ padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 12 }}>Order Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)' }}>{plan.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 2 }}>14-day free trial, then billed monthly</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-primary)' }}>
                    ${plan.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--clr-muted)' }}>AUD{plan.period}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--clr-muted)' }}>Due today</span>
                <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>$0.00 (free trial)</span>
              </div>
            </div>
          )}

          {/* Card form */}
          <div className="card-shiftify" style={{ padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 20 }}>Payment details</div>

            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Cardholder name */}
              <div>
                <label style={labelStyle}>Name on card</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  style={inputStyle}
                  autoComplete="cc-name"
                />
              </div>

              {/* Card number */}
              <div>
                <label style={labelStyle}>Card number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    style={{ ...inputStyle, paddingRight: 48 }}
                    autoComplete="cc-number"
                  />
                  <i className="bi bi-credit-card" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)', fontSize: 16 }} />
                </div>
              </div>

              {/* Expiry + CVV */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Expiry</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    style={inputStyle}
                    autoComplete="cc-exp"
                  />
                </div>
                <div>
                  <label style={labelStyle}>CVV</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={inputStyle}
                    autoComplete="cc-csc"
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="btn-shiftify"
                style={{ height: 48, fontSize: 15, fontWeight: 700, marginTop: 4, opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
              >
                {processing
                  ? 'Processing…'
                  : plan
                  ? `Start Free Trial — ${plan.label}`
                  : 'Start Free Trial'}
              </button>

              <p style={{ fontSize: 11, color: 'var(--clr-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                By confirming you agree to our{' '}
                <Link href="/terms" style={{ color: 'var(--clr-primary)', textDecoration: 'none' }}>Terms</Link>{' '}
                and authorise Shiftify to charge your card after the trial ends. Cancel anytime.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px',
  borderRadius: 'var(--btn-radius)',
  border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--clr-text)', marginBottom: 6,
};
