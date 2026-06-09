"use client";
import { SetupBanner } from "@/components/dashboard/setup-banner";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboard, type ParticipantDashboard } from "@/lib/api/dashboard";

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState<ParticipantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as ParticipantDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Your support requests and upcoming shifts."
        actions={<Link href="/jobs/post"><Button>Post a job</Button></Link>}
      />
      <SetupBanner />
      <div className="container-page py-8 space-y-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Open Jobs"             value={loading ? "..." : (data?.openJobs?.length ?? 0)} tone="ok" />
          <StatCard label="Upcoming Shifts"       value={loading ? "..." : (data?.upcomingShifts?.length ?? 0)} />
          <StatCard label="Awaiting Confirmation" value={loading ? "..." : (data?.awaitingConfirmation?.length ?? 0)} tone="warn" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My open jobs</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-slate-400">Loading...</p>
                : !data?.openJobs?.length ? <p className="text-sm text-slate-500">No open jobs. Post one to get started.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.openJobs.map((j) => (
                      <li key={j.id} className="py-2 flex justify-between">
                        <span className="font-medium">{j.title}</span>
                        <span className="text-slate-500">{j.suburb}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>

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
