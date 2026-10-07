"use client";

// SW doc Windows 38-40 — check out / mark complete as a short three-step record:
// actual time and services → factual note and incident flag → summary, then Submit.

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  job: { id: string; title: string; scheduledStartAt: string; scheduledEndAt: string | null; totalHours: number | null; budgetPerHour?: number | string | null; fundingType?: string | null; postedBy: { name: string }; postedByRoleLabel?: string };
  categoryLabel: string;
  onClose: () => void;
  onDone: () => void;
}

// <input type="datetime-local"> needs local "YYYY-MM-DDTHH:mm".
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";

export function CompletionRecordModal({ job, categoryLabel, onClose, onDone }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [start, setStart] = useState(toLocalInput(job.scheduledStartAt));
  const [end, setEnd] = useState(toLocalInput(job.scheduledEndAt) || toLocalInput(new Date().toISOString()));
  const [breakMin, setBreakMin] = useState("0");
  const [services, setServices] = useState(categoryLabel);
  const [extras, setExtras] = useState("");
  const [activities, setActivities] = useState("");
  const [outcome, setOutcome] = useState("");
  const [handover, setHandover] = useState("");
  const [incident, setIncident] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const startMs = start ? new Date(start).getTime() : NaN;
  const endMs = end ? new Date(end).getTime() : NaN;
  const hours = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
    ? Math.max(0, (endMs - startMs) / 3_600_000 - Number(breakMin || 0) / 60)
    : null;
  const rate = job.budgetPerHour != null ? Number(job.budgetPerHour) : null;
  const timeOk = hours != null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/jobs/${job.id}/complete`, {
        actualStart: new Date(start).toISOString(),
        actualEnd: new Date(end).toISOString(),
        breakMinutes: Number(breakMin || 0),
        servicesDelivered: services.trim() || undefined,
        extras: extras.trim() || undefined,
        activities: activities.trim() || undefined,
        outcome: outcome.trim() || undefined,
        handover: handover.trim() || undefined,
        incident: incident === true,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Could not submit the completion record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && !submitted && onClose()}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {submitted ? (
          <div className="px-6 py-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 m-0">Completion record submitted</h2>
            <p className="text-sm text-slate-600 m-0">{job.postedBy.name} has been notified and can review and confirm it. Support payment is arranged directly with the payer — Shiftify takes 0% commission and does not deduct anything from your agreed amount.</p>
            {incident && (
              <p className="text-sm text-amber-700 m-0">You marked that an incident or safety concern occurred. Please open the incident pathway below to record it.</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              {incident && <Link href={`/jobs/${job.id}#job-report`}><Button variant="outline" onClick={onDone}>Open incident pathway</Button></Link>}
              <Link href="/earnings"><Button variant="outline">Earnings and payment status</Button></Link>
              <Button onClick={onDone}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-900 m-0">
                  {step === 1 ? "Check out" : step === 2 ? "Support note" : "Review completion record"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 mb-0">Step {step} of 3 · {job.title}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

              {step === 1 && (
                <>
                  <p className="text-xs text-slate-500 m-0">Record the support you actually delivered.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={lbl}>Actual start</label><input type="datetime-local" className={inp} value={start} onChange={e => setStart(e.target.value)} /></div>
                    <div><label className={lbl}>Actual finish</label><input type="datetime-local" className={inp} value={end} onChange={e => setEnd(e.target.value)} /></div>
                    <div><label className={lbl}>Break (minutes)</label><input type="number" min={0} className={inp} value={breakMin} onChange={e => setBreakMin(e.target.value)} /></div>
                  </div>
                  {!timeOk && <p className="text-xs text-red-600 m-0">Finish must be after start.</p>}
                  <div><label className={lbl}>Agreed services delivered</label><input className={inp} value={services} onChange={e => setServices(e.target.value)} maxLength={500} /></div>
                  <div><label className={lbl}>Travel or other agreed extras only (optional)</label><input className={inp} value={extras} onChange={e => setExtras(e.target.value)} maxLength={500} placeholder="e.g. 12 km travel as agreed" /></div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-xs text-slate-500 m-0">Keep it concise and factual. Do not include more sensitive detail than is needed.</p>
                  <div><label className={lbl}>Activities completed</label><textarea rows={3} maxLength={2000} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" value={activities} onChange={e => setActivities(e.target.value)} /></div>
                  <div><label className={lbl}>Relevant outcome</label><textarea rows={2} maxLength={1000} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" value={outcome} onChange={e => setOutcome(e.target.value)} /></div>
                  <div><label className={lbl}>Handover information</label><textarea rows={2} maxLength={1000} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" value={handover} onChange={e => setHandover(e.target.value)} /></div>
                  <div>
                    <label className={lbl}>Did an incident or safety concern occur?</label>
                    <div className="flex gap-2">
                      {([[true, "Yes"], [false, "No"]] as const).map(([v, l]) => (
                        <button key={l} type="button" onClick={() => setIncident(v)}
                          className={`h-9 px-5 rounded-lg border text-sm font-semibold ${incident === v ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>{l}</button>
                      ))}
                    </div>
                    {incident === true && <p className="text-xs text-amber-700 mt-1.5 mb-0">After you submit, open the separate incident pathway to record what happened.</p>}
                  </div>
                </>
              )}

              {step === 3 && (
                <dl className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date</dt><dd className="m-0">{start ? new Date(start).toLocaleDateString("en-AU", { dateStyle: "medium" }) : "—"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Actual hours</dt><dd className="m-0">{hours != null ? `${(Math.round(hours * 100) / 100)} h (break ${breakMin || 0} min)` : "—"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Service</dt><dd className="m-0">{services || "—"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Agreed rate</dt><dd className="m-0">{rate != null ? `$${rate}/hr${hours != null ? ` · about $${(Math.round(hours * rate * 100) / 100).toFixed(2)}` : ""}` : job.fundingType ? "Applicable NDIS rate" : "As agreed directly"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Travel or extras</dt><dd className="m-0">{extras || "None"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Note</dt><dd className="m-0">{activities || outcome || handover ? "Included" : "Not added"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Incident</dt><dd className="m-0">{incident ? "Yes — record in incident pathway" : "No"}</dd></div>
                  <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Goes to</dt><dd className="m-0">{job.postedBy.name}{job.postedByRoleLabel ? ` · ${job.postedByRoleLabel}` : ""}</dd></div>
                </dl>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between shrink-0">
              {step === 1 ? <Button variant="ghost" onClick={onClose}>Cancel</Button> : <Button variant="ghost" onClick={() => setStep(s => (s === 3 ? 2 : 1))}>{step === 3 ? "Edit" : "Back"}</Button>}
              {step === 1 && <Button disabled={!timeOk} onClick={() => setStep(2)}>Continue</Button>}
              {step === 2 && <Button disabled={incident === null} onClick={() => setStep(3)}>Continue</Button>}
              {step === 3 && <Button loading={submitting} onClick={submit}>Submit completion record</Button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
