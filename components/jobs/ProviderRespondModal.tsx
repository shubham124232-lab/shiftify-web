"use client";

// Provider journey PR-RP01–RP05 — "Respond as Provider". This is an ORGANISATION response, not the
// Support Worker Connect window. Six steps in the approved demo's popup: Serviceability, Capability and coverage,
// Commercial and delivery, Provider introduction, Supporting evidence, Review.

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ModalShell, ShiftPassPrompt } from "@/components/jobs/post/shared";
import { cn } from "@/lib/utils";

interface JobSummary {
  id: string;
  title: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
}

// "Can you service this request?" → availabilityType understood by the existing apply endpoint.
// "Future referral / waitlist" saves similar opportunities instead of submitting.
const CAPABILITY = [
  { v: "YES_EXACT",    l: "Yes exactly as requested" },
  { v: "YES_ADJUSTED", l: "Alternate schedule" },
  { v: "PARTIAL",      l: "Partial services" },
  { v: "BRIDGING",     l: "Temporary bridging" },
  { v: "DISCUSS",      l: "Need clarification" },
  { v: "NO",           l: "Future referral / waitlist" },
] as const;
const API_AVAILABILITY: Record<string, string> = { BRIDGING: "PARTIAL" };

const CAPACITY_STATUS = ["Immediate capacity", "From a specific date", "Waitlist only", "Temporary cover", "Ongoing intake"];
const LOCATION_COVERAGE = ["Can service requested area", "Travel charges apply", "Need clarification"];
const START_PREREQS = ["Immediate intake", "Intake assessment", "Meet-and-greet", "Service agreement", "Trial visit"];
const EVIDENCE = [
  "Registration and compliance summary",
  "Public liability insurance summary",
  "Worker screening and credential summary",
  "Relevant service references",
];

const DELIVERY = [
  { v: "ORGANISATION_ONLY", l: "Organisation response only" },
  { v: "INTERNAL_WORKER",   l: "Specific internal worker" },
  { v: "SMALL_TEAM",        l: "Small team" },
  { v: "ALTERNATIVE",       l: "Alternative service proposal" },
] as const;

const RATE_APPROACH = [
  { v: "ACCEPT",      l: "Accept the posted rate" },
  { v: "OFFER_OWN",   l: "Propose a different rate" },
  { v: "QUOTE_AFTER", l: "Quote after discussing the details" },
  { v: "DISCUSS",     l: "Discuss the rate" },
] as const;

const STEPS = ["Serviceability", "Capability and coverage", "Commercial and delivery", "Provider introduction", "Supporting evidence", "Review Provider"];

interface TeamMember { id: string; name: string | null; username?: string | null; status?: string }

const draftKey = (jobId: string) => `shiftify_respond_draft_${jobId}`;

