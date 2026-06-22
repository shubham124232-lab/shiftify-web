'use client';
// /subscription — current plan, upgrade/downgrade options.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { UserStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';

interface Sub {
  id: string; planId: string; status: string;
  startedAt: string; currentPeriodEnd: string | null; autoRenew: boolean;
  plan: { key: string; name: string; amountAud: number; role: string };
}
interface ApiPlan { id: string; key: string; name: string; amountAud: number; role: string; }

function fmtDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: '#dcfce7', color: '#15803d', label: 'Active'    },
  TRIALING:  { bg: '#fef9c3', color: '#854d0e', label: 'Trial'     },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  EXPIRED:   { bg: '#fee2e2', color: '#b91c1c', label: 'Expired'   },
  PAST_DUE:  { bg: '#fef3c7', color: '#92400e', label: 'Past Due'  },
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { activeRole } = useAuth();
  const setUser = useAuthStore(s => s.updateProfile);

  const [sub,          setSub]          = useState<Sub | null>(null);
  const [plans,        setPlans]        = useState<ApiPlan[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [upgrading,    setUpgrading]    = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeOk,    setUpgradeOk]    = useState<string | null>(null);

  useEffect(() => {
    if (!activeRole) return;
    Promise.all([
      api.get<{ subscription: Sub | null }>('/subscriptions/me').catch(() => ({ subscription: null })),
      api.get<{ plans: ApiPlan[] }>(`/subscriptions/plans?role=${activeRole}`).catch(() => ({ plans: [] })),
    ]).then(([subRes, planRes]) => {
      setSub((subRes as { subscription: Sub | null }).subscription);
      setPlans((planRes as { plans: ApiPlan[] }).plans ?? []);
    }).finally(() => setLoading(false));
  }, [activeRole]);

  async function handleSelect(planId: string) {
    setUpgrading(planId); setUpgradeError(null); setUpgradeOk(null);
    try {
      await api.post('/subscriptions/activate', { planId });
      setUser({ status: UserStatus.ACTIVE } as any); // immediate — banner hides instantly
      setUpgradeOk(planId);
      const res = await api.get<{ subscription: Sub | null }>('/subscriptions/me');
      setSub((res as { subscription: Sub | null }).subscription);
    } catch (err: unknown) {
      setUpgradeError(err instanceof Error ? err.message : 'Could not change plan.');
    } finally { setUpgrading(null); }
  }

  const chip = sub ? (STATUS_CHIP[sub.status] ?? STATUS_CHIP.ACTIVE) : null;
  const isFree = activeRole === 'PARTICIPANT';

  // Loading skeleton
  if (loading) {
    return (
      <>
        <PageHeader title="Subscription" description="Manage your plan and billing." />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 100, background: '#f3f4f6', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </>
    );
  }

  // Participants are always free
  if (isFree) {
    return (
      <>
        <PageHeader title="Subscription" description="Manage your plan and billing." />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 36, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(194,24,91,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="bi bi-gift-fill" style={{ color: 'var(--clr-primary)', fontSize: 24 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--clr-text)', margin: '0 0 10px' }}>Free for Participants</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-muted)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
              Shiftify is completely free for participants. Post support requests, browse workers and providers, and manage your bookings at no cost.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Subscription" description="Manage your plan and billing." />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button type="button" onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--clr-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}>
          <i className="bi bi-arrow-left" /> Back
        </button>

        {/* ── Current plan card ─────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 16 }}>
            Current Plan
          </div>

          {sub ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-text)', marginBottom: 4 }}>
                  {sub.plan.name}
                </div>
                <div style={{ fontSize: 14, color: 'var(--clr-muted)' }}>
                  ${Number(sub.plan.amountAud).toFixed(2)}/month
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13, color: 'var(--clr-muted)' }}>
                  <span><i className="bi bi-calendar-check" style={{ marginRight: 5 }} />Started {fmtDate(sub.startedAt)}</span>
                  {sub.currentPeriodEnd && (
                    <span><i className="bi bi-arrow-repeat" style={{ marginRight: 5 }} />Renews {fmtDate(sub.currentPeriodEnd)}</span>
                  )}
                </div>
              </div>
              {chip && (
                <span style={{ background: chip.bg, color: chip.color, fontSize: 12, fontWeight: 700, borderRadius: 100, padding: '5px 14px', flexShrink: 0 }}>
                  {chip.label}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>No active subscription</div>
                <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 4 }}>
                  Select a plan below to unlock posting and job applications.
                </div>
              </div>
              <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 12, fontWeight: 700, borderRadius: 100, padding: '5px 14px' }}>
                Inactive
              </span>
            </div>
          )}

          {/* Locked warning if no active sub */}
          {(!sub || sub.status !== 'ACTIVE') && (
            <div style={{ marginTop: 16, background: '#FFF9C4', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#78350f', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <i className="bi bi-lock-fill" style={{ color: '#f59e0b', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
              <div>
                <strong>Jobs are locked.</strong> You cannot post or apply to jobs until you have an active subscription. Select a plan below.
              </div>
            </div>
          )}
        </div>

        {/* ── Plan options ─────────────────────────────────────────────── */}
        {plans.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 16 }}>
              {sub?.status === 'ACTIVE' ? 'Change Plan' : 'Choose a Plan'}
            </div>

            {upgradeError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 14 }}>
                <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />{upgradeError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plans.map(plan => {
                const isCurrent = sub?.plan.key === plan.key && sub?.status === 'ACTIVE';
                const isWorking = upgrading === plan.id;
                const didActivate = upgradeOk === plan.id;
                return (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: isCurrent ? '2px solid var(--clr-primary)' : '1.5px solid #e5e7eb', background: isCurrent ? 'rgba(194,24,91,0.03)' : '#fff', transition: 'border 0.2s' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {plan.name}
                        {isCurrent && (
                          <span style={{ background: 'rgba(194,24,91,0.1)', color: 'var(--clr-primary)', fontSize: 10, fontWeight: 800, borderRadius: 100, padding: '2px 8px' }}>Current</span>
                        )}
                        {didActivate && !isCurrent && (
                          <span style={{ color: '#16a34a', fontSize: 12 }}><i className="bi bi-check-circle-fill" /> Activated</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 3 }}>
                        ${Number(plan.amountAud).toFixed(2)}/month
                      </div>
                    </div>
                    {!isCurrent && (
                      <button type="button" onClick={() => handleSelect(plan.id)} disabled={!!upgrading}
                        style={{ height: 36, padding: '0 20px', fontSize: 13, fontWeight: 700, opacity: upgrading ? 0.6 : 1, cursor: upgrading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                        {isWorking ? 'Activating...' : sub ? 'Switch' : 'Select'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 14, lineHeight: 1.5 }}>
              Test mode — changes take effect immediately. Stripe billing will be connected in Phase 2.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
