"use client";
// Admin Dashboard — spec-complete
// Tabs: Overview | Users | Listings | Verification Queue | Trust & Safety | Subscriptions | Reports | Audit Log | Broadcast

import { useEffect, useState, useCallback } from "react";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlatformStats {
  totalUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  activeJobs: number;
  completedToday: number;
  totalJobs: number;
  roleBreakdown: Record<string, number>;
}

interface UserListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  accountType: string;
  status: string;
  adminTier: string | null;
  roles: { role: string; isActiveDefault: boolean }[];
  createdAt: string;
  providerProfile?: { businessName: string; abn: string; ndisRegistered: boolean | null } | null;
  planManagerProfile?: { businessName: string; abn: string; ndisRegistered: boolean | null } | null;
  documents?: { id: string; docType: string; fileName: string; status: string; uploadedAt: string }[];
}

interface Job {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  createdAt: string;
  postedBy: { id: string; name: string; email: string };
  _count: { applications: number };
}

interface AuditEntry {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string; adminTier: string | null };
  targetUser: { id: string; name: string; email: string } | null;
}

interface Subscription {
  id: string;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
  user: { id: string; name: string; email: string | null; status: string };
  plan: { id: string; key: string; name: string; role: string; amountAud: number };
}

interface PlatformReports {
  users: {
    newLast30Days: number;
    newLast7Days: number;
    flagged: number;
    suspended: number;
    byRole: Record<string, number>;
  };
  listings: {
    active: number;
    urgentOpenCases: number;
    topCategories: { category: string; count: number }[];
  };
  invoices: { last30Days: number };
  planManager: { totalConnections: number; acceptedConnections: number };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "red" | "amber" | "green" | "indigo" | "gray";
}) {
  const accentClass = {
    red: "text-red-600",
    amber: "text-amber-600",
    green: "text-green-600",
    indigo: "text-indigo-600",
    gray: "text-gray-700",
  }[accent ?? "indigo"];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACTIVE: "bg-green-100 text-green-700",
    APPROVED: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    REJECTED: "bg-red-100 text-red-700",
    OPEN: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-indigo-100 text-indigo-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-gray-100 text-gray-700",
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    VERIFIED: "bg-green-100 text-green-700",
    UNVERIFIED: "bg-amber-100 text-amber-700",
    EMERGENCY: "bg-red-100 text-red-700",
    URGENT: "bg-amber-100 text-amber-700",
    SCHEDULED: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Broadcast Modal ────────────────────────────────────────────────────────────

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      await api.post("/admin/broadcast", { title, body, role: role || undefined });
      alert("Broadcast sent!");
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Send Broadcast Notification</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Announcement title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Notification message…" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Role (optional)</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All users</option>
            <option value="SUPPORT_WORKER">Support Workers</option>
            <option value="PARTICIPANT">Participants</option>
            <option value="PROVIDER">Providers</option>
            <option value="COORDINATOR">Coordinators</option>
            <option value="PLAN_MANAGER">Plan Managers</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={send} disabled={sending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Action Modal ──────────────────────────────────────────────────────────

function UserActionModal({
  user,
  onClose,
  onDone,
}: {
  user: UserListItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: "suspend" | "reactivate" | "approve" | "reject" | "notify") => {
    setLoading(true);
    setError(null);
    try {
      if (action === "suspend") {
        await api.patch(`/admin/users/${user.id}/status`, { status: "SUSPENDED", reason: reason || undefined });
      } else if (action === "reactivate") {
        await api.patch(`/admin/users/${user.id}/status`, { status: "ACTIVE" });
      } else if (action === "approve") {
        await api.patch(`/admin/users/${user.id}/verify`, { approved: true });
      } else if (action === "reject") {
        if (!reason.trim()) { setError("Reason required for rejection."); setLoading(false); return; }
        await api.patch(`/admin/users/${user.id}/verify`, { approved: false, reason });
      } else if (action === "notify") {
        const title = prompt("Notification title:");
        if (!title) { setLoading(false); return; }
        const body = prompt("Message:");
        if (!body) { setLoading(false); return; }
        await api.post(`/admin/users/${user.id}/notify`, { title, body });
        alert("Notification sent!");
        setLoading(false);
        return;
      }
      onDone();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Manage User: {user.name}</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{user.email ?? user.phone ?? user.username ?? "—"}</p>
          <p>Status: <Badge status={user.status} /></p>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.roles.map((r) => (
              <span key={r.role} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{r.role.replace(/_/g, " ")}</span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note (optional for some actions)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Enter reason if required…" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {user.status === "PENDING" && (
            <>
              <button type="button" onClick={() => act("approve")} disabled={loading}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
                Approve
              </button>
              <button type="button" onClick={() => act("reject")} disabled={loading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                Reject
              </button>
            </>
          )}
          {(user.status === "ACTIVE" || user.status === "APPROVED") && (
            <button type="button" onClick={() => act("suspend")} disabled={loading}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
              Suspend
            </button>
          )}
          {user.status === "SUSPENDED" && (
            <button type="button" onClick={() => act("reactivate")} disabled={loading}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
              Reactivate
            </button>
          )}
          <button type="button" onClick={() => act("notify")} disabled={loading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            Send Notification
          </button>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "listings" | "verification" | "trust" | "subscriptions" | "reports" | "audit" | "broadcast";

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userStatus, setUserStatus] = useState("");
  const [userRole, setUserRole] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<UserListItem[]>([]);
  const [verificationTotal, setVerificationTotal] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [reports, setReports] = useState<PlatformReports | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    const res = await api.get<PlatformStats>("/admin/stats");
    setStats(res);
  }, []);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(userPage), limit: "20" });
    if (userStatus) params.set("status", userStatus);
    if (userRole)   params.set("role",   userRole);
    const res = await api.get<{ users: UserListItem[]; total: number }>(`/admin/users?${params}`);
    setUsers(res.users);
    setUserTotal(res.total);
  }, [userPage, userStatus, userRole]);

  const loadJobs = useCallback(async () => {
    const res = await api.get<{ jobs: Job[]; total: number }>("/admin/jobs?limit=20");
    setJobs(res.jobs);
    setJobTotal(res.total);
  }, []);

  const loadAudit = useCallback(async () => {
    const res = await api.get<{ entries: AuditEntry[] }>("/admin/audit-log?limit=50");
    setAuditLog(res.entries);
  }, []);

  const loadVerification = useCallback(async () => {
    const res = await api.get<{ users: UserListItem[]; total: number }>("/admin/verification-queue?limit=20");
    setVerificationQueue(res.users);
    setVerificationTotal(res.total);
  }, []);

  const loadSubscriptions = useCallback(async () => {
    const res = await api.get<{ subscriptions: Subscription[]; total: number }>("/admin/subscriptions?limit=20");
    setSubscriptions(res.subscriptions);
    setSubTotal(res.total);
  }, []);

  const loadReports = useCallback(async () => {
    const res = await api.get<PlatformReports>("/admin/reports");
    setReports(res);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadUsers(), loadJobs()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadUsers, loadJobs]);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.activeRole !== "ADMIN") { router.push("/dashboard"); return; }
    void loadAll();
  }, [user, router, loadAll]);

  useEffect(() => {
    if (activeTab === "audit")         void loadAudit();
    if (activeTab === "verification")  void loadVerification();
    if (activeTab === "subscriptions") void loadSubscriptions();
    if (activeTab === "reports")       void loadReports();
  }, [activeTab, loadAudit, loadVerification, loadSubscriptions, loadReports]);

  useEffect(() => {
    if (activeTab === "users") void loadUsers();
  }, [activeTab, userPage, userStatus, userRole, loadUsers]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const cancelJob = async (jobId: string) => {
    const reason = prompt("Reason for cancellation:");
    if (reason === null) return;
    try {
      await api.patch(`/admin/jobs/${jobId}/cancel`, { reason });
      void loadJobs();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const cancelSubscription = async (subId: string) => {
    const reason = prompt("Reason for cancellation (optional):");
    if (reason === null) return;
    try {
      await api.patch(`/admin/subscriptions/${subId}/cancel`, { reason: reason || undefined });
      void loadSubscriptions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading admin dashboard…</div>
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

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview",       label: "Overview" },
    { key: "users",          label: "Users",            badge: stats?.pendingUsers || undefined },
    { key: "listings",       label: "Listings" },
    { key: "verification",   label: "Verification",     badge: verificationTotal || undefined },
    { key: "trust",          label: "Trust & Safety",   badge: stats?.suspendedUsers || undefined },
    { key: "subscriptions",  label: "Subscriptions" },
    { key: "reports",        label: "Reports" },
    { key: "audit",          label: "Audit Log" },
    { key: "broadcast",      label: "Broadcast" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
      {selectedUser && (
        <UserActionModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDone={() => { void loadUsers(); void loadVerification(); }}
        />
      )}

      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Shiftify Platform Control</p>
          </div>
          <button
            type="button"
            onClick={() => setShowBroadcast(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Broadcast
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Users"     value={stats.totalUsers} />
            <StatCard label="Pending"         value={stats.pendingUsers}   accent="amber" />
            <StatCard label="Suspended"       value={stats.suspendedUsers} accent="red" />
            <StatCard label="Active Listings" value={stats.activeJobs}     accent="indigo" />
            <StatCard label="Done Today"      value={stats.completedToday} accent="green" />
            <StatCard label="Total Listings"  value={stats.totalJobs} />
          </div>
        )}

        {/* Role breakdown */}
        {stats?.roleBreakdown && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Users by Role</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                <div key={role} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  <span className="font-medium text-gray-900">{count}</span>
                  <span className="ml-1 text-gray-500">{role.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-0 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Priority alerts */}
            {(stats?.pendingUsers ?? 0) > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  {stats?.pendingUsers} pending user{stats?.pendingUsers !== 1 ? "s" : ""} awaiting review
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("verification")}
                  className="mt-2 text-sm text-amber-700 underline"
                >
                  Go to Verification Queue →
                </button>
              </div>
            )}

            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Listings</h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Listing</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Posted by</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Apps</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.slice(0, 5).map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{job.title}</td>
                        <td className="px-4 py-3"><Badge status={job.status} /></td>
                        <td className="px-4 py-3 text-gray-600">{job.postedBy.name}</td>
                        <td className="px-4 py-3 text-gray-600">{job._count.applications}</td>
                        <td className="px-4 py-3">
                          {!["CANCELLED", "CONFIRMED"].includes(job.status) && (
                            <button type="button" onClick={() => cancelJob(job.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Users ─────────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <select value={userStatus} onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select value={userRole} onChange={(e) => { setUserRole(e.target.value); setUserPage(1); }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All roles</option>
                <option value="SUPPORT_WORKER">Support Worker</option>
                <option value="PARTICIPANT">Participant</option>
                <option value="PROVIDER">Provider</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="PLAN_MANAGER">Plan Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <span className="ml-auto text-sm text-gray-500 self-center">{userTotal} user{userTotal !== 1 ? "s" : ""}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Roles</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email ?? u.phone ?? u.username ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r.role} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                              {r.role.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status={u.status} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-AU")}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setSelectedUser(u)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button type="button" disabled={userPage <= 1} onClick={() => setUserPage((p) => p - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {userPage}</span>
              <button type="button" disabled={userPage * 20 >= userTotal} onClick={() => setUserPage((p) => p + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Listings ──────────────────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">All Listings ({jobTotal})</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Listing</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Urgency</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Posted by</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responses</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{job.title}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{job.category.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3"><Badge status={job.urgency} /></td>
                      <td className="px-4 py-3"><Badge status={job.status} /></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{job.suburb}, {job.state}</td>
                      <td className="px-4 py-3 text-gray-600">{job.postedBy.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-center">{job._count.applications}</td>
                      <td className="px-4 py-3">
                        {!["CANCELLED", "CONFIRMED"].includes(job.status) && (
                          <button type="button" onClick={() => cancelJob(job.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Verification Queue ────────────────────────────────────────────── */}
        {activeTab === "verification" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Verification Queue</h2>
              <span className="text-sm text-gray-500">{verificationTotal} pending</span>
            </div>

            {verificationQueue.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No users pending verification.
              </div>
            ) : (
              <div className="space-y-4">
                {verificationQueue.map((u) => (
                  <div key={u.id} className="bg-white rounded-xl border border-amber-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <Badge status={u.status} />
                          {u.roles.map((r) => (
                            <span key={r.role} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                              {r.role.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{u.email ?? u.phone ?? "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Registered {new Date(u.createdAt).toLocaleDateString("en-AU")}</p>

                        {/* Business info */}
                        {(u.providerProfile ?? u.planManagerProfile) && (
                          <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                            <p>Business: {u.providerProfile?.businessName ?? u.planManagerProfile?.businessName ?? "—"}</p>
                            <p>ABN: {u.providerProfile?.abn ?? u.planManagerProfile?.abn ?? "—"}</p>
                            {(u.providerProfile?.ndisRegistered ?? u.planManagerProfile?.ndisRegistered) && (
                              <p className="text-green-600">NDIS Registered</p>
                            )}
                          </div>
                        )}

                        {/* Documents */}
                        {(u.documents?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {u.documents?.map((d) => (
                              <span key={d.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {d.docType} · <Badge status={d.status} />
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => setSelectedUser(u)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Trust & Safety ─────────────────────────────────────────────────── */}
        {activeTab === "trust" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-white rounded-xl border border-red-200 p-5">
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Suspended Users</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{stats?.suspendedUsers ?? 0}</p>
                <button type="button" onClick={() => { setUserStatus("SUSPENDED"); setActiveTab("users"); }}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 underline">
                  View all →
                </button>
              </div>
              <div className="bg-white rounded-xl border border-amber-200 p-5">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pending Verification</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">{verificationTotal}</p>
                <button type="button" onClick={() => setActiveTab("verification")}
                  className="mt-2 text-xs text-amber-600 hover:text-amber-700 underline">
                  Review queue →
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Listings</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.activeJobs ?? 0}</p>
                <button type="button" onClick={() => setActiveTab("listings")}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">
                  View all →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Risk Controls</h3>
              <p className="text-sm text-gray-500 mb-4">
                Use the Users tab to find and manage flagged, suspended or high-risk accounts.
                Use Verification Queue to action pending providers and plan managers.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => { setUserStatus("SUSPENDED"); setActiveTab("users"); }}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                  View suspended users
                </button>
                <button type="button" onClick={() => { setUserStatus("PENDING"); setActiveTab("users"); }}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
                  View pending users
                </button>
                <button type="button" onClick={() => setActiveTab("audit")}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  View audit log
                </button>
              </div>
            </div>

            {/* Suspended users list */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Recently Suspended</h3>
              {users.filter((u) => u.status === "SUSPENDED").length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">
                  No suspended users in current page. Filter by Suspended in the Users tab.
                </div>
              ) : (
                <div className="space-y-2">
                  {users.filter((u) => u.status === "SUSPENDED").map((u) => (
                    <div key={u.id} className="bg-white rounded-xl border border-red-100 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email ?? u.phone ?? "—"}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedUser(u)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Subscriptions ─────────────────────────────────────────────────── */}
        {activeTab === "subscriptions" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Subscriptions ({subTotal})</h2>
            </div>

            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No subscriptions found.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{sub.user.name}</p>
                          <p className="text-xs text-gray-500">{sub.user.email ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{sub.plan.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{sub.plan.role.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-gray-700">${sub.plan.amountAud.toFixed(2)}</td>
                        <td className="px-4 py-3"><Badge status={sub.status} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.createdAt).toLocaleDateString("en-AU")}</td>
                        <td className="px-4 py-3">
                          {sub.status === "ACTIVE" && (
                            <button type="button" onClick={() => cancelSubscription(sub.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Reports ───────────────────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {reports ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="New users (30d)"  value={reports.users.newLast30Days} accent="indigo" />
                  <StatCard label="New users (7d)"   value={reports.users.newLast7Days}  accent="indigo" />
                  <StatCard label="Suspended"         value={reports.users.suspended}    accent="red" />
                  <StatCard label="Invoices (30d)"    value={reports.invoices.last30Days} accent="green" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Listings</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Active listings</span>
                        <span className="font-medium">{reports.listings.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Urgent open cases</span>
                        <span className="font-medium text-red-600">{reports.listings.urgentOpenCases}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Manager Connections</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Total connections</span>
                        <span className="font-medium">{reports.planManager.totalConnections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accepted</span>
                        <span className="font-medium text-green-600">{reports.planManager.acceptedConnections}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Users by Role</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(reports.users.byRole).map(([role, count]) => (
                      <div key={role} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                        <span className="font-medium text-gray-900">{count}</span>
                        <span className="ml-1 text-gray-500">{role.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reports.listings.topCategories.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Support Categories</h3>
                    <div className="space-y-2">
                      {reports.listings.topCategories.map((c) => (
                        <div key={c.category} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 w-48 truncate">{c.category.replace(/_/g, " ")}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (c.count / (reports.listings.topCategories[0]?.count ?? 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                Loading reports…
              </div>
            )}
          </div>
        )}

        {/* ── Audit Log ─────────────────────────────────────────────────────── */}
        {activeTab === "audit" && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString("en-AU")}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{entry.admin.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.targetUser?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{entry.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Broadcast ─────────────────────────────────────────────────────── */}
        {activeTab === "broadcast" && (
          <div className="max-w-lg">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Broadcast Notification</h2>
              <p className="text-sm text-gray-500 mb-4">
                Send a push notification to all users or a specific role group.
              </p>
              <button type="button" onClick={() => setShowBroadcast(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Compose broadcast
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
