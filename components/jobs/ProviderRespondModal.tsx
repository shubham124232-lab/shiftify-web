"use client";

// Provider journey PR-RP01–RP05 — "Respond as Provider". Presented in place of the
// Support Worker Connect window: a Provider answers whether the organisation can
// service the request, how it would deliver, and introduces itself.

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ShiftPassPrompt } from "@/components/jobs/post/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JobSummary {
  id: string;
  title: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
}

// PR-RP01 → availabilityType understood by the existing apply endpoint.
const CAPABILITY = [
  { v: "YES_EXACT",    l: "Yes, at the requested time" },
  { v: "YES_ADJUSTED", l: "Yes, with an alternative time" },
  { v: "PARTIAL",      l: "Yes, for some services/tasks" },
  { v: "DISCUSS",      l: "I need clarification before committing" },
] as const;

// PR-RP03
const DELIVERY = [
  { v: "ORGANISATION_ONLY", l: "Organisation response only — I'll nominate later" },
  { v: "INTERNAL_WORKER",   l: "A specific internal worker" },
  { v: "SMALL_TEAM",        l: "A small team" },
  { v: "ALTERNATIVE",       l: "An alternative service proposal" },
] as const;

// PR-RP02 → rateResponse values understood by the existing apply endpoint.
const RATE_APPROACH = [
  { v: "ACCEPT",      l: "Accept the posted rate" },
  { v: "OFFER_OWN",   l: "Propose a different rate" },
  { v: "QUOTE_AFTER", l: "Quote after discussing the details" },
  { v: "DISCUSS",     l: "Discuss the rate" },
] as const;

interface TeamMember { id: string; name: string | null; username?: string | null; status?: string }

