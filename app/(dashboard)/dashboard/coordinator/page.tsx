"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { getDashboard, type CoordinatorDashboard } from "@/lib/api/dashboard";
import { listSavedSearches, type SavedSearch } from "@/lib/api/saved-searches";
import { api } from "@/lib/api";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";
import {
  Panel, HeaderLink, OutlineButton, PrimaryButton, Chip, Empty, Avatar, ParticipantViewSelect, TierTabs, TIER_LABEL, shortName, when,
} from "@/components/coordinator/workspace-ui";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { Users, FileText, MessageSquare, CalendarDays } from "lucide-react";

// Leaflet touches `window` on import, so the map only loads in the browser.
const NearbyMap = dynamic(() => import("@/components/provider/NearbyMap"), {
  ssr: false,
  loading: () => <div className="h-[340px] w-full rounded-xl border border-slate-200 bg-slate-50" />,
});

// Public suburb centre only — participant addresses are never mapped.
const SERVICE_CENTRE = { lat: -33.815, lng: 151.001 };

interface MyJob {
  id: string; title: string; status: string; urgency: string; suburb: string; category?: string;
  scheduledStartAt?: string; isRecurring?: boolean;
  forParticipantUserId?: string | null;
  applicationDeadlineAt: string | null;
  cancelledAt?: string | null; cancelledByRole?: string | null;
  _count: { applications: number };
}

