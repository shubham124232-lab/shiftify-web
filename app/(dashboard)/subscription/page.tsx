'use client';
// /subscription — role-aware plan, add-on, Shift Pass and cancellation screen.
// Source of truth: Pricing & Subscription Specification V2 (20 Aug 2026).
//   Support Worker      → "Power Ups & Billing"   (SW v3.0 nav)
//   Support Coordinator → "Subscription"          (SC nav)
//   Provider            → "Subscription & Billing" (Provider PR-D04)

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';
import { UserStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { BillingHistoryCard } from '@/components/subscription/BillingHistoryCard';

interface ApiPlan {
  id: string; key: string; name: string; role: string;
  amountAud: number | string; features?: string[]; isAddOn?: boolean;
}
interface Sub {
  id: string; planId: string; status: string;
  startedAt: string; currentPeriodEnd: string | null; autoRenew: boolean;
  cancelledAt: string | null; expiresAt: string | null;
  plan: ApiPlan;
}
interface Allowance {
  applies: boolean; limit: number; used: number; remaining: number;
  exhausted: boolean; unconsumedShiftPass: boolean; shiftPassPriceAud: number | null;
}

type Billing = 'MONTHLY' | 'ANNUAL';

const PAGE_COPY: Record<string, { title: string; description: string }> = {
  SUPPORT_WORKER: { title: 'Membership', description: 'Free, Basic, Shift Pass and Available Now — manage your plan and passes.' },
  COORDINATOR:    { title: 'Subscription',        description: 'Manage your plan, add-ons and one-time passes.' },
  PROVIDER:       { title: 'Subscription & Billing', description: 'Manage your organisation plan, passes and billing.' },
};

// Pricing V2 §6 — what one Shift Pass pays for, by role.
const SHIFT_PASS_COPY: Record<string, string> = {
  SUPPORT_WORKER: 'One additional Connect action.',
  COORDINATOR:    'One new Participant support request or agreed chargeable action.',
  PROVIDER:       'Publish one external staffing request, or respond to one Participant/Coordinator opportunity.',
};

const ADD_ON_REQUIRES: Record<string, string> = {
  SUPPORT_WORKER: 'Shiftify Basic',
  COORDINATOR:    'Shiftify Pro',
};

const isAnnual = (key: string) => key.endsWith('_ANNUAL');
const isFree = (p: ApiPlan) => p.key.endsWith('_FREE') || Number(p.amountAud) === 0;
const money = (v: number | string) => `$${Number(v).toFixed(2)}`;

function fmtDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const card: React.CSSProperties = { background: 'var(--td-white)', border: '1px solid var(--td-border)', borderRadius: 14, padding: 24 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 16 };

export default function SubscriptionPage() {
  const router = useRouter();
  const { activeRole } = useAuth();
  const setUser = useAuthStore(s => s.updateProfile);

  const [subs,       setSubs]       = useState<Sub[]>([]);
  const [plans,      setPlans]      = useState<ApiPlan[]>([]);
  const [allowance,  setAllowance]  = useState<Allowance | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [billing,    setBilling]    = useState<Billing>('MONTHLY');
  const [working,    setWorking]    = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [notice,     setNotice]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeRole) return;
    const [subRes, planRes, allowRes] = await Promise.all([
      api.get<{ subscriptions: Sub[] }>('/subscriptions/me/all').catch(() => ({ subscriptions: [] as Sub[] })),
      api.get<{ plans: ApiPlan[] }>(`/subscriptions/plans?role=${activeRole}`).catch(() => ({ plans: [] as ApiPlan[] })),
      api.get<{ allowance: Allowance }>('/subscriptions/me/allowance').catch(() => ({ allowance: null })),
    ]);
    setSubs((subRes as { subscriptions: Sub[] }).subscriptions ?? []);
    setPlans((planRes as { plans: ApiPlan[] }).plans ?? []);
    setAllowance((allowRes as { allowance: Allowance | null }).allowance ?? null);
  }, [activeRole]);

  useEffect(() => {
    if (!activeRole) return;
    load().finally(() => setLoading(false));
  }, [activeRole, load]);

  async function run(key: string, fn: () => Promise<void>, ok?: string) {
    setWorking(key); setError(null); setNotice(null);
    try { await fn(); await load(); if (ok) setNotice(ok); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); }
    finally { setWorking(null); }
  }

  const selectPlan = (plan: ApiPlan) => run(plan.id, async () => {
    await api.post('/subscriptions/activate', { planId: plan.id });
    setUser({ status: UserStatus.ACTIVE } as any); // hides the activation banner immediately
  }, `${plan.name} is now your plan.`);

  const selectAddOn = (plan: ApiPlan) => run(plan.id, async () => {
    await api.post('/subscriptions/add-on', { planId: plan.id });
  }, `${plan.name} added.`);

  const buyShiftPass = () => run('shift-pass', async () => {
    await api.post('/subscriptions/shift-pass', {});
  }, 'Shift Pass purchased. It is applied to your next chargeable action.');

  const base = subs.find(s => !s.plan.isAddOn) ?? null;
  const addOns = subs.filter(s => s.plan.isAddOn);
  const cancelled = !!base?.cancelledAt;
  const paidBase = !!base && !isFree(base.plan);
  const copy = PAGE_COPY[activeRole ?? ''] ?? { title: 'Subscription', description: 'Manage your plan and billing.' };

  function cancelRenewal() {
    if (!base) return;
    const until = fmtDate(base.currentPeriodEnd);
    if (!window.confirm(
      `Cancel renewal? Your plan stays active until ${until}. Existing applications, connections, messages and confirmed work remain accessible.`,
    )) return;
    run('cancel', async () => { await api.post('/subscriptions/cancel', {}); },
      `Renewal cancelled. You keep access until ${until}.`);
  }

  if (loading) {
    return (
      <>
        <PageHeader title={copy.title} description={copy.description} />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 100, background: 'var(--td-grey)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </>
    );
  }

  // Participants are always free (Pricing V2 §1.1)
  if (activeRole === 'PARTICIPANT') {
    return (
      <>
        <PageHeader title="Subscription" description="Manage your plan and billing." />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
          <div style={{ ...card, padding: 36, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(183,37,88,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="bi bi-gift-fill" style={{ color: 'var(--clr-primary)', fontSize: 24 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--clr-text)', margin: '0 0 10px' }}>Free for Participants</h2>
            <p style={{ fontSize: 14, color: 'var(--clr-muted)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
              Shiftify is completely free for participants and authorised representatives. Post support requests, browse workers and providers, and manage your bookings at no cost.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Plans for the chosen billing period. Free plans have no annual variant, so they show in both views.
  const wantAnnual = billing === 'ANNUAL';
  const hasAnnual = plans.some(p => isAnnual(p.key));
  const visible = (p: ApiPlan) => isFree(p) || (hasAnnual ? isAnnual(p.key) === wantAnnual : true);
  const basePlans = plans.filter(p => !p.isAddOn && visible(p));
  const addOnPlans = plans.filter(p => p.isAddOn && visible(p));
  const ownedAddOnStems = new Set(addOns.map(a => a.plan.key.replace(/_ANNUAL$/, '')));
  const periodWord = wantAnnual ? 'year' : 'month';

  // Workers see "N of 10 left" (U8); once on a paid Basic plan the counter no longer applies.
  // A paid base plan gives unlimited core actions, so the once-only counter no longer applies.
  const onPaidBase = subs.some(s => s.plan && !s.plan.isAddOn && !isFree(s.plan));
  const showAllowance = !!allowance?.applies && !onPaidBase && (
    activeRole === 'COORDINATOR' || activeRole === 'PROVIDER' || activeRole === 'SUPPORT_WORKER'
  );
  const shiftPassCopy = SHIFT_PASS_COPY[activeRole ?? ''];
  const canBuyPass = allowance?.shiftPassPriceAud != null && shiftPassCopy;

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button type="button" onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--clr-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}>
          <i className="bi bi-arrow-left" /> Back
        </button>

        {error && (
          <div style={{ background: 'var(--td-pink-tint)', border: '1px solid var(--td-pink)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--td-pink-hover)' }}>
            <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />{error}
          </div>
        )}
        {notice && (
          <div style={{ background: 'var(--td-grey-tint)', border: '1px solid var(--td-border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--td-dark-text)' }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }} />{notice}
          </div>
        )}

        {/* ── Current plan ─────────────────────────────────────────────── */}
        <div style={card}>
          <div style={eyebrow}>Current Plan</div>
          {base ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-text)', marginBottom: 4 }}>{base.plan.name}</div>
                <div style={{ fontSize: 14, color: 'var(--clr-muted)' }}>
                  {isFree(base.plan) ? 'Free' : `${money(base.plan.amountAud)}/${isAnnual(base.plan.key) ? 'year' : 'month'}`}
                </div>
                {paidBase && (
                  <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13, color: 'var(--clr-muted)', flexWrap: 'wrap' }}>
                    <span><i className="bi bi-calendar-check" style={{ marginRight: 5 }} />Started {fmtDate(base.startedAt)}</span>
                    {cancelled
                      ? <span><i className="bi bi-hourglass-split" style={{ marginRight: 5 }} />Paid through {fmtDate(base.currentPeriodEnd)} — will not renew</span>
                      : <span><i className="bi bi-arrow-repeat" style={{ marginRight: 5 }} />Renews {fmtDate(base.currentPeriodEnd)}</span>}
                  </div>
                )}
              </div>
              <span style={{ background: 'var(--td-grey)', color: 'var(--td-ink-700)', fontSize: 12, fontWeight: 700, borderRadius: 100, padding: '5px 14px', flexShrink: 0 }}>
                {cancelled ? 'Ending' : 'Active'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--td-pink)' }}>No active plan</div>
                <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 4 }}>
                  Choose a plan below. Existing applications, connections, messages and confirmed work stay accessible.
                </div>
              </div>
            </div>
          )}

          {addOns.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {addOns.map(a => (
                <div key={a.id} style={{ fontSize: 13, color: 'var(--clr-muted)' }}>
                  + {a.plan.name} — {money(a.plan.amountAud)}/{isAnnual(a.plan.key) ? 'year' : 'month'}
                  {a.cancelledAt ? ` (paid through ${fmtDate(a.currentPeriodEnd)})` : ''}
                </div>
              ))}
            </div>
          )}

          {paidBase && !cancelled && (
            <button type="button" onClick={cancelRenewal} disabled={working === 'cancel'}
              style={{ marginTop: 16, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', color: 'var(--td-pink)', cursor: 'pointer', padding: 0 }}>
              {working === 'cancel' ? 'Cancelling…' : 'Cancel renewal'}
            </button>
          )}
        </div>

        {/* ── Introductory actions (Worker + Coordinator + Provider) ───────────── */}
        {showAllowance && allowance && (
          <div style={card}>
            <div style={eyebrow}>Introductory actions</div>
            <div style={{ fontSize: 14, color: 'var(--clr-text)', fontWeight: 600 }}>
              {activeRole === 'SUPPORT_WORKER'
                ? `${allowance.remaining} of ${allowance.limit} once-only introductory Connect actions left`
                : `${allowance.used} of ${allowance.limit} once-only introductory actions used`}
            </div>
            <p style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 6, lineHeight: 1.6 }}>
              They never reset and never expire.
              {allowance.exhausted &&
                ' Choose a subscription or buy a Shift Pass to continue. Existing requests, connections, messages and confirmed work stay accessible.'}
            </p>
          </div>
        )}

        {/* ── Plan options ─────────────────────────────────────────────── */}
        {basePlans.length > 0 && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ ...eyebrow, marginBottom: 0 }}>{base ? 'Change Plan' : 'Choose a Plan'}</div>
              {hasAnnual && (
                <div style={{ display: 'inline-flex', border: '1.5px solid var(--td-border)', borderRadius: 100, overflow: 'hidden' }}>
                  {(['MONTHLY', 'ANNUAL'] as Billing[]).map(b => (
                    <button key={b} type="button" onClick={() => setBilling(b)}
                      style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', border: 'none', cursor: 'pointer',
                        background: billing === b ? 'var(--clr-primary)' : 'transparent', color: billing === b ? '#fff' : 'var(--clr-muted)' }}>
                      {b === 'MONTHLY' ? 'Monthly' : 'Annual — 35% off'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {basePlans.map(plan => {
                const isCurrent = base?.plan.key === plan.key && !cancelled;
                return (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10,
                    border: isCurrent ? '2px solid var(--clr-primary)' : '1.5px solid var(--td-border)',
                    background: isCurrent ? 'rgba(183,37,88,0.03)' : 'var(--td-white)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {plan.name}
                        {isCurrent && <span style={{ background: 'rgba(183,37,88,0.1)', color: 'var(--clr-primary)', fontSize: 10, fontWeight: 800, borderRadius: 100, padding: '2px 8px' }}>Current</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 3 }}>
                        {isFree(plan) ? 'Free' : `${money(plan.amountAud)}/${isAnnual(plan.key) ? 'year' : 'month'}`}
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--clr-muted)', lineHeight: 1.6 }}>
                          {plan.features.filter(f => !/^Billed annually/.test(f)).map(f => <li key={f}>{f}</li>)}
                        </ul>
                      )}
                    </div>
                    {!isCurrent && (
                      <button type="button" onClick={() => selectPlan(plan)} disabled={!!working}
                        style={{ height: 36, padding: '0 20px', fontSize: 13, fontWeight: 700, opacity: working ? 0.6 : 1, cursor: working ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                        {working === plan.id ? 'Activating…' : base ? 'Switch' : 'Select'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {activeRole === 'PROVIDER' && (
              <p style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 14, lineHeight: 1.6 }}>
                Need more Administrators, Team Members or Branches than Scale includes? Contact Shiftify. Limits apply across your whole organisation; one person on several Branches counts once.
              </p>
            )}
            {!basePlans.every(isFree) && (
              <p style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 14, lineHeight: 1.6 }}>
                Plans renew automatically each {periodWord} until cancelled. You can cancel at any time — cancellation takes effect at the end of the paid period and access continues until then.
                Paying provides access to Shiftify&apos;s technology and marketplace; it does not guarantee applications, responses or a confirmed worker, participant or shift.
              </p>
            )}
          </div>
        )}

        {/* ── Add-ons ──────────────────────────────────────────────────── */}
        {addOnPlans.length > 0 && (
          <div style={card}>
            <div style={eyebrow}>Add-ons</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {addOnPlans.map(plan => {
                const owned = ownedAddOnStems.has(plan.key.replace(/_ANNUAL$/, ''));
                const locked = !paidBase || cancelled;
                const requires = ADD_ON_REQUIRES[activeRole ?? ''];
                return (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: '1.5px solid var(--td-border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' }}>{plan.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 3 }}>{money(plan.amountAud)}/{isAnnual(plan.key) ? 'year' : 'month'}</div>
                      {plan.features && (
                        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--clr-muted)', lineHeight: 1.6 }}>
                          {plan.features.filter(f => !/^(Billed annually|Requires)/.test(f)).map(f => <li key={f}>{f}</li>)}
                        </ul>
                      )}
                      {locked && !owned && requires && (
                        <div style={{ fontSize: 12, color: 'var(--td-pink)', marginTop: 8 }}>Requires an active {requires} subscription.</div>
                      )}
                    </div>
                    {owned
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--td-ink-700)' }}>Active</span>
                      : (
                        <button type="button" onClick={() => selectAddOn(plan)} disabled={!!working || locked}
                          style={{ height: 36, padding: '0 20px', fontSize: 13, fontWeight: 700, opacity: working || locked ? 0.5 : 1, cursor: working || locked ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                          {working === plan.id ? 'Adding…' : 'Add'}
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pay-As-You-Go Shift Pass (Pricing V2 §6) ─────────────────── */}
        {canBuyPass && (
          <div style={card}>
            <div style={eyebrow}>Pay as you go</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' }}>Shift Pass — {money(allowance!.shiftPassPriceAud!)}</div>
                <div style={{ fontSize: 13, color: 'var(--clr-muted)', marginTop: 3 }}>{shiftPassCopy}</div>
                <div style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 6 }}>
                  One-time payment, no subscription. Activity that follows from the action stays free.
                </div>
              </div>
              <button type="button" onClick={buyShiftPass} disabled={!!working}
                style={{ height: 36, padding: '0 20px', fontSize: 13, fontWeight: 700, opacity: working ? 0.6 : 1, cursor: working ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                {working === 'shift-pass' ? 'Purchasing…' : 'Buy Shift Pass'}
              </button>
            </div>
          </div>
        )}

        <BillingHistoryCard />

        <p style={{ fontSize: 11, color: 'var(--clr-muted)', lineHeight: 1.5 }}>
          Test mode — changes take effect immediately. Stripe billing will be connected in Phase 2.
        </p>
      </div>
    </>
  );
}
