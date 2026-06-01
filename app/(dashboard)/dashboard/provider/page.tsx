"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDashboard, type ProviderDashboard } from "@/lib/api/dashboard";

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [data, setData]       = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as ProviderDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Manage your team's active jobs and expressions of interest."
      />
      <div className="container-page py-8 space-y-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Expressions of Interest" value={loading ? "..." : (data?.pendingExpressions?.length ?? 0)} tone="ok" />
          <StatCard label="Active Shifts"           value={loading ? "..." : (data?.activeShifts?.length ?? 0)} />
          <StatCard label="Unassigned (accepted)"   value={loading ? "..." : (data?.unassignedAccepted?.length ?? 0)} tone="warn" />
          <StatCard label="Unread Notifications"    value={loading ? "..." : (data?.unreadNotifications ?? 0)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending expressions</CardTitle>
              <Link href="/jobs"><Button variant="ghost" size="sm">Browse</Button></Link>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-slate-400">Loading...</p>
                : !data?.pendingExpressions?.length ? <p className="text-sm text-slate-500">No pending expressions.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.pendingExpressions.map((e) => (
                      <li key={e.applicationId} className="py-2 flex justify-between">
                        <span className="font-medium">{e.job.title}</span>
                        <span className="text-slate-500">{e.job.suburb}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active shifts</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-slate-400">Loading...</p>
                : !data?.activeShifts?.length ? <p className="text-sm text-slate-500">No active shifts right now.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.activeShifts.map((s) => (
                      <li key={s.id} className="py-2 flex justify-between">
                        <span className="font-medium">{s.title}</span>
                        <span className="text-slate-500">{s.suburb}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
