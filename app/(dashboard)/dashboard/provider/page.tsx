"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboard, type ProviderDashboard } from "@/lib/api/dashboard";

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// TODO: replace each block with a real API call when the backend endpoint is ready.

const PH_STATS = {
  liveListings:      6,
  openCapacitySlots: 4,
  housingVacancies:  2,
  workforceRequests: 3,
  confirmedIntakes:  9,
};

const PH_LIVE_LISTINGS = [
  { id: "l1", title: "Personal Care Services – Sydney",        type: "SERVICE",   status: "Active" },
  { id: "l2", title: "SIL Vacancy – 2 Beds Available",         type: "SIL",       status: "Active" },
  { id: "l3", title: "Urgent Staff Needed – Community Access", type: "WORKFORCE", status: "Active" },
];

const PH_WORKFORCE_GAPS = [
  { id: "wg1", shift: "Mon–Fri Morning Shifts",  workers: 2, area: "Parramatta" },
  { id: "wg2", shift: "Weekend Overnight Cover", workers: 1, area: "Penrith"    },
];

const PH_MATCHED_REQUESTS = [
  { id: "mr1", title: "Complex Care – Blacktown",       postedBy: "Coordinator", urgency: "URGENT"    },
  { id: "mr2", title: "Community Access – Castle Hill", postedBy: "Participant", urgency: "SCHEDULED" },
];

const LISTING_TYPE_BADGE: Record<string, string> = {
  SERVICE:   "bg-blue-100 text-blue-700",
  SIL:       "bg-purple-100 text-purple-700",
  WORKFORCE: "bg-amber-100 text-amber-700",
};
// ──────────────────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [data,    setData]    = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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
        description="Manage your team's active jobs and service listings."
        actions={
          <div className="flex gap-2">
            <Link href="/jobs"><Button>Browse Requests</Button></Link>
            {/* TODO: link to post-service-availability page */}
            <Button variant="outline" size="sm" disabled>Post Service Availability</Button>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards: first 4 LIVE, rest PLACEHOLDER ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-9">
          {/* LIVE */}
          <StatCard label="Expressions of Interest" value={loading ? "…" : (data?.pendingExpressions?.length  ?? 0)} tone="ok"   />
          <StatCard label="Active Shifts"            value={loading ? "…" : (data?.activeShifts?.length       ?? 0)}              />
          <StatCard label="Unassigned (accepted)"    value={loading ? "…" : (data?.unassignedAccepted?.length ?? 0)} tone="warn" />
          <StatCard label="Unread Notifications"     value={loading ? "…" : (data?.unreadNotifications        ?? 0)}              />
          {/* PLACEHOLDER – TODO: include in ProviderDashboard API response */}
          <StatCard label="Live Listings"       value={PH_STATS.liveListings}       tone="ok"   />
          <StatCard label="Open Capacity Slots" value={PH_STATS.openCapacitySlots}              />
          <StatCard label="Housing Vacancies"   value={PH_STATS.housingVacancies}   tone="ok"   />
          <StatCard label="Workforce Requests"  value={PH_STATS.workforceRequests}  tone="warn" />
          <StatCard label="Confirmed Intakes"   value={PH_STATS.confirmedIntakes}   tone="ok"   />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">         <Button variant="outline" size="sm">🔍 Browse Requests</Button></Link>
          {/* TODO: these pages need to be built */}
          <Button variant="outline" size="sm" disabled>＋ Post Service Availability</Button>
          <Button variant="outline" size="sm" disabled>🏠 Post SIL/SDA Vacancy</Button>
          <Button variant="outline" size="sm" disabled>👷 Post Workforce Request</Button>
          <Link href="/jobs/my">      <Button variant="outline" size="sm">📋 View Enquiries</Button></Link>
          <Link href="/messages">     <Button variant="outline" size="sm">💬 Messages</Button></Link>
          <Link href="/profile/edit"> <Button variant="outline" size="sm">⚙ Update Profile</Button></Link>
          <Link href="/documents">    <Button variant="outline" size="sm">📄 Documents</Button></Link>
        </div>

        {/* ── Row 1: LIVE ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending expressions</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.pendingExpressions?.length
                  ? <p className="text-sm text-slate-500">No pending expressions.</p>
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
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.activeShifts?.length
                  ? <p className="text-sm text-slate-500">No active shifts right now.</p>
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

        {/* ── PLACEHOLDER – live listings ── */}
        {/* TODO: GET /provider/listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My live listings</CardTitle>
            <Button variant="ghost" size="sm">View all</Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 text-sm">
              {PH_LIVE_LISTINGS.map((l) => (
                <li key={l.id} className="py-2 flex justify-between items-center">
                  <span className="font-medium">{l.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${LISTING_TYPE_BADGE[l.type] ?? ""}`}>{l.type}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{l.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── Row 2: PLACEHOLDER – matched requests + workforce gaps ── */}
        {/* TODO: GET /jobs/matched  |  GET /provider/workforce-gaps */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matched requests</CardTitle>
              <Link href="/jobs"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_MATCHED_REQUESTS.map((r) => (
                  <li key={r.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{r.title}</span>
                      <span className="ml-2 text-xs text-slate-400">by {r.postedBy}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      r.urgency === "URGENT" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                    }`}>{r.urgency}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Workforce / staffing gaps</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 text-sm">
                {PH_WORKFORCE_GAPS.map((g) => (
                  <li key={g.id} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{g.shift}</span>
                      <span className="ml-2 text-xs text-slate-400">{g.area}</span>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      {g.workers} worker{g.workers > 1 ? "s" : ""} needed
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
