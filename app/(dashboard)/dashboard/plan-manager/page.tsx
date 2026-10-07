"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActionTilesCard, type ActionTile } from "@/components/dashboard/action-tiles";
import { DashboardTabCard } from "@/components/dashboard/tab-card";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { LiveShiftboardTeaser } from "@/components/dashboard/live-shiftboard-teaser";
import { getDashboard, type PlanManagerDashboard } from "@/lib/api/dashboard";
import { listLinkedParticipants, type LinkedParticipant } from "@/lib/api/pm";
import {
  Search, ClipboardList, Link2, MessageSquare, Receipt, FileText,
} from "lucide-react";

export default function PlanManagerDashboardPage() {
  const { user } = useAuth();
  const [data,         setData]         = useState<PlanManagerDashboard | null>(null);
  const [participants, setParticipants] = useState<LinkedParticipant[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [ptLoading,    setPtLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as PlanManagerDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    listLinkedParticipants()
      .then((list) => setParticipants(list))
      .catch(() => setParticipants([]))
      .finally(() => setPtLoading(false));
  }, []);

  if (!user) return null;

  const totalOpenJobs = participants.reduce((s, p) => s + p.openJobs, 0);
  const totalInvoices = participants.reduce((s, p) => s + p.invoiceCount, 0);
  const unread = data?.unreadNotifications ?? 0;

  const tiles: ActionTile[] = [
    { key: "load-board", icon: Search,        title: "Browse Load Board", subtitle: "Find new referrals",       ctaLabel: "Browse Load Board", href: "/load-board", highlighted: true },
    { key: "referrals",  icon: ClipboardList, title: "My Referrals",      subtitle: ptLoading ? "Track referral progress" : `${totalOpenJobs} open referral${totalOpenJobs === 1 ? "" : "s"}`, ctaLabel: "My Referrals", href: "/referrals" },
  ];

  const quickActions: QuickAction[] = [
    { key: "connections", icon: Link2,          label: `Connections (${loading ? "…" : ((data?.connectionCounts?.pending ?? 0) + (data?.connectionCounts?.accepted ?? 0))})`, href: "/connections" },
    { key: "invoices",    icon: Receipt,        label: ptLoading ? "Invoices" : `Invoices (${totalInvoices})`, href: "/invoices" },
    { key: "messages",    icon: MessageSquare,  label: unread > 0 ? `Messages (${unread})` : "Message providers", href: "/messages" },
    { key: "documents",   icon: FileText,       label: "Documents", href: "/documents" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as unknown as { username: string }).username || "there").split(" ")[0]}
        description="Your participant cases, referrals, and invoices."
      />
      <SetupBanner />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          <ActionTilesCard title="Manage your caseload" tiles={tiles} />

          <DashboardTabCard
            title="Invoices & participants"
            tabs={[
              {
                key: "invoices", label: "Recent Invoices", count: loading ? undefined : (data?.recentInvoices?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.recentInvoices?.length
                    ? <p className="py-4 text-sm text-slate-500">No invoices received yet.</p>
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
                    ),
              },
              {
                key: "participants", label: "Linked Participants", count: ptLoading ? undefined : participants.length,
                content: ptLoading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !participants.length
                    ? <p className="py-4 text-sm text-slate-500">No linked participants yet. Participants can request a connection from their dashboard.</p>
                    : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-slate-200">
                            <tr>
                              <th className="pb-2 text-left font-medium text-slate-600">Name</th>
                              <th className="pb-2 text-left font-medium text-slate-600">NDIS #</th>
                              <th className="pb-2 text-left font-medium text-slate-600">Funding type</th>
                              <th className="pb-2 text-left font-medium text-slate-600">Open referrals</th>
                              <th className="pb-2 text-left font-medium text-slate-600">Invoices</th>
                              <th className="pb-2 text-left font-medium text-slate-600">Linked since</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {participants.map((p) => (
                              <tr key={p.connectionId}>
                                <td className="py-2 font-medium">{p.participant.name}</td>
                                <td className="py-2 text-slate-500">{p.participant.participantProfile?.ndisNumber ?? "—"}</td>
                                <td className="py-2 text-slate-500">{p.participant.participantProfile?.fundingManagementType ?? "—"}</td>
                                <td className="py-2">
                                  {p.openJobs > 0
                                    ? <span className="rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-700">{p.openJobs} open</span>
                                    : <span className="text-slate-400">—</span>}
                                </td>
                                <td className="py-2">{p.invoiceCount}</td>
                                <td className="py-2 text-slate-500">{new Date(p.linkedSince).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ),
              },
            ]}
          />

          <LiveShiftboardTeaser />
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">
          <QuickActionsPanel actions={quickActions} />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}
