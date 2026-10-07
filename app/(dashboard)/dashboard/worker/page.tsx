"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ManagedWorkerDashboard } from "@/components/dashboard/ManagedWorkerDashboard";
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

const GOAL_KEY = "shiftify_worker_goal";

interface ExpiringDoc {
  id: string;
  docType: string;
  fileName: string;
  expiryDate: string | null;
}

// SW v3.0 Window 15 — Available Now card. Active: ON status and expiry.
// Inactive or not purchased: the optional $24.99 Power Up prompt (Pricing V2 §3.5 — requires Basic).
// `state` comes from GET /dashboard/summary (already loaded by the page) — no separate /users/me call.
function AvailableNowCard({ state, stateLoading }: { state?: { isAvailableNow: boolean; availableNowUntil: string | null }; stateLoading: boolean }) {
  const [available, setAvailable] = useState(false);
  const [until, setUntil] = useState<string | null>(null);
  const [owned, setOwned] = useState(false);
  const [subsLoading, setSubsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const loading = stateLoading || subsLoading;

  useEffect(() => {
    if (!state) return;
    setAvailable(!!state.isAvailableNow);
    setUntil(state.availableNowUntil ?? null);
  }, [state]);

  useEffect(() => {
    api.get<{ subscriptions: { plan?: { key?: string } }[] }>("/subscriptions/me/all")
      .catch(() => ({ subscriptions: [] as { plan?: { key?: string } }[] }))
      .then((subs) => setOwned((subs.subscriptions ?? []).some(x => (x.plan?.key ?? "").startsWith("WORKER_AVAILABLE_NOW"))))
      .finally(() => setSubsLoading(false));
  }, []);

  async function turnOff() {
    setToggling(true);
    try {
      await api.patch("/users/me/profile/worker", { isAvailableNow: false });
      setAvailable(false);
      setUntil(null);
    } catch {
      // the availability page shows error detail; the dashboard card fails silently
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{available ? "🟢 Available Now is ON" : "Available Now"}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? "Loading…"
              : available ? (until ? `Until ${new Date(until).toLocaleString("en-AU", { timeStyle: "short", dateStyle: "short" })}` : "Visible to requesters until you turn it off or it expires.")
              : owned ? "Publish immediate, time-limited availability."
              : "Optional Power Up — let requesters see you're free right now."}
          </p>
        </div>
        {!loading && (available ? (
          <div className="flex gap-2">
            <a href="/availability" className="h-7 px-3 rounded-full text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Edit</a>
            <button type="button" onClick={turnOff} disabled={toggling}
              className="h-7 px-3 rounded-full text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-700">
              {toggling ? "…" : "Turn off"}
            </button>
          </div>
        ) : owned ? (
          <a href="/availability" className="h-7 px-3 rounded-full text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Turn on</a>
        ) : (
          <a href="/subscription" className="h-7 px-3 rounded-full text-xs font-semibold border border-indigo-300 bg-indigo-50 text-indigo-700 no-underline inline-flex items-center whitespace-nowrap">Activate — $24.99</a>
        ))}
      </CardContent>
    </Card>
  );
}

// Pricing V2 — 10 once-only introductory Connect actions on the free plan. Hidden once on Basic.
function IntroductoryActionsCard() {
  const [left, setLeft] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ allowance: { applies: boolean; remaining: number; limit: number } }>("/subscriptions/me/allowance"),
      api.get<{ subscriptions: { plan?: { key?: string } }[] }>("/subscriptions/me/all").catch(() => ({ subscriptions: [] })),
    ])
      .then(([a, subs]) => {
        const onBasic = (subs.subscriptions ?? []).some(x => (x.plan?.key ?? "").startsWith("WORKER_BASIC"));
        if (a.allowance?.applies && !onBasic) setLeft({ remaining: a.allowance.remaining, limit: a.allowance.limit });
      })
      .catch(() => {});
  }, []);

  if (!left) return null;
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold text-slate-800 m-0">{left.remaining} of {left.limit} left</p>
        <p className="text-xs text-slate-500 mt-0.5 mb-0">
          Once-only introductory Connect actions. They never reset or expire.
          {left.remaining === 0 && " Choose Shiftify Basic or buy a Shift Pass to connect on more shifts."}
        </p>
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

// SW v3.0 connection statuses (Connect Window 3) — no raw enum values on screen.
const STATUS_LABEL: Record<string, string> = {
  INTERESTED: "Connected", SHORTLISTED: "Shortlisted", SELECTED: "Awaiting your acceptance",
  DECLINED: "Not proceeding", WITHDRAWN: "Withdrawn",
};

// A SELECTED connection only reads "Awaiting your acceptance" while it really is; afterwards it follows the request.
function connectionLabel(status: string, job?: { status?: string; workerConfirmedAt?: string | null }) {
  if (status !== "SELECTED" || !job?.status) return STATUS_LABEL[status] ?? status;
  if (job.status === "CANCELLED") return "Request cancelled";
  if (job.status === "COMPLETED" || job.status === "CONFIRMED") return "Completed";
  if (job.status === "IN_PROGRESS") return "In progress";
  return job.workerConfirmedAt ? "Confirmed" : STATUS_LABEL[status];
}

