"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getDashboard, type ProviderDashboard, type JobSummary } from "@/lib/api/dashboard";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import {
  Briefcase, ChevronRight, CalendarDays, FileText, Users, Search, Plus,
} from "lucide-react";

const SOON = (slug: string) => `/provider/coming-soon/${slug}`;

// Time until a request starts, e.g. "Starts in 42 min".
function startsIn(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (mins <= 0) return "Start time reached";
  if (mins < 60) return `Starts in ${mins} min`;
  if (mins < 48 * 60) return `Starts in ${Math.floor(mins / 60)} hr ${mins % 60} min`;
  return `Starts in ${Math.round(mins / 1440)} days`;
}

function ago(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"} ago`;
  return `${Math.round(mins / 1440)} days ago`;
}

const URGENCY_BADGE: Record<string, { label: string; cls: string }> = {
  RAPID:       { label: "Rapid",       cls: "bg-red-100 text-red-700" },
  URGENT:      { label: "Urgent",      cls: "bg-amber-100 text-amber-700" },
  LAST_MINUTE: { label: "Last-Minute", cls: "bg-orange-100 text-orange-700" },
  ROUTINE:     { label: "Routine",     cls: "bg-slate-100 text-slate-600" },
};

function categoryLabel(value: string): string {
  return JOB_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function StatTile({ label, value, hint, href }: { label: string; value: number; hint: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-colors hover:border-brand-200">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{hint}</span>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600" />
      </div>
    </Link>
  );
}

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<{ applies: boolean; limit: number; used: number; remaining: number } | null>(null);
  const [past, setPast] = useState<JobSummary[]>([]);
  const [repostId, setRepostId] = useState("");
  const [reposting, setReposting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    // Paid organisation plans have unlimited core actions, so the once-only counter only applies without one.
    Promise.all([
      api.get<{ allowance: { applies: boolean; limit: number; used: number; remaining: number } }>("/subscriptions/me/allowance"),
      api.get<{ capacity: { planLabel: string } | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
    ])
      .then(([r, cap]) => {
        setAllowance(cap.capacity ? null : r.allowance);
        setPlan((cap.capacity as { planLabel?: string } | null)?.planLabel ?? null);
      })
      .catch(() => setAllowance(null));

    getDashboard()
      .then((d) => setData(d as ProviderDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api.get<{ jobs: JobSummary[] }>("/jobs/my")
      .then((r) => setPast(r.jobs ?? []))
      .catch(() => setPast([]));
  }, []);

  async function postAgain() {
    if (!repostId) return;
    setReposting(true);
    setError(null);
    try {
      const res = await api.post<{ job: { id: string } }>(`/jobs/${repostId}/duplicate`, {});
      router.push(`/jobs/${res.job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reuse that shift");
      setReposting(false);
    }
  }

  if (!user) return null;

  const stats = data?.stats;
  const myRequests = data?.myRequests ?? [];
  const attention = [...myRequests].sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime()).slice(0, 4);
  const expiring = data?.expiringSoon ?? [];
  const opportunities = data?.relevantOpportunities ?? [];
  const upcoming = data?.activeShifts ?? [];
  const pipeline = data?.pipeline;
  const activity = data?.recentActivity ?? [];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="Your staffing and service activity at a glance."
        actions={
          <>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen((o) => !o)}>
                <Plus className="mr-1 h-4 w-4" /> Create
              </Button>
              {createOpen && (
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg" onMouseLeave={() => setCreateOpen(false)}>
                  <Link href="/jobs/post" className="block px-3 py-2 hover:bg-slate-50">Post a Shift</Link>
                  <Link href="/provider/post-service" className="block px-3 py-2 hover:bg-slate-50">Post service or capacity</Link>
                  <Link href="/provider/sil-vacancy" className="block px-3 py-2 hover:bg-slate-50">List a housing vacancy</Link>
                </div>
              )}
            </div>
            <Link href="/jobs"><Button variant="outline" size="sm">Browse Requests</Button></Link>
            <Link href="/jobs/post"><Button size="sm">Post a Shift</Button></Link>
          </>
        }
      />
      <SetupBanner />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Free actions / plan bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        {allowance?.applies ? (
          <span className="text-slate-700">
            <strong>{allowance.remaining} / {allowance.limit}</strong> free actions remaining <span className="text-slate-400">· No expiry</span>
          </span>
        ) : (
          <span className="text-slate-700">
            <strong>{plan ? `Provider ${plan} plan` : "No paid plan"}</strong>
            {plan && <span className="text-slate-400"> · Unlimited core actions within your plan limits</span>}
          </span>
        )}
        <span className="flex gap-4">
          <Link href="/subscription" className="font-semibold text-brand-600 hover:underline">How it works</Link>
          <Link href="/subscription" className="font-semibold text-brand-600 hover:underline">View plans</Link>
        </span>
      </div>

      {/* Number tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Open staffing requests" value={stats?.openRequests ?? 0} hint="Posted and still open" href="/jobs/my" />
        <StatTile label="Applications to review" value={stats?.newEnquiries ?? 0} hint="For your open requests" href="/jobs/my" />
        <StatTile label="Upcoming assignments" value={upcoming.length} hint="View confirmed work" href="/provider/offers-assignments" />
        <StatTile label="New enquiries" value={stats?.newInquiries ?? 0} hint="Awaiting an intake response" href={"/provider/enquiries"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Needs your attention */}
          <Card>
            <CardHeader><CardTitle>Needs your attention</CardTitle></CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : attention.length === 0 && expiring.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">Nothing needs attention right now.</p>
              ) : (
                <>
                  {attention.map((j) => (
                    <DashboardListRow key={j.id} icon={<Briefcase className="h-5 w-5" />} title={j.title}
                      subtitle={`${startsIn(j.scheduledStartAt)} · ${j.suburb}`} href={`/jobs/${j.id}`} rightLabel="Review applications" />
                  ))}
                  {expiring.length > 0 && (
                    <DashboardListRow icon={<FileText className="h-5 w-5" />} title="Documents expiring soon"
                      subtitle={expiring.map((e) => `${e.label} (${new Date(e.date).toLocaleDateString("en-AU")})`).join(" · ")}
                      href="/documents" rightLabel="Review documents" />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Relevant opportunities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Relevant opportunities</CardTitle>
                <Link href="/jobs" className="text-sm font-semibold text-brand-600 hover:underline">View matches</Link>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : opportunities.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No matching requests right now. Matches are based on your live service listings.{" "}
                  <Link href="/provider/services" className="font-semibold text-brand-600 hover:underline">Manage services</Link>
                </p>
              ) : (
                opportunities.map((j) => {
                  const u = URGENCY_BADGE[j.urgency] ?? URGENCY_BADGE.ROUTINE;
                  return (
                    <DashboardListRow key={j.id} icon={<Search className="h-5 w-5" />} title={j.title}
                      subtitle={`${j.suburb} · Matches your ${categoryLabel(j.category)} service`} href={`/jobs/${j.id}`}
                      badge={<span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.label}</span>}
                      rightLabel="View request" />
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Upcoming work */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming work</CardTitle>
                <Link href={SOON("calendar")} className="text-sm font-semibold text-brand-600 hover:underline">Calendar</Link>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No upcoming assignments.</p>
              ) : (
                upcoming.map((s) => (
                  <DashboardListRow key={s.id} icon={<CalendarDays className="h-5 w-5" />} title={s.title}
                    subtitle={`${new Date(s.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · ${s.suburb}`}
                    href={`/jobs/${s.id}`} rightLabel="View" />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Service pipeline</CardTitle></CardHeader>
            <CardContent className="space-y-1 py-2">
              {([
                ["Awaiting acceptance", pipeline?.awaitingAcceptance ?? 0, "/provider/my-responses"],
                ["Awaiting intake",     pipeline?.awaitingIntake ?? 0,     "/provider/confirmed-starts"],
                ["Start confirmed",     pipeline?.startConfirmed ?? 0,     "/provider/confirmed-starts"],
              ] as const).map(([label, n, href]) => (
                <Link key={label} href={href} className="flex items-center justify-between rounded-lg px-1 py-2 hover:bg-slate-50">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="flex items-center gap-1 text-lg font-semibold text-slate-900">{n}<ChevronRight className="h-4 w-4 text-slate-300" /></span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Team availability</CardTitle></CardHeader>
            <CardContent className="py-3 text-sm text-slate-600">
              <p className="m-0 mb-3">Check replies for a specific shift.</p>
              <Link href={"/provider/team-availability"}>
                <Button variant="outline" size="sm"><Users className="mr-1 h-4 w-4" /> Team availability</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Post again</CardTitle></CardHeader>
            <CardContent className="space-y-3 py-3 text-sm text-slate-600">
              <p className="m-0">Reuse a previous shift as a new draft.</p>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                value={repostId}
                onChange={(e) => setRepostId(e.target.value)}
                disabled={past.length === 0}
              >
                <option value="">{past.length === 0 ? "No previous shifts" : "Choose post"}</option>
                {past.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <Button size="sm" disabled={!repostId || reposting} onClick={postAgain}>
                {reposting ? "Creating…" : "Create draft"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No recent activity yet.</p>
              ) : (
                <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                  {activity.map((a) => (
                    <li key={a.id} className="py-2.5">
                      <p className="m-0 text-sm text-slate-800">{a.text}</p>
                      <p className="m-0 mt-0.5 text-xs text-slate-400">{ago(a.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
