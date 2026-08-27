"use client";

// SC-PT05 "Repeat support" — offers the doc's 6 repeat choices instead of
// silently re-posting the exact original. "Repeat exactly" duplicates and
// takes the poster straight to My Requests to publish. Every other choice
// duplicates first (still a DRAFT, per job.service.ts's duplicateJob), then
// applies a small scoped edit via PATCH /jobs/:id before landing on the same
// place — My Requests already has the only Publish action in the app
// (jobs/my/page.tsx), so this doesn't duplicate that button elsewhere.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { inp } from "@/components/jobs/post/shared";

type RepeatChoice =
  | "EXACT" | "DATE_TIME" | "SERVICE_TASKS" | "REQUIREMENTS" | "FUNDING_RATE" | "RECURRING";

const CHOICES: { value: RepeatChoice; label: string }[] = [
  { value: "EXACT", label: "Repeat exactly" },
  { value: "DATE_TIME", label: "Change date/time" },
  { value: "SERVICE_TASKS", label: "Change service/tasks" },
  { value: "REQUIREMENTS", label: "Change requirements" },
  { value: "FUNDING_RATE", label: "Change funding/rate" },
  { value: "RECURRING", label: "Convert to recurring" },
];

export function RepeatSupportModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const router = useRouter();
  const [choice, setChoice] = useState<RepeatChoice>("EXACT");
  const [step, setStep] = useState<"choose" | "edit">("choose");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [category, setCategory] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [budgetPerHour, setBudgetPerHour] = useState("");

  function next() {
    if (choice === "EXACT") { void submit(); return; }
    setStep("edit");
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ job: { id: string } }>(`/jobs/${jobId}/duplicate`, {});
      const draftId = res.job.id;

      const patch: Record<string, unknown> = {};
      if (choice === "DATE_TIME") {
        if (startAt) patch.scheduledStartAt = new Date(startAt).toISOString();
        if (endAt) patch.scheduledEndAt = new Date(endAt).toISOString();
      } else if (choice === "SERVICE_TASKS" && category) {
        patch.category = category;
      } else if (choice === "FUNDING_RATE") {
        if (fundingType) patch.fundingType = fundingType;
        if (budgetPerHour) patch.budgetPerHour = Number(budgetPerHour);
      } else if (choice === "RECURRING") {
        patch.isRecurring = true;
      }
      // "REQUIREMENTS" has no dedicated draft-edit field yet (workerPreferences/
      // safetyFlags are untyped Json with no fixed key contract to safely patch
      // from a small form) — the draft still lands on My Requests for review.

      if (Object.keys(patch).length > 0) {
        await api.patch(`/jobs/${draftId}`, patch);
      }
      router.push("/jobs/my");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not repeat this request.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-sm w-full p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        {step === "choose" ? (
          <>
            <div>
              <h3 className="text-base font-bold text-slate-800 m-0">Repeat this request</h3>
              <p className="text-xs text-slate-400 mt-1">Would you like to repeat a previous request?</p>
            </div>
            <div className="flex flex-col gap-2">
              {CHOICES.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="repeat-choice" checked={choice === c.value} onChange={() => setChoice(c.value)} />
                  {c.label}
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-600 m-0">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={next} disabled={submitting}>{submitting ? "Working…" : "Review repeated request"}</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="text-base font-bold text-slate-800 m-0">{CHOICES.find((c) => c.value === choice)?.label}</h3>
              <p className="text-xs text-slate-400 mt-1">This creates a new draft — you'll publish it from My Requests.</p>
            </div>
            {choice === "DATE_TIME" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">New start</label>
                <input type="datetime-local" className={inp} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                <label className="text-xs font-medium text-slate-600">New end (optional)</label>
                <input type="datetime-local" className={inp} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            )}
            {choice === "SERVICE_TASKS" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">New service category</label>
                <select className={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Keep original</option>
                  {JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            {choice === "REQUIREMENTS" && (
              <p className="text-xs text-slate-500">
                Requirements aren't editable from this quick form yet — the draft will be created with the original requirements, ready for you to review on My Requests.
              </p>
            )}
            {choice === "FUNDING_RATE" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">Funding type</label>
                <select className={inp} value={fundingType} onChange={(e) => setFundingType(e.target.value)}>
                  <option value="">Keep original</option>
                  <option value="SELF_MANAGED">Self-managed NDIS funding</option>
                  <option value="PLAN_MANAGED">Plan-managed NDIS funding</option>
                  <option value="NDIA_MANAGED">NDIA-managed funding</option>
                  <option value="PRIVATE">Privately paid</option>
                </select>
                <label className="text-xs font-medium text-slate-600">Offered hourly rate ($, optional)</label>
                <input type="number" min="0" className={inp} value={budgetPerHour} onChange={(e) => setBudgetPerHour(e.target.value)} />
              </div>
            )}
            {choice === "RECURRING" && (
              <p className="text-xs text-slate-500">This will create the draft as a recurring request. You can set the exact pattern on My Requests.</p>
            )}
            {error && <p className="text-xs text-red-600 m-0">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("choose")} disabled={submitting}>Back</Button>
              <Button onClick={submit} disabled={submitting}>{submitting ? "Creating…" : "Create draft"}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
