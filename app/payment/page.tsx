'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserStatus, UserRole } from '@/lib/types';
import { PLANS_BY_ROLE } from '@/lib/constants/plans';

export default function PaymentPage() {
  const router = useRouter();
  const { user, activeRole, status, logout } = useAuth();

  // If already active skip this page entirely
  useEffect(() => {
    if (status === UserStatus.ACTIVE || status === UserStatus.APPROVED) router.replace('/dashboard');
  }, [status, router]);

  const availablePlans = activeRole ? (PLANS_BY_ROLE[activeRole] ?? []) : [];

  function handleSelectPlan(planId: string) {
    const plan = availablePlans.find((p) => p.id === planId);
    const params = new URLSearchParams({
      plan: planId,
      key: planId,
      label: plan?.label ?? planId,
      amount: String(plan?.price ?? 0),
    });
    router.push(`/payment/checkout?${params.toString()}`);
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  const roleLabel =
    activeRole === UserRole.SUPPORT_WORKER ? 'Support Worker' :
    activeRole === UserRole.PROVIDER ? 'Provider' :
    activeRole === UserRole.COORDINATOR ? 'Support Coordinator' :
    activeRole === UserRole.PLAN_MANAGER ? 'Plan Manager' :
    'Shiftify';

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
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ fontSize: 13, color: 'var(--clr-muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      {/* Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>

        {/* Status banner */}
        <div style={{ background: 'rgba(194,24,91,0.06)', border: '1px solid rgba(194,24,91,0.18)', borderRadius: 14, padding: '16px 24px', maxWidth: 680, width: '100%', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(194,24,91,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="bi bi-clock-fill" style={{ color: 'var(--clr-primary)', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' }}>Account Pending Activation</div>
            <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 2 }}>
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Choose a plan to activate your {roleLabel} account.
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, textAlign: 'center', marginBottom: 8 }}>
          Choose your plan
        </h1>
        <p style={{ fontSize: 14, color: 'var(--clr-muted)', textAlign: 'center', marginBottom: 40 }}>
          All plans include a 14-day free trial. Cancel anytime.
        </p>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, width: '100%', maxWidth: 860 }}>
          {availablePlans.map((plan) => (
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

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--clr-text)' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: 'var(--clr-primary)', fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                className={plan.popular ? 'btn-shiftify' : 'btn-outline-shiftify'}
                style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 700 }}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>

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
