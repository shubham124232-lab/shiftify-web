'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { UserStatus } from '@/lib/types';
import type { DevPayment } from '@/lib/types';

interface LivePlan { id: string; name: string; amountAud: number | string; }

// ─── Page ─────────────────────────────────────────────────────────────────────

function CheckoutContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, activeRole, status, activatePlan, error, clearError } = useAuth();

  const planId = searchParams.get('plan') ?? '';
  const addOnIds = (searchParams.get('addOns') ?? '').split(',').filter(Boolean);

  // Redirect if no plan in URL or already active
  useEffect(() => {
    if (!planId) router.replace('/setup/plan');
    if (status === UserStatus.ACTIVE) router.replace('/dashboard');
  }, [planId, status, router]);

  // Plan ids come from the live /subscriptions/plans API (UUIDs), not the
  // hardcoded constants file — fetch the real plan so the summary is accurate.
  const [plan, setPlan] = useState<{ label: string; price: number; period: string } | undefined>(undefined);
  const [addOns, setAddOns] = useState<{ id: string; label: string; price: number }[]>([]);
  useEffect(() => {
    if (!activeRole || !planId) return;
    api.get<{ plans: LivePlan[] }>(`/subscriptions/plans?role=${activeRole}`)
      .then(res => {
        const list = res.plans ?? [];
        const found = list.find(p => p.id === planId);
        if (found) setPlan({ label: found.name, price: Number(found.amountAud), period: '/month' });
        setAddOns(
          list
            .filter((p) => addOnIds.includes(p.id))
            .map((p) => ({ id: p.id, label: p.name, price: Number(p.amountAud) })),
        );
      })
      .catch(() => {});
  }, [activeRole, planId, addOnIds.join(',')]);

  const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);
  const grandTotal = (plan?.price ?? 0) + addOnsTotal;

  // ── State ───────────────────────────────────────────────────────────────────
  const [processing, setProcessing] = useState(false);
  const [activated,  setActivated]  = useState(false);
  const [receipt,    setReceipt]    = useState<DevPayment | null>(null);
  const [cardName,   setCardName]   = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc,    setCardCvc]    = useState('');
  const [cardError,  setCardError]  = useState<string | null>(null);

  function validateCard(): string | null {
    if (!cardName.trim()) return 'Enter the name on the card.';
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(digits)) return 'Enter a valid card number.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) return 'Expiry must be in MM/YY format.';
    if (!/^\d{3,4}$/.test(cardCvc.trim())) return 'Enter a valid CVC.';
    return null;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleActivate() {
    clearError();
    const cardErr = validateCard();
    if (cardErr) { setCardError(cardErr); return; }
    setCardError(null);
    setProcessing(true);
    try {
      const res = await activatePlan(planId, addOnIds);
      setReceipt(res._dev_payment ?? null);
      setActivated(true);
    } finally {
      setProcessing(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (activated) {
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

          {/* Dev receipt — only shown in dev/when _dev_payment present */}
          {receipt && (
            <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 12 }}>
                Dev Receipt
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Plan',    receipt.plan],
                  ['Amount',  `${receipt.currency} $${receipt.amount.toFixed(2)}`],
                  ['Receipt', receipt.receipt],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--clr-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: 'var(--clr-text)', fontFamily: k === 'Receipt' ? 'monospace' : undefined, fontSize: k === 'Receipt' ? 11 : 13 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-shiftify"
            style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700 }}
            onClick={() => router.replace('/setup/profile')}
          >
            Complete Your Profile →
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
        <Link href="/setup/plan" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 700, fontSize: 14 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, width: '100%', maxWidth: 560 }}>

          {/* Plan summary */}
          {plan && (
            <div className="card-shiftify" style={{ padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 12 }}>Plan Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)' }}>{plan.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 2 }}>Billed monthly — cancel anytime</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-primary)' }}>
                    ${plan.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--clr-muted)' }}>AUD{plan.period}</div>
                </div>
              </div>

              {addOns.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {addOns.map((a) => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--clr-text)' }}>+ {a.label}</span>
                      <span style={{ color: 'var(--clr-muted)' }}>${a.price.toFixed(2)}/month</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                    <span style={{ color: 'var(--clr-text)' }}>Total</span>
                    <span style={{ color: 'var(--clr-primary)' }}>${grandTotal.toFixed(2)}/month</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card details (mock — no real gateway yet) */}
          <div className="card-shiftify" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)' }}>Card Details</div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-muted)', display: 'block', marginBottom: 4 }}>Name on card</label>
              <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Jane Smith"
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--clr-border)', padding: '0 12px', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-muted)', display: 'block', marginBottom: 4 }}>Card number</label>
              <input type="text" inputMode="numeric" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242"
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--clr-border)', padding: '0 12px', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-muted)', display: 'block', marginBottom: 4 }}>Expiry (MM/YY)</label>
                <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="08/27"
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--clr-border)', padding: '0 12px', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-muted)', display: 'block', marginBottom: 4 }}>CVC</label>
                <input type="text" inputMode="numeric" value={cardCvc} onChange={e => setCardCvc(e.target.value)} placeholder="123"
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--clr-border)', padding: '0 12px', fontSize: 14, outline: 'none' }} />
              </div>
            </div>
            {cardError && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828' }}>{cardError}</div>
            )}
          </div>

          {/* Activate */}
          <div className="card-shiftify" style={{ padding: 28 }}>
            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <button
              type="button"
              disabled={processing}
              onClick={handleActivate}
              className="btn-shiftify"
              style={{ width: '100%', height: 48, fontSize: 15, fontWeight: 700, opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
            >
              {processing ? 'Activating…' : plan ? `Activate ${plan.label}` : 'Activate Plan'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--clr-muted)', textAlign: 'center', lineHeight: 1.5, marginTop: 14 }}>
              By confirming you agree to our{' '}
              <Link href="/terms" style={{ color: 'var(--clr-primary)', textDecoration: 'none' }}>Terms of Service</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div />}>
      <CheckoutContent />
    </Suspense>
  );
}