function badgePill(status: string, job?: { status?: string; workerConfirmedAt?: string | null }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APP_STATUS_BADGE[status] ?? "bg-slate-100 text-slate-500"}`}>
      {connectionLabel(status, job)}
    </span>
  );
}

function IndependentWorkerDashboard() {
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
  const unread = data?.stats?.unreadMessages ?? 0;

  const [goal, setGoal] = useState<{ title: string; href: string } | null>(null);
  useEffect(() => {
    try { const raw = localStorage.getItem(GOAL_KEY); if (raw) setGoal(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  const [pendingInvites, setPendingInvites] = useState<number | null>(null);
  useEffect(() => {
    api.get<{ invites: { status: string }[] }>("/job-invites")
      .then((r) => setPendingInvites((r.invites ?? []).filter((i) => i.status === "PENDING").length))
      .catch(() => setPendingInvites(0));
  }, []);

  // Window 15 summary + needs-attention come from data the page already has.
  const apps = data?.allApplications ?? [];
  const awaiting = apps.filter((a) => a.status === "SELECTED" && a.job.status !== "CANCELLED" && !(a.job as { workerConfirmedAt?: string | null }).workerConfirmedAt && !["COMPLETED", "CONFIRMED", "IN_PROGRESS"].includes(a.job.status));
  const cancelled = apps.filter((a) => a.status === "SELECTED" && a.job.status === "CANCELLED");
  const weekAgo = Date.now() - 7 * 86400000;
  const newConnections = apps.filter((a) => ["INTERESTED", "SHORTLISTED"].includes(a.status) && a.createdAt && new Date(a.createdAt).getTime() >= weekAgo);
  const expiringSoon = expiring.filter((d) => Math.ceil((new Date(d.expiryDate!).getTime() - Date.now()) / 86400000) <= 30);
  const nextSupport = data?.upcomingShifts?.[0];
  const matchedByUrgency = (u: string) => (data?.matchedJobs ?? []).filter((j) => j.urgency === u);

  const summary: { label: string; value: number | string; href: string }[] = [
    { label: "New matches",           value: loading ? "—" : (data?.stats?.matchedJobs ?? data?.matchedJobs?.length ?? 0), href: "/jobs" },
    { label: "New connections",       value: loading ? "—" : newConnections.length, href: "/connections/my" },
    { label: "Awaiting confirmation", value: loading ? "—" : awaiting.length,       href: "/connections/my" },
    { label: "Confirmed support",     value: loading ? "—" : (data?.stats?.upcomingShifts ?? data?.upcomingShifts?.length ?? 0), href: "/my-support" },
    { label: "Unread messages",       value: unread,                                 href: "/messages" },
  ];

  const attention: { key: string; text: string; href: string; cta: string }[] = [
    ...(pendingInvites ? [{ key: "inv", text: `${pendingInvites} direct invitation${pendingInvites === 1 ? "" : "s"} waiting for your reply`, href: "/job-invites", cta: "View invitations" }] : []),
    ...newConnections.slice(0, 3).map((a) => ({ key: `nc-${a.applicationId}`, text: `New connection: ${a.job.title}`, href: `/jobs/${a.job.id}`, cta: "View" })),
    ...awaiting.slice(0, 3).map((a) => ({ key: `aw-${a.applicationId}`, text: `Confirm support: ${a.job.title}`, href: `/jobs/${a.job.id}`, cta: "Review and confirm" })),
    ...cancelled.slice(0, 3).map((a) => ({ key: `ca-${a.applicationId}`, text: `Request cancelled: ${a.job.title}`, href: `/jobs/${a.job.id}`, cta: "View" })),
    ...expiringSoon.slice(0, 3).map((d) => ({ key: `doc-${d.id}`, text: `${d.docType.replaceAll("_", " ")} ${new Date(d.expiryDate!).getTime() < Date.now() ? "has expired" : "expires soon"}`, href: "/profile/build?step=9", cta: "Update document" })),
  ];

  const URGENCY_TABS: { key: string; label: string; value: string }[] = [
    { key: "rapid", label: "Rapid", value: "RAPID" }, { key: "urgent", label: "Urgent", value: "URGENT" },
    { key: "last", label: "Last-Minute", value: "LAST_MINUTE" }, { key: "routine", label: "Routine", value: "ROUTINE" },
  ];

  const tiles: ActionTile[] = [
    { key: "browse",   icon: Search,       title: "Browse requests",     subtitle: "Rapid, Urgent, Last-Minute and Routine near you", ctaLabel: "Browse requests", href: "/jobs", highlighted: true },
    { key: "availability", icon: CalendarDays, title: "Update availability", subtitle: "Let requesters see when you are free", ctaLabel: "Update availability", href: "/availability" },
  ];

  const quickActions: QuickAction[] = [
    { key: "update-availability", icon: CalendarClock,     label: "Update availability",  href: "/availability" },
    { key: "applications",        icon: ClipboardList,     label: "My connections",       href: "/connections/my" },
    { key: "messages",            icon: MessageSquare,     label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
    { key: "profile",             icon: SlidersHorizontal, label: "Update profile",       href: "/profile/build" },
    { key: "documents",           icon: FileText,          label: "Documents",            href: "/profile/build?step=9" },
    { key: "live",                icon: Search,            label: "Live Dashboard",       href: "/live-dashboard" },
    { key: "my-jobs",             icon: Briefcase,         label: "My Jobs",              href: "/jobs/my" },
    { key: "earnings",            icon: FileText,          label: "Earnings and payment status", href: "/earnings" },
    { key: "invoices",            icon: FileText,          label: "Invoices",             href: "/invoices" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="Today's work and your immediate availability."
      />
      <SetupBanner />

      {goal && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-700">You chose to start with: <strong>{goal.title}</strong>.</span>
          <span className="flex gap-3">
            <a href={goal.href} className="font-semibold underline">Continue</a>
            <button type="button" className="text-slate-500 underline" onClick={() => { try { localStorage.removeItem(GOAL_KEY); } catch { /* ignore */ } setGoal(null); }}>Dismiss</button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Summary">
        {summary.map((s) => (
          <a key={s.label} href={s.href} className="rounded-xl border border-slate-200 bg-white px-3 py-3 no-underline hover:bg-slate-50">
            <p className="m-0 text-xl font-bold text-slate-900">{s.value}</p>
            <p className="m-0 mt-0.5 text-xs text-slate-500">{s.label}</p>
          </a>
        ))}
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 font-medium">
        💰 0% commission — you keep 100% of every rate you agree with a requester.
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          <ActionTilesCard title="Find your next request" tiles={tiles} />

          <Card>
            <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
            <CardContent className="py-2">
              {loading && pendingInvites === null ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : !attention.length ? (
                <p className="py-4 text-sm text-slate-500">Nothing needs your attention right now.</p>
              ) : (
                attention.map((x) => (
                  <DashboardListRow key={x.key} icon={<ClipboardList className="h-5 w-5" />} title={x.text} href={x.href} rightLabel={x.cta} />
                ))
              )}
            </CardContent>
          </Card>

          <DashboardTabCard
            title="Opportunities for you"
            tabs={URGENCY_TABS.map((t) => {
              const list = matchedByUrgency(t.value);
              return {
                key: t.key, label: t.label, count: loading ? undefined : list.length,
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !list.length
                    ? <p className="py-4 text-sm text-slate-500">No {t.label} requests match you right now. <a href={`/jobs?urgency=${t.value}`} className="underline">Browse all {t.label} requests</a>.</p>
                    : list.slice(0, 5).map((j) => (
                      <DashboardListRow key={j.id} icon={<Briefcase className="h-5 w-5" />} title={j.title} subtitle={j.suburb}
                        href={`/jobs/${j.id}`} rightLabel="View" />
                    )),
              };
            })}
          />

          <Card>
            <CardHeader><CardTitle>Next confirmed support</CardTitle></CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : !nextSupport ? (
                <p className="py-4 text-sm text-slate-500">No confirmed support coming up. Confirmed support appears here once a request is confirmed.</p>
              ) : (
                <DashboardListRow icon={<CalendarClock className="h-5 w-5" />} title={nextSupport.title}
                  subtitle={`${new Date(nextSupport.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })} · ${nextSupport.suburb || "Area on the request"}`}
                  href="/my-support" rightLabel="Open" />
              )}
            </CardContent>
          </Card>

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
                    <DashboardListRow key={a.applicationId} title={a.job.title} badge={badgePill(a.status, a.job)} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent connections</CardTitle></CardHeader>
              <CardContent className="py-2">
                {loading ? (
                  <p className="py-4 text-sm text-slate-400">Loading…</p>
                ) : !data?.allApplications?.length ? (
                  <p className="py-4 text-sm text-slate-500">No connections yet.</p>
                ) : (
                  data.allApplications.slice(0, 5).map((a) => (
                    <DashboardListRow
                      key={a.applicationId}
                      title={a.job.title}
                      subtitle={a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-AU") : undefined}
                      badge={badgePill(a.status, a.job)}
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
          <IntroductoryActionsCard />
          <AvailableNowCard state={data?.availableNow} stateLoading={loading} />
          <QuickActionsPanel actions={quickActions} />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}

// A Provider Team Member is not an independent Support Worker, so they get their own dashboard.
export default function WorkerDashboard() {
  const { user } = useAuth();
  if (user?.accountType === "MANAGED") return <ManagedWorkerDashboard />;
  return <IndependentWorkerDashboard />;
}
