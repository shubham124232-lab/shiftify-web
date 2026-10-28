"use client";

// Support Coordinator "Add-ons": each optional tool on its own card (Growth, Speed from the plan
// catalogue), plus Shift Blast SMS, which has no package or price yet.

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, Chip, PrimaryButton, OutlineButton, Empty, ErrorNote, BORDER,
} from "@/components/coordinator/workspace-ui";

interface ApiPlan { id: string; key: string; name: string; amountAud: number | string; features?: string[]; isAddOn?: boolean }
interface Sub { id: string; cancelledAt: string | null; plan: ApiPlan }

const isAnnual = (key: string) => key.endsWith("_ANNUAL");
const isFree = (p: ApiPlan) => p.key.endsWith("_FREE") || Number(p.amountAud) === 0;
const money = (v: number | string) => `$${Number(v).toFixed(2)}`;
const stem = (key: string) => key.replace(/_ANNUAL$/, "");

export default function AddOnsPage() {
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      api.get<{ plans: ApiPlan[] }>("/subscriptions/plans?role=COORDINATOR").catch(() => ({ plans: [] as ApiPlan[] })),
      api.get<{ subscriptions: Sub[] }>("/subscriptions/me/all").catch(() => ({ subscriptions: [] as Sub[] })),
    ]);
    setPlans(p.plans ?? []);
    setSubs(s.subscriptions ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const base = subs.find((s) => !s.plan.isAddOn);
  const hasPro = !!base && !isFree(base.plan) && !base.cancelledAt;
  const owned = new Set(subs.filter((s) => s.plan.isAddOn).map((s) => stem(s.plan.key)));
  const monthly = (plans ?? []).filter((p) => p.isAddOn && !isAnnual(p.key));
  const annualOf = (p: ApiPlan) => (plans ?? []).find((a) => a.key === `${p.key}_ANNUAL`);

  async function add(plan: ApiPlan) {
    setWorking(plan.id); setError(null); setNotice(null);
    try { await api.post("/subscriptions/add-on", { planId: plan.id }); await load(); setNotice(`${plan.name} added.`); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not add this add-on."); }
    finally { setWorking(null); }
  }

  return (
    <WorkspacePage title="Add-ons" description="Choose each optional tool separately. All require active Pro.">
      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{notice}</div>}

      {plans === null ? <Panel><Empty>Loading…</Empty></Panel> : (
        <div className="grid gap-6 md:grid-cols-2">
          {monthly.map((p) => {
            const annual = annualOf(p);
            const isOwned = owned.has(stem(p.key));
            const blurb = (p.features ?? []).filter((f) => !/^(Billed annually|Requires)/.test(f)).join(", ");
            return (
              <section key={p.id} className={`flex flex-col rounded-xl border ${isOwned ? "border-[#c91355]" : BORDER} bg-white p-6`}>
                <h2 className="text-lg">{p.name}</h2>
                <p className="mt-1 font-display text-[26px] font-extrabold leading-tight">{money(p.amountAud)}<span className="text-sm font-semibold text-[#69707e]"> / month</span></p>
                {blurb && <p className="mt-3 flex-1 text-[13px] leading-relaxed text-[#525766]">{blurb}.</p>}
                <p className="mt-3 text-xs text-[#69707e]">{annual ? `Annual: ${money(annual.amountAud)}. ` : ""}Requires Pro.</p>
                <div className="mt-5">
                  {isOwned ? <Chip tone="green">Active</Chip>
                    : <PrimaryButton onClick={() => void add(p)} disabled={!hasPro || !!working}>{working === p.id ? "Adding…" : `Add ${p.name}`}</PrimaryButton>}
                  {!hasPro && !isOwned && <p className="mt-2 text-xs text-[#c91355]">Requires an active Shiftify Pro subscription.</p>}
                </div>
              </section>
            );
          })}
          {!monthly.length && <Panel><Empty>No add-ons are available for your account right now.</Empty></Panel>}
        </div>
      )}

      <section className={`flex flex-wrap items-center justify-between gap-5 rounded-xl border ${BORDER} bg-white p-6`}>
        <div className="max-w-[750px]">
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#c91355]">Speed tools · Separate optional add-on</p>
          <h2 className="my-2 text-[22px]">Shift Blast SMS</h2>
          <p className="text-[13px] leading-relaxed text-[#525766]">Send an active request to selected eligible Support Workers, Providers or both.</p>
          <p className="mt-2 text-[13px] text-[#525766]"><strong className="font-semibold text-[#17181d]">Pro subscribers</strong> · Packages &amp; rates to be decided</p>
          <p className="mt-2 text-xs text-[#69707e]">Separate from the existing Speed add-on. No Speed purchase is required. Ordinary matching continues without SMS.</p>
        </div>
        <OutlineButton href="/shift-blast">Explore Shift Blast</OutlineButton>
      </section>

      <p className="text-xs text-[#69707e]">Prices shown include GST. Shift Blast has no final package or price. Pro, Growth and Speed are separate subscriptions; an add-on never grants participant authority.</p>
    </WorkspacePage>
  );
}
