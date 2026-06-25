'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Plan {
  id:       string;
  label:    string;
  price:    number;
  period:   string;
  features: string[];
  popular?: boolean;
  isAddOn:  boolean;
}

export default function SetupPlanPage() {
  const router = useRouter();
  const { activeRole, logout } = useAuth();

  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [basePlanId, setBasePlanId] = useState<string | null>(null);
  const [addOnIds,   setAddOnIds]   = useState<string[]>([]);

  useEffect(() => {
    if (!activeRole) return;
    api.get<{ plans: any[] }>(`/subscriptions/plans?role=${activeRole}`)
      .then(res => setPlans(
        (res.plans ?? []).map((p) => ({
          id:       p.id,
          label:    p.name,
          price:    Number(p.amountAud),
          period:   '/mo',
          features: Array.isArray(p.features) ? p.features : [],
          popular:  p.popular ?? false,
          isAddOn:  p.isAddOn ?? false,
        }))
      ))
      .catch(() => setError('Failed to load plans. Please refresh.'))
      .finally(() => setLoading(false));
  }, [activeRole]);

  const basePlans = plans.filter((p) => !p.isAddOn);
  const addOnPlans = plans.filter((p) => p.isAddOn);

  function toggleAddOn(id: string) {
    setAddOnIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleContinue() {
    if (!basePlanId) return;
    const params = new URLSearchParams({ plan: basePlanId });
    if (addOnIds.length > 0) params.set('addOns', addOnIds.join(','));
    router.push(`/payment/checkout?${params.toString()}`);
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--clr-border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 99 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-heart-pulse-fill" style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--clr-primary)', letterSpacing: -0.5 }}>Shiftify</span>
        </Link>

        {/* Steps */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {['Verify phone', 'Choose plan', 'Activate'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? '#22c55e' : i === 1 ? 'var(--clr-primary)' : 'var(--clr-border)',
                  color: i <= 1 ? '#fff' : 'var(--clr-muted)',
                }}>
                  {i === 0 ? <i className="bi bi-check-lg" style={{ fontSize: 12 }} /> : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: i === 1 ? 'var(--clr-text)' : 'var(--clr-muted)', display: 'none' /* hide on mobile, but fine for desktop */ }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div style={{ width: 24, height: 1, background: 'var(--clr-border)' }} />}
            </div>
          ))}
        </div>

        <button onClick={handleLogout} style={{ fontSize: 13, color: 'var(--clr-muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      {/* Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, textAlign: 'center', marginBottom: 8 }}>
          Choose your plan
        </h1>
        <p style={{ fontSize: 14, color: 'var(--clr-muted)', textAlign: 'center', marginBottom: 40 }}>
          All plans include a 14-day free trial. Cancel anytime.
        </p>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--clr-muted)', fontSize: 14 }}>
            <div style={{ width: 18, height: 18, border: '2px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading plans…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#C62828', maxWidth: 480, width: '100%', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Base plan cards — pick exactly one */}
        {!loading && basePlans.length > 0 && (
          <div style={{ width: '100%', maxWidth: 860 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {basePlans.map((plan) => {
                const selected = basePlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    role="button"
                    onClick={() => setBasePlanId(plan.id)}
                    className="card-shiftify"
                    style={{ position: 'relative', padding: 28, cursor: 'pointer', border: selected ? '2px solid var(--clr-primary)' : plan.popular ? '2px solid var(--clr-primary)' : undefined, overflow: 'hidden' }}
                  >
                    {plan.popular && !selected && (
                      <div style={{ position: 'absolute', top: 14, right: 14, background: 'var(--clr-primary)', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 100, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Most Popular
                      </div>
                    )}
                    {selected && (
                      <div style={{ position: 'absolute', top: 14, right: 14, color: 'var(--clr-primary)', fontSize: 20 }}>
                        <i className="bi bi-check-circle-fill" />
                      </div>
                    )}

                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 6 }}>{plan.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: selected || plan.popular ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                        ${plan.price.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--clr-muted)' }}>{plan.period}</span>
                    </div>

                    {!!plan.features.length && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {plan.features.map((f) => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--clr-text)' }}>
                            <i className="bi bi-check-circle-fill" style={{ color: 'var(--clr-primary)', fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add-ons — stack any number on top of the base plan */}
            {addOnPlans.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>
                  Optional add-ons
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {addOnPlans.map((addOn) => {
                    const checked = addOnIds.includes(addOn.id);
                    return (
                      <label
                        key={addOn.id}
                        className="card-shiftify"
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', border: checked ? '2px solid var(--clr-primary)' : undefined }}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleAddOn(addOn.id)} style={{ width: 18, height: 18, accentColor: 'var(--clr-primary)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' }}>{addOn.label}</div>
                          {!!addOn.features.length && (
                            <div style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 2 }}>{addOn.features.join(' · ')}</div>
                          )}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--clr-primary)', flexShrink: 0 }}>
                          +${addOn.price.toFixed(2)}{addOn.period}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!basePlanId}
              onClick={handleContinue}
              className="btn-shiftify"
              style={{ width: '100%', height: 48, fontSize: 15, fontWeight: 700, marginTop: 32, opacity: basePlanId ? 1 : 0.5, cursor: basePlanId ? 'pointer' : 'not-allowed' }}
            >
              {basePlanId ? 'Continue to Payment' : 'Select a plan to continue'}
            </button>
          </div>
        )}

        {/* Fallback: no plans returned */}
        {!loading && !error && plans.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--clr-muted)', fontSize: 14 }}>
            <p>No plans available for your role.</p>
            <button
              type="button"
              className="btn-shiftify"
              style={{ marginTop: 16, height: 44, padding: '0 28px', fontSize: 14, fontWeight: 700 }}
              onClick={() => router.replace('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        <p style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 32, textAlign: 'center' }}>
          Questions?{' '}
          <Link href="mailto:support@shiftify.com.au" style={{ color: 'var(--clr-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Contact support
          </Link>
        </p>
      </main>
    </div>
  );
}
