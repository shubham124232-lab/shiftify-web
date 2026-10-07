"use client";

// Provider journey PR-RP01–RP05 — "Respond as Provider". This is an ORGANISATION response, not the
// Support Worker Connect window. Five screens, as the Provider document defines them:
//   RP01 Can your organisation service this request?   RP02 Service capability
//   RP03 Nominate delivery option                      RP04 Provider introduction
//   RP05 Review and submit

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

// PR-RP01 → availabilityType understood by the existing apply endpoint. "NO" saves similar
// opportunities instead of submitting.
const CAPABILITY = [
  { v: "YES_EXACT",    l: "Yes — at the requested time" },
  { v: "YES_ADJUSTED", l: "Yes — with an alternative time" },
  { v: "PARTIAL",      l: "Yes — for some services/tasks" },
  { v: "DISCUSS",      l: "I need clarification before committing" },
  { v: "NO",           l: "No — save similar opportunities" },
] as const;

// PR-RP03
const DELIVERY = [
  { v: "ORGANISATION_ONLY", l: "Organisation response only", d: "Your organisation commits capability and nominates a worker later." },
  { v: "INTERNAL_WORKER",   l: "Specific internal worker", d: "Worker relationship, consent, checks and availability must be current." },
  { v: "SMALL_TEAM",        l: "Small team", d: "Show your continuity plan and the named or unnamed team." },
  { v: "ALTERNATIVE",       l: "Alternative service proposal", d: "Shown as different from the requested support — the Participant or Support Coordinator decides." },
] as const;

// PR-RP02 → rateResponse values understood by the existing apply endpoint.
const RATE_APPROACH = [
  { v: "ACCEPT",      l: "Accept the posted rate" },
  { v: "OFFER_OWN",   l: "Propose a different rate" },
  { v: "QUOTE_AFTER", l: "Quote after discussing the details" },
  { v: "DISCUSS",     l: "Discuss the rate" },
] as const;

const STEPS = ["Can your organisation service this request?", "Service capability", "Nominate delivery option", "Provider introduction", "Review and submit"];

interface TeamMember { id: string; name: string | null; username?: string | null; status?: string }

const fieldCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";

