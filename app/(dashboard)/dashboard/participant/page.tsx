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

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// TODO: replace each block with a real API call when the backend endpoint is ready.

const PH_STATS = {
  applicationsReceived: 7,
  urgentRequests:       1,
  draftPosts:           3,
  unreadMessages:       4,
  savedWorkers:        12,
};

const PH_DRAFTS = [
  { id: "d1", title: "Morning Personal Care Support",  updatedAt: "14 Jun" },
  { id: "d2", title: "Community Access – Saturday",    updatedAt: "13 Jun" },
  { id: "d3", title: "Overnight Support – Weekly",     updatedAt: "11 Jun" },
];

const PH_RECURRING = [
  { id: "r1", title: "Weekly Domestic Assistance",   schedule: "Every Mon 9 am"     },
  { id: "r2", title: "Fortnightly Community Access", schedule: "Every 2nd Fri 1 pm" },
];

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

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState<ParticipantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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
        actions={
          <div className="flex gap-2">
            <Link href="/jobs/post"><Button>Post New Request</Button></Link>
            <Link href="/jobs/post?urgent=true">
              <Button variant="outline" size="sm">⚡ Post Urgent</Button>
            </Link>
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
          {/* PLACEHOLDER – TODO: include in ParticipantDashboard API response */}
          <StatCard label="Applications In"    value={PH_STATS.applicationsReceived}               />
          <StatCard label="Urgent Requests"    value={PH_STATS.urgentRequests}  tone="danger"      />
          <StatCard label="Draft Posts"        value={PH_STATS.draftPosts}                         />
          <StatCard label="Unread Messages"    value={PH_STATS.unreadMessages}  tone="warn"        />
          <StatCard label="Saved Workers"      value={PH_STATS.savedWorkers}    tone="ok"          />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs/post">      <Button variant="outline" size="sm">＋ Post Request</Button></Link>
          <Link href="/jobs/post?urgent=true"><Button variant="outline" size="sm">⚡ Post Urgent</Button></Link>
          {/* TODO: repeat-past flow */}
          <Button variant="outline" size="sm" disabled>↩ Repeat Past</Button>
          <Link href="/jobs/my">        <Button variant="outline" size="sm">📋 View Applications</Button></Link>
          <Link href="/shifts">         <Button variant="outline" size="sm">📅 View Bookings</Button></Link>
          <Link href="/messages">       <Button variant="outline" size="sm">💬 Message Applicants</Button></Link>
          <Link href="/profile/preferences"><Button variant="outline" size="sm">⚙ Update Preferences</Button></Link>
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

        {/* ── PLACEHOLDER – draft requests ── */}
        {/* TODO: GET /jobs?status=DRAFT&postedBy=me */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Draft requests</CardTitle>
            <Link href="/jobs/post"><Button variant="ghost" size="sm">New draft</Button></Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 text-sm">
              {PH_DRAFTS.map((d) => (
                <li key={d.id} className="py-2 flex justify-between items-center">
                  <span className="font-medium">{d.title}</span>
                  <span className="text-xs text-slate-400">{d.updatedAt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── Row 2: PLACEHOLDER – recurring + saved workers ── */}
        {/* TODO: GET /jobs?recurring=true&postedBy=me  |  GET /users/me/saved-workers */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recurring supports</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_RECURRING.map((r) => (
                  <li key={r.id} className="py-2 flex justify-between items-center">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-xs text-slate-400">{r.schedule}</span>
                  </li>
                ))}
              </ul>
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
