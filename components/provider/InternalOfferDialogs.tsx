"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { cn } from "@/lib/utils";
import { requirementLabels } from "@/lib/constants/job-filters";
import { PROVIDER_TIERS } from "@/components/provider/timing";

export interface InternalOffer {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CONFIRMED";
  memberType: "MANAGED" | "ROSTER";
  memberName: string;
  offeredRate: number | null;
  job: {
    id: string; title: string; suburb: string; scheduledStartAt: string; scheduledEndAt: string; urgency: string;
    riskSafetyNotes?: string | null; workerPreferences?: Record<string, unknown> | null;
  };
}

const URGENCY_LABEL: Record<string, string> = Object.fromEntries(PROVIDER_TIERS.map((t) => [t.key, t.label]));
interface OpenJob { urgency: string; id: string; title: string; suburb: string; scheduledStartAt: string; scheduledEndAt?: string | null; budgetPerHour?: number | string | null; status: string; riskSafetyNotes?: string | null; workerPreferences?: Record<string, unknown> | null }
interface Member { key: string; name: string; kind: "MANAGED" | "ROSTER"; branch: string | null; skills?: string[]; status: string }

const when = (a: string, b?: string | null) => {
  const day = new Date(a).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const t = (iso: string) => new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${day} · ${t(a)}${b ? `–${t(b)}` : ""}`;
};
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const skillsOf = (j: { workerPreferences?: Record<string, unknown> | null }) => requirementLabels(j.workerPreferences);

export const OFFER_STATUS: Record<InternalOffer["status"], { label: string; cls: string }> = {
  PENDING:  { label: "Pending",  cls: "pd-badge-pink" },
  ACCEPTED: { label: "Accepted", cls: "pd-badge-green" },
  DECLINED: { label: "Declined", cls: "" },
  EXPIRED:  { label: "Expired",  cls: "pd-badge-orange" },
  CONFIRMED: { label: "Confirmed", cls: "pd-badge-green" },
};

const footer = "border-t border-slate-100 bg-slate-50/60 px-6 py-4";

// Header "Send offer": choose a shift -> Select internal team -> Review shift offer -> send.
export function SendInternalOfferFlow({ onClose, onSent }: { onClose: () => void; onSent: (offerId: string) => void }) {
  const [step, setStep] = useState<"request" | "team" | "review">("request");
  const [jobs, setJobs] = useState<OpenJob[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [job, setJob] = useState<OpenJob | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ jobs: OpenJob[] }>("/jobs/my").then((r) => setJobs((r.jobs ?? []).filter((j) => j.status === "OPEN" && new Date(j.scheduledStartAt) > new Date()).sort((a, b) => +new Date(a.scheduledStartAt) - +new Date(b.scheduledStartAt)))).catch(() => setJobs([]));
    api.get<{ members: Member[] }>("/provider-workspace/team-availability").then((r) => setMembers(r.members ?? [])).catch(() => setMembers([]));
  }, []);

  async function send() {
    if (!job || !member) return;
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ offer: { id: string } }>("/provider-workspace/internal-offers", { jobId: job.id, memberKey: member.key });
      onSent(r.offer.id);
    } catch (e) { setError(e instanceof ApiError || e instanceof Error ? e.message : "Could not send the offer"); setBusy(false); }
  }

  if (step === "review" && job && member) {
    const rate = job.budgetPerHour != null && job.budgetPerHour !== "" ? `$${Number(job.budgetPerHour).toFixed(2)} / hr` : "To be agreed";
    const skills = skillsOf(job);
    return (
      <ModalShell title="Review shift offer" onClose={onClose}>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{initials(member.name)}</span>
            <div>
              <p className="m-0 text-xl font-bold text-slate-900">{member.name}</p>
              <p className="m-0 text-sm text-slate-500">Internal worker · {job.title}</p>
            </div>
          </div>
          <dl className="m-0 mt-4 divide-y divide-slate-100 border-y border-slate-100 text-sm">
            {([["Schedule", when(job.scheduledStartAt, job.scheduledEndAt)], ["Offered rate", rate], ["Support requirements", skills.length ? skills.join(", ") : "As described on the request"]] as const).map(([k, v]) => (
              <div key={k} className="flex gap-4 py-3"><dt className="w-44 shrink-0 text-slate-500">{k}</dt><dd className="m-0 font-medium text-slate-900">{v}</dd></div>
            ))}
          </dl>
          {job.riskSafetyNotes && <p className="m-0 mt-3 text-sm text-slate-500">{job.riskSafetyNotes} Essential care instructions released to the confirmed worker.</p>}
          <label className="mt-3 flex items-start gap-2.5 text-sm text-slate-700">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>I have reviewed credentials, suitability, shift terms and the permitted safety information. Worker acceptance is required before final confirmation.</span>
          </label>
          {error && <p className="m-0 mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className={cn(footer, "flex items-center justify-between")}>
          <Button variant="outline" onClick={() => setStep("team")}>Back</Button>
          <Button disabled={!consent || busy} onClick={send}>{busy ? "Sending…" : "Send offer"}</Button>
        </div>
      </ModalShell>
    );
  }

  if (step === "team" && job) {
    return (
      <ModalShell title="Select internal team" onClose={onClose}>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
          <p className="m-0 mt-1 text-sm text-slate-500">Send an offer after checking suitability and availability.</p>
          <div className="mt-4 space-y-3">
            {members === null ? <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              : members.length === 0 ? <p className="m-0 text-sm text-slate-500">No internal team members yet. Add one from Internal Team.</p>
              : members.map((m) => (
                <div key={m.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="m-0 text-base font-bold text-slate-900">{m.name}</p>
                    <p className="m-0 text-sm text-slate-500">{[...(m.skills ?? []), ["VERIFIED", "AVAILABLE", "ON_SHIFT", "NOT_SET"].includes(m.status) ? "Current" : "Verification pending"].join(", ").replace(/, (Current|Verification pending)$/, " · $1")}</p>
                  </div>
                  <Button size="sm" onClick={() => { setMember(m); setConsent(false); setStep("review"); }}>Send offer</Button>
                </div>
              ))}
          </div>
        </div>
        <div className={footer}><Button variant="outline" onClick={() => setStep("request")}>Back to request</Button></div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Choose an active shift" subtitle="Select the staffing request for this action." onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {jobs === null ? <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          : jobs.length === 0 ? <p className="m-0 text-sm text-slate-500">You have no live upcoming shifts. Post a shift first, then send an offer.</p>
          : <div className="space-y-3">
              {jobs.map((j) => (
                <button key={j.id} type="button" onClick={() => { setJob(j); setStep("team"); }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40">
                  <span><span className="block text-base font-bold text-slate-900">{j.title}</span><span className="block text-sm text-slate-500">{j.suburb} · {URGENCY_LABEL[j.urgency] ?? j.urgency}</span></span>
                  <span className="text-sm font-semibold text-brand-700">Select</span>
                </button>
              ))}
            </div>}
      </div>
      <div className={footer}><Button variant="outline" onClick={onClose}>Close</Button></div>
    </ModalShell>
  );
}

// "View offer": status, shift details and (demo preview) the worker's answer.
export function InternalOfferDetailDialog({ offer, onClose, onChanged }: { offer: InternalOffer; onClose: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skills = useMemo(() => skillsOf(offer.job), [offer]);
  const st = OFFER_STATUS[offer.status];

  async function confirm() {
    setBusy(true); setError(null);
    try { await api.post(`/provider-workspace/internal-offers/${offer.id}/confirm`, {}); onChanged(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not confirm the assignment"); setBusy(false); }
  }

  async function answer(status: "ACCEPTED" | "DECLINED") {
    setBusy(true); setError(null);
    try { await api.patch(`/provider-workspace/internal-offers/${offer.id}/response`, { status }); onChanged(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not record the answer"); setBusy(false); }
  }

  return (
    <ModalShell title="Shift offer" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="flex gap-2">
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", st.cls)}>{st.label}</span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Internal</span>
        </div>
        <p className="m-0 mt-3 text-2xl font-bold text-slate-900">{offer.job.title}</p>
        <p className="m-0 mt-2 text-base text-slate-500">{offer.memberName} · {offer.job.suburb}</p>
        <p className="m-0 text-base text-slate-500">{when(offer.job.scheduledStartAt, offer.job.scheduledEndAt)}</p>
        {offer.offeredRate !== null && <p className="m-0 text-base text-slate-500">${offer.offeredRate.toFixed(2)} / hr</p>}
        <p className="m-0 mt-4 text-lg font-bold text-slate-900">Essential support and safety</p>
        <p className="m-0 mt-1 text-base text-slate-500">{offer.job.riskSafetyNotes ? `${offer.job.riskSafetyNotes} ` : ""}Essential care instructions released to the confirmed worker.</p>
        {skills.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{s}</span>)}</div>}
        <p className="m-0 mt-5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4 text-sm text-slate-600">
          {offer.status === "ACCEPTED" ? "The worker has accepted. Confirming rechecks their documents and overlapping shifts, then fills the slot."
            : offer.status === "CONFIRMED" ? "This assignment is confirmed and appears under Confirmed assignments."
            : "An offer does not award or confirm the shift."}
        </p>
        {error && <p className="m-0 mt-2 text-sm text-red-600">{error}</p>}
      </div>
      <div className={cn(footer, "flex items-center justify-between")}>
        <Button variant="outline" onClick={onClose}>Close</Button>
        {offer.status === "ACCEPTED" && <Button disabled={busy} onClick={confirm}>{busy ? "Confirming…" : "Confirm assignment"}</Button>}
        {offer.status === "PENDING" && (
          <span className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={() => answer("DECLINED")}>Preview worker decline</Button>
            <Button disabled={busy} onClick={() => answer("ACCEPTED")}>Preview worker acceptance</Button>
          </span>
        )}
      </div>
    </ModalShell>
  );
}
