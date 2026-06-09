"use client";
import { SetupBanner } from "@/components/dashboard/setup-banner";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboard, type WorkerDashboard } from "@/lib/api/dashboard";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState<WorkerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as WorkerDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Your upcoming shifts and nearby opportunities."
        actions={<Link href="/jobs"><Button>Browse Jobs</Button></Link>}
      />
      <SetupBanner />
      <div className="container-page py-8 space-y-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Upcoming Shifts"      value={loading ? "..." : (data?.upcomingShifts?.length ?? 0)} />
          <StatCard label="Nearby Jobs"          value={loading ? "..." : (data?.nearbyJobs?.length ?? 0)} tone="ok" />
          <StatCard label="Pending Applications" value={loading ? "..." : (data?.pendingApplications?.length ?? 0)} />
          <StatCard label="Unread Notifications" value={loading ? "..." : (data?.unreadNotifications ?? 0)} tone="warn" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Upcoming shifts</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-slate-400">Loading...</p>
                : !data?.upcomingShifts?.length ? <p className="text-sm text-slate-500">No upcoming shifts.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.upcomingShifts.map((s) => (
                      <li key={s.id} className="py-2 flex justify-between">
                        <span className="font-medium">{s.title}</span>
                        <span className="text-slate-500">{new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nearby jobs</CardTitle>
              <Link href="/jobs"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-slate-400">Loading...</p>
                : !data?.nearbyJobs?.length ? <p className="text-sm text-slate-500">No nearby jobs right now.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.nearbyJobs.slice(0, 5).map((j) => (
                      <li key={j.id} className="py-2 flex justify-between">
                        <div>
                          <span className="font-medium">{j.title}</span>
                          <span className="ml-2 text-slate-400">{j.suburb}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${j.urgency === "EMERGENCY" ? "bg-red-100 text-red-700" : j.urgency === "SAME_DAY" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{j.urgency}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending applications</CardTitle>
            <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-slate-400">Loading...</p>
              : !data?.pendingApplications?.length ? <p className="text-sm text-slate-500">No pending applications.</p>
              : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {data.pendingApplications.map((a) => (
                    <li key={a.applicationId} className="py-2 flex justify-between">
                      <span className="font-medium">{a.job.title}</span>
                      <span className="text-slate-500">{a.job.suburb}</span>
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
