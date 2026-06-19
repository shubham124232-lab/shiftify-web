"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type PlanManagerDashboard } from "@/lib/api/dashboard";
import { listLinkedParticipants, type LinkedParticipant } from "@/lib/api/pm";
import { Button } from "@/components/ui/button";

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

  const totalOpenJobs   = participants.reduce((s, p) => s + p.openJobs, 0);
  const totalInvoices   = participants.reduce((s, p) => s + p.invoiceCount, 0);

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as unknown as { username: string }).username || "there").split(" ")[0]}`}
        description="Your participant cases, referrals, and invoices."
        actions={
          <div className="flex gap-2">
            <Link href="/jobs"><Button>Browse Requests</Button></Link>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Connections"  value={loading  ? "…" : ((data?.connectionCounts?.pending ?? 0) + (data?.connectionCounts?.accepted ?? 0))} />
          <StatCard label="Pending Requests"   value={loading  ? "…" : (data?.connectionCounts?.pending  ?? 0)} tone="warn" />
          <StatCard label="Active Connections" value={loading  ? "…" : (data?.connectionCounts?.accepted ?? 0)} tone="ok"   />
          <StatCard label="Linked Participants" value={ptLoading ? "…" : participants.length}                   tone="ok"   />
          <StatCard label="Open Referrals"     value={ptLoading ? "…" : totalOpenJobs}                                       />
          <StatCard label="Total Invoices"     value={ptLoading ? "…" : totalInvoices}                                       />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">     <Button variant="outline" size="sm">Browse Requests</Button></Link>
          <Link href="/messages"> <Button variant="outline" size="sm">Message Providers</Button></Link>
          <Link href="/invoices"> <Button variant="outline" size="sm">Invoices</Button></Link>
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

        {/* ── LIVE: linked participants ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Linked participants</CardTitle>
            <Link href="/participants"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {ptLoading
              ? <p className="text-sm text-slate-400">Loading…</p>
              : !participants.length
                ? <p className="text-sm text-slate-500">No linked participants yet. Participants can request a connection from their dashboard.</p>
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
                )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
