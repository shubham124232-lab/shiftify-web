"use client";

// Provider "Subscription and billing" — organisation capacity plans, pay-as-you-go, receipts (client-approved demo).
// Test mode: activating a plan records it immediately, no card is taken.

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { UserStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { Check } from "lucide-react";

interface ApiPlan { id: string; key: string; name: string; amountAud: number | string; features?: string[]; isAddOn?: boolean }
interface Sub { id: string; status: string; startedAt: string; currentPeriodEnd: string | null; cancelledAt: string | null; plan: ApiPlan }
interface Allowance { applies?: boolean; limit?: number; used?: number; shiftPassPriceAud: number | null }
interface Capacity {
  administrators: { used: number; max: number | null };
  teamMembers: { used: number; max: number | null };
  branches: { used: number; max: number | null };
}
interface HistoryItem { kind: string; label: string; amountAud: number | null; at: string; detail: string }

const isAnnual = (k: string) => k.endsWith("_ANNUAL");
const stem = (k: string) => k.replace(/_ANNUAL$/, "");
const shortName = (n: string) => n.replace(/\s*\(Annual\)$/, "");
const money = (v: number | string) => `$${Number(v).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "N/A");
const BULLETS = ["Unlimited genuine core actions", "Internal and external matching"];

export function ProviderBilling() {
  const setUser = useAuthStore((s) => s.updateProfile);
  const userName = useAuthStore((s) => s.user?.name ?? "");
  const [subs, setSubs] = useState<Sub[]>([]);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [cap, setCap] = useState<Capacity | null>(null);
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [annual, setAnnual] = useState(false);
  const [checkout, setCheckout] = useState<ApiPlan | null>(null);
  const [dialog, setDialog] = useState<"settings" | "receipts" | "failed" | null>(null);
  const [org, setOrg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    const [s, p, c, a] = await Promise.all([
      api.get<{ subscriptions: Sub[] }>("/subscriptions/me/all").catch(() => ({ subscriptions: [] as Sub[] })),
      api.get<{ plans: ApiPlan[] }>("/subscriptions/plans?role=PROVIDER").catch(() => ({ plans: [] as ApiPlan[] })),
      api.get<{ capacity: Capacity | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
      api.get<{ allowance: Allowance | null }>("/subscriptions/me/allowance").catch(() => ({ allowance: null })),
    ]);
    setSubs(s.subscriptions ?? []); setPlans(p.plans ?? []); setCap(c.capacity ?? null); setAllowance(a.allowance ?? null);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { api.get<{ organisation: string | null }>("/provider-org/identity").then((r) => setOrg(r.organisation)).catch(() => setOrg(null)); }, []);

  const base = subs.find((x) => !x.plan.isAddOn && Number(x.plan.amountAud) > 0) ?? null;
  const cancelled = !!base?.cancelledAt;
  const orgPlans = plans.filter((p) => !p.isAddOn && Number(p.amountAud) > 0 && isAnnual(p.key) === annual);
  const passPrice = allowance?.shiftPassPriceAud ?? 19.99;

  async function run(key: string, fn: () => Promise<void>, ok: string) {
    setBusy(key); setError(null); setNotice(null);
    try { await fn(); await load(); setNotice(ok); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { setBusy(null); }
  }

  function cancelRenewal() {
    if (!base) return;
    if (!window.confirm(`Cancel future renewal? Access continues until ${day(base.currentPeriodEnd)}. Existing applications, messages and confirmed work remain accessible.`)) return;
    void run("cancel", async () => { await api.post("/subscriptions/cancel", {}); }, `Renewal cancelled. You keep access until ${day(base.currentPeriodEnd)}.`);
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-6">
      <div>
        <p className="m-0 text-xs text-slate-500">Provider / Billing</p>
        <h1 className="m-0 mt-2 text-3xl font-bold text-slate-900">Subscription and billing</h1>
        <p className="m-0 mt-1 text-sm text-slate-500">Organisation-wide access. Matching and internal assignments are included.</p>
      </div>

      {error && <p className="m-0 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {notice && <p className="m-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</p>}

      {base ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Current access</p>
              <p className="m-0 mt-1 text-xl font-bold">{shortName(base.plan.name)} · {isAnnual(base.plan.key) ? "annual" : "monthly"}</p>
              <p className="m-0 mt-0.5 text-xs text-slate-300">{cancelled ? `Paid through ${day(base.currentPeriodEnd)} · will not renew` : `Paid through ${day(base.currentPeriodEnd)}`}</p>
            </div>
            <div>
              <p className="m-0 text-lg font-bold">{money(base.plan.amountAud)}</p>
              <p className="m-0 text-xs text-slate-300">per {isAnnual(base.plan.key) ? "year" : "month"}</p>
            </div>
          </div>
          {!cancelled && <Button variant="outline" className="bg-white text-slate-900" disabled={busy === "cancel"} onClick={cancelRenewal}>Cancel future renewal</Button>}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 px-6 py-5 text-white">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Current access</p>
          <p className="m-0 mt-1 text-xl font-bold">No active plan</p>
          <p className="m-0 mt-0.5 text-xs text-slate-300">Choose a plan below. Existing applications, messages and confirmed work stay accessible.</p>
        </div>
      )}

      {cap && (
        <div className="grid gap-4 md:grid-cols-3">
          {([["Administrators", cap.administrators], ["Internal Team Members", cap.teamMembers], ["Branches", cap.branches]] as const).map(([label, v]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <p className="m-0 text-sm text-slate-500">{label}</p>
              <p className="m-0 mt-1 text-xl font-bold text-slate-900">{v.used} / {v.max ?? "∞"}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${v.max ? Math.min(100, (v.used / v.max) * 100) : 0}%` }} />
              </div>
              <p className="m-0 mt-3 text-xs text-slate-500">Unique people count once Provider-wide.</p>
            </div>
          ))}
        </div>
      )}

      {cap && ([["Administrators", cap.administrators], ["Internal Team Members", cap.teamMembers], ["Branches", cap.branches]] as const)
        .filter(([, v]) => v.max != null && v.used > v.max)
        .map(([label, v]) => (
          <p key={label} className="m-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            {label} are over your plan limit ({v.used} of {v.max}). Choose a larger plan, or contact Shiftify for more capacity.
          </p>
        ))}
      {!base && allowance?.applies && allowance.limit != null && (
        <p className="m-0 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
          {allowance.used ?? 0} of {allowance.limit} once-only introductory Provider actions used. They never reset or expire.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-bold text-slate-900">Choose the right organisation capacity</h2>
          <p className="m-0 mt-1 text-sm text-slate-500">Unlimited genuine Provider posts and responses in every paid plan.</p>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-semibold">
          <button type="button" onClick={() => setAnnual(false)} className={`px-4 py-2 ${!annual ? "bg-slate-900 text-white" : "text-slate-500"}`}>Monthly</button>
          <button type="button" onClick={() => setAnnual(true)} className={`px-4 py-2 ${annual ? "bg-slate-900 text-white" : "text-slate-500"}`}>Annual · save 35%</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orgPlans.map((p) => {
          const current = base?.plan.key === p.key && !cancelled;
          const recommended = stem(p.key).endsWith("_TEAM");
          const lines = (p.features ?? []).filter((f) => !/^Billed annually/.test(f)).concat(BULLETS);
          return (
            <div key={p.id} className={`relative flex flex-col rounded-xl border bg-white p-5 ${current || recommended ? "border-2 border-brand-600" : "border-slate-200"}`}>
              {recommended && <span className="absolute -top-3 left-4 rounded bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Growing teams</span>}
              <h3 className="m-0 text-lg font-bold text-slate-900">{shortName(p.name)}</h3>
              <p className="m-0 mt-3 text-3xl font-bold text-slate-900">{money(p.amountAud)}<span className="text-sm font-normal text-slate-500">/{annual ? "year" : "month"}</span></p>
              <p className="m-0 mt-1 text-xs text-slate-500">{annual ? "Billed annually · 35% off" : "Billed monthly"}</p>
              <ul className="m-0 mt-4 flex-1 list-none space-y-2 p-0">
                {lines.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />{f}</li>)}
              </ul>
              <Button className="mt-5 w-full" disabled={!!busy} onClick={() => (current ? setDialog("settings") : setCheckout(p))}>
                {current ? `Manage ${shortName(p.name)}` : `Choose ${shortName(p.name)}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
        More capacity?
        <a href="mailto:support@shiftify.com.au" className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 no-underline hover:bg-slate-50">Contact Shiftify</a>
        No public Enterprise plan or separate capacity add-ons.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white">
          <h3 className="m-0 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">Pay as you go</h3>
          <div className="px-5 py-5">
            <p className="m-0 text-3xl font-bold text-slate-900">{money(passPrice)} <span className="text-sm font-normal text-slate-500">/ action</span></p>
            <p className="m-0 mt-3 text-sm text-slate-500">Publish one external staffing request or submit one Provider-initiated response. Resulting applications, messages and confirmed work remain accessible.</p>
            <Button className="mt-4" disabled={!!busy} onClick={() => run("pass", async () => { await api.post("/subscriptions/shift-pass", {}); }, "Shift Pass purchased. It is applied to your next chargeable action.")}>
              {busy === "pass" ? "Purchasing…" : "Post using a Shift Pass"}
            </Button>
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white">
          <h3 className="m-0 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">Payment method and receipts</h3>
          <div className="flex flex-wrap gap-2 px-5 py-5">
            <Button variant="outline" onClick={() => setDialog("settings")}>Payment settings</Button>
            <Button variant="outline" onClick={() => setDialog("receipts")}>View receipts</Button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <h3 className="m-0 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">Have a sales code?</h3>
        <div className="px-5 py-5">
          <label className="text-xs font-semibold text-slate-700">Sales code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter your salesperson's code"
            className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          <Button variant="outline" className="mt-3" onClick={() => { setError(null); setNotice(null); code.trim() ? setError("Sales codes are not active yet.") : setError("Enter a sales code first."); }}>Apply code</Button>
          <p className="m-0 mt-3 text-xs text-slate-500">Get 10% off your first monthly subscription payment with an eligible sales code. Annual plans, Shift Passes and Pay-as-you-go are excluded.</p>
        </div>
      </section>

      {checkout && (
        <CheckoutDialog plan={checkout} contact={userName} org={org} onClose={() => setCheckout(null)}
          onConfirm={async () => {
            await api.post("/subscriptions/activate", { planId: checkout.id });
            setUser({ status: UserStatus.ACTIVE } as never);
            await load();
          }} />
      )}
      {dialog === "settings" && (
        <ModalShell title="Payment settings" onClose={() => setDialog(null)}>
          <div className="space-y-4 px-6 py-5">
            <div><p className="m-0 font-semibold text-slate-900">Billing contact</p><p className="m-0 mt-1 text-sm text-slate-500">{[userName, org].filter(Boolean).join(" · ") || "Organisation owner"}</p></div>
            <div><p className="m-0 font-semibold text-slate-900">Payment issue preview</p><p className="m-0 mt-1 text-sm text-slate-500">Use the access-state preview to review payment failure and preserved confirmed-work access.</p></div>
          </div>
          <div className="flex justify-between border-t border-slate-100 px-6 py-4">
            <Button variant="outline" onClick={() => setDialog(null)}>Close</Button>
            <Button onClick={() => setDialog("failed")}>Preview failed payment</Button>
          </div>
        </ModalShell>
      )}
      {dialog === "failed" && (
        <ModalShell title="Payment issue preview" onClose={() => setDialog(null)}>
          <div className="space-y-3 px-6 py-5 text-sm text-slate-600">
            <p className="m-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">Preview only. Your plan and payment are not affected.</p>
            <p className="m-0 font-semibold text-slate-900">If a payment fails</p>
            <ul className="m-0 space-y-1.5 pl-5">
              <li>Publishing new external staffing requests and new responses pause until payment is updated.</li>
              <li>Existing applications, messages and confirmed work stay accessible.</li>
              <li>Internal team and confirmed assignments are not removed.</li>
            </ul>
          </div>
          <div className="flex justify-between border-t border-slate-100 px-6 py-4">
            <Button variant="outline" onClick={() => setDialog("settings")}>Back</Button>
            <Button variant="outline" onClick={() => setDialog(null)}>Close</Button>
          </div>
        </ModalShell>
      )}
      {dialog === "receipts" && <ReceiptsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

function CheckoutDialog({ plan, contact, org, onClose, onConfirm }: { plan: ApiPlan; contact: string; org: string | null; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [name, setName] = useState(contact);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("APPROVED");
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const yearly = isAnnual(plan.key);
  const start = new Date();
  const renew = new Date(start); renew.setFullYear(start.getFullYear() + (yearly ? 1 : 0)); if (!yearly) renew.setMonth(start.getMonth() + 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  if (done) return (
    <ModalShell title="Subscription active" onClose={onClose}>
      <div className="space-y-3 px-6 py-5 text-sm text-slate-600">
        <p className="m-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{shortName(plan.name)} is now your plan. This was a simulated purchase and nothing was charged.</p>
        <p className="m-0"><b className="text-slate-900">Receipt:</b> {shortName(plan.name)} · {yearly ? "annual" : "monthly"} · {money(plan.amountAud)} AUD</p>
        <p className="m-0"><b className="text-slate-900">Paid through:</b> {fmt(renew)}</p>
        <p className="m-0">Your organisation capacity is available now. Payment does not mark an unverified business as verified.</p>
      </div>
      <div className="border-t border-slate-100 px-6 py-4"><Button onClick={onClose}>Done</Button></div>
    </ModalShell>
  );
  return (
    <ModalShell title="Demo checkout" onClose={onClose}>
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <p className="m-0 rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-700">No real charge. Do not enter card details.</p>
        <p className="m-0 font-semibold text-slate-900">{shortName(plan.name)} Provider plan · {yearly ? "annual" : "monthly"}</p>
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-5 py-4">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total AUD</p>
          <p className="m-0 mt-1 text-3xl font-bold text-slate-900">{money(plan.amountAud)}</p>
          <p className="m-0 mt-1 text-sm text-slate-600">Renews automatically {yearly ? "annually" : "monthly"} at the displayed price. Cancel future renewal at any time; access continues through the paid period.</p>
        </div>
        <div className="grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
          <p className="m-0"><b className="text-slate-900">Organisation:</b> {org ?? "Your organisation"}</p>
          <p className="m-0"><b className="text-slate-900">Authorised payer:</b> {contact || "Organisation owner"}</p>
          <p className="m-0"><b className="text-slate-900">Starts:</b> {fmt(start)}</p>
          <p className="m-0"><b className="text-slate-900">Next renewal:</b> {fmt(renew)}</p>
        </div>
        <div><label className="text-sm font-semibold text-slate-900">Billing contact</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
        <div><label className="text-sm font-semibold text-slate-900">Demo payment outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <option value="APPROVED">Approved</option><option value="DECLINED">Declined</option>
          </select></div>
        <p className="m-0 text-sm text-slate-500">Platform products do not guarantee applicants, a worker, completed support or commercial outcomes. Support payments are agreed separately.</p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I authorise this simulated purchase and acknowledge the displayed product, duration and renewal terms.
        </label>
        {!yearly && (
          <div><label className="text-sm font-semibold text-slate-900">Sales code (optional)</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            <Button variant="outline" className="mt-2" onClick={() => setErr(code.trim() ? "Sales codes are not active yet." : "Enter a sales code first.")}>Apply code</Button></div>
        )}
        {err && <p className="m-0 text-sm text-red-600">{err}</p>}
      </div>
      <div className="flex justify-between border-t border-slate-100 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Back</Button>
        <Button disabled={!agree || !name.trim() || busy} onClick={async () => {
          setBusy(true); setErr(null);
          if (outcome === "DECLINED") { setErr("Demo payment declined. Your plan was not changed and nothing was charged."); setBusy(false); return; }
          try { await onConfirm(); setDone(true); } catch (e) { setErr(e instanceof Error ? e.message : "Could not complete the purchase."); setBusy(false); }
        }}>{busy ? "Completing…" : "Complete demo purchase"}</Button>
      </div>
    </ModalShell>
  );
}

function ReceiptsDialog({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  useEffect(() => { api.get<{ history: HistoryItem[] }>("/subscriptions/me/history").then((r) => setItems(r.history)).catch(() => setItems([])); }, []);
  return (
    <ModalShell title="Demo purchase history" onClose={onClose}>
      <div className="overflow-y-auto px-6 py-5">
        {items === null ? <p className="m-0 text-sm text-slate-500">Loading…</p>
          : items.length === 0 ? <p className="m-0 py-10 text-center text-base font-semibold text-slate-900">No demo purchases</p>
          : items.map((i, n) => (
            <div key={n} className="flex justify-between gap-3 border-t border-slate-100 py-3 first:border-0 text-sm">
              <div><p className="m-0 font-semibold text-slate-900">{i.label}</p><p className="m-0 text-xs text-slate-500">{new Date(i.at).toLocaleDateString("en-AU")} · {i.detail}</p></div>
              <p className="m-0 font-semibold">{i.amountAud != null ? `$${i.amountAud.toFixed(2)}` : ""}</p>
            </div>
          ))}
      </div>
      <div className="border-t border-slate-100 px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </ModalShell>
  );
}
