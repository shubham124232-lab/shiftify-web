"use client";

// Provider PR-LV02/LV03 — owner-only extras on a response card: why it matches, verification and document
// state, a private note and the reason for passing over a response. Notes/reasons are never shown to the responder.

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface OwnerToolsApp {
  id: string;
  status: string;
  availabilityType?: string | null;
  rateResponse?: string | null;
  ownerNote?: string | null;
  decisionReason?: string | null;
  applicant: {
    phoneVerified?: boolean;
    documents?: { docType: string; expiryDate: string | null; status: string }[];
    workerProfile?: { servicesOffered: string[] | null; suburb: string | null } | null;
    providerProfile?: { coreServices: string[] | null } | null;
  };
}

export const DECLINE_REASONS = ["Not the right fit", "Rate or terms differ", "Availability does not match", "Required checks not met", "Request filled another way", "Other"];

function matchReasons(app: OwnerToolsApp, jobCategory: string, jobSuburb: string): string[] {
  const out: string[] = [];
  const services = (app.applicant.workerProfile?.servicesOffered ?? app.applicant.providerProfile?.coreServices ?? []) as string[];
  if (services.includes(jobCategory)) out.push("Offers this support category");
  if (app.applicant.workerProfile?.suburb && app.applicant.workerProfile.suburb.toLowerCase() === jobSuburb.toLowerCase()) out.push("Based in the request suburb");
  if (app.availabilityType === "YES_EXACT") out.push("Available at the requested time");
  if (app.rateResponse === "ACCEPT") out.push("Accepts the offered rate");
  return out;
}

function docState(docs: NonNullable<OwnerToolsApp["applicant"]["documents"]>): { label: string; tone: string } {
  if (docs.length === 0) return { label: "No documents submitted", tone: "text-slate-500" };
  const now = Date.now();
  const expired = docs.filter((d) => d.expiryDate && new Date(d.expiryDate).getTime() < now);
  if (expired.length > 0) return { label: `${expired.length} document${expired.length === 1 ? "" : "s"} expired`, tone: "text-red-600" };
  const soon = docs.filter((d) => d.expiryDate && new Date(d.expiryDate).getTime() < now + 30 * 86400000);
  if (soon.length > 0) return { label: `${soon.length} document${soon.length === 1 ? "" : "s"} expiring within 30 days`, tone: "text-amber-700" };
  return { label: `${docs.length} document${docs.length === 1 ? "" : "s"} submitted, none expired`, tone: "text-emerald-700" };
}

export function ApplicantOwnerTools({
  jobId, app, jobCategory, jobSuburb, canAct, declineReason, onDeclineReason, onSaved,
}: {
  jobId: string; app: OwnerToolsApp; jobCategory: string; jobSuburb: string; canAct: boolean;
  declineReason: string; onDeclineReason: (v: string) => void; onSaved: () => void;
}) {
  const [note, setNote] = useState(app.ownerNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const reasons = matchReasons(app, jobCategory, jobSuburb);
  const docs = docState(app.applicant.documents ?? []);

  async function saveNote() {
    setSaving(true); setSaved(false);
    try {
      await api.patch(`/jobs/${jobId}/applications/${app.id}/note`, { note });
      setSaved(true); onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={app.applicant.phoneVerified ? "font-semibold text-emerald-700" : "font-semibold text-slate-500"}>
          {app.applicant.phoneVerified ? "✓ Mobile verified" : "Mobile not verified"}
        </span>
        <span className={docs.tone}>· {docs.label}</span>
      </div>
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((r) => <span key={r} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{r}</span>)}
        </div>
      )}
      {app.decisionReason && <p className="m-0 text-slate-500">Reason recorded: {app.decisionReason}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <input className="min-w-[180px] flex-1 rounded-md border border-slate-200 px-2 py-1" placeholder="Private note (only you see this)"
          value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} maxLength={1000} />
        <Button size="sm" variant="outline" disabled={saving || note === (app.ownerNote ?? "")} onClick={saveNote}>{saved ? "Saved" : saving ? "Saving…" : "Save note"}</Button>
      </div>
      {canAct && (
        <select className="rounded-md border border-slate-200 px-2 py-1" value={declineReason} onChange={(e) => onDeclineReason(e.target.value)} aria-label="Reason if you pass on this response">
          <option value="">Reason if you pass on this response (optional)</option>
          {DECLINE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
    </div>
  );
}
