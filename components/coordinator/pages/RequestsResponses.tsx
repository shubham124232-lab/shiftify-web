"use client";

// Support Coordinator "Requests & Responses" — support needs by participant, timing and status,
// plus the responses those requests have received.

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getDashboard, type CoordinatorDashboard, type CoordinatorRecentResponse } from "@/lib/api/dashboard";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import {
  WorkspacePage, Panel, SubTabs, TierTabs, FilterBar, fieldClass, RequestRow, Chip, Avatar, Empty, ErrorNote,
  OutlineButton, PrimaryButton, useCoordinatorParticipants, TIER_LABEL, tierStyle, when, shortName, BORDER,
} from "@/components/coordinator/workspace-ui";

interface Job {
  id: string; title: string; category: string; urgency: string; suburb: string; state: string;
  scheduledStartAt: string; status: string; postedAt: string; isRecurring?: boolean;
  forParticipantUserId?: string | null; shortlistedCount?: number;
  _count?: { applications: number };
}

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(JOB_CATEGORIES.map((c) => [c.value, c.label]));

// SC-M01 status views.
const STATUS_VIEWS: { key: string; label: string; match: (j: Job) => boolean }[] = [
  { key: "ALL",           label: "All",           match: () => true },
  { key: "LIVE",          label: "Live",          match: (j) => j.status === "OPEN" && (j._count?.applications ?? 0) > 0 },
  { key: "UNFILLED",      label: "Service gap",   match: (j) => j.status === "OPEN" && (j._count?.applications ?? 0) === 0 },
  { key: "DRAFT",         label: "Draft",         match: (j) => j.status === "DRAFT" },
  { key: "SHORTLISTED",   label: "Shortlisted",   match: (j) => (j.shortlistedCount ?? 0) > 0 },
  { key: "CONFIRMED",     label: "Confirmed",     match: (j) => ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(j.status) },
  { key: "COMPLETED",     label: "Completed",     match: (j) => j.status === "COMPLETED" },
  { key: "CANCELLED",     label: "Cancelled",     match: (j) => j.status === "CANCELLED" },
  { key: "RECURRING",     label: "Recurring",     match: (j) => !!j.isRecurring },
];

