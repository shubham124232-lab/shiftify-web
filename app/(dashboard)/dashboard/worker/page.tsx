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
import { getDashboard, type WorkerDashboard } from "@/lib/api/dashboard";
import {
  Search, CalendarDays, ClipboardList, MessageSquare,
  SlidersHorizontal, FileText, Briefcase, CalendarClock,
} from "lucide-react";

interface ExpiringDoc {
  id: string;
  docType: string;
  fileName: string;
  expiryDate: string | null;
}

// SW doc Window 15 — Available Now status card on the dashboard right rail.
function AvailableNowCard() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.get<{ user: any }>("/users/me")
      .then(r => setAvailable(!!r.user?.workerProfile?.isAvailableNow))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    setToggling(true);
    try {
      const next = !available;
      await api.patch("/users/me/profile/worker", { isAvailableNow: next });
      setAvailable(next);
    } catch {
      // profile-page toggle handles error detail; dashboard card fails silently
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{available ? "🟢 Available Now" : "Available Now"}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? "Loading…" : available ? "Requesters can see you're free right now." : "Signal you're free to start right now."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={loading || toggling}
          className={`h-7 px-3 rounded-full text-xs font-semibold border transition-colors ${
            available ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {toggling ? "…" : available ? "Turn off" : "Turn on"}
        </button>
      </CardContent>
    </Card>
  );
}

const APP_STATUS_BADGE: Record<string, string> = {
  INTERESTED:  "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  SELECTED:    "bg-emerald-100 text-emerald-700",
  DECLINED:    "bg-slate-100 text-slate-500",
  WITHDRAWN:   "bg-slate-100 text-slate-400",
};

function badgePill(status: string) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APP_STATUS_BADGE[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState<WorkerDashboard | null>(null);
  const [docs,    setDocs]    = useState<ExpiringDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as WorkerDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api.get<{ documents: ExpiringDoc[] }>("/users/me/documents")
      .then((r) => setDocs((r.documents ?? []).filter((d) => d.expiryDate)))
      .catch(() => setDocs([]));
  }, []);

  if (!user) return null;

  const expiring = [...docs]
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 5);
  const unread = data?.unreadNotifications ?? 0;

  const tiles: ActionTile[] = [
    { key: "browse",   icon: Search,       title: "Browse Jobs",       subtitle: "Find shifts near you",     ctaLabel: "Browse Jobs",       href: "/jobs", highlighted: true },
    { key: "availability", icon: CalendarDays, title: "Post Availability", subtitle: "Let providers find you", ctaLabel: "Post Availability", href: "/availability" },
  ];

  const quickActions: QuickAction[] = [
    { key: "update-availability", icon: CalendarClock,     label: "Update availability",  href: "/availability" },
    { key: "applications",        icon: ClipboardList,     label: "My applications",      href: "/jobs/my" },
    { key: "messages",            icon: MessageSquare,     label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
    { key: "profile",             icon: SlidersHorizontal, label: "Update profile",       href: "/profile/edit" },
    { key: "documents",           icon: FileText,          label: "Documents",            href: "/documents" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="Your upcoming shifts and nearby opportunities."
      />
      <SetupBanner />

      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 font-medium">
        💰 0% commission — you keep 100% of every rate you agree with a requester.
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          <ActionTilesCard title="Find your next shift" tiles={tiles} />

          <DashboardTabCard
            title="My shifts & jobs"
            tabs={[
              {
                key: "upcoming", label: "Upcoming Shifts", count: loading ? undefined : (data?.upcomingShifts?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.upcomingShifts?.length
                    ? <p className="py-4 text-sm text-slate-500">No upcoming shifts.</p>
                    : data.upcomingShifts.map((s) => (
                      <DashboardListRow key={s.id} icon={<CalendarClock className="h-5 w-5" />} title={s.title}
                        subtitle={new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                        href={`/jobs/${s.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "matched", label: "Matched Jobs", count: loading ? undefined : (data?.matchedJobs?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.matchedJobs?.length
                    ? <p className="py-4 text-sm text-slate-500">No matching jobs right now.</p>
                    : data.matchedJobs.slice(0, 5).map((j) => (
                      <DashboardListRow key={j.id} icon={<Briefcase className="h-5 w-5" />} title={j.title} subtitle={j.suburb}
                        href={`/jobs/${j.id}`} rightLabel="View"
                        badge={
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            j.urgency === "RAPID" ? "bg-red-100 text-red-700"
                            : j.urgency === "URGENT" ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                          }`}>{j.urgency}</span>
                        } />
                    )),
              },
              {
                key: "pending", label: "Pending Applications", count: loading ? undefined : (data?.pendingApplications?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.pendingApplications?.length
                    ? <p className="py-4 text-sm text-slate-500">No pending applications.</p>
                    : data.pendingApplications.map((a) => (
                      <DashboardListRow key={a.applicationId} icon={<ClipboardList className="h-5 w-5" />} title={a.job.title} subtitle={a.job.suburb} href={`/jobs/${a.job.id}`} rightLabel="View" />
                    )),
              },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Shortlisted &amp; selected</CardTitle></CardHeader>
              <CardContent className="py-2">
                {loading ? (
                  <p className="py-4 text-sm text-slate-400">Loading…</p>
                ) : !data?.shortlistedApplications?.length ? (
                  <p className="py-4 text-sm text-slate-500">Nothing shortlisted yet — keep applying!</p>
                ) : (
                  data.shortlistedApplications.slice(0, 5).map((a) => (
                    <DashboardListRow key={a.applicationId} title={a.job.title} badge={badgePill(a.status)} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent applications</CardTitle></CardHeader>
              <CardContent className="py-2">
                {loading ? (
                  <p className="py-4 text-sm text-slate-400">Loading…</p>
                ) : !data?.allApplications?.length ? (
                  <p className="py-4 text-sm text-slate-500">No applications yet.</p>
                ) : (
                  data.allApplications.slice(0, 5).map((a) => (
                    <DashboardListRow
                      key={a.applicationId}
                      title={a.job.title}
                      subtitle={a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-AU") : undefined}
                      badge={badgePill(a.status)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Compliance &amp; document reminders</CardTitle></CardHeader>
            <CardContent className="py-2">
              {!expiring.length ? (
                <p className="py-4 text-sm text-slate-500">No documents with expiry dates on file. Upload your compliance documents to track them here.</p>
              ) : (
                expiring.map((d) => {
                  const daysLeft = Math.ceil((new Date(d.expiryDate!).getTime() - Date.now()) / 86400000);
                  const expired = daysLeft < 0;
                  const warn = !expired && daysLeft <= 30;
                  return (
                    <DashboardListRow
                      key={d.id}
                      title={d.docType.replaceAll("_", " ")}
                      badge={
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          expired ? "bg-red-100 text-red-700" : warn ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {expired ? `Expired ${Math.abs(daysLeft)} days ago` : warn ? `Expires in ${daysLeft} days` : `Valid · ${daysLeft} days`}
                        </span>
                      }
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
          <AvailableNowCard />
          <QuickActionsPanel actions={quickActions} />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}
