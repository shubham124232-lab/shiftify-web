"use client";

// Support Coordinator "Refer & Earn": own code and link, one combined 0–10 counter, referral activity.
// Same /refer-and-earn/me data as the Provider page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, Chip, Empty, ErrorNote, OutlineButton, PrimaryButton, BORDER,
} from "@/components/coordinator/workspace-ui";

interface Referral { id: string; name: string; role: string; status: "PENDING" | "QUALIFIED" | "NOT_ELIGIBLE"; reason: string | null; createdAt: string }
interface Data {
  eligible: boolean; ineligibleReason: string | null; code: string; target: number; qualified: number;
  rewardUnlocked: boolean; rewardCovers: string | null; referrals: Referral[];
}

const STATUS: Record<Referral["status"], { label: string; tone: "amber" | "green" | "slate" }> = {
  PENDING: { label: "Pending", tone: "amber" },
  QUALIFIED: { label: "Qualified", tone: "green" },
  NOT_ELIGIBLE: { label: "Not eligible", tone: "slate" },
};

export default function CoordinatorReferAndEarnPage() {
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
    <WorkspacePage title="Refer & Earn" description="Help more independent professionals join Shiftify.">
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data ? (!error && <Empty>Loading…</Empty>) : (
        <>
          {!data.eligible && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {data.ineligibleReason} <Link href="/subscription" className="font-semibold underline">View plans</Link>
            </div>
          )}
          <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
            <Panel title={data.rewardUnlocked ? "Your free Pro month is unlocked" : "Your progress"}>
              <p className="text-sm text-slate-600">One combined counter across Providers, Independent Support Workers and Support Coordinators.</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-[30px] font-extrabold leading-none text-slate-900">{data.qualified}</span>
                <span className="text-sm font-semibold text-slate-500">/ {data.target} qualifying registrations</span>
              </p>
              <div className="mt-3 h-1 w-full max-w-md rounded-full bg-slate-100">
                <div className="h-1 rounded-full bg-brand-600" style={{ width: `${Math.min(100, (data.qualified / Math.max(1, data.target)) * 100)}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-800">
                {data.rewardUnlocked
                  ? `Reward recorded for your next eligible Pro monthly renewal${data.rewardCovers ? `, covering the billing cycle after ${new Date(data.rewardCovers).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : ""}.`
                  : `${remaining} more qualifying registration${remaining === 1 ? "" : "s"} to unlock your next month free.`}
              </p>
              <p className="mt-2 text-xs text-slate-500">A registration counts after contact verification and profile completion. No subscription purchase is required to count.</p>
            </Panel>
            <Panel title="Your referral code">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-lg border ${BORDER} bg-slate-50 px-3 py-3 font-mono text-lg font-bold tracking-[3px] text-slate-900`}>{data.code}</span>
                <OutlineButton onClick={() => void copy("code")}>{copied === "code" ? "Copied ✓" : "Copy code"}</OutlineButton>
              </div>
              <PrimaryButton onClick={() => void copy("link")} className="mt-4">{copied === "link" ? "Link copied ✓" : "Copy referral link"}</PrimaryButton>
              <p className="mt-3 text-sm text-slate-600">Your new referred customer receives 50% off their first eligible monthly subscription. Later renewals are at full price.</p>
            </Panel>
          </div>
          <Panel title="Referral activity" bodyClassName="px-5">
            {!data.referrals.length ? <Empty>No referrals yet. Share your code or link to get started.</Empty> : (
              <div className="divide-y divide-[#e4e6ed]">
                {data.referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{r.role} · {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}{r.reason ? ` · ${r.reason}` : ""}</p>
                    </div>
                    <Chip tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Chip>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </WorkspacePage>
  );
}
