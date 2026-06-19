"use client";
// Support Worker Dashboard
// Sections: stat cards, load board (matched jobs), upcoming shifts, application tracker

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface WorkerStats {
  upcomingShifts:     number;
  activeApplications: number;
  matchedJobs:        number;
  hoursThisWeek:      number;
  completedShifts:    number;
  savedJobs:          number;
  unreadMessages:     number;
}

interface JobSummary {
  id:                string;
  title:             string;
  category:          string;
  urgency:           string;
  suburb:            string;
  state:             string;
  scheduledStartAt:  string;
  totalHours:        number | null;
  status:            string;
  createdAt:         string;
  budgetPerHour?:    number | null;
  isRecurring?:      boolean;
  shiftType?:        string | null;
  durationType?:     string | null;
  serviceDeliveryMode?: string | null;
  hideParticipantName?: boolean;
  _count?:           { applications: number };
}

interface Application {
  applicationId: string;
  status:        string;
  createdAt:     string;
  note?:         string | null;
  rateResponse?: string | null;
  proposedRate?: number | null;
  job:           JobSummary | null;
}

interface DashboardData {
  role:           "SUPPORT_WORKER";
  stats:          WorkerStats;
  upcomingShifts: JobSummary[];
  allApplications: Application[];
  matchedJobs:    JobSummary[];
  unreadNotifications: number;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?:  string;
  accent?: "red" | "amber" | "green" | "indigo" | "violet";
}) {
  const accentClass = {
    red:    "text-red-600",
    amber:  "text-amber-600",
    green:  "text-green-600",
    indigo: "text-indigo-600",
    violet: "text-violet-600",
  }[accent ?? "indigo"];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accentClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-900 mb-3">{children}</h2>;
}

const URGENCY_COLOR: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700",
  URGENT:    "bg-amber-100 text-amber-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
};

const STATUS_COLOR: Record<string, string> = {
  INTERESTED:  "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-violet-100 text-violet-700",
  SELECTED:    "bg-green-100 text-green-700",
  DECLINED:    "bg-red-100 text-red-700",
  WITHDRAWN:   "bg-gray-100 text-gray-600",
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  return <Badge text={urgency} color={URGENCY_COLOR[urgency] ?? "bg-gray-100 text-gray-600"} />;
}

