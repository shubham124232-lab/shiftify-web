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
  cancelledAt?: string | null; cancelledByRole?: string | null;
  _count: { applications: number };
}

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [data,        setData]        = useState<CoordinatorDashboard | null>(null);
  const [myJobs,       setMyJobs]      = useState<MyJob[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [jobsLoading,  setJobsLoading] = useState(true);
  const [error,        setError]       = useState<string | null>(null);
  // SC-A02 — the first thing the coordinator chose at sign-up, offered once until dismissed.
  const [goal, setGoal] = useState<{ title: string; href: string } | null>(null);
  useEffect(() => {
    try { const raw = localStorage.getItem("shiftify_coordinator_goal"); if (raw) setGoal(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

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
  const urgentJobs    = openJobs.filter((j) => j.urgency === "RAPID" || j.urgency === "URGENT");
  const unread        = data?.stats?.unreadMessages ?? 0;
  const expiringSoon  = openJobs
    .filter((j) => j.applicationDeadlineAt && new Date(j.applicationDeadlineAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7)
    .sort((a, b) => new Date(a.applicationDeadlineAt!).getTime() - new Date(b.applicationDeadlineAt!).getTime());

  const postTiles: ActionTile[] = [
    { key: "rapid",       icon: Zap,           title: "Rapid",       subtitle: "Within 60 minutes", ctaLabel: "Post Rapid request",       href: "/jobs/post?urgency=RAPID",   highlighted: true },
    { key: "urgent",      icon: Clock,         title: "Urgent",      subtitle: "Within 4 hours",     ctaLabel: "Post Urgent request",      href: "/jobs/post?urgency=URGENT" },
    { key: "last-minute", icon: CalendarClock, title: "Last-Minute", subtitle: "4–48 hours",         ctaLabel: "Post Last-Minute request", href: "/jobs/post?urgency=LAST_MINUTE" },
    { key: "routine",     icon: CalendarDays,  title: "Routine",     subtitle: "Plan ahead",         ctaLabel: "Post Routine request",     href: "/jobs/post" },
  ];

  // SC-D01 — Post support request, Find workers or providers, Add or connect participant, View responses, Messages.
  const quickActions: QuickAction[] = [
    { key: "post",         icon: ClipboardList, label: "Post support request", href: "/jobs/post" },
    { key: "workers",      icon: Users,         label: "Find workers or providers", href: "/find" },
    { key: "participants", icon: UserCheck,     label: "Add or connect participant", href: "/participants" },
    { key: "applications", icon: ClipboardList, label: jobsLoading ? "View responses" : `View responses (${responseCount})`, href: "/jobs/my" },
    { key: "messages",     icon: MessageSquare, label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
  ];

  // SC-D02 — only the priority items that apply right now are shown.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const priorityItems: { key: string; text: string; href: string; tone: "red" | "amber" | "slate" }[] = [
    ...openJobs.filter((j) => j.urgency === "RAPID" && j._count.applications === 0)
      .map((j) => ({ key: "rapid-" + j.id, text: `Rapid request waiting for responses — ${j.title}`, href: `/jobs/${j.id}`, tone: "red" as const })),
    ...openJobs.filter((j) => j.urgency === "URGENT" && j._count.applications > 0)
      .map((j) => ({ key: "urgent-" + j.id, text: `Urgent request with new responses — ${j.title}`, href: `/jobs/${j.id}`, tone: "red" as const })),
    ...myJobs.filter((j) => j.cancelledByRole === "SUPPORT_WORKER" && j.cancelledAt && new Date(j.cancelledAt).getTime() > weekAgo)
      .map((j) => ({ key: "cancel-" + j.id, text: `Worker cancelled — replacement needed — ${j.title}`, href: `/jobs/${j.id}`, tone: "red" as const })),
    ...expiringSoon.slice(0, 3)
      .map((j) => ({ key: "close-" + j.id, text: `Request closing soon — ${j.title}`, href: `/jobs/${j.id}`, tone: "amber" as const })),
    ...(!loading && (data?.stats?.awaitingConfirmation ?? 0) > 0
      ? [{ key: "await", text: `Participant waiting for confirmation (${data?.stats?.awaitingConfirmation})`, href: "/upcoming-support", tone: "amber" as const }] : []),
    ...(unread > 0 ? [{ key: "unread", text: `Unread message (${unread})`, href: "/messages", tone: "slate" as const }] : []),
  ];

  // SC-D03 — coordination activity summary.
  const summary: { label: string; value: number | string }[] = [
    { label: "Connected participants", value: loading ? "…" : (data?.stats?.connectedParticipants ?? 0) },
    { label: "Active requests", value: loading ? "…" : (data?.stats?.activeRequests ?? 0) },
    { label: "New responses", value: loading ? "…" : (data?.stats?.newResponses ?? 0) },
    { label: "Confirmed support", value: loading ? "…" : (data?.stats?.confirmedSupport ?? 0) },
    { label: "Unfilled requests", value: loading ? "…" : (data?.stats?.unfilledRequests ?? 0) },
    { label: "Unread messages", value: loading ? "…" : unread },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="What would you like to organise today?"
      />
      <SetupBanner />

      {goal && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-700">You chose to start with: <strong>{goal.title}</strong>.</span>
          <span className="flex gap-3">
            <Link href={goal.href} className="font-semibold underline">Continue</Link>
            <button type="button" className="text-slate-500 underline" onClick={() => { try { localStorage.removeItem("shiftify_coordinator_goal"); } catch { /* ignore */ } setGoal(null); }}>Dismiss</button>
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          {priorityItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Requests needing attention</CardTitle></CardHeader>
              <CardContent className="py-2">
                {priorityItems.slice(0, 6).map((it) => (
                  <DashboardListRow key={it.key} title={it.text} href={it.href} rightLabel="View"
                    badge={<span className={`rounded-full px-2 py-0.5 text-xs ${it.tone === "red" ? "bg-red-100 text-red-700" : it.tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{it.tone === "slate" ? "Info" : "Action"}</span>} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Your coordination activity</CardTitle></CardHeader>
            <CardContent className="py-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {summary.map((s) => (
                  <div key={s.label} className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="text-xl font-bold text-slate-900">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/jobs/my" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">View all activity →</Link>
            </CardContent>
          </Card>

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
                key: "open", label: "Open", count: loading ? undefined : (data?.stats?.activeRequests ?? data?.openJobs?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.openJobs?.length
                    ? <p className="py-4 text-sm text-slate-500">No open jobs.</p>
                    : data.openJobs.map((j) => (
                      <DashboardListRow key={j.id} icon={<Users className="h-5 w-5" />} title={j.title} subtitle={j.suburb} href={`/jobs/${j.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "upcoming", label: "Upcoming support", count: loading ? undefined : (data?.stats?.upcomingShifts ?? data?.upcomingShifts?.length ?? 0),
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
                key: "awaiting", label: "Participant waiting for confirmation", count: loading ? undefined : (data?.stats?.awaitingConfirmation ?? data?.awaitingConfirmation?.length ?? 0),
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
              <CardTitle>New worker and provider responses</CardTitle>
              <Link href="/jobs/my" className="text-sm font-semibold text-brand-600 hover:underline">View all responses →</Link>
            </CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : !data?.recentResponses?.length ? (
                <p className="py-4 text-sm text-slate-500">No new responses right now.</p>
              ) : data.recentResponses.map((r) => (
                <DashboardListRow
                  key={r.id}
                  icon={<Users className="h-5 w-5" />}
                  title={`${r.applicant.name} · ${r.applicantType}`}
                  subtitle={`${r.jobTitle}${r.proposedRate != null ? ` · $${r.proposedRate}/hr` : ""}${r.message ? ` · "${r.message.slice(0, 60)}"` : ""}`}
                  href={`/jobs/${r.jobId}`}
                  rightLabel="View"
                />
              ))}
            </CardContent>
          </Card>

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
