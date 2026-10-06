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
import { api } from "@/lib/api";
import { getDashboard, type ProviderDashboard } from "@/lib/api/dashboard";
import {
  Search, FilePlus, Home, Users, MessageSquare, SlidersHorizontal,
  FileText, Briefcase, ClipboardList, Zap, Clock, CalendarClock,
} from "lucide-react";

interface ProviderListing {
  id: string;
  listingCategory: "SERVICE" | "HOUSING";
  status: string;
  title: string;
  suburb: string;
  vacancyCategory: string | null;
  createdAt: string;
}

const LISTING_TYPE_BADGE: Record<string, string> = {
  SERVICE: "bg-blue-100 text-blue-700",
  HOUSING: "bg-purple-100 text-purple-700",
};

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [data,     setData]     = useState<ProviderDashboard | null>(null);
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [allowance, setAllowance] = useState<{ applies: boolean; limit: number; used: number; remaining: number } | null>(null);

  useEffect(() => {
    // Paid organisation plans have unlimited core actions, so the once-only counter only applies without one.
    Promise.all([
      api.get<{ allowance: { applies: boolean; limit: number; used: number; remaining: number } }>("/subscriptions/me/allowance"),
      api.get<{ capacity: unknown | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
    ])
      .then(([r, cap]) => setAllowance(cap.capacity ? null : r.allowance))
      .catch(() => setAllowance(null));

    getDashboard()
      .then((d) => setData(d as ProviderDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api.get<{ listings: ProviderListing[] }>("/provider/listings")
      .then((r) => setListings(r.listings ?? []))
      .catch(() => setListings([]));
  }, []);

  if (!user) return null;

  const liveListings = listings.filter((l) => l.status === "ACTIVE");
  const unread = data?.stats?.unreadMessages ?? 0;

  // PR-D01 — what needs attention now?
  const tiles: ActionTile[] = [
    { key: "rapid",   icon: Zap,           title: "Rapid",       subtitle: "Within 60 minutes", ctaLabel: "Post Rapid staffing request",       href: "/jobs/post/rapid", highlighted: true },
    { key: "urgent",  icon: Clock,         title: "Urgent",      subtitle: "Within 4 hours",    ctaLabel: "Post Urgent staffing request",      href: "/jobs/post/urgent" },
    { key: "lastmin", icon: CalendarClock, title: "Last-Minute", subtitle: "4–48 hours",        ctaLabel: "Post Last-Minute staffing request", href: "/jobs/post/last-minute" },
    { key: "now",     icon: Users,         title: "Available Now workers", subtitle: "Find someone free right now", ctaLabel: "Find an Available Now worker", href: "/workers/available" },
    { key: "opps",    icon: Search,        title: "Opportunities", subtitle: "Participant and Support Coordinator requests", ctaLabel: "View matching opportunities", href: "/jobs" },
  ];

  const quickActions: QuickAction[] = [
    { key: "listings", icon: ClipboardList,     label: "Services & capacity listings",   href: "/provider/listings" },
    { key: "team",     icon: Users,             label: "Internal workforce",       href: "/provider/workforce" },
    { key: "messages", icon: MessageSquare,     label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
    { key: "profile",  icon: SlidersHorizontal, label: "Provider profile", href: "/profile/edit" },
    { key: "documents",icon: FileText,          label: "Documents",     href: "/documents" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="What needs attention now — staffing requests, responses and opportunities."
      />
      <SetupBanner />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          <ActionTilesCard title="Grow your business" tiles={tiles} />

          <DashboardTabCard
            title="Live operations"
            tabs={[
              {
                key: "responses", label: "Worker responses", count: loading ? undefined : (data?.stats?.responsesReceived ?? data?.workerResponses?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.workerResponses?.length
                    ? <p className="py-4 text-sm text-slate-500">No responses to your requests yet.</p>
                    : data.workerResponses.map((r) => (
                      <DashboardListRow key={r.applicationId} icon={<Briefcase className="h-5 w-5" />} title={r.job.title}
                        subtitle={[r.applicantName, r.job.suburb].filter(Boolean).join(" · ")} href={`/jobs/${r.job.id}`}
                        badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{r.status === "INTERESTED" ? "New" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}</span>} />
                    )),
              },
              {
                key: "requests", label: "My requests", count: loading ? undefined : (data?.stats?.openRequests ?? data?.myRequests?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.myRequests?.length
                    ? <p className="py-4 text-sm text-slate-500">You have no open staffing requests.</p>
                    : data.myRequests.map((j) => (
                      <DashboardListRow key={j.id} icon={<Briefcase className="h-5 w-5" />} title={j.title} subtitle={j.suburb} href={`/jobs/${j.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "expressions", label: "My applications", count: loading ? undefined : (data?.stats?.outgoingPendingApplications ?? data?.pendingExpressions?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.pendingExpressions?.length
                    ? <p className="py-4 text-sm text-slate-500">You haven&apos;t responded to any opportunities yet.</p>
                    : data.pendingExpressions.map((e) => (
                      <DashboardListRow key={e.applicationId} icon={<Briefcase className="h-5 w-5" />} title={e.job.title} subtitle={e.job.suburb} href={`/jobs/${e.job.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "active", label: "Upcoming and active", count: loading ? undefined : (data?.activeShifts?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.activeShifts?.length
                    ? <p className="py-4 text-sm text-slate-500">No active shifts right now.</p>
                    : data.activeShifts.map((s) => (
                      <DashboardListRow key={s.id} icon={<Briefcase className="h-5 w-5" />} title={s.title} subtitle={s.suburb} href={`/jobs/${s.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "unassigned", label: "Awaiting your allocation", count: loading ? undefined : (data?.stats?.unfilledWorkforceGaps ?? data?.unassignedAccepted?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.unassignedAccepted?.length
                    ? <p className="py-4 text-sm text-slate-500">Nothing awaiting assignment.</p>
                    : data.unassignedAccepted.map((j) => (
                      <DashboardListRow key={j.id} icon={<Briefcase className="h-5 w-5" />} title={j.title} subtitle={j.suburb} href={`/jobs/${j.id}`}
                        badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Assign a worker</span>} />
                    )),
              },
            ]}
          />

          <Card>
            <CardHeader><CardTitle>Services & capacity</CardTitle></CardHeader>
            <CardContent className="py-2">
              {!liveListings.length ? (
                <p className="py-4 text-sm text-slate-500">No live listings. Post your service availability or a SIL/SDA vacancy to attract referrals.</p>
              ) : (
                liveListings.slice(0, 5).map((l) => (
                  <DashboardListRow
                    key={l.id}
                    title={l.title}
                    badge={
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${LISTING_TYPE_BADGE[l.listingCategory] ?? ""}`}>
                          {l.listingCategory === "HOUSING" ? l.vacancyCategory ?? "HOUSING" : "SERVICE"}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Live</span>
                      </div>
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>

          <LiveShiftboardTeaser />
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">
          {allowance?.applies && (
            <Card>
              <CardHeader><CardTitle>Provider actions</CardTitle></CardHeader>
              <CardContent className="py-3 text-sm text-slate-600">
                <p className="m-0 font-semibold text-slate-800">{allowance.remaining} of {allowance.limit} once-only actions remaining</p>
                <p className="text-xs text-slate-500 mt-1 mb-0">Publishing a request or responding to an opportunity uses one action. Urgency never costs extra. Invitation responses and your own team assignments are free.</p>
              </CardContent>
            </Card>
          )}
          <QuickActionsPanel actions={quickActions} />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}
