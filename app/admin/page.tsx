"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStats, getVerificationQueue, type PlatformStats, type AdminUser } from "@/lib/api/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [queue, setQueue]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStats(), getVerificationQueue({ limit: 5 })])
      .then(([s, q]) => { setStats(s); setQueue(q.users); })
      .catch((e) => setError(e.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Platform overview — Shiftify Admin Console"
      />
      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Users"     value={loading ? "..." : (stats?.totalUsers ?? 0)} />
          <StatCard label="Suspended"       value={loading ? "..." : (stats?.suspendedUsers ?? 0)} tone="warn" />
          <StatCard label="Active Jobs"     value={loading ? "..." : (stats?.activeJobs ?? 0)} tone="ok" />
          <StatCard label="Completed Today" value={loading ? "..." : (stats?.completedToday ?? 0)} />
        </div>

        {stats && (
          <Card>
            <CardHeader><CardTitle>Users by role</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.roleBreakdown ?? {}).map(([role, count]) => (
                  <div key={role} className="rounded-lg bg-slate-100 px-4 py-3 text-center min-w-[100px]">
                    <div className="text-2xl font-bold text-slate-800">{count as number}</div>
                    <div className="text-xs text-slate-500 mt-1">{role.replace("_", " ")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Suspended users queue</CardTitle>
            <Link href="/admin/verification"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-slate-400">Loading...</p>
              : !queue.length ? <p className="text-sm text-slate-500">No suspended users.</p>
              : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {queue.map((u) => (
                    <li key={u.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{u.name}</span>
                        <span className="ml-2 text-slate-500 text-xs">{u.email}</span>
                      </div>
                      <Link href={`/admin/users`}>
                        <Button variant="ghost" size="sm">Review</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
