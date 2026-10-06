"use client";

import "../../../home.css";
import "../../../shiftboard.css";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActionTilesCard, type ActionTile } from "@/components/dashboard/action-tiles";
import { MyRequestsCard, categoryLabel } from "@/components/dashboard/my-requests-card";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { LiveShiftboardTeaser } from "@/components/dashboard/live-shiftboard-teaser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type ParticipantDashboard } from "@/lib/api/dashboard";
import { api } from "@/lib/api";
import {
  Zap, Clock, CalendarClock, CalendarDays, Plus, RefreshCw,
  MessageSquare, ClipboardList, SlidersHorizontal, User,
} from "lucide-react";

interface SavedPro {
  id: string;
  professionalUserId: string;
  professional: {
    name: string;
    workerProfile: { rating: number; totalReviews: number; servicesOffered: string[] | null } | null;
    providerProfile: { averageRating: number; totalRatings: number; coreServices: string[] | null; businessName: string | null } | null;
  };
}

interface MyJob {
  id: string; title: string; status: string; category: string; postedAt: string;
  isRecurring: boolean; scheduledStartAt: string; urgency?: string;
  _count: { applications: number };
}

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState<ParticipantDashboard | null>(null);
  const [myJobs,  setMyJobs]  = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [savedPros, setSavedPros] = useState<SavedPro[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
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
    api.get<{ saved: SavedPro[] }>("/saved-professionals")
      .then((r) => setSavedPros(r.saved ?? []))
      .catch(() => {})
      .finally(() => setSavedLoading(false));
  }, []);

  if (!user) return null;

  const drafts    = myJobs.filter((j) => j.status === "DRAFT");
  const recurring = myJobs.filter((j) => j.isRecurring && j.status !== "DRAFT" && j.status !== "CANCELLED");
  const applicationsReceived = data?.stats?.applicationsReceived ?? 0;
  const unread = data?.stats?.unreadMessages ?? 0;

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
    { key: "applications", icon: ClipboardList,     label: applicationsReceived > 0 ? `Responses received (${applicationsReceived})` : "Responses received", href: "/jobs/my" },
    { key: "preferences",  icon: SlidersHorizontal, label: "Update preferences",   href: "/profile/edit" },
  ];

  return (
    <div className="sf-home sf-dash">
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

            <MyRequestsCard
              title="My support requests"
              tabs={[
                {
                  key: "active", label: "Active", empty: "No open requests yet.", total: data?.stats?.activeRequests,
                  items: loading ? null : (data?.openJobs ?? []).map((j) => ({
                    id: j.id, href: `/jobs/${j.id}`, cta: "View",
                    heading: [j.suburb, j.state].filter(Boolean).join(", "),
                    sub: j.title || categoryLabel(j.category),
                    urgency: j.urgency, startAt: j.scheduledStartAt, hours: j.totalHours,
                  })),
                },
                {
                  key: "upcoming", label: "Upcoming", empty: "No upcoming shifts.", total: data?.stats?.upcomingBookings,
                  items: loading ? null : (data?.upcomingShifts ?? []).map((s) => ({
                    id: s.id, href: `/jobs/${s.id}`, cta: "View details",
                    heading: s.suburb, sub: s.title, startAt: s.scheduledStartAt,
                  })),
                },
                {
                  key: "awaiting", label: "Awaiting confirmation", empty: "Nothing awaiting confirmation.", total: data?.stats?.awaitingConfirmation,
                  items: loading ? null : (data?.awaitingConfirmation ?? []).map((s) => ({
                    id: s.id, href: `/jobs/${s.id}`, cta: "Confirm",
                    heading: s.suburb, sub: s.title, startAt: s.scheduledStartAt,
                  })),
                },
                {
                  key: "drafts", label: "Drafts", empty: "No drafts yet.",
                  // Drafts have no suburb yet, so the category leads.
                  items: jobsLoading ? null : drafts.map((d) => ({
                    id: d.id, href: `/jobs/${d.id}`, cta: "Edit",
                    heading: categoryLabel(d.category), sub: d.title || "Untitled draft",
                    urgency: d.urgency, startAt: d.scheduledStartAt, showStartsIn: false,
                    meta: `Saved ${new Date(d.postedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`,
                  })),
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
                {savedLoading ? (
                  <p className="py-3 text-sm text-slate-400">Loading…</p>
                ) : savedPros.length === 0 ? (
                  <p className="py-3 text-sm text-slate-500">
                    You haven&apos;t saved anyone yet. <a href="/find" className="font-semibold text-emerald-700">Find workers</a>
                  </p>
                ) : (
                  savedPros.slice(0, 3).map((p) => {
                    const wp = p.professional.workerProfile;
                    const pp = p.professional.providerProfile;
                    const services = (wp?.servicesOffered ?? pp?.coreServices ?? []).slice(0, 2).join(", ");
                    const rating = wp && wp.totalReviews > 0 ? wp.rating : pp && pp.totalRatings > 0 ? pp.averageRating : null;
                    return (
                      <DashboardListRow
                        key={p.id}
                        icon={<User className="h-5 w-5" />}
                        title={pp?.businessName || p.professional.name}
                        subtitle={services || undefined}
                        href="/saved-professionals"
                        badge={rating !== null ? <span className="text-xs font-semibold text-emerald-700">★ {Number(rating).toFixed(1)}</span> : undefined}
                      />
                    );
                  })
                )}
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
    </div>
  );
}
