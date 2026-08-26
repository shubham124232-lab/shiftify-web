"use client";

import { useState } from "react";
import { api } from "@/lib/api";
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

// SW journey doc §6 "What Connect means" — a worker who presses Connect has
// confirmed all three of these. This is a single acknowledgement, not a
// repeated application questionnaire.
const CONFIRMATIONS = [
  { key: "available",  label: "I'm available for the times listed" },
  { key: "canDeliver", label: "I can provide this support and meet the essential requirements" },
  { key: "shareProfile", label: "I want my profile and permitted contact details shared with the request initiator" },
] as const;

type ConfirmKey = (typeof CONFIRMATIONS)[number]["key"];

export function ApplyModal({ job, onClose, onSuccess }: ApplyModalProps) {
  const [confirmed, setConfirmed] = useState<Record<ConfirmKey, boolean>>({
    available: false, canDeliver: false, shareProfile: false,
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allConfirmed = CONFIRMATIONS.every(c => confirmed[c.key]);
  const startStr = new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  const endStr = job.scheduledEndAt ? new Date(job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : null;

  async function submit() {
    if (!allConfirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/jobs/${job.id}/apply`, {
        availabilityType: "YES_EXACT",
        rateResponse: "ACCEPT",
        introduction: message.trim() || undefined,
        applicationData: { connectAcknowledgement: true },
      });
      onSuccess();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to Connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Connect to this request</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review, confirm, and Connect — no forms to fill in</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message (optional)</label>
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
            The initiator decides who to confirm — Connecting shares your profile and permitted contact details but does not automatically award the shift.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting} disabled={!allConfirmed}>Connect</Button>
        </div>
      </div>
    </div>
  );
}
