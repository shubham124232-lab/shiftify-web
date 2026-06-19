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

// ─── Step data shape ──────────────────────────────────────────────────────────

interface ApplyData {
  // Step 1 — Availability
  availabilityConfirmed: string;
  adjustedStartAt: string;
  adjustedEndAt: string;
  availabilityNote: string;
  // Step 2 — Skills
  relevantSkills: string[];
  suitabilityNote: string;
  // Step 3 — Rate
  rateType: string;
  proposedRate: string;
  rateNote: string;
  // Step 4 — Introduction
  introduction: string;
  // Step 5 — Supporting notes
  additionalNotes: string;
  hasDocuments: boolean;
}

const defaultData: ApplyData = {
  availabilityConfirmed: "EXACT",
  adjustedStartAt: "", adjustedEndAt: "", availabilityNote: "",
  relevantSkills: [], suitabilityNote: "",
  rateType: "NDIS_RATE", proposedRate: "", rateNote: "",
  introduction: "",
  additionalNotes: "", hasDocuments: false,
};

const SKILL_OPTIONS = [
  "NDIS Worker Screening", "First Aid / CPR", "Manual Handling",
  "Medication Assistance", "Personal Care", "Behaviour Support",
  "Community Access", "Transport", "Overnight / Sleepover", "High Intensity Skills",
];

const STEPS = [
  "Availability",
  "Skills & Suitability",
  "Rate / Commercial",
  "Introduction",
  "Supporting Notes",
  "Review & Submit",
];

