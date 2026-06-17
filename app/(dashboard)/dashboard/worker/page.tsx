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

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// TODO: replace each block with a real API call when the backend endpoint is ready.

const PH_STATS = {
  matchedRequests:    14,
  savedJobs:           5,
  recurringOpps:       3,
  interviewCallbacks:  2,
};

const PH_MATCHED = [
  { id: "m1", title: "Personal Care – Parramatta",        rate: "$38/hr", urgency: "URGENT"    },
  { id: "m2", title: "Community Access – Hills District", rate: "$36/hr", urgency: "SCHEDULED" },
  { id: "m3", title: "Overnight Support – Castle Hill",   rate: "$45/hr", urgency: "SAME_DAY"  },
];

const PH_SAVED = [
  { id: "s1", title: "Domestic Assistance – Blacktown", postedAt: "Today"     },
  { id: "s2", title: "Transport Support – Penrith",     postedAt: "Yesterday" },
];

const PH_COMPLIANCE = [
  { id: "c1", label: "NDIS Worker Screening", daysLeft: 42,  warn: false },
  { id: "c2", label: "First Aid Certificate", daysLeft: 12,  warn: true  },
  { id: "c3", label: "Police Check",          daysLeft: 180, warn: false },
];

const URGENCY_BADGE: Record<string, string> = {
  URGENT:    "bg-red-100 text-red-700",
  SAME_DAY:  "bg-orange-100 text-orange-700",
  SCHEDULED: "bg-slate-100 text-slate-500",
};
// ──────────────────────────────────────────────────────────────────────────────

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState<WorkerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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
        actions={
          <div className="flex gap-2">
            <Link href="/jobs"><Button>Browse Jobs</Button></Link>
            <Link href="/availability"><Button variant="outline" size="sm">Post Availability</Button></Link>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards: first 4 LIVE, rest PLACEHOLDER ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
          {/* LIVE */}
          <StatCard label="Upcoming Shifts"      value={loading ? "…" : (data?.upcomingShifts?.length      ?? 0)}             />
          <StatCard label="Open Opportunities"   value={loading ? "…" : (data?.nearbyJobs?.length          ?? 0)} tone="ok"   />
          <StatCard label="Active Applications"  value={loading ? "…" : (data?.pendingApplications?.length ?? 0)}             />
          <StatCard label="Unread Notifications" value={loading ? "…" : (data?.unreadNotifications         ?? 0)} tone="warn" />
          {/* PLACEHOLDER – TODO: include in WorkerDashboard API response */}
          <StatCard label="Matched Requests"     value={PH_STATS.matchedRequests}   tone="ok"    />
          <StatCard label="Saved Jobs"           value={PH_STATS.savedJobs}                      />
          <StatCard label="Recurring Opps"       value={PH_STATS.recurringOpps}                  />
          <StatCard label="Callbacks"            value={PH_STATS.interviewCallbacks} tone="warn" />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">         <Button variant="outline" size="sm">🔍 Browse Requests</Button></Link>
          <Link href="/availability"> <Button variant="outline" size="sm">📅 Post Availability</Button></Link>
          <Link href="/availability"> <Button variant="outline" size="sm">✏ Update Availability</Button></Link>
          <Link href="/jobs/my">      <Button variant="outline" size="sm">📋 My Applications</Button></Link>
          {/* TODO: link to matches page */}
          <Button variant="outline" size="sm" disabled>⚡ View Matches</Button>
          <Link href="/messages">     <Button variant="outline" size="sm">💬 Messages</Button></Link>
          <Link href="/profile/edit"> <Button variant="outline" size="sm">⚙ Update Profile</Button></Link>
          <Link href="/documents">    <Button variant="outline" size="sm">📄 Documents</Button></Link>
        </div>

        {/* ── Row 1: LIVE ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nearby jobs</CardTitle>
              <Link href="/jobs"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.nearbyJobs?.length
                  ? <p className="text-sm text-slate-500">No nearby jobs right now.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.nearbyJobs.slice(0, 5).map((j) => (
                        <li key={j.id} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{j.title}</span>
                            <span className="ml-2 text-slate-400">{j.suburb}</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            j.urgency === "EMERGENCY" ? "bg-red-100 text-red-700"
                            : j.urgency === "SAME_DAY" ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                          }`}>{j.urgency}</span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* ── LIVE: pending applications ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending applications</CardTitle>
            <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {loading
              ? <p className="text-sm text-slate-400">Loading…</p>
              : !data?.pendingApplications?.length
                ? <p className="text-sm text-slate-500">No pending applications.</p>
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

        {/* ── Row 2: PLACEHOLDER – matched + saved ── */}
        {/* TODO: GET /jobs/matched  |  GET /jobs/saved */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Best matched requests</CardTitle>
              <Link href="/jobs"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_MATCHED.map((j) => (
                  <li key={j.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{j.title}</span>
                      <span className="ml-2 text-xs text-slate-400">{j.rate}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${URGENCY_BADGE[j.urgency] ?? URGENCY_BADGE.SCHEDULED}`}>
                      {j.urgency}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saved opportunities</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_SAVED.map((s) => (
                  <li key={s.id} className="py-2 flex justify-between items-center">
                    <span className="font-medium">{s.title}</span>
                    <span className="text-xs text-slate-400">{s.postedAt}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ── PLACEHOLDER – compliance reminders ── */}
        {/* TODO: GET /users/me/documents?expiringSoon=true */}
        <Card>
          <CardHeader><CardTitle>Compliance &amp; document reminders</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 text-sm">
              {PH_COMPLIANCE.map((c) => (
                <li key={c.id} className="py-2 flex justify-between items-center">
                  <span className="font-medium">{c.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.warn ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {c.warn ? `Expires in ${c.daysLeft} days` : `Valid · ${c.daysLeft} days`}
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
