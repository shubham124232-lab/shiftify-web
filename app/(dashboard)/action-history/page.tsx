"use client";

// Support Coordinator "Free action history": the once-only free support-request allowance
// (/subscriptions/me/allowance) and the requests published so far (/jobs/my).

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, Note, Empty, OutlineButton, BORDER, TIER_LABEL, when,
} from "@/components/coordinator/workspace-ui";

interface Allowance { applies: boolean; limit: number; used: number; remaining: number; exhausted: boolean }
interface Job { id: string; title: string; status: string; urgency: string; postedAt: string | null }

export default function ActionHistoryPage() {
  const [allowance, setAllowance] = useState<Allowance | null | undefined>(undefined);
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    api.get<{ allowance: Allowance }>("/subscriptions/me/allowance").then((r) => setAllowance(r.allowance ?? null)).catch(() => setAllowance(null));
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then((r) => setJobs((r.jobs ?? []).filter((j) => j.status !== "DRAFT" && j.postedAt).sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))))
      .catch(() => setJobs([]));
  }, []);

  const limit = allowance?.limit ?? 10;
  const remaining = allowance?.remaining ?? limit;
  const unlimited = allowance !== undefined && (!allowance || !allowance.applies);

  return (
    <WorkspacePage title={`Your ${limit} free support-request posts`} description="A once-only allowance for a verified Support Coordinator.">
      <Panel title="Free action counter">
        {allowance === undefined ? <Empty>Loading…</Empty> : (
          <div className="space-y-4">
            <p className="flex items-baseline gap-3">
              <span className="font-display text-[44px] font-extrabold leading-none text-[#c91355]">{unlimited ? "∞" : remaining}</span>
              <span className="text-[13px] text-[#69707e]">{unlimited ? "Unlimited eligible publishing on your plan" : `of ${limit} actions remaining`}</span>
            </p>
            {!unlimited && (
              <div className="h-1 max-w-[420px] rounded-full bg-[#f1f3f7]">
                <div className="h-1 rounded-full bg-[#c91355]" style={{ width: `${Math.max(0, Math.min(100, (remaining / limit) * 100))}%` }} />
              </div>
            )}
            <p className="text-[13px]">No expiry. No monthly reset. One allowance across your participant portfolio.</p>
            <Note>Pro includes unlimited eligible publishing. Your unused introductory balance is not spent while Pro is active.</Note>
          </div>
        )}
      </Panel>

      <Panel title="What uses an action">
        <div className="text-[13px]">
          {[
            ["Uses one action", "Successfully publishing a new participant support request. A duplicated or repeated request is new when published."],
            ["Does not use an action", "Adding or connecting a participant, drafts, edits, browsing, saving, response review, offers, messages and confirmation or management of the resulting support."],
            ["Direct Invite", "A paid feature requiring active Pro + Growth. Invite a professional privately for an authorised participant, including without a published post. It does not use an introductory post."],
          ].map(([k, v]) => (
            <div key={k} className={`grid gap-2 border-b ${BORDER} py-3 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]`}>
              <span className="text-[#69707e]">{k}</span><span>{v}</span>
            </div>
          ))}
          <p className="mt-3 text-xs text-[#69707e]">Reviewing responses and confirming support from a published request never use a second post. No extra per-invitation fee is established.</p>
        </div>
      </Panel>

      <Panel title="Publication history" action={<OutlineButton href="/subscription">Subscription &amp; billing</OutlineButton>}>
        {jobs === null ? <Empty>Loading…</Empty> : !jobs.length ? <Empty>No new requests published yet.</Empty> : (
          <div className="divide-y divide-[#e4e6ed]">
            {jobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 py-3 text-[13px]">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{j.title}</span>
                  <span className="text-xs text-[#69707e]">{TIER_LABEL[j.urgency] ?? "Routine"} · published {when(j.postedAt)}</span>
                </span>
                <OutlineButton href={`/jobs/${j.id}`} className="!min-h-[32px] !py-1.5">View</OutlineButton>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </WorkspacePage>
  );
}
