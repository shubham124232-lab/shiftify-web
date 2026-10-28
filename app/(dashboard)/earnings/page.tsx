"use client";

// SW doc Window 41 — support-payment progress, kept separate from membership. Shiftify does not process
// or verify support payments (0% commission, invoicing is a record only), so "Paid" is the worker's own record.

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

interface EarningRecord {
  id: string; title: string; category: string; supportDate: string; hours: number | null;
  agreedRate: number | null; amount: number | null; fundingType: string | null; payer: string | null;
  paymentRoute: string; stage: "AWAITING_APPROVAL" | "APPROVED" | "INVOICED" | "PAID" | "ATTENTION";
  paidAt: string | null; incident: boolean;
}

const TABS: { key: EarningRecord["stage"]; label: string; hint: string }[] = [
  { key: "AWAITING_APPROVAL", label: "Awaiting approval", hint: "Completion records the poster has not confirmed yet." },
  { key: "APPROVED",          label: "Approved",          hint: "Confirmed by the poster. Arrange payment directly with the payer." },
  { key: "INVOICED",          label: "Invoiced or sent",  hint: "An invoice record has been shared with the payer." },
  { key: "PAID",              label: "Paid",              hint: "Support you have recorded as paid." },
  { key: "ATTENTION",         label: "Requires attention", hint: "An incident or safety concern was flagged on these completion records." },
];

const money = (n: number | null) => (n == null ? "—" : `$${n.toFixed(2)}`);

export default function EarningsPage() {
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<EarningRecord["stage"] | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    return api.get<{ records: EarningRecord[] }>("/jobs/earnings/mine")
      .then(r => setRecords(r.records ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function setPaid(id: string, paid: boolean) {
    setActing(id);
    try { await api.patch(`/jobs/${id}/worker-payment`, { paid }); await load(); }
    catch (e: unknown) { setError((e as { message?: string })?.message ?? "Could not update the payment record."); }
    finally { setActing(null); }
  }

  const count = (k: EarningRecord["stage"]) => records.filter(r => r.stage === k).length;
  const active = tab ?? (TABS.find(t => count(t.key) > 0)?.key ?? "AWAITING_APPROVAL");
  const shown = records.filter(r => r.stage === active);

  return (
    <>
      <PageHeader title="Earnings and payment status" description="Track support payment progress. This is separate from your Shiftify membership." />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 font-medium mb-4">
          0% commission — there is no Shiftify percentage deduction from the amount you agree with the payer.
        </div>
        <p className="text-xs text-slate-500 mt-0 mb-4">Payment for support is arranged directly between you and the payer. Shiftify does not process, hold or verify these payments, so &ldquo;Paid&rdquo; is your own record.</p>

        <div className="flex gap-2 flex-wrap mb-2">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`h-8 px-4 rounded-full border text-sm font-semibold transition-colors ${active === t.key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {t.label}{loading ? "" : ` (${count(t.key)})`}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-0 mb-4">{TABS.find(t => t.key === active)?.hint}</p>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : shown.length === 0 ? (
          <div className="text-center py-12"><p className="text-base font-semibold text-slate-700 m-0">Nothing here yet</p></div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map(r => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800">{JOB_CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(r.supportDate).toLocaleDateString("en-AU", { dateStyle: "medium" })}
                      {r.hours != null ? ` · ${r.hours} h` : ""}
                      {r.agreedRate != null ? ` · $${r.agreedRate}/hr` : " · rate per funding type"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Payer: {r.payer ?? "—"} · {r.paymentRoute}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-800">{money(r.amount)}</div>
                    <div className="text-[11px] text-slate-400">{r.paidAt ? `Paid ${new Date(r.paidAt).toLocaleDateString("en-AU")}` : "Not recorded as paid"}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-2.5">
                  <Link href={`/jobs/${r.id}`}><Button size="sm" variant="outline">View record</Button></Link>
                  <Link href={`/jobs/${r.id}/invoice`}><Button size="sm" variant="outline">Invoice record</Button></Link>
                  <Link href={`/jobs/${r.id}#job-messages`}><Button size="sm" variant="outline">Contact payer</Button></Link>
                  {r.stage !== "PAID"
                    ? <Button size="sm" disabled={acting === r.id} onClick={() => setPaid(r.id, true)}>Record as paid</Button>
                    : <Button size="sm" variant="ghost" disabled={acting === r.id} onClick={() => setPaid(r.id, false)}>Undo paid</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
