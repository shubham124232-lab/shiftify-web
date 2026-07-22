"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboard, type CoordinatorDashboard } from "@/lib/api/dashboard";
import { api } from "@/lib/api";

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// "Requests expiring soon" needs applicationDeadlineAt, which /jobs/my doesn't
// currently select — genuinely not exposed, still a placeholder. Same for
// "Participants w/ Gaps" (needs a per-participant join /jobs/my doesn't have).
// Everything else on this page is now live — including Unfilled Needs and
// Responses Received, which turned out to already be in the /jobs/my response
// (_count.applications) — just unused until now.

const PH_STATS = {
  expiringRequests:     1,
  participantsWithGaps: 4,
};

const PH_EXPIRING = [
  { id: "e1", title: "Weekly Domestic – Linda W.", expiresIn: "2 days" },
  { id: "e2", title: "Transport Support – Raj S.", expiresIn: "5 days" },
];
// ──────────────────────────────────────────────────────────────────────────────

interface MyJob {
  id: string; title: string; status: string; urgency: string; suburb: string;
  _count: { applications: number };
}

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [data,        setData]        = useState<CoordinatorDashboard | null>(null);
  const [myJobs,       setMyJobs]      = useState<MyJob[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [jobsLoading,  setJobsLoading] = useState(true);
  const [error,        setError]       = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as CoordinatorDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api.get<{ jobs: MyJob[] }>("/jobs/my")
      .then((r) => setMyJobs(r.jobs ?? []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, []);

  if (!user) return null;

  const urgentCount = data?.openJobs?.filter(
    (j) => j.urgency === "EMERGENCY" || j.urgency === "SAME_DAY",
  ).length ?? 0;
  const draftCount    = myJobs.filter((j) => j.status === "DRAFT").length;
  const openJobs      = myJobs.filter((j) => j.status === "OPEN");
  const unfilledJobs  = openJobs.filter((j) => j._count.applications === 0);
  const responseCount = myJobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);
  const urgentJobs    = openJobs.filter((j) => j.urgency === "EMERGENCY" || j.urgency === "SAME_DAY");

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Manage your participants support requests."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/jobs/post"><Button>Post New Request</Button></Link>
            <Link href="/jobs/post?urgency=EMERGENCY"><Button variant="danger" size="sm">Emergency</Button></Link>
            <Link href="/jobs/post?urgency=SAME_DAY"><Button variant="outline" size="sm">Same Day</Button></Link>
            <Link href="/jobs/post?urgency=REPLACEMENT"><Button variant="outline" size="sm">Replacement</Button></Link>
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
          <StatCard label="My Participants"       value={loading ? "…" : (data?.managedParticipantCount    ?? 0)} tone="ok"   />
          <StatCard label="Active Requests"       value={loading ? "…" : (data?.openJobs?.length           ?? 0)}             />
          <StatCard label="Upcoming Shifts"       value={loading ? "…" : (data?.upcomingShifts?.length     ?? 0)}             />
          <StatCard label="Awaiting Confirmation" value={loading ? "…" : (data?.awaitingConfirmation?.length ?? 0)} tone="warn" />
          <StatCard label="Urgent Requests"        value={loading ? "…" : urgentCount} tone="danger" />
          <StatCard label="Draft Requests"         value={jobsLoading ? "…" : draftCount}            />
          <StatCard label="Unfilled Needs"        value={jobsLoading ? "…" : unfilledJobs.length} tone="warn" />
          <StatCard label="Responses Received"    value={jobsLoading ? "…" : responseCount}       tone="ok"   />
          {/* PLACEHOLDER – no backing endpoint yet */}
          <StatCard label="Expiring Requests"     value={PH_STATS.expiringRequests}     tone="warn"   />
          <StatCard label="Participants w/ Gaps"  value={PH_STATS.participantsWithGaps} tone="danger" />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs/post">                          <Button variant="outline" size="sm">Post Request</Button></Link>
          <Link href="/jobs/post?urgency=EMERGENCY">        <Button variant="danger" size="sm">Emergency</Button></Link>
          <Link href="/jobs/post?urgency=SAME_DAY">         <Button variant="outline" size="sm">Same Day</Button></Link>
          <Link href="/jobs/post?urgency=REPLACEMENT">      <Button variant="outline" size="sm">Replacement</Button></Link>
          <Link href="/jobs/my">                            <Button variant="outline" size="sm">View Applications</Button></Link>
          <Link href="/participants">                       <Button variant="outline" size="sm">Participant Cases</Button></Link>
          <Link href="/messages">                           <Button variant="outline" size="sm">Message Applicants</Button></Link>
        </div>

        {/* ── Row 1: LIVE ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Open support requests</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.openJobs?.length
                  ? <p className="text-sm text-slate-500">No open jobs.</p>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My participants</CardTitle>
              <Link href="/participants"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Managed participants are listed under{" "}
                <Link href="/participants" className="text-brand-600 underline">Participants</Link>.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── LIVE – urgent / priority requests ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-700">Urgent / priority requests</CardTitle>
            <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : !urgentJobs.length ? (
              <p className="text-sm text-slate-500">No urgent requests right now.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {urgentJobs.slice(0, 5).map((u) => (
                  <li key={u.id} className="py-2 flex justify-between items-center">
                    <div>
                      <Link href={`/jobs/${u.id}`} className="font-medium hover:underline">{u.title}</Link>
                      <span className="ml-2 text-xs text-slate-400">{u.suburb}</span>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{u.urgency.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Row 2: LIVE service gaps, PLACEHOLDER expiring ── */}
        {/* TODO: expiring needs applicationDeadlineAt exposed on /jobs/my */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Service gaps / unfilled needs</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : !unfilledJobs.length ? (
                <p className="text-sm text-slate-500">No open requests without applicants.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {unfilledJobs.slice(0, 5).map((g) => (
                    <li key={g.id} className="py-2 flex justify-between items-center">
                      <Link href={`/jobs/${g.id}`} className="font-medium hover:underline">{g.title}</Link>
                      <span className="ml-2 text-xs text-slate-400">{g.suburb}</span>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">No applicants</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Requests expiring soon</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_EXPIRING.map((e) => (
                  <li key={e.id} className="py-2 flex justify-between items-center">
                    <span className="font-medium">{e.title}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      {e.expiresIn}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
