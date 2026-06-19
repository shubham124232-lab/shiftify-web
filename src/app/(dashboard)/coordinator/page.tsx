"use client";
// Support Coordinator Dashboard
// Spec: stat cards, participant cases, open/urgent requests, applications,
//       posting flow with case selection, case notes, saved providers.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CoordStats {
  activeRequests:      number;
  draftRequests:       number;
  urgentRequests:      number;
  unfilledRequests:    number;
  upcomingShifts:      number;
  awaitingConfirmation: number;
  managedParticipants: number;
  unreadMessages:      number;
}

interface JobSummary {
  id: string;
  title: string;
  category: string;
  urgency: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: string | null;
  status: string;
  createdAt: string;
}

interface DashboardData {
  role: "COORDINATOR";
  stats: CoordStats;
  openJobs: JobSummary[];
  upcomingShifts: JobSummary[];
  awaitingConfirmation: JobSummary[];
  managedParticipantCount: number;
  unreadNotifications: number;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  sublabel,
}: {
  label: string;
  value: number;
  accent?: "red" | "amber" | "green" | "purple" | "indigo";
  sublabel?: string;
}) {
  const accentClass = {
    red:    "text-red-600",
    amber:  "text-amber-600",
    green:  "text-green-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
  }[accent ?? "purple"];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accentClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, string> = {
    EMERGENCY: "bg-red-100 text-red-700",
    SAME_DAY:  "bg-amber-100 text-amber-700",
    SCHEDULED: "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[urgency] ?? "bg-gray-100 text-gray-700"}`}>
      {urgency === "EMERGENCY" ? "Urgent" : urgency === "SAME_DAY" ? "Same Day" : "Scheduled"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN:        "bg-blue-100 text-blue-700",
    DRAFT:       "bg-gray-100 text-gray-600",
    ASSIGNED:    "bg-purple-100 text-purple-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    COMPLETED:   "bg-green-100 text-green-700",
    CANCELLED:   "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function JobCard({ job }: { job: JobSummary }) {
  const start = new Date(job.scheduledStartAt);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{job.title}</p>
        <div className="flex gap-1 flex-shrink-0">
          <UrgencyBadge urgency={job.urgency} />
          <StatusBadge status={job.status} />
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {job.suburb}, {job.state} &bull; {start.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
        {job.totalHours ? ` • ${job.totalHours}h` : ""}
      </p>
      <p className="mt-1 text-xs text-gray-400">{job.category.replace(/_/g, " ")}</p>
    </Link>
  );
}

function SectionHeader({
  title,
  action,
  actionHref,
}: {
  title: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} className="text-xs font-medium text-purple-600 hover:text-purple-800">
          {action}
        </Link>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoordinatorDashboard() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);

  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.get<DashboardData>("/dashboard/summary");
      if (result.role !== "COORDINATOR") {
        router.replace("/dashboard/plan-manager");
        return;
      }
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    load();
  }, [user, router, load]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={load} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
      </div>
    </div>
  );

  if (!data) return null;

  const { stats, openJobs, upcomingShifts, awaitingConfirmation } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl">🟣</span>
            <span className="text-lg font-bold text-gray-900">Shiftify</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-600">Support Coordinator</span>
          </div>
          <div className="flex items-center gap-3">
            {stats.unreadMessages > 0 && (
              <Link href="/notifications" className="relative">
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {stats.unreadMessages > 9 ? "9+" : stats.unreadMessages}
                </span>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
            )}
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title + quick actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome back, {user?.name?.split(" ")[0]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/jobs/new?role=coordinator"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Post New Request
            </Link>
            <Link
              href="/jobs/new?role=coordinator&urgency=EMERGENCY"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Post Urgent Request
            </Link>
            <Link
              href="/jobs/my"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              My Requests
            </Link>
          </div>
        </div>

        {/* Stat cards — 4 across on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Managed Participants" value={stats.managedParticipants} accent="purple" />
          <StatCard label="Active Requests" value={stats.activeRequests} accent="indigo" />
          <StatCard label="Urgent Requests" value={stats.urgentRequests} accent="red" />
          <StatCard label="Unfilled Requests" value={stats.unfilledRequests} accent="amber" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Upcoming Shifts" value={stats.upcomingShifts} accent="green" />
          <StatCard label="Awaiting Confirmation" value={stats.awaitingConfirmation} accent="amber" />
          <StatCard label="Draft Requests" value={stats.draftRequests} accent="indigo" />
          <StatCard label="Unread Messages" value={stats.unreadMessages} accent="purple" />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Urgent requests */}
            {stats.urgentRequests > 0 && (
              <section>
                <SectionHeader title="Urgent Requests" action="View all" actionHref="/jobs/my?urgency=EMERGENCY" />
                <div className="space-y-3">
                  {openJobs.filter((j) => j.urgency === "EMERGENCY").slice(0, 3).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* Open requests */}
            <section>
              <SectionHeader title="Open Requests" action="View all" actionHref="/jobs/my?status=OPEN" />
              {openJobs.length === 0
                ? <EmptyState message="No open requests. Post a new request to find workers or providers." />
                : (
                  <div className="space-y-3">
                    {openJobs.slice(0, 5).map((job) => <JobCard key={job.id} job={job} />)}
                  </div>
                )
              }
            </section>

            {/* Upcoming shifts */}
            <section>
              <SectionHeader title="Upcoming Confirmed Shifts" action="View all" actionHref="/jobs/my?status=ASSIGNED" />
              {upcomingShifts.length === 0
                ? <EmptyState message="No upcoming shifts confirmed yet." />
                : (
                  <div className="space-y-3">
                    {upcomingShifts.slice(0, 5).map((job) => <JobCard key={job.id} job={job} />)}
                  </div>
                )
              }
            </section>

            {/* Awaiting confirmation */}
            {awaitingConfirmation.length > 0 && (
              <section>
                <SectionHeader title="Awaiting Confirmation" action="Review" actionHref="/jobs/my?status=COMPLETED" />
                <div className="space-y-3">
                  {awaitingConfirmation.slice(0, 3).map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">

            {/* Quick actions panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Post Standard Request", href: "/jobs/new?role=coordinator", icon: "📋" },
                  { label: "Post Urgent Request", href: "/jobs/new?role=coordinator&urgency=EMERGENCY", icon: "🚨" },
                  { label: "Post Replacement Request", href: "/jobs/new?role=coordinator&purpose=REPLACEMENT", icon: "🔄" },
                  { label: "View All Applications", href: "/jobs/applications", icon: "📥" },
                  { label: "Participant Cases", href: "/coordinator/participants", icon: "👥" },
                  { label: "Saved Providers", href: "/coordinator/saved", icon: "⭐" },
                  { label: "Case Notes", href: "/coordinator/notes", icon: "📝" },
                  { label: "Browse Workers/Providers", href: "/jobs", icon: "🔍" },
                ].map(({ label, href, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Participant Cases summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Participant Cases</h3>
                <Link href="/coordinator/participants" className="text-xs text-purple-600 hover:underline">View all</Link>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-purple-600">{stats.managedParticipants}</p>
                <p className="text-xs text-gray-500 mt-1">managed participants</p>
              </div>
              <Link
                href="/coordinator/participants/new"
                className="mt-2 block w-full rounded-lg border border-purple-300 px-3 py-2 text-center text-sm font-medium text-purple-700 hover:bg-purple-50"
              >
                + Add Participant
              </Link>
            </div>

            {/* Service gap alerts */}
            {stats.unfilledRequests > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">Service Gaps Unresolved</h3>
                <p className="text-2xl font-bold text-amber-700">{stats.unfilledRequests}</p>
                <p className="text-xs text-amber-600 mt-1">requests with no applicants</p>
                <Link
                  href="/jobs/my?status=OPEN&unfilled=true"
                  className="mt-3 block text-xs font-medium text-amber-700 hover:underline"
                >
                  View unfilled requests
                </Link>
              </div>
            )}

            {/* Profile completion reminder */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">Profile & Compliance</h3>
              <p className="text-xs text-purple-700 mb-3">Keep your profile and documents up to date to stay visible to participants.</p>
              <Link
                href="/users/me/profile/coordinator"
                className="block w-full rounded-lg bg-purple-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-purple-700"
              >
                Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