export function ProviderRespondModal({
  job, onClose, onSuccess,
}: { job: JobSummary; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(0);
  // RP01
  const [capability, setCapability] = useState<string>("YES_EXACT");
  const [altTime, setAltTime] = useState("");
  const [partialTasks, setPartialTasks] = useState("");
  const [clarification, setClarification] = useState("");
  // RP02
  const [services, setServices] = useState("");
  const [coverage, setCoverage] = useState("");
  const [complexSupports, setComplexSupports] = useState("");
  const [continuity, setContinuity] = useState("");
  const [rateApproach, setRateApproach] = useState<string>("DISCUSS");
  const [proposedRate, setProposedRate] = useState("");
  // RP03 — nomination: active login workers and verified roster members of this organisation only.
  const [delivery, setDelivery] = useState<string>("ORGANISATION_ONLY");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [nominees, setNominees] = useState<string[]>([]);
  const [alternativeProposal, setAlternativeProposal] = useState("");
  // RP04
  const [who, setWho] = useState("");
  const [suitability, setSuitability] = useState("");
  const [experience, setExperience] = useState("");
  const [backup, setBackup] = useState("");
  const [nextStep, setNextStep] = useState("");
  // RP05
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [allowance, setAllowance] = useState<{ applies: boolean; remaining: number; limit: number } | null>(null);

  useEffect(() => {
    api.get<{ users: TeamMember[] }>("/linking/workers")
      .then(r => setTeam((r.users ?? []).filter(u => !u.status || u.status === "ACTIVE")))
      .catch(() => {});
    Promise.all([
      api.get<{ allowance: { applies: boolean; remaining: number; limit: number } }>("/subscriptions/me/allowance"),
      api.get<{ capacity: unknown | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
    ])
      .then(([r, cap]) => setAllowance(cap.capacity ? null : r.allowance))
      .catch(() => setAllowance(null));
  }, []);

  const needsNominee = delivery === "INTERNAL_WORKER" || delivery === "SMALL_TEAM";
  const rateNum = proposedRate.trim() ? Number(proposedRate) : undefined;

  function toggleNominee(id: string) {
    setNominees(prev => delivery === "INTERNAL_WORKER" ? [id] : prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function stepError(): string | null {
    if (step === 0) {
      if (capability === "YES_ADJUSTED" && !altTime.trim()) return "Tell us the alternative time you can offer.";
      if (capability === "PARTIAL" && !partialTasks.trim()) return "Tell us which services or tasks you can cover.";
      if (capability === "DISCUSS" && !clarification.trim()) return "Tell us what you need clarified.";
    }
    if (step === 1 && rateApproach === "OFFER_OWN" && (rateNum === undefined || !Number.isFinite(rateNum) || rateNum < 0)) return "Enter the hourly rate you are proposing.";
    if (step === 2) {
      if (needsNominee && nominees.length === 0) return delivery === "INTERNAL_WORKER" ? "Choose the worker you are nominating." : "Choose the team members you are nominating.";
      if (delivery === "ALTERNATIVE" && !alternativeProposal.trim()) return "Describe the alternative service you are proposing.";
    }
    return null;
  }

  function next() {
    const e = stepError();
    if (e) { setError(e); return; }
    setError(null);
    setStep(s => s + 1);
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

  async function submit() {
    if (!confirmed) return;
    setSubmitting(true);
    setError(null);
    setLimitBlocked(false);
    const introduction = [
      who.trim() && `Who we are: ${who.trim()}`,
      suitability.trim() && `Why we are suitable: ${suitability.trim()}`,
      experience.trim() && `Relevant experience: ${experience.trim()}`,
      backup.trim() && `Continuity and backup: ${backup.trim()}`,
      nextStep.trim() && `Proposed next step: ${nextStep.trim()}`,
    ].filter(Boolean).join("\n");
    try {
      await api.post(`/jobs/${job.id}/apply`, {
        availabilityType: capability,
        rateResponse: rateApproach,
        proposedRate: rateApproach === "OFFER_OWN" ? rateNum : undefined,
        introduction: introduction || undefined,
        applicationData: {
          connectAcknowledgement: true, providerResponse: true, deliveryOption: delivery,
          alternativeTime: capability === "YES_ADJUSTED" ? altTime.trim() : undefined,
          partialTasks: capability === "PARTIAL" ? partialTasks.trim() : undefined,
          clarificationQuestion: capability === "DISCUSS" ? clarification.trim() : undefined,
          alternativeProposal: delivery === "ALTERNATIVE" ? alternativeProposal.trim() : undefined,
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

  const radio = (name: string, value: string, current: string, set: (v: string) => void, label: string, hint?: string) => (
    <label key={value} className={cn("flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-2.5 text-sm transition-colors",
      current === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
      <input type="radio" name={name} className="mt-0.5 accent-brand-600" checked={current === value} onChange={() => set(value)} />
      <span>{label}{hint && <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>}</span>
    </label>
  );

  const nomineeNames = team.filter(t => nominees.includes(t.id)).map(t => t.name || t.username).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Respond as Provider</h2>
            <p className="text-xs text-slate-400 mt-0.5">{job.title} · {job.suburb}, {job.state}</p>
            <p className="text-xs font-semibold text-brand-700 mt-1 mb-0">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          {limitBlocked && <ShiftPassPrompt onPurchased={() => { setLimitBlocked(false); void submit(); }} onDismiss={() => setLimitBlocked(false)} />}

          {step === 0 && (
            <div className="space-y-2">
              {CAPABILITY.map(o => radio("cap", o.v, capability, setCapability, o.l))}
              {capability === "YES_ADJUSTED" && <input className={fieldCls} value={altTime} onChange={e => setAltTime(e.target.value)} placeholder="What alternative time can you offer?" maxLength={200} />}
              {capability === "PARTIAL" && <input className={fieldCls} value={partialTasks} onChange={e => setPartialTasks(e.target.value)} placeholder="Which services or tasks can you cover?" maxLength={300} />}
              {capability === "DISCUSS" && <input className={fieldCls} value={clarification} onChange={e => setClarification(e.target.value)} placeholder="What do you need clarified?" maxLength={300} />}
              {capability === "NO" && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 m-0">
                  Nothing is sent to the poster and no Provider Action is used. We&apos;ll save this request so you see similar opportunities.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {([
                ["Relevant services and registration groups", services, setServices],
                ["Locations and travel coverage", coverage, setCoverage],
                ["Complex supports and participant-specific training", complexSupports, setComplexSupports],
                ["Availability and continuity approach", continuity, setContinuity],
              ] as const).map(([label, value, set]) => (
                <div key={label}>
                  <label className="block text-xs text-slate-600 mb-1">{label}</label>
                  <input className={fieldCls} maxLength={300} value={value} onChange={e => set(e.target.value)} />
                </div>
              ))}
              <div className="space-y-2 pt-1">
                <label className="block text-xs text-slate-600">Proposed rate or quote approach</label>
                {RATE_APPROACH.map(o => radio("rate", o.v, rateApproach, setRateApproach, o.l))}
                {rateApproach === "OFFER_OWN" && (
                  <input type="number" min={0} step="0.01" placeholder="Hourly rate ($)" className={fieldCls} value={proposedRate} onChange={e => setProposedRate(e.target.value)} />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              {DELIVERY.map(o => radio("del", o.v, delivery, v => { setDelivery(v); setNominees([]); }, o.l, o.d))}
              {needsNominee && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-slate-600 m-0">{delivery === "INTERNAL_WORKER" ? "Choose the worker you are nominating" : "Choose the team members you are nominating"}</p>
                  {team.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
                      No active workers in your organisation yet — add and activate one from Internal Workforce first, or respond as the organisation only.
                    </p>
                  ) : team.map(m => (
                    <label key={m.id} className={cn("flex items-center gap-3 cursor-pointer border rounded-lg px-4 py-2 text-sm",
                      nominees.includes(m.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                      <input type={delivery === "INTERNAL_WORKER" ? "radio" : "checkbox"} name="nominee" className="accent-brand-600" checked={nominees.includes(m.id)} onChange={() => toggleNominee(m.id)} />
                      <span>{m.name || m.username}</span>
                    </label>
                  ))}
                </div>
              )}
              {delivery === "ALTERNATIVE" && (
                <textarea className={fieldCls} rows={3} maxLength={600} value={alternativeProposal} onChange={e => setAlternativeProposal(e.target.value)} placeholder="Describe the alternative service you are proposing and how it differs from the request." />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {([
                ["Who is your organisation?", who, setWho],
                ["Why are you suitable for this request?", suitability, setSuitability],
                ["Relevant experience", experience, setExperience],
                ["Continuity and backup arrangements", backup, setBackup],
                ["Proposed next step", nextStep, setNextStep],
              ] as const).map(([label, value, set]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                  <textarea className={fieldCls} rows={2} maxLength={400} value={value} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100 text-sm">
                {[
                  ["Response", CAPABILITY.find(c => c.v === capability)?.l],
                  ["Delivery", DELIVERY.find(d => d.v === delivery)?.l + (nomineeNames ? ` — ${nomineeNames}` : "")],
                  ["Rate", RATE_APPROACH.find(r => r.v === rateApproach)?.l + (rateApproach === "OFFER_OWN" && proposedRate ? ` ($${proposedRate}/hr)` : "")],
                  ["Services and coverage", [services, coverage].filter(Boolean).join(" · ") || "—"],
                  ["Introduction", [who, suitability].filter(Boolean).join(" ") || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1.5">
                    <span className="text-xs font-semibold text-slate-500 w-32 shrink-0">{k}</span>
                    <span className="text-right text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 m-0">
                The poster will see this as an <strong>organisation response</strong> from your Provider business, even when a worker is nominated.
              </p>
              <label className={cn("flex items-start gap-3 cursor-pointer border rounded-lg px-4 py-3 text-sm transition-colors", confirmed ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
                <span>I have reviewed this request, my organisation can meet the stated requirements, and I agree to share our profile and permitted contact details.</span>
              </label>
              <p className="text-xs text-slate-500 m-0">
                {allowance?.applies
                  ? `Submitting uses one Provider Action (${allowance.remaining} of ${allowance.limit} remaining). Responding to a direct invitation or enquiry does not use an action.`
                  : "Submitting is included in your plan. Responding to a direct invitation or enquiry never uses an action."}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between shrink-0">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => { setError(null); setStep(s => s - 1); }}>{step === 0 ? "Go back" : "Back"}</Button>
          {step === 0 && capability === "NO" ? (
            <Button onClick={declineAndSave} loading={saving}>Save similar opportunities</Button>
          ) : step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} loading={submitting} disabled={!confirmed}>Respond as Provider</Button>
          )}
        </div>
      </div>
    </div>
  );
}
