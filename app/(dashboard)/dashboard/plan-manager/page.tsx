"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type PlanManagerDashboard } from "@/lib/api/dashboard";

export default function PlanManagerDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState<PlanManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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
        description="Your invoices and participant connections."
      />
      <div className="container-page py-8 space-y-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Connections"  value={loading ? "..." : ((data?.connectionCounts?.pending ?? 0) + (data?.connectionCounts?.accepted ?? 0))} />
          <StatCard label="Pending Requests"   value={loading ? "..." : (data?.connectionCounts?.pending ?? 0)} tone="warn" />
          <StatCard label="Active Connections" value={loading ? "..." : (data?.connectionCounts?.accepted ?? 0)} tone="ok" />
          <StatCard label="Recent Invoices"    value={loading ? "..." : (data?.recentInvoices?.length ?? 0)} />
        </div>

        <Card>
          <CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-slate-400">Loading...</p>
              : !data?.recentInvoices?.length ? <p className="text-sm text-slate-500">No invoices received yet.</p>
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
      </div>
    </>
  );
}
