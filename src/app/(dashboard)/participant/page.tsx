"use client";
// Participant Dashboard — spec: stat cards, feed sections, quick action buttons
// All data from GET /dashboard/summary (live API call via api.get)

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobSummary {
  id:               string;
  title:            string;
  category:         string;
  urgency:          string;
  suburb:           string;
  state:            string;
  scheduledStartAt: string | null;
  totalHours:       number | string | null;
  status:           string;
  createdAt:        string;
}

interface DashboardStats {
  activeRequests:      number;
  applicationsReceived: number;
  confirmedSupports:   number;
  upcomingBookings:    number;
  urgentRequests:      number;
  draftRequests:       number;
  unreadMessages:      number;
  recurringSupports:   number;
}

interface DashboardData {
  role:                  "PARTICIPANT";
  stats:                 DashboardStats;
  openJobs:              JobSummary[];
  upcomingShifts:        JobSummary[];
  awaitingConfirmation:  JobSummary[];
  unreadNotifications:   number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

const URGENCY_BADGE: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700 border border-red-200",
  SAME_DAY:  "bg-orange-100 text-orange-700 border border-orange-200",
  SCHEDULED: "bg-blue-100 text-blue-700 border border-blue-200",
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT:       "bg-gray-100 text-gray-600",
  OPEN:        "bg-green-100 text-green-700",
  ASSIGNED:    "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED:   "bg-teal-100 text-teal-700",
  CONFIRMED:   "bg-indigo-100 text-indigo-700",
  CANCELLED:   "bg-red-100 text-red-600",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  href,
}: {
  label:  string;
  value:  number;
  icon:   string;
  accent: string;
  href?:  string;
}) {
  const content = (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${accent} transition-shadow hover:shadow-sm`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-600 mt-0.5">{label}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function JobCard({ job }: { job: JobSummary }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {job.suburb}, {job.state}
            {job.scheduledStartAt ? ` · ${formatDate(job.scheduledStartAt)} ${formatTime(job.scheduledStartAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge label={job.status.replace("_", " ")} className={STATUS_BADGE[job.status] ?? "bg-gray-100 text-gray-600"} />
          {job.urgency !== "SCHEDULED" && (
            <Badge label={job.urgency.replace("_", " ")} className={URGENCY_BADGE[job.urgency] ?? ""} />
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <span>{job.category.replace(/_/g, " ")}</span>
        {job.totalHours && <span>· {job.totalHours}h</span>}
      </div>
    </Link>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
      {label}
    </div>
  );
}

function FeedSection({
  title,
  jobs,
  emptyLabel,
  viewAllHref,
}: {
  title:       string;
  jobs:        JobSummary[];
  emptyLabel:  string;
  viewAllHref: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <Link href={viewAllHref} className="text-xs text-indigo-600 hover:underline">
          View all
        </Link>
      </div>
      {jobs.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ParticipantDashboardPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>("/dashboard/summary");
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Shiftify</h1>
            <p className="text-xs text-gray-500">Participant Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {data && data.unreadNotifications > 0 && (
              <Link href="/notifications" className="relative">
                <span className="text-gray-500 text-sm">🔔</span>
                <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center">
                  {data.unreadNotifications}
                </span>
              </Link>
            )}
            <Link
              href="/profile/participant"
              className="text-sm text-gray-700 hover:text-indigo-600"
            >
              {user?.name ?? "Profile"}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        {/* ── Left sidebar / nav ── */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">Menu</p>
          {[
            { href: "/dashboard/participant",       label: "Dashboard Home",         icon: "🏠" },
            { href: "/jobs/new",                    label: "Post New Request",        icon: "➕" },
            { href: "/my-requests",                 label: "My Requests",             icon: "📋" },
            { href: "/my-requests?tab=applications", label: "Applications",           icon: "📬" },
            { href: "/bookings",                    label: "Bookings",                icon: "📅" },
            { href: "/messages",                    label: "Messages",                icon: "💬" },
            { href: "/favourites",                  label: "Favourite Workers",       icon: "⭐" },
            { href: "/recurring",                   label: "Recurring Supports",      icon: "🔄" },
            { href: "/documents",                   label: "Documents & Notes",       icon: "📄" },
            { href: "/notifications",               label: "Notifications",           icon: "🔔" },
            { href: "/profile/participant",         label: "Profile Settings",        icon: "⚙️" },
            { href: "/help",                        label: "Help / Support",          icon: "❓" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h2>
            <p className="text-sm text-gray-500 mt-1">Here&apos;s an overview of your support requests and bookings.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchDashboard} className="ml-4 text-red-600 hover:underline font-medium text-xs">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-gray-200" />
                ))}
              </div>
              <div className="h-40 rounded-xl bg-gray-200" />
              <div className="h-40 rounded-xl bg-gray-200" />
            </div>
          )}

          {/* Dashboard content */}
          {!loading && data && (
            <>
              {/* ── Quick action buttons ── */}
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/jobs/new"
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Post New Request
                </Link>
                <Link
                  href="/jobs/new?urgency=EMERGENCY"
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Post Urgent Request
                </Link>
                <Link
                  href="/my-requests?tab=applications"
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Applications
                </Link>
                <Link
                  href="/bookings"
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Bookings
                </Link>
                <Link
                  href="/messages"
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Message Applicants
                </Link>
                <Link
                  href="/profile/participant#preferences"
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Update Support Preferences
                </Link>
              </div>

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Active Requests"
                  value={data.stats.activeRequests}
                  icon="📋"
                  accent="bg-green-50 border-green-200"
                  href="/my-requests?status=OPEN"
                />
                <StatCard
                  label="Applications Received"
                  value={data.stats.applicationsReceived}
                  icon="📬"
                  accent="bg-blue-50 border-blue-200"
                  href="/my-requests?tab=applications"
                />
                <StatCard
                  label="Confirmed Supports"
                  value={data.stats.confirmedSupports}
                  icon="✅"
                  accent="bg-teal-50 border-teal-200"
                  href="/my-requests?status=CONFIRMED"
                />
                <StatCard
                  label="Upcoming Bookings"
                  value={data.stats.upcomingBookings}
                  icon="📅"
                  accent="bg-indigo-50 border-indigo-200"
                  href="/bookings"
                />
                <StatCard
                  label="Urgent Requests"
                  value={data.stats.urgentRequests}
                  icon="🚨"
                  accent="bg-red-50 border-red-200"
                  href="/my-requests?urgency=EMERGENCY"
                />
                <StatCard
                  label="Draft Posts"
                  value={data.stats.draftRequests}
                  icon="📝"
                  accent="bg-gray-50 border-gray-200"
                  href="/my-requests?status=DRAFT"
                />
                <StatCard
                  label="Unread Messages"
                  value={data.stats.unreadMessages}
                  icon="💬"
                  accent="bg-yellow-50 border-yellow-200"
                  href="/messages"
                />
                <StatCard
                  label="Recurring Supports"
                  value={data.stats.recurringSupports}
                  icon="🔄"
                  accent="bg-purple-50 border-purple-200"
                  href="/recurring"
                />
              </div>

              {/* ── Feed sections ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FeedSection
                  title="Open Requests"
                  jobs={data.openJobs}
                  emptyLabel="No open requests. Post a new support request to get started."
                  viewAllHref="/my-requests?status=OPEN"
                />
                <FeedSection
                  title="Upcoming Shifts"
                  jobs={data.upcomingShifts}
                  emptyLabel="No upcoming shifts yet."
                  viewAllHref="/bookings"
                />
              </div>

              <FeedSection
                title="Awaiting Confirmation"
                jobs={data.awaitingConfirmation}
                emptyLabel="Nothing awaiting confirmation."
                viewAllHref="/my-requests?status=COMPLETED"
              />

              {/* ── Profile completion reminder ── */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-800">Complete your profile</p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    A complete profile helps workers find and match with you faster.
                  </p>
                </div>
                <Link
                  href="/profile/participant"
                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
