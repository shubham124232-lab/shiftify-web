"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getDashboard, type WorkerDashboard } from "@/lib/api/dashboard";

interface ExpiringDoc {
  id: string;
  docType: string;
  fileName: string;
  expiryDate: string | null;
}

const APP_STATUS_BADGE: Record<string, string> = {
  INTERESTED:  "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  SELECTED:    "bg-emerald-100 text-emerald-700",
  DECLINED:    "bg-slate-100 text-slate-500",
  WITHDRAWN:   "bg-slate-100 text-slate-400",
};

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

  const stats = data?.stats;
  const expiring = [...docs]
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Your upcoming shifts and nearby opportunities."
        actions={
          <div className="flex gap-2">
            <Link href="/jobs"><Button>Browse Jobs</Button></Link>
            <Link href="/availability"><Button variant="outline" size="sm">Post Availability</Button></Link>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards (all LIVE from /dashboard/summary stats) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Upcoming Shifts"      value={loading ? "…" : (stats?.upcomingShifts     ?? data?.upcomingShifts?.length ?? 0)}             />
          <StatCard label="Open Opportunities"   value={loading ? "…" : (stats?.matchedJobs        ?? data?.matchedJobs?.length    ?? 0)} tone="ok"   />
          <StatCard label="Active Applications"  value={loading ? "…" : (stats?.activeApplications ?? data?.pendingApplications?.length ?? 0)}        />
          <StatCard label="Completed Shifts"     value={loading ? "…" : (stats?.completedShifts    ?? 0)} tone="ok"   />
          <StatCard label="Hours This Week"      value={loading ? "…" : (stats?.hoursThisWeek      ?? 0)}             />
          <StatCard label="Unread Notifications" value={loading ? "…" : (data?.unreadNotifications ?? 0)} tone="warn" />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">         <Button variant="outline" size="sm">🔍 Browse Requests</Button></Link>
          <Link href="/availability"> <Button variant="outline" size="sm">📅 Post Availability</Button></Link>
          <Link href="/availability"> <Button variant="outline" size="sm">✏ Update Availability</Button></Link>
          <Link href="/jobs/my">      <Button variant="outline" size="sm">📋 My Applications</Button></Link>
          <Link href="/jobs">         <Button variant="outline" size="sm">⚡ View Matches</Button></Link>
          <Link href="/messages">     <Button variant="outline" size="sm">💬 Messages</Button></Link>
          <Link href="/profile/edit"> <Button variant="outline" size="sm">⚙ Update Profile</Button></Link>
          <Link href="/documents">    <Button variant="outline" size="sm">📄 Documents</Button></Link>
        </div>

        {/* ── Row 1 ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Upcoming shifts</CardTitle></CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.upcomingShifts?.length
                  ? <p className="text-sm text-slate-500">No upcoming shifts.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.upcomingShifts.map((s) => (
                        <li key={s.id} className="py-2 flex justify-between">
                          <span className="font-medium">{s.title}</span>
                          <span className="text-slate-500">
                            {new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matched jobs</CardTitle>
              <Link href="/jobs"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.matchedJobs?.length
                  ? <p className="text-sm text-slate-500">No matching jobs right now.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.matchedJobs.slice(0, 5).map((j) => (
                        <li key={j.id} className="py-2 flex justify-between items-center">
                          <div>
                            <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                            <span className="ml-2 text-slate-400">{j.suburb}</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            j.urgency === "EMERGENCY" ? "bg-red-100 text-red-700"
                            : j.urgency === "SAME_DAY" ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                          }`}>{j.urgency}</span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* ── Pending applications ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending applications</CardTitle>
            <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {loading
              ? <p className="text-sm text-slate-400">Loading…</p>
              : !data?.pendingApplications?.length
                ? <p className="text-sm text-slate-500">No pending applications.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.pendingApplications.map((a) => (
                      <li key={a.applicationId} className="py-2 flex justify-between">
                        <span className="font-medium">{a.job.title}</span>
                        <span className="text-slate-500">{a.job.suburb}</span>
                      </li>
                    ))}
                  </ul>
                )}
          </CardContent>
        </Card>

        {/* ── Row 2: shortlisted + recent applications (LIVE) ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Shortlisted &amp; selected</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.shortlistedApplications?.length
                  ? <p className="text-sm text-slate-500">Nothing shortlisted yet — keep applying!</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.shortlistedApplications.slice(0, 5).map((a) => (
                        <li key={a.applicationId} className="py-2 flex justify-between items-center">
                          <span className="font-medium">{a.job.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${APP_STATUS_BADGE[a.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {a.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent applications</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.allApplications?.length
                  ? <p className="text-sm text-slate-500">No applications yet.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.allApplications.slice(0, 5).map((a) => (
                        <li key={a.applicationId} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{a.job.title}</span>
                            {a.createdAt && (
                              <span className="ml-2 text-xs text-slate-400">
                                {new Date(a.createdAt).toLocaleDateString("en-AU")}
                              </span>
                            )}
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${APP_STATUS_BADGE[a.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {a.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* ── Compliance & document expiry (LIVE from /users/me/documents) ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Compliance &amp; document reminders</CardTitle>
            <Link href="/documents"><Button variant="ghost" size="sm">Manage documents</Button></Link>
          </CardHeader>
          <CardContent>
            {!expiring.length
              ? <p className="text-sm text-slate-500">No documents with expiry dates on file. Upload your compliance documents to track them here.</p>
              : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {expiring.map((d) => {
                    const daysLeft = Math.ceil((new Date(d.expiryDate!).getTime() - Date.now()) / 86400000);
                    const expired = daysLeft < 0;
                    const warn = !expired && daysLeft <= 30;
                    return (
                      <li key={d.id} className="py-2 flex justify-between items-center">
                        <span className="font-medium">{d.docType.replaceAll("_", " ")}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          expired ? "bg-red-100 text-red-700"
                          : warn ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {expired ? `Expired ${Math.abs(daysLeft)} days ago` : warn ? `Expires in ${daysLeft} days` : `Valid · ${daysLeft} days`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
