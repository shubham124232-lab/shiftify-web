"use client";

// SC-D04 "Confirmed Support" — agreed support arrangements, from confirmation through to completion.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, SubTabs, Chip, Empty, ErrorNote, OutlineButton, PrimaryButton,
  useCoordinatorParticipants, when, shortName,
} from "@/components/coordinator/workspace-ui";

interface Job {
  id: string; title: string; suburb: string; state: string; scheduledStartAt: string; scheduledEndAt?: string | null;
  status: string; participantName?: string | null; deliveredByName?: string | null; forParticipantUserId?: string | null;
}

type Tab = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
const TABS: { key: Tab; label: string; chip: string; tone: "green" | "blue" | "slate" }[] = [
  { key: "UPCOMING",    label: "Upcoming",    chip: "Confirmed",   tone: "green" },
  { key: "IN_PROGRESS", label: "In progress", chip: "In progress", tone: "blue" },
  { key: "COMPLETED",   label: "Completed",   chip: "Completed",   tone: "slate" },
];

export function CoordinatorConfirmedSupport() {
  const participants = useCoordinatorParticipants();
  const [participant, setParticipant] = useState("ALL");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("UPCOMING");

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then((r) => setJobs(r.jobs ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const current = TABS.find((t) => t.key === tab)!;
  const shown = jobs
    .filter((j) => participant === "ALL" || j.forParticipantUserId === participant)
    .filter((j) => {
      if (tab === "UPCOMING") return j.status === "ASSIGNED";
      if (tab === "IN_PROGRESS") return j.status === "IN_PROGRESS";
      return j.status === "COMPLETED" || j.status === "CONFIRMED";
    });

  return (
    <WorkspacePage
      title="Confirmed Support"
      description="Agreed support, cancellations and continuity of care."
      participantView={{ value: participant, onChange: setParticipant, participants }}
      actions={<PrimaryButton href="/calendar">Weekly calendar</PrimaryButton>}
    >
      <SubTabs items={TABS.map((t) => ({ label: t.label, active: tab === t.key, onClick: () => setTab(t.key) }))} />
      {error && <ErrorNote>{error}</ErrorNote>}
      <Panel title="Support arrangements" bodyClassName="px-5">
        {loading ? <Empty>Loading…</Empty> : !shown.length ? <Empty>Confirmed support will appear here.</Empty> : (
          <div className="divide-y divide-[#e4e6ed]">
            {shown.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <Chip tone={current.tone}>{current.chip}</Chip>
                  <p className="mt-2 truncate text-sm font-bold text-slate-900">{j.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{[j.participantName && shortName(j.participantName), j.deliveredByName, j.suburb].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 text-xs text-slate-500">{when(j.scheduledStartAt)}{j.scheduledEndAt ? ` — ${when(j.scheduledEndAt)}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OutlineButton href={`/jobs/${j.id}`}>View support</OutlineButton>
                  <OutlineButton href={`/jobs/${j.id}#messages`}>Message</OutlineButton>
                  {tab === "UPCOMING" && <OutlineButton href={`/jobs/${j.id}`}>Replace / Cancel</OutlineButton>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </WorkspacePage>
  );
}
