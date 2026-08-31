"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActionTilesCard, type ActionTile } from "@/components/dashboard/action-tiles";
import { DashboardTabCard } from "@/components/dashboard/tab-card";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { LiveShiftboardTeaser } from "@/components/dashboard/live-shiftboard-teaser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type ParticipantDashboard } from "@/lib/api/dashboard";
import { api } from "@/lib/api";
import {
  Zap, Clock, CalendarClock, CalendarDays, Plus, RefreshCw,
  MessageSquare, ClipboardList, SlidersHorizontal, User, Users,
} from "lucide-react";

// ─── Placeholder data ──────────────────────────────────────────────────────────────────────────────
// Saved Workers and Recommended-for-you have NO backend feature behind them at
// all (no favorites model, no matching engine) — genuinely still placeholders.
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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" });
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

  const drafts    = myJobs.filter((j) => j.status === "DRAFT");
  const recurring = myJobs.filter((j) => j.isRecurring && j.status !== "DRAFT" && j.status !== "CANCELLED");
  const applicationsReceived = myJobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);
  const unread = data?.unreadNotifications ?? 0;

  const postTiles: ActionTile[] = [
    { key: "rapid",       icon: Zap,          title: "Rapid",       subtitle: "Within 60 minutes", ctaLabel: "Post Rapid request",       href: "/jobs/post?urgency=RAPID",   highlighted: true },
    { key: "urgent",      icon: Clock,        title: "Urgent",      subtitle: "Within 4 hours",     ctaLabel: "Post Urgent request",      href: "/jobs/post?urgency=URGENT" },
    { key: "last-minute", icon: CalendarClock,title: "Last-Minute", subtitle: "4–48 hours",         ctaLabel: "Post Last-Minute request", href: "/jobs/post?urgency=LAST_MINUTE" },
    { key: "routine",     icon: CalendarDays, title: "Routine",     subtitle: "Plan ahead",         ctaLabel: "Post Routine request",     href: "/jobs/post" },
  ];

  const quickActions: QuickAction[] = [
    { key: "post-another", icon: Plus,            label: "Post another request",  href: "/jobs/post" },
    { key: "repeat",       icon: RefreshCw,        label: "Repeat a past request", href: "#", disabled: true },
    { key: "messages",     icon: MessageSquare,    label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
    { key: "applications", icon: ClipboardList,     label: applicationsReceived > 0 ? `Applications received (${applicationsReceived})` : "Applications received", href: "/jobs/my" },
    { key: "preferences",  icon: SlidersHorizontal, label: "Update preferences",   href: "/profile/edit" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="What support do you need today?"
      />
      <SetupBanner />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_1fr]">
        {/* ── Main column ── */}
        <div className="space-y-6">
          <ActionTilesCard
            title="Post a support request"
            tiles={postTiles}
            note="Shiftify is not an emergency service. If there is immediate danger, call 000."
          />

          <DashboardTabCard
            title="My support requests"
            tabs={[
              {
                key: "active", label: "Active", count: loading ? undefined : (data?.openJobs?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.openJobs?.length
                    ? <p className="py-4 text-sm text-slate-500">No open requests yet.</p>
                    : data.openJobs.map((j) => (
                      <DashboardListRow key={j.id} icon={<User className="h-5 w-5" />} title={j.title} subtitle={j.suburb} href={`/jobs/${j.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "upcoming", label: "Upcoming", count: loading ? undefined : (data?.upcomingShifts?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.upcomingShifts?.length
                    ? <p className="py-4 text-sm text-slate-500">No upcoming shifts.</p>
                    : data.upcomingShifts.map((s) => (
                      <DashboardListRow key={s.id} icon={<Users className="h-5 w-5" />} title={s.title} subtitle={fmtDateTime(s.scheduledStartAt)} href={`/jobs/${s.id}`} rightLabel="View details" />
                    )),
              },
              {
                key: "awaiting", label: "Awaiting Confirmation", count: loading ? undefined : (data?.awaitingConfirmation?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.awaitingConfirmation?.length
                    ? <p className="py-4 text-sm text-slate-500">Nothing awaiting confirmation.</p>
                    : data.awaitingConfirmation.map((s) => (
                      <DashboardListRow key={s.id} icon={<Users className="h-5 w-5" />} title={s.title} subtitle={fmtDateTime(s.scheduledStartAt)} href={`/jobs/${s.id}`} rightLabel="Confirm" />
                    )),
              },
              {
                key: "drafts", label: "Drafts", count: jobsLoading ? undefined : drafts.length,
                content: jobsLoading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !drafts.length
                    ? <p className="py-4 text-sm text-slate-500">No drafts yet.</p>
                    : drafts.map((d) => (
                      <DashboardListRow key={d.id} icon={<ClipboardList className="h-5 w-5" />} title={d.title} subtitle={new Date(d.postedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} href={`/jobs/${d.id}`} rightLabel="Edit" />
                    )),
              },
            ]}
          />

          <Card>
            <CardHeader><CardTitle>Recurring supports</CardTitle></CardHeader>
            <CardContent className="py-2">
              {jobsLoading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : !recurring.length ? (
                <p className="py-4 text-sm text-slate-500">No recurring supports set up.</p>
              ) : (
                recurring.slice(0, 5).map((r) => (
                  <DashboardListRow
                    key={r.id}
                    icon={<CalendarDays className="h-5 w-5" />}
                    title={r.title}
                    subtitle={new Date(r.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    href={`/jobs/${r.id}`}
                    rightLabel="View"
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Saved workers / providers</CardTitle></CardHeader>
            <CardContent className="py-2">
              {PH_SAVED_WORKERS.map((w) => (
                <DashboardListRow
                  key={w.id}
                  icon={<User className="h-5 w-5" />}
                  title={w.name}
                  subtitle={w.service}
                  badge={<span className="text-xs font-semibold text-emerald-700">★ {w.rating}</span>}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recommended for you</CardTitle></CardHeader>
            <CardContent className="py-2">
              {PH_RECOMMENDED.map((m) => (
                <DashboardListRow
                  key={m.id}
                  icon={<User className="h-5 w-5" />}
                  title={m.name}
                  subtitle={m.service}
                  badge={
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {m.match}% match
                    </span>
                  }
                />
              ))}
            </CardContent>
          </Card>

          <LiveShiftboardTeaser />
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">
          <QuickActionsPanel actions={quickActions} className="max-w-xs" />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}