interface ManagedParticipant { id: string; name: string }
interface Connection {
  id: string; status: string; initiatedBy?: string;
  participant: { id: string; name: string };
}

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(JOB_CATEGORIES.map((c) => [c.value, c.label]));

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [data,         setData]         = useState<CoordinatorDashboard | null>(null);
  const [myJobs,       setMyJobs]       = useState<MyJob[]>([]);
  const [managed,      setManaged]      = useState<ManagedParticipant[]>([]);
  const [connections,  setConnections]  = useState<Connection[]>([]);
  const [saved,        setSaved]        = useState<SavedSearch[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [jobsLoading,  setJobsLoading]  = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [participant,  setParticipant]  = useState<string>("ALL");
  const [tier,         setTier]         = useState<string>("ALL");
  // SC-A02 — the first thing the coordinator chose at sign-up, offered once until dismissed.
  const [goal, setGoal] = useState<{ title: string; href: string } | null>(null);
  useEffect(() => {
    try { const raw = localStorage.getItem("shiftify_coordinator_goal"); if (raw) setGoal(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as CoordinatorDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api.get<{ jobs: MyJob[] }>("/jobs/my")
      .then((r) => setMyJobs(r.jobs ?? []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
    api.get<{ users: ManagedParticipant[] }>("/linking/participants").then((r) => setManaged(r.users ?? [])).catch(() => {});
    api.get<{ connections: Connection[] }>("/coordinator-connections").then((r) => setConnections(r.connections ?? [])).catch(() => {});
    listSavedSearches().then((r) => setSaved(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  // Participant view — everyone this coordinator manages or is connected to.
  const participants = useMemo(() => {
    const map = new Map<string, string>();
    managed.forEach((p) => map.set(p.id, p.name));
    connections.filter((c) => c.status === "ACCEPTED").forEach((c) => map.set(c.participant.id, c.participant.name));
    return [...map].map(([id, name]) => ({ id, name }));
  }, [managed, connections]);
  const nameById = useMemo(() => new Map(participants.map((p) => [p.id, p.name])), [participants]);

  if (!user) return null;

  const inView      = (j: MyJob) => participant === "ALL" || j.forParticipantUserId === participant;
  const jobs        = myJobs.filter(inView);
  const openJobs    = jobs.filter((j) => j.status === "OPEN");
  const tierCount   = (k: string) => openJobs.filter((j) => (j.urgency || "ROUTINE") === k).length;
  const shownJobs   = tier === "ALL" ? openJobs : openJobs.filter((j) => (j.urgency || "ROUTINE") === tier);
  const pendingConnections = connections.filter((c) => c.status === "PENDING");
  const participantName = (j: MyJob) => j.forParticipantUserId ? nameById.get(j.forParticipantUserId) : undefined;

  // SC-D02 — only the priority items that apply right now are shown.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const expiringSoon = openJobs
    .filter((j) => j.applicationDeadlineAt && new Date(j.applicationDeadlineAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7)
    .sort((a, b) => new Date(a.applicationDeadlineAt!).getTime() - new Date(b.applicationDeadlineAt!).getTime());
  const attention: { key: string; job: MyJob; chip: string; tone: "red" | "blue" | "slate" }[] = [
    ...openJobs.filter((j) => (j.urgency === "RAPID" || j.urgency === "URGENT") && j._count.applications === 0)
      .map((j) => ({ key: "waiting-" + j.id, job: j, chip: "Waiting for responses", tone: "red" as const })),
    ...openJobs.filter((j) => j.urgency === "URGENT" && j._count.applications > 0)
      .map((j) => ({ key: "responses-" + j.id, job: j, chip: "New responses", tone: "blue" as const })),
    ...jobs.filter((j) => j.cancelledByRole === "SUPPORT_WORKER" && j.cancelledAt && new Date(j.cancelledAt).getTime() > weekAgo)
      .map((j) => ({ key: "cancel-" + j.id, job: j, chip: "Replacement needed", tone: "red" as const })),
    ...expiringSoon.slice(0, 3)
      .map((j) => ({ key: "close-" + j.id, job: j, chip: "Closing soon", tone: "slate" as const })),
  ];

  const stats: { label: string; value: number; note: string; icon: typeof Users }[] = [
    { label: "Connected participants", value: data?.stats?.connectedParticipants ?? participants.length, note: "Approved participant workspaces", icon: Users },
    { label: "Open requests", value: participant === "ALL" ? (data?.stats?.activeRequests ?? openJobs.length) : openJobs.length, note: "Including unfilled support gaps", icon: FileText },
    { label: "New responses", value: data?.stats?.newResponses ?? 0, note: "Ready for review", icon: MessageSquare },
    { label: "Confirmed support", value: data?.stats?.confirmedSupport ?? 0, note: "Upcoming arrangements", icon: CalendarDays },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      {/* ── Title row ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight text-slate-900">My Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Keep participant needs, responses and upcoming support in view.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ParticipantViewSelect value={participant} onChange={setParticipant} participants={participants} />
          <PrimaryButton href="/jobs/post">Post Support Request</PrimaryButton>
          <Link href="/help-safety" aria-label="Help" className="px-2 text-sm font-semibold text-slate-500 hover:text-slate-900">?</Link>
        </div>
      </div>

      <SetupBanner />

      {/* ── Plan strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-[13px] text-slate-800">
        <span>Shiftify plan · Manage your support-request posts and add-ons</span>
        <span className="flex items-center gap-2">
          <HeaderLink href="/help-safety">How it works</HeaderLink>
          <OutlineButton href="/subscription" className="px-2.5 py-1.5 text-xs">View plans</OutlineButton>
        </span>
      </div>

      {goal && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e6ed] bg-white px-4 py-3 text-sm">
          <span className="text-slate-700">You chose to start with: <strong>{goal.title}</strong>.</span>
          <span className="flex gap-3">
            <Link href={goal.href} className="font-semibold underline">Continue</Link>
            <button type="button" className="text-slate-500 underline" onClick={() => { try { localStorage.removeItem("shiftify_coordinator_goal"); } catch { /* ignore */ } setGoal(null); }}>Dismiss</button>
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e4e6ed] bg-white p-6">
            <div className="flex items-start justify-between">
              <span className="text-[13px] text-slate-600">{s.label}</span>
              <s.icon className="h-[18px] w-[18px] text-brand-600" />
            </div>
            <div className="mt-3 text-[30px] font-extrabold leading-none text-slate-900">{loading ? "…" : s.value}</div>
            <div className="mt-3 text-xs text-slate-500">{s.note}</div>
          </div>
        ))}
      </div>

      {/* ── Your support requests ── */}
      <Panel title="Your support requests" action={<HeaderLink href="/jobs/my">View all requests</HeaderLink>}>
        <TierTabs value={tier} onChange={setTier} loading={jobsLoading} count={(k) => (k === "ALL" ? openJobs.length : tierCount(k))} />

        {jobsLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : !shownJobs.length ? (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">No open support requests yet.</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex justify-center"><OutlineButton href="/participants/connect">Add or connect participant</OutlineButton></div>
              <div className="flex justify-center"><PrimaryButton href="/jobs/post">Post support request</PrimaryButton></div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {shownJobs.map((j) => {
              const style = URGENCY_STYLE[j.urgency] ?? URGENCY_STYLE.ROUTINE;
              const who = participantName(j);
              return (
                <div key={j.id} className="flex items-center justify-between gap-4 rounded-lg border-l-2 bg-slate-50 px-3.5 py-3.5" style={{ borderLeftColor: style.solid }}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {j._count.applications === 0 ? <Chip tone="red">Service gap</Chip> : <Chip tone="green">Live</Chip>}
                      <Chip tone={style}>{TIER_LABEL[j.urgency] ?? "Routine"}</Chip>
                      {j.isRecurring && <Chip tone="blue">Recurring</Chip>}
                    </div>
                    <p className="mt-2 truncate text-sm font-bold text-slate-900">{j.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{[who && shortName(who), j.suburb, when(j.scheduledStartAt)].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {j._count.applications} {j._count.applications === 1 ? "response" : "responses"}{j.category ? ` · ${CATEGORY_LABEL[j.category] ?? j.category}` : ""}
                    </p>
                  </div>
                  <OutlineButton href={`/jobs/${j.id}`}>Manage</OutlineButton>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ── Main + right rail ── */}
      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Needs your attention" action={<HeaderLink href="/jobs/my">All requests</HeaderLink>} bodyClassName="px-5">
            {jobsLoading ? <Empty>Loading…</Empty> : !attention.length ? <Empty>No urgent items in this participant view.</Empty> : (
              <div className="divide-y divide-[#e4e6ed]">
                {attention.slice(0, 5).map(({ key, job, chip, tone }) => {
                  const who = participantName(job);
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          <Chip tone={tone}>{chip}</Chip>
                          <Chip tone={URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.ROUTINE}>{TIER_LABEL[job.urgency] ?? "Routine"}</Chip>
                        </div>
                        <p className="mt-2 truncate text-sm font-bold text-slate-900">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{[who && shortName(who), job.suburb, when(job.scheduledStartAt)].filter(Boolean).join(" · ")}</p>
                        <p className="mt-1.5 text-xs text-slate-500">{job._count.applications} {job._count.applications === 1 ? "response" : "responses"}{job.category ? ` · ${CATEGORY_LABEL[job.category] ?? job.category}` : ""}</p>
                      </div>
                      <OutlineButton href={`/jobs/${job.id}`}>Manage</OutlineButton>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Upcoming support" action={<HeaderLink href="/upcoming-support">Weekly calendar</HeaderLink>} bodyClassName="px-5">
            {loading ? <Empty>Loading…</Empty> : !data?.upcomingShifts?.length ? <Empty>Confirmed support will appear here.</Empty> : (
              <div className="divide-y divide-[#e4e6ed]">
                {data.upcomingShifts.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                    <div className="min-w-0">
                      <Chip tone="green">Confirmed</Chip>
                      <p className="mt-2 truncate text-sm font-bold text-slate-900">{s.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{[s.suburb, s.selectedApplicant?.name].filter(Boolean).join(" · ")}</p>
                      <p className="mt-1 text-xs text-slate-500">{when(s.scheduledStartAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <OutlineButton href={`/jobs/${s.id}`}>View support</OutlineButton>
                      <OutlineButton href="/messages">Message</OutlineButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Recent responses" action={<HeaderLink href="/jobs/my">View responses</HeaderLink>}>
            {loading ? <Empty>Loading…</Empty> : !data?.recentResponses?.length ? <Empty>New responses will appear here.</Empty> : (
              <div className="space-y-4">
                {data.recentResponses.slice(0, 4).map((r) => (
                  <div key={r.id} className="rounded-xl border border-[#e4e6ed] p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.applicant.name} />
                        <div>
                          <p className="text-base font-bold text-slate-900">{r.applicant.name}</p>
                          <p className="text-xs text-slate-500">{r.applicantType}</p>
                        </div>
                      </div>
                      {r.status === "PENDING" && <Chip tone="slate">New</Chip>}
                    </div>
                    <p className="mt-5 text-xs text-slate-500">{r.jobTitle} · {when(r.createdAt)}</p>
                    {r.message && <p className="mt-4 text-sm text-slate-800">{r.message}</p>}
                    {r.proposedRate != null && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <Chip tone="blue">${r.proposedRate.toFixed(2)}/hour indicative</Chip>
                      </div>
                    )}
                    <OutlineButton href={`/jobs/${r.jobId}`} className="mt-4 w-full">Review responses</OutlineButton>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Find support nearby">
            <div className="relative">
              <NearbyMap origin={SERVICE_CENTRE} radiusKm={8} pins={[]} />
              <Link href="/live-dashboard" className="absolute bottom-3 left-3 z-[400] rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-brand-600">Open full map ↗</Link>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Service-area centre. Public suburb centres only. Participant addresses are never mapped publicly. Listings below remain available if the map cannot load.</p>
            <OutlineButton href="/find" className="mt-3">Find local support</OutlineButton>
          </Panel>

          <Panel title="Participant connections" action={<OutlineButton href="/participants/new">Add participant</OutlineButton>} bodyClassName="px-5">
            {!pendingConnections.length ? <Empty>All participant connections are up to date.</Empty> : (
              <div className="divide-y divide-[#e4e6ed]">
                {pendingConnections.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-5">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{shortName(c.participant.name)}</p>
                      <p className="mt-1 text-xs text-slate-500">{c.initiatedBy === "PARTICIPANT" ? "Waiting for your response" : "Awaiting permission approval"}</p>
                    </div>
                    <OutlineButton href="/participants">View</OutlineButton>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Saved searches" action={<HeaderLink href="/jobs/alerts">Manage</HeaderLink>} bodyClassName="px-5">
            {!saved.length ? <Empty>Saved searches will appear here.</Empty> : (
              <div className="divide-y divide-[#e4e6ed]">
                {saved.slice(0, 4).map((s) => {
                  const q = new URLSearchParams(Object.entries(s.filters).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]));
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-5">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{s.label || s.filters.category || "Saved search"}</p>
                        <p className="mt-1 text-xs text-slate-500">{[s.filters.suburb, s.isActive ? "Alerts on" : "Alerts off"].filter(Boolean).join(" · ")}</p>
                      </div>
                      <OutlineButton href={`/find?${q.toString()}`}>Run</OutlineButton>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
        <Panel title="Refer & Earn">
          <p className="text-sm text-slate-600">A Pro subscriber benefit: refer 10 qualifying professionals and earn a free Pro month.</p>
          <OutlineButton href="/referrals" className="mt-3">How it works</OutlineButton>
        </Panel>
        <Panel title="Optional tools">
          <p className="text-sm leading-relaxed text-slate-600">Growth for Direct Invite. Speed for Available Now and a focused replacement desk. Shift Blast for optional SMS outreach.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <OutlineButton href="/subscription">Compare add-ons</OutlineButton>
            <OutlineButton href="/subscription">Shift Blast SMS</OutlineButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}
