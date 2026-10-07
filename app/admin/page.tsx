'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStats, listUsers, getFlags, type PlatformStats, type AdminUser, type UrgentFlag } from '@/lib/api/admin';

const FLAG_COLOR: Record<string, string> = {
  SAFETY:     "bg-red-100 text-red-700",
  MISCONDUCT: "bg-red-100 text-red-700",
  NO_SHOW:    "bg-amber-100 text-amber-700",
  OTHER:      "bg-slate-100 text-slate-600",
};

const ROLE_BADGE: Record<string, string> = {
  PARTICIPANT:    "bg-blue-100 text-blue-700",
  SUPPORT_WORKER: "bg-emerald-100 text-emerald-700",
  PROVIDER:       "bg-purple-100 text-purple-700",
  COORDINATOR:    "bg-teal-100 text-teal-700",
  PLAN_MANAGER:   "bg-indigo-100 text-indigo-700",
};
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAuth, loading } = useAuth();
  const router = useRouter();

  const [stats,       setStats]       = useState<PlatformStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [flags,       setFlags]       = useState<UrgentFlag[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuth || !user) { router.replace('/login'); return; }
    if (!user.adminTier)  { router.replace('/dashboard'); return; }

    // Fetch live data
    Promise.all([
      getStats(),
      listUsers({ page: 1, limit: 5 }),
      getFlags(5),
    ])
      .then(([statsRes, usersRes, flagsRes]) => {
        setStats(statsRes);
        setRecentUsers(usersRes.users);
        setFlags(flagsRes.flags);
      })
      .catch((e) => setDataError(e.message))
      .finally(() => setDataLoading(false));
  }, [loading, isAuth, user, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Platform overview — {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users"><Button variant="outline" size="sm">Review New Users</Button></Link>
            <Link href="/admin/jobs"> <Button variant="outline" size="sm">Review Jobs</Button></Link>
            <Link href="/admin/listings"> <Button variant="outline" size="sm">Review Listings</Button></Link>
            <Link href="/admin/broadcast"><Button size="sm">Post Notice</Button></Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {dataError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{dataError}</div>
        )}

        {/* ── Stat cards row 1: LIVE ── */}
        {/* GET /admin/stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Users"           value={dataLoading ? "…" : (stats?.totalUsers            ?? 0)} tone="ok"     />
          <StatCard label="Pending Verifications" value={dataLoading ? "…" : (stats?.pendingUsers          ?? 0)} tone="warn"   />
          <StatCard label="Suspended Accounts"    value={dataLoading ? "…" : (stats?.suspendedUsers        ?? 0)} tone="warn"   />
          <StatCard label="Active Jobs"           value={dataLoading ? "…" : (stats?.activeJobs            ?? 0)}               />
          <StatCard label="Completed Today"       value={dataLoading ? "…" : (stats?.completedToday        ?? 0)} tone="ok"     />
          <StatCard label="Total Jobs"            value={dataLoading ? "…" : (stats?.totalJobs             ?? 0)}               />
        </div>

        {/* ── Stat cards row 2: role breakdown (LIVE) + placeholder ── */}
        {/* GET /admin/stats → roleBreakdown */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Participants"   value={dataLoading ? "…" : (stats?.roleBreakdown?.PARTICIPANT    ?? 0)} tone="ok"     />
          <StatCard label="Workers"        value={dataLoading ? "…" : (stats?.roleBreakdown?.SUPPORT_WORKER ?? 0)} tone="ok"     />
          <StatCard label="Providers"      value={dataLoading ? "…" : (stats?.roleBreakdown?.PROVIDER       ?? 0)}               />
          <StatCard label="Coordinators"   value={dataLoading ? "…" : (stats?.roleBreakdown?.COORDINATOR    ?? 0)}               />
          <StatCard label="Plan Managers"  value={dataLoading ? "…" : (stats?.roleBreakdown?.PLAN_MANAGER   ?? 0)}               />
          <StatCard label="Urgent Flags"   value={dataLoading ? "…" : (stats?.openComplaints ?? 0)} tone="danger" />
        </div>

        {/* ── Stat cards row 3: LIVE ── */}
        {/* GET /admin/stats — no "Failed Payments" figure: Phase 1 mock payments
            never fail, so there is nothing real to show for it. */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Confirmed Bookings"  value={dataLoading ? "…" : (stats?.confirmedBookings ?? 0)} tone="ok"     />
          <StatCard label="Open Complaints"     value={dataLoading ? "…" : (stats?.openComplaints ?? 0)}    tone="danger" />
          <StatCard label="Monthly Revenue"     value={dataLoading ? "…" : `$${(stats?.monthlyRevenueAud ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`} tone="ok" />
          <StatCard label="Unread Admin Alerts" value={dataLoading ? "…" : (stats?.unreadAdminAlerts ?? 0)} tone="warn"   />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users">        <Button variant="outline" size="sm">👤 Users</Button></Link>
          <Link href="/admin/jobs">         <Button variant="outline" size="sm">📋 Listings</Button></Link>
          <Link href="/admin/verification"> <Button variant="outline" size="sm">✅ Verifications</Button></Link>
          <Link href="/admin/audit">         <Button variant="outline" size="sm">📜 Audit Logs</Button></Link>
          <Link href="/admin/broadcast">     <Button variant="outline" size="sm">📢 Broadcast</Button></Link>
          <Link href="/admin/subscriptions"> <Button variant="outline" size="sm">💳 Subscriptions</Button></Link>
          <Link href="/admin/reports"><Button variant="outline" size="sm">📊 Reports</Button></Link>
          <Button variant="outline" size="sm" disabled>🚨 Complaints</Button>
          <Button variant="outline" size="sm" disabled>⚙ Platform Settings</Button>
        </div>

        {/* ── Row 1: urgent flags (placeholder) + recent registrations (LIVE) ── */}
        {/* Flags: GET /admin/flags (open incident reports)  |  Users: GET /admin/users?limit=5 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Urgent flags</CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : flags.length === 0 ? (
                <p className="text-sm text-slate-500">No open incident reports.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {flags.map((f) => (
                    <li key={f.id} className="py-2 flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${FLAG_COLOR[f.category] ?? "bg-slate-100 text-slate-500"}`}>
                          {f.category.replace("_", " ")}
                        </span>
                        <span className="text-slate-700">{f.job.title}</span>
                        {f.description && <span className="text-slate-500"> — {f.description}</span>}
                        <span className="text-xs text-slate-400"> (reported by {f.reporter.name})</span>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(f.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent registrations</CardTitle>
              <Link href="/admin/users"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {dataLoading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !recentUsers.length
                  ? <p className="text-sm text-slate-500">No users yet.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {recentUsers.map((u) => {
                        const primaryRole = u.roles[0]?.role ?? "UNKNOWN";
                        return (
                          <li key={u.id} className="py-2 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{u.name}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE[primaryRole] ?? "bg-slate-100 text-slate-500"}`}>
                                {primaryRole.replace("_", " ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs ${
                                u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
                                : u.status === "PENDING" ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                              }`}>{u.status}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(u.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* ── Admin page links ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: "/admin/users",         icon: "👤", label: "Users",         desc: "Manage all accounts"     },
            { href: "/admin/jobs",          icon: "📋", label: "Jobs",          desc: "All load board posts"    },
            { href: "/admin/listings",      icon: "🏠", label: "Listings",      desc: "Provider service/SIL-SDA listings" },
            { href: "/admin/verification",  icon: "✅", label: "Verifications", desc: "Document review queue"   },
            { href: "/admin/subscriptions", icon: "💳", label: "Subscriptions", desc: "Manage billing & plans"  },
            { href: "/admin/reports",       icon: "📊", label: "Reports",       desc: "Platform analytics & activity" },
            { href: "/admin/audit",         icon: "📜", label: "Audit Log",     desc: "Platform activity trail" },
            { href: "/admin/broadcast",     icon: "📢", label: "Broadcast",     desc: "Send platform notices"   },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-400 hover:shadow-sm transition-all cursor-pointer">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