function statusChip(j: Job) {
  if (j.status === "DRAFT") return <Chip tone="slate">Draft</Chip>;
  if (j.status === "OPEN") return (j._count?.applications ?? 0) > 0 ? <Chip tone="green">Live</Chip> : <Chip tone="red">Service gap</Chip>;
  if (["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(j.status)) return <Chip tone="green">Confirmed</Chip>;
  if (j.status === "CANCELLED") return <Chip tone="red">Cancelled</Chip>;
  return <Chip tone="slate">{j.status.charAt(0) + j.status.slice(1).toLowerCase().replace("_", " ")}</Chip>;
}

export function CoordinatorRequestsResponses() {
  const participants = useCoordinatorParticipants();
  const nameById = useMemo(() => new Map(participants.map((p) => [p.id, p.name])), [participants]);
  const [participant, setParticipant] = useState("ALL");
  const [tab, setTab] = useState<"REQUESTS" | "RESPONSES">("REQUESTS");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [responses, setResponses] = useState<CoordinatorRecentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    return api.get<{ jobs: Job[] }>("/jobs/my")
      .then((r) => setJobs(r.jobs ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    getDashboard().then((d) => setResponses((d as CoordinatorDashboard).recentResponses ?? [])).catch(() => {});
  }, []);

  // PATCH /jobs/:id/publish flips DRAFT → OPEN.
  async function publish(id: string) {
    setPublishing(id);
    try { await api.patch(`/jobs/${id}/publish`, {}); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not publish this draft."); }
    finally { setPublishing(null); }
  }

  const q = search.trim().toLowerCase();
  const inScope = jobs
    .filter((j) => participant === "ALL" || j.forParticipantUserId === participant)
    .filter((j) => (STATUS_VIEWS.find((v) => v.key === status) ?? STATUS_VIEWS[0]).match(j))
    .filter((j) => {
      if (!q) return true;
      const who = j.forParticipantUserId ? nameById.get(j.forParticipantUserId) ?? "" : "";
      return [j.title, j.suburb, who].some((v) => v.toLowerCase().includes(q));
    });
  const tierOf = (j: Job) => j.urgency || "ROUTINE";
  const shown = tier === "ALL" ? inScope : inScope.filter((j) => tierOf(j) === tier);
  const jobIds = new Set(jobs.filter((j) => participant === "ALL" || j.forParticipantUserId === participant).map((j) => j.id));
  const shownResponses = responses.filter((r) => participant === "ALL" || jobIds.has(r.jobId));

  return (
    <WorkspacePage
      title="Requests & Responses"
      description="Review support needs by participant, timing and status."
      participantView={{ value: participant, onChange: setParticipant, participants }}
      actions={<PrimaryButton href="/jobs/post">Post Support Request</PrimaryButton>}
    >
      <SubTabs items={[
        { label: "All requests", active: tab === "REQUESTS", onClick: () => setTab("REQUESTS") },
        { label: shownResponses.length ? `Responses (${shownResponses.length})` : "Responses", active: tab === "RESPONSES", onClick: () => setTab("RESPONSES") },
        { label: "Post support request", href: "/jobs/post" },
      ]} />
      {error && <ErrorNote>{error}</ErrorNote>}

      {tab === "REQUESTS" ? (
        <>
          <TierTabs value={tier} onChange={setTier} loading={loading} count={(k) => (k === "ALL" ? inScope.length : inScope.filter((j) => tierOf(j) === k).length)} />
          <FilterBar>
            <input className={`${fieldClass} w-full max-w-xs`} placeholder="Search title, participant or suburb" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={`${fieldClass} min-w-[12rem]`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Request status">
              {STATUS_VIEWS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
          </FilterBar>
          <Panel title="Your support requests">
            {loading ? <Empty>Loading…</Empty> : !shown.length ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500">No support requests match this view.</p>
                <PrimaryButton href="/jobs/post" className="mt-4">Post support request</PrimaryButton>
              </div>
            ) : (
              <div className="space-y-2.5">
                {shown.map((j) => {
                  const who = j.forParticipantUserId ? nameById.get(j.forParticipantUserId) : undefined;
                  const responsesCount = j._count?.applications ?? 0;
                  return (
                    <RequestRow
                      key={j.id}
                      urgency={j.urgency}
                      chips={<>
                        {statusChip(j)}
                        <Chip tone={tierStyle(j.urgency)}>{TIER_LABEL[tierOf(j)] ?? "Routine"}</Chip>
                        {j.isRecurring && <Chip tone="blue">Recurring</Chip>}
                      </>}
                      title={j.title}
                      meta={[who && shortName(who), j.suburb, when(j.scheduledStartAt)].filter(Boolean).join(" · ")}
                      detail={`${responsesCount} ${responsesCount === 1 ? "response" : "responses"}${j.category ? ` · ${CATEGORY_LABEL[j.category] ?? j.category}` : ""}`}
                      actions={<>
                        {j.status === "DRAFT" && (
                          <PrimaryButton onClick={() => void publish(j.id)} disabled={publishing === j.id}>{publishing === j.id ? "Publishing…" : "Publish"}</PrimaryButton>
                        )}
                        <OutlineButton href={`/jobs/${j.id}`}>Manage</OutlineButton>
                      </>}
                    />
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      ) : (
        <Panel title="Responses">
          {!shownResponses.length ? <Empty>New responses will appear here.</Empty> : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {shownResponses.map((r) => (
                <div key={r.id} className={`rounded-xl border ${BORDER} p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.applicant.name} tone={r.applicantType === "Provider" ? "blue" : "pink"} />
                      <div>
                        <p className="text-base font-bold text-slate-900">{r.applicant.name}</p>
                        <p className="text-xs text-slate-500">{r.applicantType}</p>
                      </div>
                    </div>
                    {r.status === "PENDING" && <Chip tone="slate">New</Chip>}
                  </div>
                  <p className="mt-5 text-xs text-slate-500">{r.jobTitle} · {when(r.createdAt)}</p>
                  {r.message && <p className="mt-4 text-sm text-slate-800">{r.message}</p>}
                  {r.proposedRate != null && <div className="mt-4"><Chip tone="blue">${r.proposedRate.toFixed(2)}/hour indicative</Chip></div>}
                  <OutlineButton href={`/jobs/${r.jobId}`} className="mt-4 w-full">Review responses</OutlineButton>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </WorkspacePage>
  );
}
