"use client";

// Provider "Shift Blast — SMS" (approved demo, Billing & Extras). No SMS backend or package exists yet,
// so this is an interactive preview over the Provider's real live requests: nothing is sent or charged.

import { useEffect, useMemo, useState } from "react";
import { Clock, ShieldCheck, MessageCircle, Check, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { ModalShell } from "@/components/jobs/post/shared";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { TierBadge, laneSlug, tierLabel } from "@/components/provider/timing";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";

interface Job { id: string; title: string; status: string; urgency: string; suburb: string; category: string; scheduledStartAt: string }
interface Blast { at: string; title: string; radius: number; audience: string }

const RADII = [5, 10, 20, 30];
const AUDIENCES = ["Support Workers who opted in to SMS", "Saved workers only"] as const;
const STEPS = ["Choose request", "Select recipients", "Preview SMS", "Review & send"];

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();
const service = (v: string) => JOB_CATEGORIES.find((c) => c.value === v)?.label ?? v;

function startsIn(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (mins < 60) return `Starts in ${Math.max(mins, 0)} min`;
  if (mins < 48 * 60) return `Starts in ${Math.floor(mins / 60)} hr ${mins % 60} min`;
  return `${fmtDay(iso)} · ${fmtTime(iso)}`;
}

export default function ProviderShiftBlastPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [chosen, setChosen] = useState<Job | null>(null);
  const [step, setStep] = useState(1);
  const [radius, setRadius] = useState(30);
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>(AUDIENCES[0]);
  const [history, setHistory] = useState<Blast[]>([]);

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then((r) => setJobs((r.jobs ?? []).filter((j) => j.status === "OPEN" && new Date(j.scheduledStartAt) > new Date())
        .sort((a, b) => +new Date(a.scheduledStartAt) - +new Date(b.scheduledStartAt))))
      .catch(() => setJobs([]));
  }, []);

  const message = useMemo(() => chosen
    ? `Shiftify: ${tierLabel(chosen.urgency)} ${service(chosen.category)} shift near ${chosen.suburb}, ${fmtDay(chosen.scheduledStartAt)} ${fmtTime(chosen.scheduledStartAt)}. View and respond in the Shiftify app. Reply STOP to opt out.`
    : "", [chosen]);

  function open(j: Job) { setChosen(j); setStep(2); }
  function close() { setChosen(null); setStep(1); }
  function record() {
    if (!chosen) return;
    setHistory((h) => [{ at: new Date().toISOString(), title: chosen.title, radius, audience }, ...h]);
    close();
  }

  return (
    <div className="pd-workspace">
      <div className="pd-content">
      <div className="pd-breadcrumb">Provider / Shift blast</div>
      <div className="pd-page-head">
        <ProviderAreaTabs />
        <div>
          <h1>Shift Blast — SMS</h1>
          <p>Reach suitable Support Workers directly, alongside ordinary matching.</p>
        </div>
        <div className="pd-buttons">
          <a href="#sms-activity" className="pd-btn"><Clock />View SMS activity</a>
        </div>
      </div>

      <section className="pd-blast-hero">
        <div>
          <div className="pd-eyebrow">Speed tools</div>
          <h2>Get your shift in front of available workers.</h2>
          <p>Choose a live staffing request, select eligible SMS recipients and review the message before sending.</p>
          <div className="pd-tags">
            <span className="pd-badge pd-badge-pink">Subscribed Providers</span>
            <span className="pd-badge">All four timing categories</span>
            <span className="pd-badge">Separate optional purchase</span>
          </div>
        </div>
        <aside>
          <small>SMS packages &amp; rates</small>
          <strong>To be decided</strong>
          <small>No price or allowance has been assumed.</small>
        </aside>
      </section>

      <p className="pd-info-banner">This is an interactive SMS preview. No messages are sent, no contacts are exposed and no payment is taken.</p>

      <ol className="pd-blast-steps">
        {STEPS.map((s, i) => <li key={s} className={cn(chosen && i < step && "done")}><span>{i + 1}</span>{s}</li>)}
      </ol>

      <section className="pd-panel">
        <div className="pd-panel-head"><h2>Choose a live staffing request</h2></div>
        <div className="pd-board-body">
          {jobs === null ? (
            <p className="pd-quiet-empty m-0">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="pd-quiet-empty m-0">You have no live staffing requests. Post a shift first, then come back to prepare a blast.</p>
          ) : jobs.map((j) => (
            <article key={j.id} className="pd-request-row" data-urgency={laneSlug(j.urgency)}>
              <div>
                <div className="pd-row-title"><TierBadge urgency={j.urgency} /><strong>{j.title}</strong></div>
                <div className="pd-row-meta"><span>{j.suburb} · {fmtDay(j.scheduledStartAt)} · {fmtTime(j.scheduledStartAt)} · {startsIn(j.scheduledStartAt)}</span></div>
                <p className="pd-blast-row-note">{service(j.category)} · recipients are chosen on the next step</p>
              </div>
              <div className="pd-row-end">
                <button type="button" className="pd-btn pd-btn-md pd-btn-primary" onClick={() => open(j)}>Prepare blast</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pd-panel">
        <div className="pd-panel-head"><h2>How this works</h2></div>
        <div className="pd-blast-how">
          <div><ShieldCheck /><strong>Relevant recipients</strong><p>Current evidence, service fit, availability, area and SMS permission determine the audience.</p></div>
          <div><MessageCircle /><strong>Privacy-safe message</strong><p>Recipients see timing, service, general area and a request reference. Private support details stay out of SMS.</p></div>
          <div><Check /><strong>Connection comes next</strong><p>Workers review the request and respond. An SMS or connection does not confirm the shift.</p></div>
        </div>
      </section>

      <section className="pd-panel" id="sms-activity">
        <div className="pd-panel-head"><h2>SMS activity</h2></div>
        {history.length === 0 ? (
          <div className="pd-empty"><LayoutGrid /><h3>No Shift Blasts yet</h3><p>Prepare a request to explore recipient selection and SMS preview.</p></div>
        ) : history.map((b) => (
          <div key={b.at} className="pd-task-row">
            <div><strong>{b.title}</strong><p>Preview only · {b.audience} · within {b.radius} km · {fmtDay(b.at)} {fmtTime(b.at)}</p></div>
            <span className="pd-badge">Not sent</span>
          </div>
        ))}
      </section>

      {chosen && (
        <ModalShell title="Prepare Shift Blast" subtitle={chosen.title} onClose={close}>
          <ol className="pd-steps">
            {STEPS.slice(1).map((s, i) => <li key={s} className={cn("pd-step", step === i + 2 && "active", step > i + 2 && "done")}>{i + 1}. {s}</li>)}
          </ol>
          <div className="pd-modal-body">
            {step === 2 && (
              <div className="space-y-5">
                <div className="pd-form-title"><h3>Select recipients</h3></div>
                <label className="block">Who should receive it?
                  <select value={audience} onChange={(e) => setAudience(e.target.value as (typeof AUDIENCES)[number])}>
                    {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </label>
                <label className="block">Distance from the request
                  <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                    {RADII.map((r) => <option key={r} value={r}>Within {r} km</option>)}
                  </select>
                </label>
                <p className="pd-notice">Only workers with current evidence, the {service(chosen.category)} service, confirmed availability and SMS permission are included. Your internal team uses the included availability tools instead.</p>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="pd-form-title"><h3>Preview SMS</h3></div>
                <div className="pd-bubble">{message}</div>
                <p className="pd-notice">The message never includes the participant&apos;s name, exact address or care notes.</p>
              </div>
            )}
            {step === 4 && (
              <div>
                <div className="pd-form-title"><h3>Review &amp; send</h3></div>
                <div className="pd-review-row"><span>Request</span><strong>{chosen.title}</strong></div>
                <div className="pd-review-row"><span>Timing</span><span>{tierLabel(chosen.urgency)} · {startsIn(chosen.scheduledStartAt)}</span></div>
                <div className="pd-review-row"><span>Recipients</span><span>{audience} · within {radius} km</span></div>
                <div className="pd-review-row"><span>Price</span><span>To be decided — no charge in this preview</span></div>
              </div>
            )}
          </div>
          <div className="pd-modal-foot">
            <button type="button" className="pd-btn" onClick={() => (step === 2 ? close() : setStep(step - 1))}>{step === 2 ? "Cancel" : "Back"}</button>
            <div className="pd-buttons">
              <span className="text-xs text-[#69707e]">{step - 1} of 3</span>
              {step < 4
                ? <button type="button" className="pd-btn pd-btn-primary" onClick={() => setStep(step + 1)}>Continue</button>
                : <button type="button" className="pd-btn pd-btn-primary" onClick={record}>Record preview</button>}
            </div>
          </div>
        </ModalShell>
      )}
      </div>
    </div>
  );
}
