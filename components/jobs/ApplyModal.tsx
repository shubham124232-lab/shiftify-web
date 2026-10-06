"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ShiftPassPrompt } from "@/components/jobs/post/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobSummary {
  id: string;
  title: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
  totalHours?: number | null;
  urgency: string;
  shiftType?: string;
}

interface ApplyModalProps {
  job: JobSummary;
  onClose: () => void;
  onSuccess: () => void;
}

// SW v3.0 Connect Window 1 — one acknowledgement plus contact consent, not an
// application questionnaire.
const CONFIRMATIONS = [
  { key: "available",    label: "I have reviewed this request and confirm that I am available and can meet the stated requirements." },
  { key: "shareProfile", label: "I agree to share my permitted profile and contact details with the request initiator." },
] as const;

type ConfirmKey = (typeof CONFIRMATIONS)[number]["key"];

export function ApplyModal({ job, onClose, onSuccess }: ApplyModalProps) {
  const [confirmed, setConfirmed] = useState<Record<ConfirmKey, boolean>>({
    available: false, shareProfile: false,
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(false);

  const allConfirmed = CONFIRMATIONS.every(c => confirmed[c.key]);
  const startStr = new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  const endStr = job.scheduledEndAt ? new Date(job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : null;

  async function submit() {
    if (!allConfirmed) return;
    setSubmitting(true);
    setError(null);
    setLimitBlocked(false);
    try {
      await api.post(`/jobs/${job.id}/apply`, {
        availabilityType: "YES_EXACT",
        rateResponse: "ACCEPT",
        introduction: message.trim() || undefined,
        applicationData: { connectAcknowledgement: true },
      });
      setDone(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_LIMIT") setLimitBlocked(true);
      else setError((err as { message?: string })?.message ?? "Failed to Connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // SW v3.0 Connect Window 2 — tell the worker exactly what was shared.
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl px-6 py-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Connection created</h2>
          <p className="text-sm text-slate-600 m-0">
            The initiator receives your name and photo, permitted contact method, services, experience, relevant qualifications and document status, general location, availability, rate and a link to your full profile.
          </p>
          <p className="text-xs text-slate-500 m-0">
            You can message in the app, review the request, or withdraw interest. The participant&apos;s full address is not released at Connect, and the shift stays open until the initiator confirms a worker and that worker accepts.
          </p>
          <div className="flex justify-end pt-2">
            <Button onClick={onSuccess}>View request</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Connect to this request</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your saved profile, services, document status, availability and preferred rate will be shared with the initiator.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {limitBlocked && (
            <ShiftPassPrompt onPurchased={() => { setLimitBlocked(false); void submit(); }} onDismiss={() => setLimitBlocked(false)} />
          )}

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
            <div className="font-semibold text-slate-800">{job.title}</div>
            <div className="text-slate-500">📅 {startStr}{endStr ? ` → ${endStr}` : ""}</div>
            <div className="text-slate-500">📍 {job.suburb}, {job.state}</div>
            {job.totalHours && <div className="text-slate-500">⏱ {job.totalHours} hours</div>}
          </div>

          <div className="space-y-2">
            {CONFIRMATIONS.map(c => (
              <label key={c.key} className={cn("flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-3 text-sm transition-colors", confirmed[c.key] ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
                  checked={confirmed[c.key]}
                  onChange={e => setConfirmed(prev => ({ ...prev, [c.key]: e.target.checked }))}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Add a short message or question — optional</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              rows={3}
              maxLength={500}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Anything you'd like the initiator to know before Connecting (optional)..."
            />
          </div>

          <p className="text-xs text-slate-400">
            Connect expresses interest and capability. The shift remains open until the initiator confirms a worker and that worker accepts. The participant's full address is not released at Connect.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between shrink-0">
          <Button variant="ghost" onClick={onClose}>Go back</Button>
          <Button onClick={submit} loading={submitting} disabled={!allConfirmed}>Connect</Button>
        </div>
      </div>
    </div>
  );
}
