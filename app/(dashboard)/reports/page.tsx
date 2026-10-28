"use client";

// Support Coordinator "Reports": coordination activity across the authorised participant portfolio,
// worked out from the coordinator's own requests (/jobs/my). Export CSV downloads the table shown.

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, StatCard, DataTable, OutlineButton, Empty, ErrorNote,
  useCoordinatorParticipants, useParticipantScope, shortName,
} from "@/components/coordinator/workspace-ui";

interface Job {
  id: string; status: string; forParticipantUserId?: string | null;
  _count?: { applications: number };
}

const isOpen = (j: Job) => j.status === "OPEN";
const isGap = (j: Job) => j.status === "OPEN" && (j._count?.applications ?? 0) === 0;
const isConfirmed = (j: Job) => ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(j.status);

export default function CoordinatorReportsPage() {
  const participants = useCoordinatorParticipants();
  const [participant, setParticipant] = useParticipantScope();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then((r) => setJobs(r.jobs ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load requests"); setJobs([]); });
  }, []);

  const inView = (jobs ?? []).filter((j) => participant === "ALL" || j.forParticipantUserId === participant);

  // One row per participant who has at least one open request.
  const rows = useMemo(() => participants
    .filter((p) => participant === "ALL" || p.id === participant)
    .map((p) => {
      const mine = (jobs ?? []).filter((j) => j.forParticipantUserId === p.id);
      const source = p.meta?.endsWith("Managed") ? "MANAGED" : "CONNECTION";
      return { id: p.id, source, name: shortName(p.name), open: mine.filter(isOpen).length, gaps: mine.filter(isGap).length };
    })
    .filter((r) => r.open > 0), [participants, jobs, participant]);

  function exportCsv() {
    const lines = [["Participant", "Open requests", "Service gaps"], ...rows.map((r) => [r.name, r.open, r.gaps])];
    const csv = lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "shiftify-coordination-report.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <WorkspacePage
      title="Reports"
      description="Coordination activity within your authorised participant portfolio."
      participantView={{ value: participant, onChange: setParticipant, participants }}
      actions={<OutlineButton onClick={exportCsv} disabled={!rows.length}>Export CSV</OutlineButton>}
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open requests" value={jobs ? inView.filter(isOpen).length : "…"} href="/jobs/my" />
        <StatCard label="Unresolved gaps" value={jobs ? inView.filter(isGap).length : "…"} href="/jobs/my" />
        <StatCard label="Confirmed arrangements" value={jobs ? inView.filter(isConfirmed).length : "…"} href="/upcoming-support" />
        <StatCard label="Completed supports" value={jobs ? inView.filter((j) => j.status === "COMPLETED").length : "…"} href="/upcoming-support" />
      </div>

      <Panel title="Open needs by participant">
        {jobs === null ? <Empty>Loading…</Empty> : !rows.length ? <Empty>No open requests for this participant view.</Empty> : (
          <DataTable
            head={["Participant", "Open requests", "Service gaps", "Action"]}
            rows={rows.map((r) => [
              <strong key="n" className="font-semibold">{r.name}</strong>,
              r.open,
              r.gaps,
              <OutlineButton key="a" href={`/participants/${r.id}?source=${r.source}`} className="!min-h-[32px] !py-1.5">Open case</OutlineButton>,
            ])}
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
