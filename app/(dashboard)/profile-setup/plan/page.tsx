'use client';
// Dashboard plan selection — reached when a user completed the profile wizard
// from the dashboard banner but hasn't selected a plan yet (status = PENDING).
// Mirrors /setup/plan but activates then redirects to /dashboard (not /payment/checkout).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { UserStatus } from '@/lib/types';

interface Plan {
  id:       string;
  label:    string;
  price:    number;
  period:   string;
  features: string[];
  popular?: boolean;
}

export default function DashboardProfileSetupPlanPage() {
  const router = useRouter();
  const { activeRole, user } = useAuth();
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!activeRole) return;
    api.get<{ plans: { id: string; name: string; amountAud: string; features: unknown; popular?: boolean }[] }>(`/subscriptions/plans?role=${activeRole}`)
      .then(res => setPlans(
        (res.plans ?? []).map((p) => ({
          id:       p.id,
          label:    p.name,
          price:    Number(p.amountAud),
          period:   '/mo',
          features: Array.isArray(p.features) ? p.features as string[] : [],
          popular:  p.popular ?? false,
        }))
      ))
      .catch(() => setError('Failed to load plans. Please refresh.'))
      .finally(() => setLoading(false));
  }, [activeRole]);

  async function handleSelect(planId: string) {
    // In dashboard resume flow the user has already been on the platform.
    // Send them through the normal checkout page so the fake payment flow runs.
    router.push(`/payment/checkout?plan=${planId}&next=/dashboard`);
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 860 }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginBottom: 4 }}>Profile Setup</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 8 }}>
          Choose your plan
        </h1>
        <p style={{ fontSize: 14, color: 'var(--clr-muted)', margin: 0 }}>
          Select a plan to activate your account and unlock full marketplace access.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--clr-muted)', fontSize: 14 }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--clr-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading plans…
        </div>
      )}

      {error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#C62828', maxWidth: 480, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card-shiftify"
              style={{ position: 'relative', padding: 28, border: plan.popular ? '2px solid var(--clr-primary)' : undefined, overflow: 'hidden' }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'var(--clr-primary)', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 100, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 6 }}>{plan.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: plan.popular ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  ${plan.price.toFixed(2)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--clr-muted)' }}>{plan.period}</span>
              </div>

              {plan.features.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--clr-text)' }}>
                      <i className="bi bi-check-circle-fill" style={{ color: 'var(--clr-primary)', fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => handleSelect(plan.id)}
                className={plan.popular ? 'btn-shiftify' : 'btn-outline-shiftify'}
                style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 700 }}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <div style={{ fontSize: 14, color: 'var(--clr-muted)' }}>
          No plans available for your role.{' '}
          <button
            type="button"
            className="btn-shiftify"
            style={{ marginLeft: 12, height: 38, padding: '0 20px', fontSize: 13, fontWeight: 700 }}
            onClick={() => router.replace('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
