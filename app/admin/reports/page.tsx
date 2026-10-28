"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReports, type PlatformReports } from "@/lib/api/admin";

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData]       = useState<PlatformReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getReports()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Reports" description="Platform growth, activity and demand insights." />
      <div className="container-page py-8 space-y-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <p className="text-sm text-slate-400">Loading reports…</p>
        ) : data && (
          <>
            {/* Growth */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Growth</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="New users (30 days)" value={data.users.newLast30Days} tone="ok" />
                <Stat label="New users (7 days)"  value={data.users.newLast7Days}  tone="ok" />
                <Stat label="Suspended accounts"  value={data.users.suspended}     tone="warn" />
                <Stat label="Invoices (30 days)"  value={data.invoices.last30Days} />
              </div>
            </div>

            {/* Marketplace */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Marketplace</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Active requests"        value={data.listings.active} />
                <Stat label="Urgent open cases"      value={data.listings.urgentOpenCases} tone="warn" />
                <Stat label="PM connections (total)" value={data.planManager.totalConnections} />
                <Stat label="PM connections (accepted)" value={data.planManager.acceptedConnections} tone="ok" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Users by role */}
              <Card>
                <CardHeader><CardTitle>Users by role</CardTitle></CardHeader>
                <CardContent>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {Object.entries(data.users.byRole).map(([role, count]) => (
                      <li key={role} className="py-2 flex justify-between">
                        <span className="font-medium">{role.replaceAll("_", " ")}</span>
                        <span className="text-slate-500">{count}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Top categories */}
              <Card>
                <CardHeader><CardTitle>Top requested categories</CardTitle></CardHeader>
                <CardContent>
                  {!data.listings.topCategories.length
                    ? <p className="text-sm text-slate-500">No request data yet.</p>
                    : (
                      <ul className="divide-y divide-slate-100 text-sm">
                        {data.listings.topCategories.map((c) => (
                          <li key={c.category} className="py-2 flex justify-between">
                            <span className="font-medium">{c.category.replaceAll("_", " ")}</span>
                            <span className="text-slate-500">{c.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
