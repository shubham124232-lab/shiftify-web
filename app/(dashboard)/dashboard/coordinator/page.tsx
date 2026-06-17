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

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// TODO: replace each block with a real API call when the backend endpoint is ready.

const PH_STATS = {
  urgentRequests:       3,
  unfilledNeeds:        5,
  responses:            8,
  draftRequests:        2,
  expiringRequests:     1,
  participantsWithGaps: 4,
};

const PH_URGENT = [
  { id: "u1", participant: "James K.",  title: "Emergency Overnight – Castle Hill",  due: "Today 6 pm"   },
  { id: "u2", participant: "Ayesha P.", title: "Replacement Worker – Morning Shift", due: "Today 8 am"   },
  { id: "u3", participant: "Marcus T.", title: "Hospital Discharge Support",          due: "Tomorrow 10am" },
];

const PH_GAPS = [
  { id: "g1", participant: "Linda W.", service: "Personal Care",     status: "No applicants" },
  { id: "g2", participant: "Raj S.",   service: "Community Access",  status: "1 pending"     },
  { id: "g3", participant: "Omar F.",  service: "Overnight Support", status: "No applicants" },
];

const PH_EXPIRING = [
  { id: "e1", title: "Weekly Domestic – Linda W.", expiresIn: "2 days" },
  { id: "e2", title: "Transport Support – Raj S.", expiresIn: "5 days" },
];
// ──────────────────────────────────────────────────────────────────────────────

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState<CoordinatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as CoordinatorDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Manage your participants support requests."
        actions={
          <div className="flex gap-2">
            <Link href="/jobs/post"><Button>Post New Request</Button></Link>
            <Link href="/jobs/post?urgent=true"><Button variant="outline" size="sm">⚡ Post Urgent</Button></Link>
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
          {/* PLACEHOLDER – TODO: include in CoordinatorDashboard API response */}
          <StatCard label="Urgent Requests"       value={PH_STATS.urgentRequests}       tone="danger" />
          <StatCard label="Unfilled Needs"        value={PH_STATS.unfilledNeeds}        tone="warn"   />
          <StatCard label="Responses Received"    value={PH_STATS.responses}            tone="ok"     />
          <StatCard label="Draft Requests"        value={PH_STATS.draftRequests}                      />
          <StatCard label="Expiring Requests"     value={PH_STATS.expiringRequests}     tone="warn"   />
          <StatCard label="Participants w/ Gaps"  value={PH_STATS.participantsWithGaps} tone="danger" />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs/post">          <Button variant="outline" size="sm">＋ Post Request</Button></Link>
          <Link href="/jobs/post?urgent=1"> <Button variant="outline" size="sm">⚡ Post Urgent</Button></Link>
          {/* TODO: replacement request flow */}
          <Button variant="outline" size="sm" disabled>🔄 Post Replacement</Button>
          {/* TODO: repeat last request */}
          <Button variant="outline" size="sm" disabled>↩ Repeat Past Request</Button>
          <Link href="/jobs/my">            <Button variant="outline" size="sm">📋 View Applications</Button></Link>
          <Link href="/participants">       <Button variant="outline" size="sm">👤 Participant Cases</Button></Link>
          <Link href="/messages">           <Button variant="outline" size="sm">💬 Message Applicants</Button></Link>
          {/* TODO: invite provider flow */}
          <Button variant="outline" size="sm" disabled>📨 Invite Providers</Button>
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

        {/* ── PLACEHOLDER – urgent / priority requests ── */}
        {/* TODO: GET /jobs?urgency=URGENT&postedBy=me */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-700">Urgent / priority requests</CardTitle>
            <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 text-sm">
              {PH_URGENT.map((u) => (
                <li key={u.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{u.title}</span>
                    <span className="ml-2 text-xs text-slate-400">— {u.participant}</span>
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{u.due}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── Row 2: PLACEHOLDER – service gaps + expiring ── */}
        {/* TODO: GET /jobs?status=OPEN&applications=0  |  GET /jobs?expiresIn=7days */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Service gaps / unfilled needs</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_GAPS.map((g) => (
                  <li key={g.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{g.participant}</span>
                      <span className="ml-2 text-xs text-slate-400">{g.service}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      g.status === "No applicants" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>{g.status}</span>
                  </li>
                ))}
              </ul>
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
