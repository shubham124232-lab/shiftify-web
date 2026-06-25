"use client";
// Provider Dashboard
// Spec: stat cards, browse requests, post service availability, SIL/SDA vacancies,
//       post workforce requests, listing management, enquiries, matched requests.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProviderStats {
  liveListings:         number;
  openCapacitySlots:    number;
  housingVacancies:     number;
  workforceRequests:    number;
  newEnquiries:         number;
  matchedRequests:      number;
  confirmedIntakes:     number;
  unfilledWorkforceGaps: number;
  unreadMessages:       number;
  profileCompletion:    number;
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

interface Application {
  applicationId: string;
  job: JobSummary;
}

interface DashboardData {
  role: "PROVIDER";
  pendingExpressions: Application[];
  activeShifts: JobSummary[];
  unassignedAccepted: JobSummary[];
  unreadNotifications: number;
  // Extended stats (populated after backend enhancement)
  stats?: ProviderStats;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  sublabel,
}: {
  label: string;
  value: number | string;
  accent?: "red" | "amber" | "green" | "blue" | "indigo";
  sublabel?: string;
}) {
  const accentClass = {
    red:    "text-red-600",
    amber:  "text-amber-600",
    green:  "text-green-600",
    blue:   "text-blue-600",
    indigo: "text-indigo-600",
  }[accent ?? "blue"];
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
    ASSIGNED:    "bg-indigo-100 text-indigo-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED:   "bg-green-100 text-green-700",
    CANCELLED:   "bg-red-100 text-red-700",
    INTERESTED:  "bg-blue-100 text-blue-700",
    SHORTLISTED: "bg-amber-100 text-amber-700",
    SELECTED:    "bg-green-100 text-green-700",
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
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all"
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

function ApplicationCard({ application }: { application: Application }) {
  return (
    <Link
      href={`/jobs/${application.job.id}/applications/${application.applicationId}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{application.job.title}</p>
        <StatusBadge status="INTERESTED" />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {application.job.suburb}, {application.job.state} &bull;{" "}
        {new Date(application.job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
      </p>
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
        <Link href={actionHref} className="text-xs font-medium text-blue-600 hover:text-blue-800">
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

// ── Posting action card ────────────────────────────────────────────────────────

function PostingCard({
  icon,
  title,
  description,
  href,
  accentColor,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  accentColor: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border-2 ${accentColor} bg-white p-5 hover:shadow-md transition-all group`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);

  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.get<DashboardData>("/dashboard/summary");
      if (result.role !== "PROVIDER") {
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
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
      </div>
    </div>
  );

  if (!data) return null;

  const { pendingExpressions, activeShifts, unassignedAccepted, unreadNotifications } = data;

  // Derive simple stat counts from available data
  const stats: ProviderStats = data.stats ?? {
    liveListings:          0,
    openCapacitySlots:     0,
    housingVacancies:      0,
    workforceRequests:     0,
    newEnquiries:          pendingExpressions.length,
    matchedRequests:       0,
    confirmedIntakes:      activeShifts.length,
    unfilledWorkforceGaps: unassignedAccepted.length,
    unreadMessages:        unreadNotifications,
    profileCompletion:     0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔵</span>
            <span className="text-lg font-bold text-gray-900">Shiftify</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-600">Provider</span>
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
        {/* Page title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome back, {user?.name?.split(" ")[0]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Requests
            </Link>
            <Link
              href="/jobs/applications"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              My Applications
            </Link>
          </div>
        </div>

        {/* Stat cards row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard label="New Enquiries" value={stats.newEnquiries} accent="blue" />
          <StatCard label="Confirmed Intakes" value={stats.confirmedIntakes} accent="green" />
          <StatCard label="Unfilled Workforce Gaps" value={stats.unfilledWorkforceGaps} accent="amber" />
          <StatCard label="Unread Messages" value={stats.unreadMessages} accent="indigo" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Live Listings" value={stats.liveListings} accent="blue" sublabel="service + vacancy" />
          <StatCard label="Open Capacity Slots" value={stats.openCapacitySlots} accent="green" />
          <StatCard label="Housing Vacancies" value={stats.housingVacancies} accent="indigo" sublabel="SIL / SDA" />
          <StatCard label="Workforce Requests" value={stats.workforceRequests} accent="amber" sublabel="posted" />
        </div>

        {/* Posting action cards */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Post Something</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PostingCard
              icon="📋"
              title="Post Service Availability"
              description="Advertise open intake capacity and services offered"
              href="/provider/listings/new?type=service"
              accentColor="border-blue-200 hover:border-blue-400"
            />
            <PostingCard
              icon="🏠"
              title="Post SIL / SDA Vacancy"
              description="List supported living and accommodation openings"
              href="/provider/listings/new?type=housing"
              accentColor="border-indigo-200 hover:border-indigo-400"
            />
            <PostingCard
              icon="👷"
              title="Post Workforce Request"
              description="Find support workers for shifts or roster gaps"
              href="/provider/listings/new?type=workforce"
              accentColor="border-amber-200 hover:border-amber-400"
            />
            <PostingCard
              icon="📊"
              title="Post Capacity Vacancy"
              description="Advertise specific open capacity slots"
              href="/provider/listings/new?type=capacity"
              accentColor="border-green-200 hover:border-green-400"
            />
          </div>
        </section>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pending expressions of interest */}
            <section>
              <SectionHeader title="Expressions of Interest (Pending)" action="View all" actionHref="/jobs/applications?status=INTERESTED" />
              {pendingExpressions.length === 0
                ? (
                  <EmptyState message="No pending expressions of interest. Browse open requests to find opportunities." />
                )
                : (
                  <div className="space-y-3">
                    {pendingExpressions.slice(0, 5).map((app) => (
                      <ApplicationCard key={app.applicationId} application={app} />
                    ))}
                    {pendingExpressions.length > 5 && (
                      <Link href="/jobs/applications?status=INTERESTED" className="block text-center text-xs font-medium text-blue-600 hover:underline py-2">
                        View {pendingExpressions.length - 5} more
                      </Link>
                    )}
                  </div>
                )
              }
            </section>

            {/* Active confirmed shifts */}
            <section>
              <SectionHeader title="Active / Confirmed Shifts" action="View all" actionHref="/jobs/my?status=ASSIGNED" />
              {activeShifts.length === 0
                ? <EmptyState message="No active shifts. Applications that are accepted will appear here." />
                : (
                  <div className="space-y-3">
                    {activeShifts.slice(0, 5).map((job) => <JobCard key={job.id} job={job} />)}
                  </div>
                )
              }
            </section>

            {/* Unassigned (accepted but no worker assigned) */}
            {unassignedAccepted.length > 0 && (
              <section>
                <SectionHeader title="Accepted — No Worker Assigned" action="Assign workers" actionHref="/provider/workforce" />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs text-amber-700 mb-3">These requests are confirmed but no worker has been assigned yet.</p>
                  <div className="space-y-3">
                    {unassignedAccepted.slice(0, 3).map((job) => <JobCard key={job.id} job={job} />)}
                  </div>
                </div>
              </section>
            )}

            {/* Browse requests CTA */}
            <section>
              <SectionHeader title="Open Requests on Load Board" action="Browse all" actionHref="/jobs" />
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Browse participant and coordinator requests that match your service capability.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/jobs?filter=participant" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Participant Requests
                  </Link>
                  <Link href="/jobs?filter=coordinator" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Coordinator Requests
                  </Link>
                  <Link href="/jobs?urgency=EMERGENCY" className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                    Urgent Requests
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Browse Requests", href: "/jobs", icon: "🔍" },
                  { label: "My Listings", href: "/provider/listings", icon: "📋" },
                  { label: "Enquiries / Applications", href: "/jobs/applications", icon: "📥" },
                  { label: "Workforce Coverage", href: "/provider/workforce", icon: "👥" },
                  { label: "Organisation Profile", href: "/users/me/profile/provider", icon: "🏢" },
                  { label: "Service Lines", href: "/provider/services", icon: "⚙️" },
                  { label: "Locations / Regions", href: "/provider/locations", icon: "📍" },
                  { label: "Documents / Compliance", href: "/users/me/documents", icon: "📂" },
                  { label: "Reports / Analytics", href: "/provider/reports", icon: "📊" },
                ].map(({ label, href, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* SIL/SDA spotlight */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">SIL / SDA Vacancies</h3>
              <p className="text-xs text-indigo-700 mb-3">List your supported living and accommodation vacancies to attract suitable participants.</p>
              <div className="space-y-2">
                <Link
                  href="/provider/listings/new?type=housing&subtype=SIL"
                  className="block w-full rounded-lg bg-indigo-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Post SIL Vacancy
                </Link>
                <Link
                  href="/provider/listings/new?type=housing&subtype=SDA"
                  className="block w-full rounded-lg border border-indigo-400 px-3 py-2 text-center text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Post SDA Vacancy
                </Link>
              </div>
            </div>

            {/* Workforce gap alert */}
            {unassignedAccepted.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">Workforce Gap Alert</h3>
                <p className="text-2xl font-bold text-amber-700">{unassignedAccepted.length}</p>
                <p className="text-xs text-amber-600 mt-1">confirmed requests without an assigned worker</p>
                <Link
                  href="/provider/listings/new?type=workforce&urgency=EMERGENCY"
                  className="mt-3 block text-xs font-medium text-amber-700 hover:underline"
                >
                  Post urgent workforce request
                </Link>
              </div>
            )}

            {/* Profile / compliance card */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Organisation Profile</h3>
              <p className="text-xs text-blue-700 mb-3">Keep your insurance and compliance documents current to remain visible on the marketplace.</p>
              <div className="space-y-2">
                <Link
                  href="/users/me/profile/provider"
                  className="block w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Update Profile
                </Link>
                <Link
                  href="/users/me/documents"
                  className="block w-full rounded-lg border border-blue-400 px-3 py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Manage Documents
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