export function ProviderRespondModal({
  job, onClose, onSuccess,
}: { job: JobSummary; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(0);
  // Step 1 — serviceability
  const [capability, setCapability] = useState<string>("YES_EXACT");
  const [capacityStatus, setCapacityStatus] = useState(CAPACITY_STATUS[0]);
  const [schedule, setSchedule] = useState("");
  const [locationCoverage, setLocationCoverage] = useState(LOCATION_COVERAGE[0]);
  const [startPrereq, setStartPrereq] = useState(START_PREREQS[0]);
  const [partialTasks, setPartialTasks] = useState("");
  const [clarification, setClarification] = useState("");
  // Step 2 — capability and coverage
  const [services, setServices] = useState("");
  const [coverage, setCoverage] = useState("");
  const [complexSupports, setComplexSupports] = useState("");
  const [continuity, setContinuity] = useState("");
  // Step 3 — commercial and delivery (nomination: active login workers and verified roster members of this organisation only)
  const [rateApproach, setRateApproach] = useState<string>("DISCUSS");
  const [proposedRate, setProposedRate] = useState("");
  const [delivery, setDelivery] = useState<string>("ORGANISATION_ONLY");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [nominees, setNominees] = useState<string[]>([]);
  const [alternativeProposal, setAlternativeProposal] = useState("");
  // Step 4 — introduction
  const [who, setWho] = useState("");
  const [suitability, setSuitability] = useState("");
  const [experience, setExperience] = useState("");
  const [backup, setBackup] = useState("");
  const [nextStep, setNextStep] = useState("");
  // Step 5 — evidence
  const [evidence, setEvidence] = useState<string[]>(EVIDENCE.slice(0, 2));
  // Step 6 — review
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [allowance, setAllowance] = useState<{ applies: boolean; remaining: number; limit: number } | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

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
    // Resume a saved draft for this request.
    try {
      const raw = localStorage.getItem(draftKey(job.id));
      if (raw) {
        const d = JSON.parse(raw) as Record<string, string | string[]>;
        const str = (k: string, set: (v: string) => void) => { if (typeof d[k] === "string") set(d[k] as string); };
        str("capability", setCapability); str("capacityStatus", setCapacityStatus); str("schedule", setSchedule);
        str("locationCoverage", setLocationCoverage); str("startPrereq", setStartPrereq); str("partialTasks", setPartialTasks);
        str("clarification", setClarification); str("services", setServices); str("coverage", setCoverage);
        str("complexSupports", setComplexSupports); str("continuity", setContinuity); str("rateApproach", setRateApproach);
        str("proposedRate", setProposedRate); str("delivery", setDelivery); str("alternativeProposal", setAlternativeProposal);
        str("who", setWho); str("suitability", setSuitability); str("experience", setExperience); str("backup", setBackup); str("nextStep", setNextStep);
        if (Array.isArray(d.nominees)) setNominees(d.nominees);
        if (Array.isArray(d.evidence)) setEvidence(d.evidence);
      }
    } catch { /* no draft */ }
  }, [job.id]);

  const needsNominee = delivery === "INTERNAL_WORKER" || delivery === "SMALL_TEAM";
  const rateNum = proposedRate.trim() ? Number(proposedRate) : undefined;

  function toggleNominee(id: string) {
    setNominees(prev => delivery === "INTERNAL_WORKER" ? [id] : prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function stepError(): string | null {
    if (step === 0) {
      if (capability !== "NO" && !schedule.trim()) return "Enter the confirmed or proposed schedule.";
      if (capability === "PARTIAL" && !partialTasks.trim()) return "Tell us which services or tasks you can cover.";
      if (capability === "DISCUSS" && !clarification.trim()) return "Tell us what you need clarified.";
    }
    if (step === 2) {
      if (rateApproach === "OFFER_OWN" && (rateNum === undefined || !Number.isFinite(rateNum) || rateNum < 0)) return "Enter the hourly rate you are proposing.";
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

  function saveDraft() {
    try {
      localStorage.setItem(draftKey(job.id), JSON.stringify({
        capability, capacityStatus, schedule, locationCoverage, startPrereq, partialTasks, clarification, services, coverage,
        complexSupports, continuity, rateApproach, proposedRate, delivery, alternativeProposal, who, suitability, experience,
        backup, nextStep, nominees, evidence,
      }));
      setDraftSaved(true);
      setError(null);
    } catch { setError("Could not save the draft on this device."); }
  }

  // "Future referral / waitlist": nothing is sent; the request is saved so similar opportunities show up.
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
        availabilityType: API_AVAILABILITY[capability] ?? capability,
        rateResponse: rateApproach,
        proposedRate: rateApproach === "OFFER_OWN" ? rateNum : undefined,
        introduction: introduction || undefined,
        applicationData: {
          connectAcknowledgement: true, providerResponse: true, deliveryOption: delivery,
          serviceability: capability,
          capacityStatus, proposedSchedule: schedule.trim(), locationCoverage, startPrerequisites: startPrereq,
          alternativeTime: capability === "YES_ADJUSTED" ? schedule.trim() : undefined,
          partialTasks: capability === "PARTIAL" ? partialTasks.trim() : undefined,
          clarificationQuestion: capability === "DISCUSS" ? clarification.trim() : undefined,
          alternativeProposal: delivery === "ALTERNATIVE" ? alternativeProposal.trim() : undefined,
          supportingEvidence: evidence,
          serviceCapability: {
            services: services.trim() || undefined,
            coverage: coverage.trim() || undefined,
            complexSupports: complexSupports.trim() || undefined,
            continuity: continuity.trim() || undefined,
          },
          ...(needsNominee ? { nominatedWorkerUserIds: nominees } : {}),
        },
      });
      try { localStorage.removeItem(draftKey(job.id)); } catch { /* ignore */ }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_LIMIT") setLimitBlocked(true);
      else setError((err as { message?: string })?.message ?? "Could not submit your response.");
    } finally {
      setSubmitting(false);
    }
  }

  const field = (label: string, node: React.ReactNode, required = false) => (
    <label className="block">{label}{required && <span className="text-[#c91355]"> *</span>}{node}</label>
  );
  const select = (value: string, set: (v: string) => void, options: readonly string[]) => (
    <select value={value} onChange={e => set(e.target.value)}>{options.map(o => <option key={o}>{o}</option>)}</select>
  );
  const text = (label: string, value: string, set: (v: string) => void, rows = 3) => (
    field(label, <textarea rows={rows} maxLength={400} value={value} onChange={e => set(e.target.value)} />)
  );

  const nomineeNames = team.filter(t => nominees.includes(t.id)).map(t => t.name || t.username).join(", ");
  const showSteps = capability !== "NO";
  const lastStep = STEPS.length - 1;

  return (
    <ModalShell title="Respond as Provider" subtitle={`${job.title} · ${job.suburb}${job.state ? `, ${job.state}` : ""}`} onClose={onClose}>
      {showSteps && (
        <ol className="pd-steps">
          {STEPS.map((s, i) => <li key={s} className={cn("pd-step", step === i && "active", step > i && "done")}>{i + 1}. {s}</li>)}
        </ol>
      )}
      <div className="pd-modal-body">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {draftSaved && !error && <div className="pd-notice mb-4">Draft saved on this device. It reopens here the next time you respond to this request.</div>}
        {limitBlocked && <ShiftPassPrompt onPurchased={() => { setLimitBlocked(false); void submit(); }} onDismiss={() => setLimitBlocked(false)} />}

        {step === 0 && (
          <div>
            <div className="pd-form-title"><h3>Serviceability</h3><p className="pd-muted m-0 mt-1 text-sm">Explain exactly what your organisation can offer.</p></div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              {field("Can you service this request?", <select value={capability} onChange={e => setCapability(e.target.value)}>{CAPABILITY.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>, true)}
              {capability !== "NO" && field("Capacity status", select(capacityStatus, setCapacityStatus, CAPACITY_STATUS), true)}
              {capability !== "NO" && <div className="sm:col-span-2">{field("Confirmed / proposed schedule", <textarea rows={3} maxLength={300} value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Mon, Wed, Fri · 7–10 am" />, true)}</div>}
              {capability === "PARTIAL" && <div className="sm:col-span-2">{field("Which services or tasks can you cover?", <input value={partialTasks} onChange={e => setPartialTasks(e.target.value)} maxLength={300} />, true)}</div>}
              {capability === "DISCUSS" && <div className="sm:col-span-2">{field("What do you need clarified?", <input value={clarification} onChange={e => setClarification(e.target.value)} maxLength={300} />, true)}</div>}
              {capability !== "NO" && field("Location coverage", select(locationCoverage, setLocationCoverage, LOCATION_COVERAGE))}
              {capability !== "NO" && field("Start prerequisites", select(startPrereq, setStartPrereq, START_PREREQS))}
            </div>
            {capability === "NO" && (
              <p className="pd-notice mt-4">Nothing is sent to the poster and no Provider Action is used. We&apos;ll save this request so you see similar opportunities.</p>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="pd-form-title"><h3>Capability and coverage</h3></div>
            <div className="space-y-4">
              {field("Relevant services and registration groups", <input maxLength={300} value={services} onChange={e => setServices(e.target.value)} />)}
              {field("Locations and travel coverage", <input maxLength={300} value={coverage} onChange={e => setCoverage(e.target.value)} />)}
              {field("Complex supports and participant-specific training", <input maxLength={300} value={complexSupports} onChange={e => setComplexSupports(e.target.value)} />)}
              {field("Availability and continuity approach", <input maxLength={300} value={continuity} onChange={e => setContinuity(e.target.value)} />)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="pd-form-title"><h3>Commercial and delivery</h3></div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              {field("Proposed rate or quote approach", <select value={rateApproach} onChange={e => setRateApproach(e.target.value)}>{RATE_APPROACH.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>, true)}
              {rateApproach === "OFFER_OWN"
                ? field("Hourly rate ($)", <input type="number" min={0} step="0.01" value={proposedRate} onChange={e => setProposedRate(e.target.value)} />, true)
                : <div />}
              {field("Delivery option", <select value={delivery} onChange={e => { setDelivery(e.target.value); setNominees([]); }}>{DELIVERY.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>, true)}
            </div>
            {needsNominee && (
              <div className="mt-4 space-y-2">
                <p className="m-0 text-sm font-semibold">{delivery === "INTERNAL_WORKER" ? "Choose the worker you are nominating" : "Choose the team members you are nominating"}</p>
                {team.length === 0 ? (
                  <p className="pd-notice m-0">No active workers in your organisation yet — add and activate one from Internal Team first, or respond as the organisation only.</p>
                ) : team.map(m => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e4e6ed] px-4 py-2.5 text-sm">
                    <input type={delivery === "INTERNAL_WORKER" ? "radio" : "checkbox"} name="nominee" checked={nominees.includes(m.id)} onChange={() => toggleNominee(m.id)} />
                    <span>{m.name || m.username}</span>
                  </label>
                ))}
              </div>
            )}
            {delivery === "ALTERNATIVE" && (
              <div className="mt-4">{field("Alternative service proposal", <textarea rows={3} maxLength={600} value={alternativeProposal} onChange={e => setAlternativeProposal(e.target.value)} placeholder="Describe the alternative service you are proposing and how it differs from the request." />, true)}</div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="pd-form-title"><h3>Provider introduction</h3></div>
            <div className="space-y-4">
              {text("Who is your organisation?", who, setWho, 2)}
              {text("Why are you suitable for this request?", suitability, setSuitability, 2)}
              {text("Relevant experience", experience, setExperience, 2)}
              {text("Continuity and backup arrangements", backup, setBackup, 2)}
              {text("Proposed next step", nextStep, setNextStep, 2)}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="pd-form-title"><h3>Supporting evidence</h3><p className="pd-muted m-0 mt-1 text-sm">Choose the summaries the poster can see. Raw documents stay private.</p></div>
            <div className="space-y-2">
              {EVIDENCE.map(e => (
                <label key={e} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e4e6ed] px-4 py-2.5 text-sm">
                  <input type="checkbox" checked={evidence.includes(e)} onChange={() => setEvidence(cur => cur.includes(e) ? cur.filter(x => x !== e) : [...cur, e])} />
                  <span>{e}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="pd-form-title"><h3>Review Provider response</h3></div>
            {([
              ["Serviceability", CAPABILITY.find(c => c.v === capability)?.l],
              ["Capacity", `${capacityStatus} · ${locationCoverage}`],
              ["Schedule", schedule || "—"],
              ["Delivery", DELIVERY.find(d => d.v === delivery)?.l + (nomineeNames ? ` — ${nomineeNames}` : "")],
              ["Rate", RATE_APPROACH.find(r => r.v === rateApproach)?.l + (rateApproach === "OFFER_OWN" && proposedRate ? ` ($${proposedRate}/hr)` : "")],
              ["Services and coverage", [services, coverage].filter(Boolean).join(" · ") || "—"],
              ["Introduction", [who, suitability].filter(Boolean).join(" ") || "—"],
              ["Evidence shared", evidence.length ? evidence.join(", ") : "None"],
            ] as const).map(([k, v]) => (
              <div key={k} className="pd-review-row"><span>{k}</span><strong style={{ fontWeight: 600 }}>{v}</strong></div>
            ))}
            <p className="pd-notice mt-4">The poster will see this as an <strong>organisation response</strong> from your Provider business, even when a worker is nominated.</p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e4e6ed] px-4 py-3 text-sm">
              <input type="checkbox" className="mt-1" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
              <span>I have reviewed this request, my organisation can meet the stated requirements, and I agree to share our profile and permitted contact details.</span>
            </label>
            <p className="pd-note">
              {allowance?.applies
                ? `Submitting uses one Provider Action (${allowance.remaining} of ${allowance.limit} remaining). Responding to a direct invitation or enquiry does not use an action.`
                : "Submitting is included in your plan. Responding to a direct invitation or enquiry never uses an action."}
            </p>
          </div>
        )}
      </div>

      <div className="pd-modal-foot">
        <button type="button" className="pd-btn" onClick={step === 0 ? onClose : () => { setError(null); setStep(s => s - 1); }}>{step === 0 ? "Close" : "Back"}</button>
        <div className="pd-buttons">
          {capability !== "NO" && <button type="button" className="pd-btn" onClick={saveDraft}>Save draft</button>}
          {showSteps && <span className="pd-muted text-xs">{step + 1} of {STEPS.length}</span>}
          {capability === "NO" ? (
            <button type="button" className="pd-btn pd-btn-primary" onClick={declineAndSave} disabled={saving}>{saving ? "Saving…" : "Save similar opportunities"}</button>
          ) : step < lastStep ? (
            <button type="button" className="pd-btn pd-btn-primary" onClick={next}>Continue</button>
          ) : (
            <button type="button" className="pd-btn pd-btn-primary" onClick={submit} disabled={!confirmed || submitting}>{submitting ? "Submitting…" : "Respond as Provider"}</button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