const inp = "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
const lbl = "block text-xs font-semibold text-slate-700 mb-1";

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ job, data, onChange }: { job: JobSummary; data: ApplyData; onChange: (f: Partial<ApplyData>) => void }) {
  const startStr = new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  const endStr = job.scheduledEndAt ? new Date(job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
        <div className="font-semibold text-slate-800">{job.title}</div>
        <div className="text-slate-500">📅 {startStr}{endStr ? ` → ${endStr}` : ""}</div>
        <div className="text-slate-500">📍 {job.suburb}, {job.state}</div>
        {job.totalHours && <div className="text-slate-500">⏱ {job.totalHours} hours</div>}
      </div>

      <div>
        <label className={lbl}>Can you make this shift?</label>
        <div className="flex flex-col gap-2 mt-1">
          {[
            { v: "EXACT", l: "Yes — I can do the exact times listed" },
            { v: "ADJUSTED", l: "Mostly — I need to adjust slightly" },
            { v: "PARTIAL", l: "Partial — I can cover part of the shift" },
          ].map(({ v, l }) => (
            <label key={v} className={cn("flex items-center gap-3 cursor-pointer border rounded-lg px-4 py-3 text-sm transition-colors", data.availabilityConfirmed === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.availabilityConfirmed === v} onChange={() => onChange({ availabilityConfirmed: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>

      {(data.availabilityConfirmed === "ADJUSTED" || data.availabilityConfirmed === "PARTIAL") && (
        <div className="space-y-3 border border-amber-200 rounded-xl p-4 bg-amber-50/40">
          <p className="text-xs text-amber-700 font-medium">Specify the times you can cover:</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Available from</label>
              <input type="datetime-local" className={inp} value={data.adjustedStartAt} onChange={e => onChange({ adjustedStartAt: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Available until</label>
              <input type="datetime-local" className={inp} value={data.adjustedEndAt} onChange={e => onChange({ adjustedEndAt: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={lbl}>Availability note (optional)</label>
        <textarea className={`${inp} h-auto py-2`} rows={2} value={data.availabilityNote} onChange={e => onChange({ availabilityNote: e.target.value })} placeholder="Any additional availability context..." />
      </div>
    </div>
  );
}

function Step2({ data, onChange }: { data: ApplyData; onChange: (f: Partial<ApplyData>) => void }) {
  function toggleSkill(s: string) {
    const list = data.relevantSkills.includes(s) ? data.relevantSkills.filter(x => x !== s) : [...data.relevantSkills, s];
    onChange({ relevantSkills: list });
  }
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Relevant skills &amp; qualifications you hold</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SKILL_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => toggleSkill(s)}
              className={cn("h-8 px-3 rounded-full border text-xs font-medium transition-colors", data.relevantSkills.includes(s) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={lbl}>Why are you a good fit for this role?</label>
        <textarea className={`${inp} h-auto py-2`} rows={4} value={data.suitabilityNote} onChange={e => onChange({ suitabilityNote: e.target.value })} placeholder="Describe your relevant experience and why you are well-suited for this support..." />
      </div>
    </div>
  );
}

function Step3({ data, onChange }: { data: ApplyData; onChange: (f: Partial<ApplyData>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Rate type</label>
        <div className="flex flex-col gap-2">
          {[
            { v: "NDIS_RATE", l: "NDIS Price Guide Rate", desc: "Standard NDIS published rate for this support category" },
            { v: "AGREED_RATE", l: "Agreed custom rate", desc: "Specify a rate you are willing to work for" },
            { v: "OPEN_TO_NEGOTIATE", l: "Open to negotiation", desc: "Happy to discuss with the participant / coordinator" },
          ].map(({ v, l, desc }) => (
            <label key={v} className={cn("flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-3 text-sm transition-colors", data.rateType === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.rateType === v} onChange={() => onChange({ rateType: v })} />
              <div>
                <div className="font-medium">{l}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      {data.rateType === "AGREED_RATE" && (
        <div>
          <label className={lbl}>Your proposed hourly rate (AUD)</label>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input type="number" min="0" step="0.50" className={`${inp} pl-7`} value={data.proposedRate} onChange={e => onChange({ proposedRate: e.target.value })} placeholder="38.00" />
          </div>
        </div>
      )}
      <div>
        <label className={lbl}>Commercial notes (optional)</label>
        <textarea className={`${inp} h-auto py-2`} rows={2} value={data.rateNote} onChange={e => onChange({ rateNote: e.target.value })} placeholder="Any notes about rates or billing arrangements..." />
      </div>
    </div>
  );
}

function Step4({ data, onChange }: { data: ApplyData; onChange: (f: Partial<ApplyData>) => void }) {
  const charCount = data.introduction.length;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-1">
          <label className={lbl}>Introduction / proposal</label>
          <span className="text-xs text-slate-400">{charCount}/500</span>
        </div>
        <textarea
          className={`${inp} h-auto py-2`} rows={7}
          maxLength={500}
          value={data.introduction}
          onChange={e => onChange({ introduction: e.target.value })}
          placeholder="Introduce yourself to the participant or coordinator. Tell them about your experience, approach, and why you would be a great fit for this support role..."
        />
      </div>
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
        <strong>Tip:</strong> A warm, specific introduction significantly increases your chances of being selected. Mention any personal connection to the type of support needed.
      </div>
    </div>
  );
}

function Step5({ data, onChange }: { data: ApplyData; onChange: (f: Partial<ApplyData>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Additional notes (optional)</label>
        <textarea className={`${inp} h-auto py-2`} rows={4} value={data.additionalNotes} onChange={e => onChange({ additionalNotes: e.target.value })} placeholder="Any other relevant information, special considerations, or questions for the poster..." />
      </div>
      <label className="flex items-center gap-3 cursor-pointer border border-slate-200 rounded-xl px-4 py-3">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={data.hasDocuments} onChange={e => onChange({ hasDocuments: e.target.checked })} />
        <div>
          <span className="text-sm font-medium text-slate-800">I have all required compliance documents up to date</span>
          <p className="text-xs text-slate-400 mt-0.5">Police Check, NDIS Screening, First Aid, etc. Verifiable in your profile.</p>
        </div>
      </label>
    </div>
  );
}

function ReviewStep({ job, data }: { job: JobSummary; data: ApplyData }) {
  const availLabel: Record<string, string> = { EXACT: "Exact times", ADJUSTED: "Adjusted times", PARTIAL: "Partial coverage" };
  const rateLabel: Record<string, string> = { NDIS_RATE: "NDIS rate", AGREED_RATE: `$${data.proposedRate}/hr`, OPEN_TO_NEGOTIATE: "Open to negotiate" };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Review your application before submitting.</p>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        {[
          ["Job", job.title],
          ["Availability", availLabel[data.availabilityConfirmed]],
          ["Skills listed", data.relevantSkills.length > 0 ? data.relevantSkills.join(", ") : "—"],
          ["Rate", rateLabel[data.rateType] ?? data.rateType],
          ["Introduction", data.introduction.trim() ? data.introduction.trim().slice(0, 120) + (data.introduction.length > 120 ? "…" : "") : "—"],
          ["Documents confirmed", data.hasDocuments ? "Yes" : "Not confirmed"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-start px-4 py-3">
            <span className="text-xs font-semibold text-slate-500 w-32 shrink-0">{label}</span>
            <span className="text-sm text-slate-800 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

export function ApplyModal({ job, onClose, onSuccess }: ApplyModalProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ApplyData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change(fields: Partial<ApplyData>) {
    setData(prev => ({ ...prev, ...fields }));
  }

  function validateStep(): string | null {
    if (step === 3 && data.introduction.trim().length < 20) return "Please write at least 20 characters in your introduction.";
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const note = [
        `Availability: ${data.availabilityConfirmed}`,
        data.availabilityNote ? `Availability note: ${data.availabilityNote}` : null,
        data.relevantSkills.length > 0 ? `Skills: ${data.relevantSkills.join(", ")}` : null,
        data.suitabilityNote ? `Suitability: ${data.suitabilityNote}` : null,
        `Rate: ${data.rateType}${data.rateType === "AGREED_RATE" ? ` $${data.proposedRate}/hr` : ""}`,
        data.rateNote ? `Rate note: ${data.rateNote}` : null,
        data.introduction.trim() ? `Introduction: ${data.introduction.trim()}` : null,
        data.additionalNotes.trim() ? `Notes: ${data.additionalNotes.trim()}` : null,
        data.hasDocuments ? "Documents: Confirmed up to date" : null,
      ].filter(Boolean).join("\n\n");

      await api.post(`/jobs/${job.id}/apply`, { note });
      onSuccess();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepComponents = [
    <Step1 key={0} job={job} data={data} onChange={change} />,
    <Step2 key={1} data={data} onChange={change} />,
    <Step3 key={2} data={data} onChange={change} />,
    <Step4 key={3} data={data} onChange={change} />,
    <Step5 key={4} data={data} onChange={change} />,
    <ReviewStep key={5} job={job} data={data} />,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Apply — {STEPS[step]}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">×</button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-brand-500" : "bg-slate-200")} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {stepComponents[step]}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between shrink-0">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => { setError(null); setStep(s => s - 1); }}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} loading={submitting}>Submit Application</Button>
          )}
        </div>
      </div>
    </div>
  );
}
