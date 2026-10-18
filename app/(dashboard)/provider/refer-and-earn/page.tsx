"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Referral { id: string; name: string; role: string; status: "PENDING" | "QUALIFIED" | "NOT_ELIGIBLE"; reason: string | null; createdAt: string }
interface Data {
  eligible: boolean; ineligibleReason: string | null; code: string; target: number; qualified: number;
  rewardUnlocked: boolean; rewardCovers: string | null; referrals: Referral[];
}

const STATUS: Record<Referral["status"], { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  QUALIFIED: { label: "Qualified", cls: "bg-emerald-50 text-emerald-700" },
  NOT_ELIGIBLE: { label: "Not eligible", cls: "bg-slate-100 text-slate-600" },
};

// Provider "Refer & Earn" (Provider handoff): own code and link, one combined 0-10 counter, referral list, free-month status.
// The free-action counter on the dashboard is separate from this counter.
export default function ReferAndEarnPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    api.get<Data>("/refer-and-earn/me").then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load Refer & Earn"));
  }, []);

  const link = data && typeof window !== "undefined" ? `${window.location.origin}/register?ref=${data.code}` : "";
  async function copy(kind: "code" | "link") {
    if (!data) return;
    try { await navigator.clipboard.writeText(kind === "code" ? data.code : link); setCopied(kind); setTimeout(() => setCopied(null), 1800); } catch { setError("Could not copy. Select the text and copy it manually."); }
  }

  const remaining = data ? Math.max(0, data.target - data.qualified) : 0;
  return (
    <div className="space-y-5 px-8 py-6">
      <div>
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Refer &amp; Earn</h1>
        <p className="m-0 mt-1.5 text-[15px] text-slate-500">Invite Providers, Independent Support Workers and Support Coordinators. Every 10 qualifying registrations unlock a free month.</p>
      </div>
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!data ? <div className="h-32 animate-pulse rounded-2xl bg-slate-100" /> : (
        <>
          {!data.eligible && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              {data.ineligibleReason} <Link href="/subscription" className="font-semibold underline">View plans</Link>
            </div>
          )}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="m-0 text-lg font-bold text-slate-900">
              {data.rewardUnlocked ? "Next month free unlocked" : `${data.qualified} / ${data.target} qualifying referrals`}
            </p>
            <p className="m-0 mt-1 text-sm text-slate-500">
              {data.rewardUnlocked
                ? `Your next monthly invoice is free${data.rewardCovers ? `, covering the billing cycle after ${new Date(data.rewardCovers).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : ""}. Your subscription is not cancelled.`
                : `${data.qualified} / ${data.target} qualifying referrals - ${remaining} more to unlock your next month free.`}
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-6">
              <div>
                <p className="m-0 text-xs font-semibold text-slate-500">Your code</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-base font-bold text-slate-900">{data.code}</code>
                  <Button variant="outline" size="sm" onClick={() => void copy("code")}>{copied === "code" ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}Copy code</Button>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-xs font-semibold text-slate-500">Your link</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{link}</code>
                  <Button variant="outline" size="sm" onClick={() => void copy("link")}>{copied === "link" ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}Copy link</Button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white">
            <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Referrals</h2>
            {data.referrals.length === 0 ? <p className="m-0 px-6 py-10 text-sm text-slate-500">No referrals yet. Share your code or link to get started.</p> : (
              <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                {data.referrals.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="m-0 text-sm font-bold text-slate-900">{r.name}</p>
                      <p className="m-0 mt-0.5 text-xs text-slate-500">{r.role} · {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}{r.reason ? ` · ${r.reason}` : ""}</p>
                    </div>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600">
            <p className="m-0 font-semibold text-slate-900">How it works</p>
            <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
              <li>A referral counts once the new person verifies their contact details and completes their profile. A subscription is not required.</li>
              <li>Provider-managed workers, Plan Managers, self-referrals, duplicate accounts and extra Branches of your own organisation do not count.</li>
              <li>At 10 qualifying registrations you earn your next monthly invoice free. This counter is separate from your free-action counter.</li>
              <li>Referred people get 50% off their first eligible monthly subscription payment.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