export function ProviderRespondModal({
  job, onClose, onSuccess,
}: { job: JobSummary; onClose: () => void; onSuccess: () => void }) {
  const [capability, setCapability] = useState<string>("YES_EXACT");
  const [delivery, setDelivery] = useState<string>("ORGANISATION_ONLY");
  const [intro, setIntro] = useState("");
  // PR-RP02 service capability — all optional free text, shared with the poster as-is.
  const [services, setServices] = useState("");
  const [coverage, setCoverage] = useState("");
  const [complexSupports, setComplexSupports] = useState("");
  const [continuity, setContinuity] = useState("");
  const [rateApproach, setRateApproach] = useState<string>("DISCUSS");
  const [proposedRate, setProposedRate] = useState("");
  // PR-RP03 nomination — only active members of this organisation can be nominated.
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [nominees, setNominees] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);

  useEffect(() => {
    api.get<{ users: TeamMember[] }>("/linking/workers")
      .then(r => setTeam((r.users ?? []).filter(u => !u.status || u.status === "ACTIVE")))
      .catch(() => {});
  }, []);

  const needsNominee = delivery === "INTERNAL_WORKER" || delivery === "SMALL_TEAM";
  const rateNum = proposedRate.trim() ? Number(proposedRate) : undefined;
  const rateInvalid = rateApproach === "OFFER_OWN" && (rateNum === undefined || !Number.isFinite(rateNum) || rateNum < 0);
  const nomineeInvalid = needsNominee && nominees.length === 0;

  function toggleNominee(id: string) {
    setNominees(prev => delivery === "INTERNAL_WORKER"
      ? [id]
      : prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function submit() {
    if (!confirmed || rateInvalid || nomineeInvalid) return;
    setSubmitting(true);
    setError(null);
    setLimitBlocked(false);
    try {
      await api.post(`/jobs/${job.id}/apply`, {
        availabilityType: capability,
        rateResponse: rateApproach,
        proposedRate: rateApproach === "OFFER_OWN" ? rateNum : undefined,
        introduction: intro.trim() || undefined,
        applicationData: {
          connectAcknowledgement: true, providerResponse: true, deliveryOption: delivery,
          serviceCapability: {
            services: services.trim() || undefined,
            coverage: coverage.trim() || undefined,
            complexSupports: complexSupports.trim() || undefined,
            continuity: continuity.trim() || undefined,
          },
          ...(needsNominee ? { nominatedWorkerUserIds: nominees } : {}),
        },
      });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_LIMIT") setLimitBlocked(true);
      else setError((err as { message?: string })?.message ?? "Could not submit your response.");
    } finally {
      setSubmitting(false);
    }
  }

  // PR-RP01 "No — save similar opportunities"
  async function declineAndSave() {
    setSaving(true);
    try {
      await api.patch(`/jobs/${job.id}/save`, { saved: true });
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const radio = (name: string, value: string, current: string, set: (v: string) => void, label: string) => (
    <label key={value} className={cn("flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-2.5 text-sm transition-colors",
      current === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
      <input type="radio" name={name} className="mt-0.5 accent-brand-600" checked={current === value} onChange={() => set(value)} />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Respond as Provider</h2>
            <p className="text-xs text-slate-400 mt-0.5">{job.title} · {job.suburb}, {job.state}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          {limitBlocked && <ShiftPassPrompt onPurchased={() => { setLimitBlocked(false); void submit(); }} onDismiss={() => setLimitBlocked(false)} />}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 m-0">Can your organisation service this request?</p>
            {CAPABILITY.map(o => radio("cap", o.v, capability, setCapability, o.l))}
            <button type="button" onClick={declineAndSave} disabled={saving} className="text-xs text-slate-500 hover:underline bg-transparent border-none p-0 cursor-pointer">
              {saving ? "Saving…" : "No — save similar opportunities"}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 m-0">Service capability</p>
            {([
              ["Relevant services and registration groups", services, setServices],
              ["Locations and travel coverage", coverage, setCoverage],
              ["Complex supports and participant-specific training", complexSupports, setComplexSupports],
              ["Availability and continuity approach", continuity, setContinuity],
            ] as const).map(([label, value, set]) => (
              <div key={label}>
                <label className="block text-xs text-slate-600 mb-1">{label}</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                  maxLength={300} value={value} onChange={e => set(e.target.value)}
                />
              </div>
            ))}
            <label className="block text-xs text-slate-600 mb-1">Proposed rate or quote approach</label>
            {RATE_APPROACH.map(o => radio("rate", o.v, rateApproach, setRateApproach, o.l))}
            {rateApproach === "OFFER_OWN" && (
              <input
                type="number" min={0} step="0.01" placeholder="Hourly rate ($)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                value={proposedRate} onChange={e => setProposedRate(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 m-0">How would you deliver it?</p>
            {DELIVERY.map(o => radio("del", o.v, delivery, v => { setDelivery(v); setNominees([]); }, o.l))}
            {needsNominee && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-600 m-0">
                  {delivery === "INTERNAL_WORKER" ? "Choose the worker you are nominating" : "Choose the team members you are nominating"}
                </p>
                {team.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
                    No active workers in your organisation yet — add and activate one from the Team page first, or respond as the organisation only.
                  </p>
                ) : team.map(m => (
                  <label key={m.id} className={cn("flex items-center gap-3 cursor-pointer border rounded-lg px-4 py-2 text-sm",
                    nominees.includes(m.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                    <input
                      type={delivery === "INTERNAL_WORKER" ? "radio" : "checkbox"} name="nominee"
                      className="accent-brand-600" checked={nominees.includes(m.id)} onChange={() => toggleNominee(m.id)}
                    />
                    <span>{m.name || m.username}</span>
                  </label>
                ))}
              </div>
            )}
            {delivery === "ALTERNATIVE" && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
                An alternative proposal is shown as different from the requested support — the Participant or Support Coordinator decides.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Provider introduction</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              rows={4} maxLength={1500} value={intro} onChange={e => setIntro(e.target.value)}
              placeholder="Who you are, why you're suitable, relevant experience, continuity and backup arrangements, and the proposed next step."
            />
          </div>

          <label className={cn("flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-3 text-sm transition-colors", confirmed ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
            <span>I have reviewed this request, my organisation can meet the stated requirements, and I agree to share our profile and permitted contact details.</span>
          </label>

          <p className="text-xs text-slate-400 m-0">
            Submitting uses one Provider action. Responding to a direct invitation or enquiry does not use an action.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between shrink-0">
          <Button variant="ghost" onClick={onClose}>Go back</Button>
          <Button onClick={submit} loading={submitting} disabled={!confirmed || rateInvalid || nomineeInvalid}>Respond as Provider</Button>
        </div>
      </div>
    </div>
  );
}
