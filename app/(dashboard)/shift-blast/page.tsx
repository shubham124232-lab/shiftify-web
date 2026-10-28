"use client";

// Support Coordinator "Shift Blast SMS". No SMS backend or package exists yet, so this is an
// interactive preview over the coordinator's real open requests: nothing is sent or charged.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, Note, PrimaryButton, OutlineButton, Empty, fieldClass, BORDER,
  useCoordinatorParticipants, shortName, when,
} from "@/components/coordinator/workspace-ui";

interface Job { id: string; title: string; status: string; forParticipantUserId?: string | null }
interface Blast { at: string; request: string; recipients: string; radius: number }

const RECIPIENTS = ["Both", "Workers", "Providers"] as const;
const RADII = [5, 10, 25, 50];

export default function ShiftBlastPage() {
  const participants = useCoordinatorParticipants();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [jobId, setJobId] = useState("");
  const [recipients, setRecipients] = useState<(typeof RECIPIENTS)[number]>("Both");
  const [radius, setRadius] = useState(10);
  const [reviewing, setReviewing] = useState(false);
  const [history, setHistory] = useState<Blast[]>([]);

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my").then((r) => setJobs((r.jobs ?? []).filter((j) => j.status === "OPEN"))).catch(() => setJobs([]));
  }, []);

  const nameOf = (j: Job) => {
    const p = participants.find((x) => x.id === j.forParticipantUserId);
    return p ? `${j.title} · ${shortName(p.name)}` : j.title;
  };
  const chosen = jobs?.find((j) => j.id === jobId);

  function simulate() {
    if (!chosen) return;
    setHistory((h) => [{ at: new Date().toISOString(), request: nameOf(chosen), recipients, radius }, ...h]);
    setReviewing(false);
  }

  return (
    <WorkspacePage
      title="Shift Blast SMS"
      description="Optional SMS outreach for subscribed Support Coordinators."
      actions={<OutlineButton href="/add-ons">Compare add-ons</OutlineButton>}
    >
      <Note>Interactive demonstration only. No SMS is sent, no real package is active and no charge is taken. Rates and packages are still to be decided.</Note>

      <Panel title="Choose a request">
        <div className="space-y-5">
          <label className="block space-y-1.5 text-xs text-[#69707e]">Active participant request *
            <select className={`${fieldClass} w-full`} value={jobId} onChange={(e) => { setJobId(e.target.value); setReviewing(false); }}>
              <option value="">{jobs === null ? "Loading…" : jobs.length ? "Choose request" : "No active requests"}</option>
              {(jobs ?? []).map((j) => <option key={j.id} value={j.id}>{nameOf(j)}</option>)}
            </select>
          </label>

          <div>
            <p className="mb-2 text-xs text-[#69707e]">Recipient type</p>
            <div className="flex flex-wrap gap-2">
              {RECIPIENTS.map((r) => (
                <button key={r} type="button" onClick={() => setRecipients(r)}
                  className={`rounded-lg border px-3 py-2 text-[13px] font-semibold ${recipients === r ? "border-[#f3c1d3] bg-[#fff0f5] text-[#c91355]" : `${BORDER} bg-white`}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-[#69707e]">Radius from request service area</p>
            <div className="flex flex-wrap gap-2">
              {RADII.map((r) => (
                <button key={r} type="button" onClick={() => setRadius(r)}
                  className={`rounded-lg border px-3 py-2 text-[13px] font-semibold ${radius === r ? "border-[#f3c1d3] bg-[#fff0f5] text-[#c91355]" : `${BORDER} bg-white`}`}>
                  {r} km
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#69707e]">Available Now filtering is an existing Speed feature. Ordinary eligible SMS recipients remain available without Speed.</p>

          {reviewing && chosen ? (
            <div className={`space-y-3 rounded-lg border ${BORDER} bg-[#f8f9fb] p-4 text-[13px]`}>
              <p><strong className="font-semibold">{nameOf(chosen)}</strong></p>
              <p className="text-[#525766]">Eligible {recipients === "Both" ? "Support Workers and Providers" : recipients === "Workers" ? "Support Workers" : "Providers"} within {radius} km of the request service area.</p>
              <div className="flex gap-2">
                <PrimaryButton onClick={simulate}>Send simulated blast</PrimaryButton>
                <OutlineButton onClick={() => setReviewing(false)}>Back</OutlineButton>
              </div>
            </div>
          ) : (
            <PrimaryButton onClick={() => setReviewing(true)} disabled={!chosen}>Review eligible recipients</PrimaryButton>
          )}
        </div>
      </Panel>

      <Panel title="Recent simulated blasts">
        {!history.length ? <Empty>No simulated SMS outreach recorded.</Empty> : (
          <div className="divide-y divide-[#e4e6ed]">
            {history.map((b) => (
              <div key={b.at} className="py-3 text-[13px]">
                <p className="font-semibold">{b.request}</p>
                <p className="text-xs text-[#69707e]">{when(b.at)} · {b.recipients} · {b.radius} km · simulated, not sent</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </WorkspacePage>
  );
}
