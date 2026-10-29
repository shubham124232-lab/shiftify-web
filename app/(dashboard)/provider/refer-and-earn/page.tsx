"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

interface Referral { id: string; name: string; role: string; status: "PENDING" | "QUALIFIED" | "NOT_ELIGIBLE"; reason: string | null; createdAt: string }
interface Data {
  eligible: boolean; ineligibleReason: string | null; code: string; target: number; qualified: number;
  rewardUnlocked: boolean; rewardCovers: string | null; referrals: Referral[];
}

const STATUS: Record<Referral["status"], { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "pd-badge-orange" },
  QUALIFIED: { label: "Qualified", cls: "pd-badge-green" },
  NOT_ELIGIBLE: { label: "Not eligible", cls: "" },
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
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Refer &amp; Earn</h1>
            <p>Grow your support network. Get your next month on us.</p>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!data ? <div className="pd-quiet-empty">Loading…</div> : (
          <>
            {!data.eligible && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {data.ineligibleReason} <Link href="/subscription" className="pd-textbtn">View plans</Link>
              </div>
            )}
            <div className="pd-grid2">
              <section className="pd-panel">
                <div className="pd-panel-head"><h2>Your referral link</h2></div>
                <div className="pd-panel-body">
                  <p>Invite Providers, Independent Support Workers and Support Coordinators. All eligible roles count towards the same target.</p>
                  <label className="pd-form-field">Your referral code<input readOnly value={data.code} /></label>
                  <label className="pd-form-field">Your referral link<input readOnly value={link} /></label>
                  <div className="pd-buttons">
                    <button type="button" className="pd-btn pd-btn-primary" onClick={() => void copy("link")}>{copied === "link" ? <Check /> : <Copy />}Copy link</button>
                    <button type="button" className="pd-btn" onClick={() => void copy("code")}>{copied === "code" ? <Check /> : <Copy />}Copy code</button>
                  </div>
                  <p className="pd-note">Referred people get 50% off their first eligible monthly subscription payment, then normal-price renewals. Annual plans, Shift Pass and Pay-as-you-go are excluded. One introductory offer per new customer; discounts cannot be combined.</p>
                </div>
              </section>
              <section className="pd-panel">
                <div className="pd-panel-head"><h2>Your progress</h2></div>
                <div className="pd-panel-body">
                  <strong className="pd-referral-count">{data.rewardUnlocked ? "Free month unlocked" : `${data.qualified} / ${data.target}`}</strong>
                  <p style={{ margin: 0 }}>
                    {data.rewardUnlocked
                      ? `Your next monthly invoice is free${data.rewardCovers ? `, covering the billing cycle after ${new Date(data.rewardCovers).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : ""}. Your subscription is not cancelled.`
                      : `${remaining} more qualifying registration${remaining === 1 ? "" : "s"} to unlock your next month free.`}
                  </p>
                  <progress className="pd-referral-progress" value={data.qualified} max={data.target} aria-label="Qualifying referrals">{data.qualified} of {data.target}</progress>
                  <p className="pd-note">One combined counter. Registering through your code and completing the profile qualifies; a paid subscription is not required. This counter is separate from your free-action counter.</p>
                </div>
              </section>
            </div>

            <section className="pd-panel">
              <div className="pd-panel-head"><h2>Your referrals</h2></div>
              <div className="pd-panel-body">
                {data.referrals.length === 0 ? <div className="pd-quiet-empty">No referrals yet. Share your code or link to get started.</div> : data.referrals.map((r) => (
                  <div key={r.id} className="pd-ticket-row">
                    <div>
                      <strong>{r.name}</strong>
                      <p>{r.role} · {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}{r.reason ? ` · ${r.reason}` : ""}</p>
                    </div>
                    <span className={`pd-badge ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                  </div>
                ))}
                <p className="pd-note">Available to active subscribed Providers. Provider-managed workers, Plan Managers, self-referrals, duplicate accounts and extra Branches of your own organisation do not count.</p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
