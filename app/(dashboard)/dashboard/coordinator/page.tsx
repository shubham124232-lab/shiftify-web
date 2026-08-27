"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActionTilesCard, type ActionTile } from "@/components/dashboard/action-tiles";
import { DashboardTabCard } from "@/components/dashboard/tab-card";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { LiveShiftboardTeaser } from "@/components/dashboard/live-shiftboard-teaser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type CoordinatorDashboard } from "@/lib/api/dashboard";
import { api } from "@/lib/api";
import {
  Zap, Clock, CalendarClock, CalendarDays, UserCheck, MessageSquare,
  ClipboardList, Users, AlertTriangle,
} from "lucide-react";

function expiresInLabel(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

interface MyJob {
  id: string; title: string; status: string; urgency: string; suburb: string;
  applicationDeadlineAt: string | null;
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

  const draftCount    = myJobs.filter((j) => j.status === "DRAFT").length;
  const openJobs      = myJobs.filter((j) => j.status === "OPEN");
  const unfilledJobs  = openJobs.filter((j) => j._count.applications === 0);
  const responseCount = myJobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);
  const urgentJobs    = openJobs.filter((j) => j.urgency === "EMERGENCY" || j.urgency === "SAME_DAY");
  const unread        = data?.unreadNotifications ?? 0;
  const expiringSoon  = openJobs
    .filter((j) => j.applicationDeadlineAt && new Date(j.applicationDeadlineAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7)
    .sort((a, b) => new Date(a.applicationDeadlineAt!).getTime() - new Date(b.applicationDeadlineAt!).getTime());

  const postTiles: ActionTile[] = [
    { key: "rapid",       icon: Zap,           title: "Rapid",       subtitle: "Within 60 minutes", ctaLabel: "Post Rapid request",       href: "/jobs/post?urgency=EMERGENCY",   highlighted: true },
    { key: "urgent",      icon: Clock,         title: "Urgent",      subtitle: "Within 4 hours",     ctaLabel: "Post Urgent request",      href: "/jobs/post?urgency=SAME_DAY" },
    { key: "last-minute", icon: CalendarClock, title: "Last-Minute", subtitle: "4–48 hours",         ctaLabel: "Post Last-Minute request", href: "/jobs/post?urgency=REPLACEMENT" },
    { key: "routine",     icon: CalendarDays,  title: "Routine",     subtitle: "Plan ahead",         ctaLabel: "Post Routine request",     href: "/jobs/post" },
  ];

  const quickActions: QuickAction[] = [
    { key: "participants", icon: UserCheck,     label: `My participants (${loading ? "…" : (data?.managedParticipantCount ?? 0)})`, href: "/participants" },
    { key: "applications", icon: ClipboardList, label: jobsLoading ? "View applications" : `Responses received (${responseCount})`, href: "/jobs/my" },
    { key: "messages",     icon: MessageSquare, label: unread > 0 ? `Messages (${unread})` : "Message applicants", href: "/messages" },
    { key: "workers",      icon: Users,         label: "Browse workers", href: "/workers/available" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="Manage your participants support requests."
      />
      <SetupBanner />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          <ActionTilesCard
            title="Post a support request"
            tiles={postTiles}
            note="Shiftify is not an emergency service. If there is immediate danger, call 000."
          />

          <DashboardTabCard
            title="Support requests"
            headerAction={<Link href="/jobs/post" className="text-sm font-semibold text-brand-600 hover:underline">Post request →</Link>}
            tabs={[
              {
                key: "open", label: "Open", count: loading ? undefined : (data?.openJobs?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.openJobs?.length
                    ? <p className="py-4 text-sm text-slate-500">No open jobs.</p>
                    : data.openJobs.map((j) => (
                      <DashboardListRow key={j.id} icon={<Users className="h-5 w-5" />} title={j.title} subtitle={j.suburb} href={`/jobs/${j.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "upcoming", label: "Upcoming Shifts", count: loading ? undefined : (data?.upcomingShifts?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.upcomingShifts?.length
                    ? <p className="py-4 text-sm text-slate-500">No upcoming shifts.</p>
                    : data.upcomingShifts.map((s) => (
                      <DashboardListRow key={s.id} icon={<Users className="h-5 w-5" />} title={s.title}
                        subtitle={new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                        href={`/jobs/${s.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "awaiting", label: "Awaiting Confirmation", count: loading ? undefined : (data?.awaitingConfirmation?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.awaitingConfirmation?.length
                    ? <p className="py-4 text-sm text-slate-500">Nothing awaiting confirmation.</p>
                    : data.awaitingConfirmation.map((s) => (
                      <DashboardListRow key={s.id} icon={<Users className="h-5 w-5" />} title={s.title}
                        subtitle={new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                        href={`/jobs/${s.id}`} rightLabel="Confirm" />
                    )),
              },
              {
                key: "urgent", label: "Urgent", count: jobsLoading ? undefined : urgentJobs.length,
                content: jobsLoading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !urgentJobs.length
                    ? <p className="py-4 text-sm text-slate-500">No urgent requests right now.</p>
                    : urgentJobs.slice(0, 5).map((u) => (
                      <DashboardListRow key={u.id} icon={<AlertTriangle className="h-5 w-5" />} title={u.title} subtitle={u.suburb} href={`/jobs/${u.id}`}
                        badge={<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{u.urgency.replace("_", " ")}</span>} />
                    )),
              },
              {
                key: "gaps", label: "Service Gaps", count: jobsLoading ? undefined : unfilledJobs.length,
                content: jobsLoading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !unfilledJobs.length
                    ? <p className="py-4 text-sm text-slate-500">No open requests without applicants.</p>
                    : unfilledJobs.slice(0, 5).map((g) => (
                      <DashboardListRow key={g.id} icon={<Users className="h-5 w-5" />} title={g.title} href={`/jobs/${g.id}`}
                        badge={<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">No applicants</span>} />
                    )),
              },
              {
                key: "drafts", label: "Drafts", count: jobsLoading ? undefined : draftCount,
                content: jobsLoading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !draftCount
                    ? <p className="py-4 text-sm text-slate-500">No drafts yet.</p>
                    : myJobs.filter((j) => j.status === "DRAFT").map((d) => (
                      <DashboardListRow key={d.id} icon={<ClipboardList className="h-5 w-5" />} title={d.title} href={`/jobs/${d.id}`} rightLabel="Edit" />
                    )),
              },
            ]}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Requests expiring soon</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {jobsLoading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : !expiringSoon.length ? (
                <p className="py-4 text-sm text-slate-500">No open requests with a deadline coming up.</p>
              ) : expiringSoon.slice(0, 5).map((e) => (
                <DashboardListRow
                  key={e.id}
                  title={e.title}
                  href={`/jobs/${e.id}`}
                  badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{expiresInLabel(e.applicationDeadlineAt!)}</span>}
                />
              ))}
            </CardContent>
          </Card>

          <LiveShiftboardTeaser />
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">
          <QuickActionsPanel actions={quickActions} />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}
