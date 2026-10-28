"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SetupBanner } from "@/components/dashboard/setup-banner";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";
import { CreateDialog, PostShiftDialog } from "@/components/provider/DashboardDialogs";
import { RequestDetailDialog, NearbyRequestsDialog } from "@/components/provider/RequestDialogs";
import { ProviderRespondModal } from "@/components/jobs/ProviderRespondModal";
import { ApplicationsFlow } from "@/components/provider/ApplicationsFlow";
import { ReusePostDialog } from "@/components/dashboard/ReusePostDialog";
import { api } from "@/lib/api";
import { getDashboard, type ProviderDashboard, type JobSummary } from "@/lib/api/dashboard";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import {
  Briefcase, Calendar, Users, Search, Plus, Clock, MapPin, RefreshCw, HelpCircle,
  MessageCircle, Check, Zap, X,
} from "lucide-react";

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
  RAPID:       { label: "Rapid",       cls: "pd-badge-rapid" },
  URGENT:      { label: "Urgent",      cls: "pd-badge-urgent" },
  LAST_MINUTE: { label: "Last-Minute", cls: "pd-badge-last-minute" },
  ROUTINE:     { label: "Routine",     cls: "pd-badge-routine" },
};

function categoryLabel(value: string): string {
  return JOB_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function StatTile({ label, value, hint, href, icon }: { label: string; value: number; hint: string; href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="pd-stat">
      <div className="pd-stat-top">{label}{icon}</div>
      <div className="pd-stat-num">{value}</div>
      <div className="pd-stat-foot">{hint}<span aria-hidden="true">→</span></div>
    </Link>
  );
}

const URGENCY_ICON: Record<string, React.ReactNode> = {
  RAPID: <Zap />,
  URGENT: <Clock />,
  LAST_MINUTE: <Clock />,
  ROUTINE: <Calendar />,
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  APPLICATION: <Users />,
  ENQUIRY: <MessageCircle />,
  CONFIRMATION: <Check />,
};

// "Match details & feedback" — why a request surfaced, with a lightweight useful / not-relevant response.
function MatchDetails({ why }: { why: string }) {
  const [vote, setVote] = useState<"USEFUL" | "NOT_RELEVANT" | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  return (
    <details className="pd-match-options">
      <summary>Match details &amp; feedback</summary>
      <div className="pd-buttons">
        <button type="button" className="pd-btn pd-btn-ghost" onClick={() => setShowWhy((v) => !v)}>Why this match</button>
        <button type="button" className="pd-btn pd-btn-ghost" onClick={() => setVote("USEFUL")}>Useful</button>
        <button type="button" className="pd-btn pd-btn-ghost" onClick={() => setVote("NOT_RELEVANT")}>Not relevant</button>
      </div>
      {showWhy && <p className="m-0 mt-1.5 text-xs text-slate-500">{why}</p>}
      {vote && <p className="m-0 mt-1.5 text-xs font-medium text-slate-600">Thanks — noted as {vote === "USEFUL" ? "useful" : "not relevant"}.</p>}
    </details>
  );
}

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [baseSub, setBaseSub] = useState<{ status: string; currentPeriodEnd: string | null; cancelledAt: string | null } | null>(null);
  const [allowance, setAllowance] = useState<{ applies: boolean; limit: number; used: number; remaining: number } | null>(null);
  const [past, setPast] = useState<JobSummary[]>([]);
  const [repostOpen, setRepostOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [referral, setReferral] = useState<{ qualified: number; target: number; rewardUnlocked: boolean } | null>(null);
  useEffect(() => { api.get<{ qualified: number; target: number; rewardUnlocked: boolean }>("/refer-and-earn/me").then(setReferral).catch(() => undefined); }, []);
  const [reviewJob, setReviewJob] = useState<JobSummary | null>(null);
  // Team availability replies per shift: jobId → { available, awaiting }.
  const [teamReplies, setTeamReplies] = useState<Record<string, { available: number; awaiting: number }>>({});
  const [reposting, setReposting] = useState<string | null>(null);
  const [repostError, setRepostError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [respondJob, setRespondJob] = useState<JobSummary | null>(null);
  const [detail, setDetail] = useState<{ id: string; own: boolean } | null>(null);

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
    // Handoff strip cases (renewal cancelled, payment issue) come from the organisation's base subscription.
    api.get<{ subscriptions: { status: string; currentPeriodEnd: string | null; cancelledAt: string | null; plan: { isAddOn?: boolean; amountAud: number | string } }[] }>("/subscriptions/me/all")
      .then((r) => setBaseSub(r.subscriptions.find((x) => !x.plan.isAddOn && Number(x.plan.amountAud) > 0) ?? null))
      .catch(() => setBaseSub(null));

    getDashboard()
      .then((d) => setData(d as ProviderDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api.get<{ requests: { jobId?: string | null; replies: { status: string }[] }[] }>("/provider-workspace/team-availability")
      .then((r) => {
        const m: Record<string, { available: number; awaiting: number }> = {};
        for (const req of r.requests ?? []) {
          if (!req.jobId) continue;
          const cur = (m[req.jobId] ??= { available: 0, awaiting: 0 });
          for (const rep of req.replies ?? []) {
            if (rep.status === "AVAILABLE") cur.available += 1;
            else if (rep.status === "PENDING") cur.awaiting += 1;
          }
        }
        setTeamReplies(m);
      })
      .catch(() => setTeamReplies({}));

    api.get<{ jobs: JobSummary[] }>("/jobs/my")
      .then((r) => setPast(r.jobs ?? []))
      .catch(() => setPast([]));
  }, []);

  async function postAgain(id: string) {
    setReposting(id);
    setRepostError(null);
    try {
      const res = await api.post<{ job: { id: string } }>(`/jobs/${id}/duplicate`, {});
      router.push(`/jobs/${res.job.id}`);
    } catch (e) {
      setRepostError(e instanceof Error ? e.message : "Could not reuse that shift");
      setReposting(null);
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
    <div className="pd-workspace pd-dash">
      <div className="pd-content">
      <div className="pd-breadcrumb">Provider / My Dashboard</div>
      <div className="pd-page-head">
        <div>
          <h1>My Dashboard</h1>
          <p>Your staffing and service activity at a glance.</p>
        </div>
        <div className="pd-buttons">
          <button type="button" className="pd-btn" onClick={() => setCreateOpen(true)}>Create</button>
          <Link href="/jobs" className="pd-btn"><Search />Browse Requests</Link>
          <button type="button" className="pd-btn pd-btn-primary" onClick={() => setPostOpen(true)}><Plus />Post a Shift</button>
        </div>
      </div>

      {howOpen && (
        <Portal><div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setHowOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Your first 10 free actions" className="w-full max-w-[80vw] overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="m-0 text-xl font-bold text-slate-900">Your first 10 free actions</h2>
              <button type="button" onClick={() => setHowOpen(false)} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 px-6 py-5 text-[15px] text-slate-700">
              <p className="m-0">Use an action to publish a new external staffing request or send a Provider-initiated response to a Participant or Support Coordinator request.</p>
              <p className="m-0">Drafts, browsing, internal availability and assignments do not use an action. These 10 actions have no expiry and do not reset.</p>
              <p className="m-0">Housing listings and optional promotions have separate pricing. After the 10 actions, choose a subscription or a $19.99 single-action pass.</p>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button onClick={() => setHowOpen(false)}>Got it</Button>
            </div>
          </div>
        </div></Portal>
      )}

      {createOpen && <CreateDialog onClose={() => setCreateOpen(false)} />}
      {postOpen && <PostShiftDialog onClose={() => setPostOpen(false)} />}
      {nearbyOpen && <NearbyRequestsDialog mode="opportunity" requests={opportunities} onClose={() => setNearbyOpen(false)} onOpen={(id) => { setNearbyOpen(false); setDetail({ id, own: false }); }} onRespond={(id) => { setNearbyOpen(false); setRespondJob(opportunities.find((o) => o.id === id) ?? null); }} />}
      {respondJob && <ProviderRespondModal job={{ id: respondJob.id, title: respondJob.title, suburb: respondJob.suburb, state: respondJob.state ?? "", scheduledStartAt: respondJob.scheduledStartAt }} onClose={() => setRespondJob(null)} onSuccess={() => setRespondJob(null)} />}
      {detail && <RequestDetailDialog jobId={detail.id} own={detail.own} onClose={() => setDetail(null)} />}
      {reviewJob && <ApplicationsFlow job={reviewJob} onClose={() => setReviewJob(null)} onViewDetails={() => { const id = reviewJob.id; setReviewJob(null); setDetail({ id, own: true }); }} />}

      <SetupBanner />

      {error && (
        <div className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Free actions / plan bar: one slim strip, seven cases from the Provider handoff. */}
      {(() => {
        const dateText = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "");
        const periodOver = !!baseSub?.currentPeriodEnd && new Date(baseSub.currentPeriodEnd) < new Date();
        let text: React.ReactNode;
        let action: React.ReactNode = <Link href="/subscription" className="pd-btn pd-btn-ghost">View plans</Link>;
        if (baseSub && (baseSub.status === "EXPIRED" || periodOver) && !baseSub.cancelledAt) {
          text = <><strong>Payment issue or expired subscription</strong> <span className="text-slate-400">· New chargeable activity may be restricted. Existing records stay available.</span></>;
          action = <Link href="/subscription" className="pd-btn pd-btn-ghost">Resolve billing</Link>;
        } else if (baseSub && baseSub.cancelledAt) {
          text = <><strong>{plan ? `Provider ${plan} plan` : "Current plan"}</strong> <span className="text-slate-400">· Current plan active until {dateText(baseSub.currentPeriodEnd)} · Renewal cancelled</span></>;
          action = <Link href="/subscription" className="pd-btn pd-btn-ghost">Manage plan</Link>;
        } else if (baseSub && plan) {
          text = <><strong>{plan}</strong> <span className="text-slate-400">· Unlimited genuine Provider actions</span></>;
          action = <Link href="/subscription" className="pd-btn pd-btn-ghost">Manage plan</Link>;
        } else if (allowance?.applies && allowance.remaining <= 0) {
          text = <><strong>0 / {allowance.limit}</strong> free actions remaining <span className="text-slate-400">· Subscribe or pay $19.99 for a Shift Pass at your next chargeable action. Browsing and existing work stay available.</span></>;
        } else if (allowance?.applies) {
          text = <><strong>{allowance.remaining} / {allowance.limit}</strong> free actions remaining <span className="text-slate-400">· No expiry</span></>;
        } else {
          text = <><strong>{plan ? `Provider ${plan} plan` : "No paid plan"}</strong>{plan && <span className="text-slate-400"> · Unlimited genuine Provider actions</span>}</>;
        }
        return (
          <div className="pd-access-strip">
            <span>{text}</span>
            <span className="flex gap-2">
              {allowance?.applies && !baseSub && (
                <button type="button" onClick={() => setHowOpen(true)} className="pd-btn pd-btn-ghost"><HelpCircle /> How it works</button>
              )}
              {action}
            </span>
          </div>
        );
      })()}

      {/* Number tiles */}
      <div className="pd-stats">
        <StatTile label="Open staffing requests" value={stats?.openRequests ?? 0} hint={`${stats?.openRequests ?? 0} unfilled worker slot${(stats?.openRequests ?? 0) === 1 ? "" : "s"}`} href="/jobs/my?filter=open" icon={<Briefcase />} />
        <StatTile label="Applications to review" value={stats?.newEnquiries ?? 0} hint="For your open requests" href="/jobs/my?filter=applications" icon={<Users />} />
        <StatTile label="Upcoming assignments" value={upcoming.length} hint="View confirmed work" href="/provider/offers-assignments?filter=upcoming" icon={<Calendar />} />
        <StatTile label="New enquiries" value={stats?.newInquiries ?? 0} hint="Awaiting an intake response" href={"/provider/enquiries"} icon={<MessageCircle />} />
      </div>

      <div className="pd-home-grid">
        <div className="pd-home-main">
          {/* Needs your attention */}
          <section className="pd-panel">
            <div className="pd-panel-head"><h2>Needs your attention</h2></div>
            {loading ? (
              <p className="pd-quiet-empty m-0">Loading…</p>
            ) : attention.length === 0 && expiring.length === 0 ? (
              <p className="pd-quiet-empty m-0">Nothing needs attention right now.</p>
            ) : (
              <>
                {attention.map((j) => (
                  <div key={j.id} className="pd-task-row pd-attention-row">
                    <span className="pd-icon-tile pd-icon-tile-alert"><Clock /></span>
                    <div>
                      <strong>{j.title}</strong>
                      <p>{`${startsIn(j.scheduledStartAt)} · 1 unfilled slots`}</p>
                    </div>
                    <button type="button" className="pd-btn" onClick={() => setReviewJob(j)}>Review applications</button>
                  </div>
                ))}
                {expiring.length > 0 && (
                  <div className="pd-task-row pd-attention-row">
                    <span className="pd-icon-tile"><Briefcase /></span>
                    <div>
                      <strong>Documents expiring soon</strong>
                      <p>{expiring.map((e) => `${e.label} (${new Date(e.date).toLocaleDateString("en-AU")})`).join(" · ")}</p>
                    </div>
                    <Link href="/documents" className="pd-btn">Review documents</Link>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Relevant opportunities */}
          <section className="pd-panel">
            <div className="pd-panel-head">
              <h2>Relevant opportunities</h2>
              <Link href="/jobs" className="pd-textbtn">View matches</Link>
              <button type="button" className="pd-btn" onClick={() => setNearbyOpen(true)}><MapPin />View nearby requests</button>
            </div>
            {loading ? (
              <p className="pd-quiet-empty m-0">Loading…</p>
            ) : opportunities.length === 0 ? (
              <p className="pd-quiet-empty m-0">
                No matching requests right now. Matches are based on your live service listings.{" "}
                <Link href="/provider/services" className="pd-textbtn">Manage services</Link>
              </p>
            ) : (
              opportunities.map((j) => {
                const u = URGENCY_BADGE[j.urgency] ?? URGENCY_BADGE.ROUTINE;
                return (
                  <div key={j.id} className="pd-task-row">
                    <div>
                      <div className="pd-tags"><span className={`pd-badge ${u.cls}`}>{URGENCY_ICON[j.urgency] ?? URGENCY_ICON.ROUTINE}{u.label}</span></div>
                      <strong>{j.title}</strong>
                      <p>{`${j.suburb} · Matches your ${categoryLabel(j.category)} service`}</p>
                      <MatchDetails why={`This request is in ${j.suburb} and matches the ${categoryLabel(j.category)} service on your live listings.`} />
                    </div>
                    <button type="button" className="pd-btn" onClick={() => setDetail({ id: j.id, own: false })}>View request</button>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside>
          {/* Upcoming work */}
          <section className="pd-panel">
            <div className="pd-panel-head">
              <h2>Upcoming work</h2>
              <Link href="/provider/calendar" className="pd-textbtn">Calendar</Link>
            </div>
            {loading ? (
              <p className="pd-quiet-empty m-0">Loading…</p>
            ) : upcoming.length === 0 ? (
              <p className="pd-quiet-empty m-0">No upcoming assignments.</p>
            ) : (
              upcoming.map((s) => (
                <div key={s.id} className="pd-task-row">
                  <div>
                    <strong>{s.title}</strong>
                    <p>{new Date(s.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}<br />{[s.selectedApplicant?.name, s.suburb].filter(Boolean).join(" · ")}</p>
                  </div>
                  <button type="button" className="pd-btn" onClick={() => setDetail({ id: s.id, own: true })}>View</button>
                </div>
              ))
            )}
          </section>

          <section className="pd-panel">
            <div className="pd-panel-head"><h2>Service pipeline</h2></div>
            <div className="pd-pipeline">
              {([
                ["Awaiting acceptance", pipeline?.awaitingAcceptance ?? 0, "/provider/my-responses"],
                ["Awaiting intake",     pipeline?.awaitingIntake ?? 0,     "/provider/confirmed-starts"],
                ["Start confirmed",     pipeline?.startConfirmed ?? 0,     "/provider/confirmed-starts"],
              ] as const).map(([label, n, href]) => (
                <Link key={label} href={href} className="pd-pipeline-step">
                  <span className="pd-pipeline-number">{n}</span>
                  <span>{label}</span>
                  <span className="pd-pipeline-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>

          <details className="pd-panel pd-disclosure">
            <summary>
              <span className="pd-icon-tile"><Users /></span>
              <span>
                <strong>Team availability</strong>
                <small>Check replies for a specific shift</small>
              </span>
              <span className="pd-disclosure-chevron">⌄</span>
            </summary>
            {attention.length === 0 ? (
              <p className="pd-quiet-empty m-0">No open shifts to check.</p>
            ) : attention.slice(0, 3).map((j) => {
              const t = teamReplies[j.id] ?? { available: 0, awaiting: 0 };
              return (
                <div key={j.id} className="pd-task-row">
                  <div>
                    <strong>{j.title}</strong>
                    <p>{`${new Date(j.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · ${j.suburb}`}<br />{t.available} available · {t.awaiting} awaiting response</p>
                  </div>
                  <Link href={`/provider/team-availability?jobId=${j.id}`} className="pd-btn">Check</Link>
                </div>
              );
            })}
            <div className="pd-disclosure-footer"><Link href="/provider/team-availability" className="pd-btn pd-btn-ghost">View team availability</Link></div>
          </details>

          <div className="pd-shortcut">
            <span className="pd-icon-tile"><RefreshCw /></span>
            <div>
              <strong>Post again</strong>
              <small>Reuse a previous shift as a new draft</small>
            </div>
            <button type="button" className="pd-btn" onClick={() => { setRepostError(null); setRepostOpen(true); }}>Choose post</button>
          </div>
          {repostOpen && (
            <ReusePostDialog posts={past} busyId={reposting} error={repostError} onPick={postAgain} onClose={() => setRepostOpen(false)} />
          )}

          <section className="pd-panel">
            <div className="pd-panel-head"><h2>Recent activity</h2></div>
            <div className="pd-panel-pad">
              {loading ? (
                <p className="m-0 text-sm text-slate-400">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="m-0 text-sm text-slate-500">No recent activity yet.</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="pd-activity">
                    <span className="pd-activity-symbol">{ACTIVITY_ICON[a.type] ?? ACTIVITY_ICON.APPLICATION}</span>
                    <div>{a.text}<br /><small>{ago(a.at)}</small></div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
      <div className="pd-peer-shortcut">
        <span>{referral ? (referral.rewardUnlocked ? <strong>Next month free unlocked</strong> : <><strong>{referral.qualified} / {referral.target} qualifying referrals</strong> · Unlock your next month free</>) : "Invite a Provider · Referral rewards are available exclusively to active subscribers."}</span>
        <Link href="/provider/refer-and-earn" className="pd-btn">Refer &amp; Earn</Link>
      </div>
      </div>
    </div>
  );
}
