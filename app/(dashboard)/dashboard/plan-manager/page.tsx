"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type PlanManagerDashboard } from "@/lib/api/dashboard";
import { Button } from "@/components/ui/button";

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// TODO: replace each block with a real API call when the backend endpoint is ready.

const PH_STATS = {
  activeParticipantCases:       18,
  openReferrals:                 6,
  unfilledGaps:                  3,
  pendingConfirmations:          4,
  serviceAgreementsOutstanding:  2,
  participantsNeedingProvider:   5,
};

const PH_PARTICIPANT_CASES = [
  { id: "pc1", name: "Linda W.", plan: "Plan-managed", gap: "Personal Care", status: "Provider sourcing" },
  { id: "pc2", name: "Raj S.",   plan: "Plan-managed", gap: "Transport",     status: "Agreement pending" },
  { id: "pc3", name: "Omar F.",  plan: "Plan-managed", gap: "Overnight",     status: "No provider yet"   },
];

const PH_SAVED_PROVIDERS = [
  { id: "sp1", name: "Sunrise Care Group",    services: "Personal Care, Community Access", rating: 4.8 },
  { id: "sp2", name: "Community First NDIS",  services: "Domestic, Transport",             rating: 4.6 },
  { id: "sp3", name: "Allied Health Connect", services: "Nursing, High Intensity",         rating: 4.9 },
];

const PH_GAPS = [
  { id: "g1", participant: "Linda W.",  service: "Personal Care",     urgency: "URGENT"    },
  { id: "g2", participant: "Marcus T.", service: "Community Access",  urgency: "SCHEDULED" },
  { id: "g3", participant: "Ayesha P.", service: "Overnight Support", urgency: "URGENT"    },
];
// ──────────────────────────────────────────────────────────────────────────────

export default function PlanManagerDashboardPage() {
  const { user } = useAuth();
  const [data,    setData]    = useState<PlanManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as PlanManagerDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Your participant cases, referrals, and invoices."
        actions={
          <div className="flex gap-2">
            <Link href="/jobs"><Button>Browse Requests</Button></Link>
            {/* TODO: post-referral-request page */}
            <Button variant="outline" size="sm" disabled>Post Referral Request</Button>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards: first 4 LIVE, rest PLACEHOLDER ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-10">
          {/* LIVE */}
          <StatCard label="Total Connections"  value={loading ? "…" : ((data?.connectionCounts?.pending ?? 0) + (data?.connectionCounts?.accepted ?? 0))} />
          <StatCard label="Pending Requests"   value={loading ? "…" : (data?.connectionCounts?.pending  ?? 0)} tone="warn" />
          <StatCard label="Active Connections" value={loading ? "…" : (data?.connectionCounts?.accepted ?? 0)} tone="ok"   />
          <StatCard label="Recent Invoices"    value={loading ? "…" : (data?.recentInvoices?.length     ?? 0)}              />
          {/* PLACEHOLDER – TODO: include in PlanManagerDashboard API response */}
          <StatCard label="Participant Cases"       value={PH_STATS.activeParticipantCases}      tone="ok"     />
          <StatCard label="Open Referrals"          value={PH_STATS.openReferrals}                             />
          <StatCard label="Unfilled Gaps"           value={PH_STATS.unfilledGaps}               tone="danger" />
          <StatCard label="Pending Confirmations"   value={PH_STATS.pendingConfirmations}        tone="warn"   />
          <StatCard label="Service Agreements Due"  value={PH_STATS.serviceAgreementsOutstanding} tone="warn" />
          <StatCard label="Needing Provider"        value={PH_STATS.participantsNeedingProvider} tone="danger" />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">      <Button variant="outline" size="sm">🔍 Browse Requests</Button></Link>
          {/* TODO: referral request + participant cases pages */}
          <Button variant="outline" size="sm" disabled>＋ Post Referral Request</Button>
          <Button variant="outline" size="sm" disabled>👤 View Participant Cases</Button>
          <Button variant="outline" size="sm" disabled>📋 View Provider Responses</Button>
          <Button variant="outline" size="sm" disabled>🔍 View Unfilled Gaps</Button>
          <Link href="/messages">  <Button variant="outline" size="sm">💬 Message Providers</Button></Link>
          <Button variant="outline" size="sm" disabled>🤝 Update Provider Network</Button>
          <Link href="/invoices">  <Button variant="outline" size="sm">🧾 Invoices</Button></Link>
        </div>

        {/* ── LIVE: recent invoices ── */}
        <Card>
          <CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader>
          <CardContent>
            {loading
              ? <p className="text-sm text-slate-400">Loading…</p>
              : !data?.recentInvoices?.length
                ? <p className="text-sm text-slate-500">No invoices received yet.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="pb-2 text-left font-medium text-slate-600">Participant</th>
                          <th className="pb-2 text-left font-medium text-slate-600">Sent by</th>
                          <th className="pb-2 text-left font-medium text-slate-600">Hours</th>
                          <th className="pb-2 text-left font-medium text-slate-600">Date</th>
                          <th className="pb-2 text-left font-medium text-slate-600">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recentInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-2">{inv.participant?.name ?? "—"}</td>
                            <td className="py-2">{inv.sender?.name ?? "—"}</td>
                            <td className="py-2">{inv.hours ?? "—"}</td>
                            <td className="py-2">{new Date(inv.sentAt).toLocaleDateString()}</td>
                            <td className="py-2 text-slate-500">{inv.note ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
          </CardContent>
        </Card>

        {/* ── Row 2: PLACEHOLDER – participant cases + service gaps ── */}
        {/* TODO: GET /plan-manager/participant-cases  |  GET /plan-manager/gaps */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Participant cases</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_PARTICIPANT_CASES.map((c) => (
                  <li key={c.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-slate-400">{c.gap}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "No provider yet"   ? "bg-red-100 text-red-700"
                      : c.status === "Agreement pending" ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                    }`}>{c.status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Service gaps</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_GAPS.map((g) => (
                  <li key={g.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{g.participant}</span>
                      <span className="ml-2 text-xs text-slate-400">{g.service}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      g.urgency === "URGENT" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                    }`}>{g.urgency}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ── PLACEHOLDER – saved providers ── */}
        {/* TODO: GET /plan-manager/saved-providers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved providers / network</CardTitle>
            <Button variant="ghost" size="sm">View all</Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 text-sm">
              {PH_SAVED_PROVIDERS.map((p) => (
                <li key={p.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{p.services}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">★ {p.rating}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
