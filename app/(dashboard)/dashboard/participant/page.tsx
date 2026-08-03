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
import { api } from "@/lib/api";

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// Saved Workers and Recommended-for-you have NO backend feature behind them at
// all (no favorites model, no matching engine) — genuinely still placeholders.
// Everything else on this page is now live, including Applications Received
// and Recurring Supports, which turned out to already be in the /jobs/my
// response (_count.applications, isRecurring) — just unused until now.

const PH_STATS = {
  savedWorkers: 12,
};

const PH_SAVED_WORKERS = [
  { id: "w1", name: "Sarah M.", service: "Personal Care",       rating: 4.9 },
  { id: "w2", name: "James T.", service: "Community Access",    rating: 4.7 },
  { id: "w3", name: "Priya K.", service: "Domestic Assistance", rating: 4.8 },
];

const PH_RECOMMENDED = [
  { id: "m1", name: "Alex R.",  match: 96, service: "Personal Care, Transport" },
  { id: "m2", name: "Chloe B.", match: 91, service: "Community Access"         },
];
// ──────────────────────────────────────────────────────────────────────────────

interface MyJob {
  id: string; title: string; status: string; category: string; postedAt: string;
  isRecurring: boolean; scheduledStartAt: string;
  _count: { applications: number };
}

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState<ParticipantDashboard | null>(null);
  const [myJobs,  setMyJobs]  = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as ParticipantDashboard))
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
  const drafts    = myJobs.filter((j) => j.status === "DRAFT");
  const recurring = myJobs.filter((j) => j.isRecurring && j.status !== "DRAFT" && j.status !== "CANCELLED");
  const applicationsReceived = myJobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Your support requests and upcoming shifts."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/jobs/post"><Button>Post New Request</Button></Link>
            <Link href="/jobs/post?urgency=EMERGENCY"><Button variant="danger" size="sm">🔴 Emergency</Button></Link>
            <Link href="/jobs/post?urgency=SAME_DAY"><Button variant="outline" size="sm">⚡ Same Day</Button></Link>
            <Link href="/jobs/post?urgency=REPLACEMENT"><Button variant="outline" size="sm">🔁 Replacement</Button></Link>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards: first 3 LIVE, rest PLACEHOLDER ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
          {/* LIVE */}
          <StatCard label="Active Requests"    value={loading ? "…" : (data?.openJobs?.length            ?? 0)} tone="ok"   />
          <StatCard label="Upcoming Bookings"  value={loading ? "…" : (data?.upcomingShifts?.length      ?? 0)}             />
          <StatCard label="Awaiting Confirm"   value={loading ? "…" : (data?.awaitingConfirmation?.length ?? 0)} tone="warn" />
          <StatCard label="Urgent Requests"    value={loading ? "…" : urgentCount}              tone="danger" />
          <StatCard label="Draft Posts"        value={jobsLoading ? "…" : drafts.length}                      />
          <StatCard label="Unread Messages"    value={loading ? "…" : (data?.unreadNotifications ?? 0)} tone="warn" />
          <StatCard label="Applications In"    value={jobsLoading ? "…" : applicationsReceived}   tone="ok"   />
          {/* PLACEHOLDER – no backing feature yet (no favorites model) */}
          <StatCard label="Saved Workers"      value={PH_STATS.savedWorkers}    tone="ok"          />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs/post">      <Button variant="outline" size="sm">＋ Post Request</Button></Link>
          <Link href="/jobs/post?urgency=EMERGENCY"><Button variant="danger" size="sm">🔴 Emergency</Button></Link>
          <Link href="/jobs/post?urgency=SAME_DAY"><Button variant="outline" size="sm">⚡ Same Day</Button></Link>
          <Link href="/jobs/post?urgency=REPLACEMENT"><Button variant="outline" size="sm">🔁 Replacement</Button></Link>
          {/* TODO: repeat-past flow */}
          <Button variant="outline" size="sm" disabled>↩ Repeat Past</Button>
          <Link href="/jobs/my">        <Button variant="outline" size="sm">📋 View Applications</Button></Link>
          <Link href="/jobs/my">        <Button variant="outline" size="sm">📅 View Bookings</Button></Link>
          <Link href="/messages">       <Button variant="outline" size="sm">💬 Message Applicants</Button></Link>
          <Link href="/profile/edit">   <Button variant="outline" size="sm">⚙ Update Preferences</Button></Link>
        </div>

        {/* ── Row 1: LIVE ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My open requests</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.openJobs?.length
                  ? <p className="text-sm text-slate-500">No open requests yet.</p>
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
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.upcomingShifts?.length
                  ? <p className="text-sm text-slate-500">No upcoming shifts.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.upcomingShifts.map((s) => (
                        <li key={s.id} className="py-2 flex justify-between">
                          <span className="font-medium">{s.title}</span>
                          <span className="text-slate-500">
                            {new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* ── LIVE – draft requests ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Draft requests</CardTitle>
            <Link href="/jobs/post"><Button variant="ghost" size="sm">New draft</Button></Link>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <p className="text-sm text-slate-500">No drafts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {drafts.map((d) => (
                  <li key={d.id} className="py-2 flex justify-between items-center">
                    <Link href={`/jobs/${d.id}`} className="font-medium hover:underline">{d.title}</Link>
                    <span className="text-xs text-slate-400">
                      {new Date(d.postedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Row 2: LIVE recurring, PLACEHOLDER saved workers ── */}
        {/* TODO: GET /users/me/saved-workers (no favorites feature exists yet) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recurring supports</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : !recurring.length ? (
                <p className="text-sm text-slate-500">No recurring supports set up.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {recurring.slice(0, 5).map((r) => (
                    <li key={r.id} className="py-2 flex justify-between items-center">
                      <Link href={`/jobs/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                      <span className="text-xs text-slate-400">
                        {new Date(r.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saved workers / providers</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_SAVED_WORKERS.map((w) => (
                  <li key={w.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{w.name}</span>
                      <span className="ml-2 text-xs text-slate-400">{w.service}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">★ {w.rating}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ── PLACEHOLDER – recommended ── */}
        {/* TODO: GET /jobs/matched?role=PARTICIPANT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recommended for you</CardTitle>
            <Link href="/jobs"><Button variant="ghost" size="sm">Browse all</Button></Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 text-sm">
              {PH_RECOMMENDED.map((m) => (
                <li key={m.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{m.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{m.service}</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {m.match}% match
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