function JobCard({ job, onApply }: { job: JobSummary; onApply?: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <UrgencyBadge urgency={job.urgency} />
            {job.isRecurring && (
              <Badge text="Recurring" color="bg-indigo-100 text-indigo-700" />
            )}
            {job.shiftType && (
              <Badge text={job.shiftType.replace(/_/g, " ")} color="bg-gray-100 text-gray-600" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {job.suburb}, {job.state}
            {job.totalHours ? ` · ${job.totalHours}h` : ""}
            {job.budgetPerHour ? ` · $${Number(job.budgetPerHour).toFixed(2)}/hr` : ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(job.scheduledStartAt).toLocaleDateString("en-AU", {
              weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
          >
            View
          </Link>
          {onApply && (
            <button
              type="button"
              onClick={() => onApply(job.id)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
            >
              Apply
            </button>
          )}
        </div>
      </div>
      {job._count !== undefined && (
        <p className="text-xs text-gray-400 mt-2">{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}

function ShiftCard({ job }: { job: JobSummary }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {job.suburb}, {job.state}
            {job.totalHours ? ` · ${job.totalHours}h` : ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(job.scheduledStartAt).toLocaleDateString("en-AU", {
              weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            text={job.status}
            color={
              job.status === "ASSIGNED" ? "bg-green-100 text-green-700"
              : job.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
            }
          />
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  if (!app.job) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              text={app.status.replace(/_/g, " ")}
              color={STATUS_COLOR[app.status] ?? "bg-gray-100 text-gray-600"}
            />
            {app.job.urgency !== "SCHEDULED" && <UrgencyBadge urgency={app.job.urgency} />}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">{app.job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {app.job.suburb}, {app.job.state}
            {app.job.totalHours ? ` · ${app.job.totalHours}h` : ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Applied {new Date(app.createdAt).toLocaleDateString("en-AU")}
            {" · Shift: "}
            {new Date(app.job.scheduledStartAt).toLocaleDateString("en-AU", {
              day: "numeric", month: "short",
            })}
          </p>
          {app.rateResponse && (
            <p className="text-xs text-gray-500 mt-1">Rate: {app.rateResponse}
              {app.proposedRate ? ` — $${Number(app.proposedRate).toFixed(2)}/hr` : ""}
            </p>
          )}
        </div>
        <Link
          href={`/jobs/${app.job.id}`}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shrink-0"
        >
          View
        </Link>
      </div>
    </div>
  );
}

// ── Apply modal (quick apply flow) ─────────────────────────────────────────────

interface ApplyModalProps {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ApplyModal({ jobId, onClose, onSuccess }: ApplyModalProps) {
  const [availabilityType, setAvailabilityType] = useState("YES_EXACTLY");
  const [rateResponse, setRateResponse] = useState("ACCEPT_POSTED");
  const [proposedRate, setProposedRate] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        availabilityType,
        rateResponse,
        proposedRate: proposedRate ? Number(proposedRate) : undefined,
        introduction: introduction || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Apply for This Shift</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Step 1 — Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability Confirmation</label>
            <div className="space-y-2">
              {[
                { v: "YES_EXACTLY", label: "Yes, I can do the requested date/time exactly" },
                { v: "YES_WITH_ADJUSTMENT", label: "Yes, with slight adjustment" },
                { v: "PARTIALLY", label: "Partially available" },
                { v: "OPEN_TO_DISCUSS", label: "Available for ongoing arrangement discussion" },
              ].map(({ v, label }) => (
                <label key={v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="availabilityType"
                    value={v}
                    checked={availabilityType === v}
                    onChange={(e) => setAvailabilityType(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Step 2 — Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rate Response</label>
            <div className="space-y-2">
              {[
                { v: "ACCEPT_POSTED", label: "Accept posted rate" },
                { v: "OFFER_OWN_RATE", label: "Offer my hourly rate" },
                { v: "NEGOTIATE", label: "Open to negotiation" },
              ].map(({ v, label }) => (
                <label key={v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="rateResponse"
                    value={v}
                    checked={rateResponse === v}
                    onChange={(e) => setRateResponse(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  {label}
                </label>
              ))}
            </div>
            {rateResponse === "OFFER_OWN_RATE" && (
              <input
                type="number"
                min="0"
                step="0.01"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                placeholder="Hourly rate (e.g. 45.00)"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Step 3 — Introduction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Introduction / Why you are suitable
            </label>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              rows={4}
              placeholder="Briefly introduce yourself and explain why you are a good fit for this shift..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type DashTab = "overview" | "loadboard" | "applications" | "shifts";

export default function SupportWorkerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ summary: DashboardData }>("/dashboard/summary");
      setData(res.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.activeRole !== "SUPPORT_WORKER") { router.push("/dashboard"); return; }
    void load();
  }, [user, router, load]);

  const handleApplySuccess = () => {
    setApplyJobId(null);
    void load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  const stats = data?.stats;
  const matchedJobs = data?.matchedJobs ?? [];
  const upcomingShifts = data?.upcomingShifts ?? [];
  const allApplications = data?.allApplications ?? [];

  // Filtered load board
  const filteredJobs = matchedJobs.filter((j) => {
    if (!jobFilter) return true;
    return (
      j.title.toLowerCase().includes(jobFilter.toLowerCase()) ||
      j.suburb.toLowerCase().includes(jobFilter.toLowerCase()) ||
      j.category.toLowerCase().includes(jobFilter.toLowerCase())
    );
  });

  // Filtered applications
  const filteredApps = allApplications.filter((a) => {
    if (appStatusFilter === "ALL") return true;
    return a.status === appStatusFilter;
  });

  const TABS: { id: DashTab; label: string; count?: number }[] = [
    { id: "overview",      label: "Overview" },
    { id: "loadboard",     label: "Browse Jobs", count: matchedJobs.length },
    { id: "applications",  label: "My Applications", count: allApplications.length },
    { id: "shifts",        label: "Upcoming Shifts", count: upcomingShifts.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Apply modal */}
      {applyJobId && (
        <ApplyModal
          jobId={applyJobId}
          onClose={() => setApplyJobId(null)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support Worker Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {data && data.unreadNotifications > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-600">
                {data.unreadNotifications}
              </span>
            )}
            <Link
              href="/register/support-worker"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Complete Profile
            </Link>
            <Link
              href="/users/me/availability"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Update Availability
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Upcoming Shifts"    value={stats.upcomingShifts}     accent="green" />
            <StatCard label="Active Applications" value={stats.activeApplications} accent="indigo" />
            <StatCard label="Matched Jobs"        value={stats.matchedJobs}        accent="violet" />
            <StatCard
              label="Hours This Week"
              value={stats.hoursThisWeek}
              sub={`${stats.completedShifts} completed total`}
              accent="amber"
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("loadboard")}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Browse Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            My Applications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shifts")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Upcoming Shifts
          </button>
          <Link
            href="/users/me/availability"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Post Availability
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 overflow-x-auto">
            {TABS.map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Upcoming shifts preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Upcoming Shifts</SectionTitle>
                {upcomingShifts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("shifts")}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                )}
              </div>
              {upcomingShifts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No upcoming shifts. Browse the load board to find work.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingShifts.slice(0, 3).map((s) => <ShiftCard key={s.id} job={s} />)}
                </div>
              )}
            </div>

            {/* Matched jobs preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Matched Opportunities</SectionTitle>
                <button
                  type="button"
                  onClick={() => setActiveTab("loadboard")}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Browse all
                </button>
              </div>
              {matchedJobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No open opportunities right now. Check back soon.
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedJobs.slice(0, 5).map((j) => (
                    <JobCard key={j.id} job={j} onApply={setApplyJobId} />
                  ))}
                </div>
              )}
            </div>

            {/* Active applications preview */}
            {allApplications.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionTitle>Recent Applications</SectionTitle>
                  <button
                    type="button"
                    onClick={() => setActiveTab("applications")}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {allApplications.slice(0, 3).map((a) => (
                    <ApplicationCard key={a.applicationId} app={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Load board tab */}
        {activeTab === "loadboard" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Available Requests</SectionTitle>
              <button
                type="button"
                onClick={() => void load()}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                placeholder="Search by title, suburb, or category…"
                className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                {jobFilter ? "No jobs match your search." : "No open opportunities right now. Check back soon."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((j) => (
                  <JobCard key={j.id} job={j} onApply={setApplyJobId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications tab */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle>My Applications</SectionTitle>
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              {["ALL","INTERESTED","SHORTLISTED","SELECTED","DECLINED"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAppStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    appStatusFilter === s
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                {appStatusFilter === "ALL"
                  ? "No applications yet. Browse the load board to apply for shifts."
                  : `No applications with status "${appStatusFilter}".`}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((a) => <ApplicationCard key={a.applicationId} app={a} />)}
              </div>
            )}
          </div>
        )}

        {/* Shifts tab */}
        {activeTab === "shifts" && (
          <div className="space-y-4">
            <SectionTitle>Upcoming Shifts</SectionTitle>
            {upcomingShifts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No upcoming shifts confirmed. Once a poster selects you, your shift will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((s) => <ShiftCard key={s.id} job={s} />)}
              </div>
            )}

            <div className="mt-4">
              <SectionTitle>All Jobs &amp; Bookings</SectionTitle>
              <Link
                href="/jobs/my"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View full booking history
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
