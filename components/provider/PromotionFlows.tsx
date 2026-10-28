"use client";

// Provider promotions (doc P78–P80): Featured Shift picker/checkout and the 3-step Platinum Tile Sponsorship wizard.
// Purchases are recorded in test mode (no card is taken).

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";

export interface EligibleShift { id: string; title: string; urgency: string; suburb: string; scheduledStartAt: string; featuredUntil: string | null }

export const FEATURED_PRICE = [
  { urgency: "RAPID", label: "Rapid", window: "up to 60 min", max: "60 minutes or until filled", mins: 60, price: 19.99 },
  { urgency: "URGENT", label: "Urgent", window: "up to 24 hr", max: "24 hours or until filled", mins: 1440, price: 14.99 },
  { urgency: "LAST_MINUTE", label: "Last-Minute", window: "48 hr", max: "48 hours or until filled", mins: 2880, price: 9.99 },
  { urgency: "ROUTINE", label: "Routine", window: "7 days", max: "7 days or until filled", mins: 10080, price: 21.99 },
];
export const PLATINUM_PRICE: Record<string, Record<number, number>> = {
  METRO: { 1: 499.99, 3: 1124.99, 6: 2099.99, 12: 3899.99 },
  STATE: { 1: 999.99, 3: 2249.99, 6: 4199.99, 12: 7799.99 },
  NATIONAL: { 1: 1499.99, 3: 3374.99, 6: 6299.99, 12: 11699.99 },
};
const COVERAGE_LABEL: Record<string, string> = { METRO: "Metro", STATE: "State", NATIONAL: "National" };
const money = (v: number) => `$${v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inp = "mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";
const lab = "text-sm font-semibold text-slate-900";

// ── Featured Shift ───────────────────────────────────────────────────────────────────────────────
export function FeaturedShiftFlow({ shifts, initialId, onClose, onDone }: { shifts: EligibleShift[]; initialId?: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [picked, setPicked] = useState<EligibleShift | null>(() => shifts.find((s) => s.id === initialId) ?? null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tier = picked ? FEATURED_PRICE.find((p) => p.urgency === picked.urgency) : undefined;
  const already = !!picked?.featuredUntil && new Date(picked.featuredUntil) > new Date();

  async function pay() {
    if (!picked) return;
    setBusy(true); setErr(null);
    try { await api.post(`/jobs/${picked.id}/featured-shift`, {}); onDone(`"${picked.title}" is now a Featured Shift.`); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not purchase the Featured Shift."); setBusy(false); }
  }

  if (!picked) return (
    <ModalShell title="Choose an active shift" onClose={onClose}>
      <div className="space-y-3 overflow-y-auto px-6 py-5">
        <p className="m-0 text-sm text-slate-500">Select the staffing request for this action.</p>
        {shifts.length === 0 && <p className="m-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">No active external staffing requests. Publish a request first, then feature it.</p>}
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-4">
            <div><p className="m-0 font-semibold text-slate-900">{s.title}</p>
              <p className="m-0 mt-0.5 text-sm text-slate-500">{s.suburb} · {FEATURED_PRICE.find((p) => p.urgency === s.urgency)?.label ?? s.urgency}</p></div>
            <Button size="sm" onClick={() => setPicked(s)}>Select</Button>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </ModalShell>
  );

  return (
    <ModalShell title="Review Featured Shift" onClose={onClose}>
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-5 py-4">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total AUD</p>
          <p className="m-0 mt-1 text-3xl font-bold text-slate-900">{tier ? money(tier.price) : "—"}</p>
        </div>
        <dl className="m-0 divide-y divide-slate-100 text-sm">
          {[["Shift", picked.title], ["Category", tier?.label ?? picked.urgency], ["Location", picked.suburb], ["Maximum featured duration", tier?.max ?? "—"], ["Latest promotional end", tier ? new Date(Date.now() + tier.mins * 60000).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"]].map(([k, v]) => (
            <div key={k} className="flex gap-6 py-2.5"><dt className="w-48 shrink-0 text-slate-500">{k}</dt><dd className="m-0 text-slate-900">{v}</dd></div>
          ))}
        </dl>
        <p className="m-0 text-sm text-slate-500">Genuine urgency stays unchanged. Featuring stops when the request is closed or filled. Platform products do not guarantee applicants or a confirmed worker.</p>
        {already && <p className="m-0 text-sm text-amber-700">This shift is already featured.</p>}
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I authorise this simulated purchase and acknowledge the displayed price and duration.
        </label>
        {err && <p className="m-0 text-sm text-red-600">{err}</p>}
      </div>
      <div className="flex justify-between border-t border-slate-100 px-6 py-4">
        <Button variant="outline" onClick={() => setPicked(null)}>Back</Button>
        <Button disabled={!agree || !tier || already || busy} onClick={pay}>{busy ? "Completing…" : "Complete demo purchase"}</Button>
      </div>
    </ModalShell>
  );
}

// ── Platinum Tile Sponsorship ────────────────────────────────────────────────────────────────────
interface Draft {
  coverage: string; centre: string; state: string; category: string; months: number;
  name: string; description: string; start: string; confirmed: boolean;
}
const DRAFT_KEY = "shiftify.platinumDraft";
const today = () => new Date().toISOString().slice(0, 10);

export function PlatinumSponsorshipFlow({ businessName, onClose, onDone }: { businessName: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>({ coverage: "METRO", centre: "", state: "", category: "PERSONAL_CARE", months: 1, name: businessName, description: "", start: today(), confirmed: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) setD((x) => ({ ...x, ...JSON.parse(raw), confirmed: false })); } catch { /* no draft */ }
  }, []);
  const up = (p: Partial<Draft>) => { setD((x) => ({ ...x, ...p })); setSaved(false); };

  const price = PLATINUM_PRICE[d.coverage][d.months];
  const categoryLabel = JOB_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category;
  const centreText = d.coverage === "METRO" ? d.centre : d.coverage === "STATE" ? d.state : "National";
  const stepOk = useMemo(() => {
    if (step === 0) return d.coverage === "NATIONAL" || (d.coverage === "METRO" ? !!d.centre.trim() : !!d.state);
    if (step === 1) return !!d.name.trim() && !!d.description.trim() && !!d.start;
    return d.confirmed;
  }, [step, d]);

  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); setSaved(true); } catch { setErr("Could not save the draft in this browser."); }
  }
  async function buy() {
    setBusy(true); setErr(null);
    try {
      await api.post("/provider/listings/platinum-tile", {
        coverage: d.coverage, durationMonths: d.months,
        centreSuburb: d.coverage === "METRO" ? d.centre : undefined,
        marketState: d.coverage === "STATE" ? d.state : undefined,
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      onDone("Platinum Tile campaign purchased.");
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not purchase the campaign."); setBusy(false); }
  }

  const titles = ["Coverage and placement", "Creative and dates", "Review campaign"];
  const row = (k: string, v: string) => <div key={k} className="flex gap-6 border-b border-slate-100 py-2.5 text-sm"><dt className="w-52 shrink-0 text-slate-500">{k}</dt><dd className="m-0 text-slate-900">{v}</dd></div>;

  return (
    <ModalShell title="Platinum Tile Sponsorship" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 pt-3">
        {titles.map((t, i) => (
          <p key={t} className={cn("m-0 border-b-2 pb-2 text-xs", i < step ? "border-brand-300 text-slate-500" : i === step ? "border-brand-600 font-semibold text-brand-700" : "border-slate-100 text-slate-400")}>{i + 1}. {t.split(" ").slice(0, 2).join(" ")}</p>
        ))}
      </div>
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <div><h3 className="m-0 text-xl font-bold text-slate-900">{titles[step]}</h3>
          <p className="m-0 mt-1 text-sm text-slate-500">{step === 0 ? "Active paid subscription and verified Provider profile required." : step === 1 ? "Three labelled sponsored positions per defined market inventory." : "Prices use the approved multi-month discount; no further annual discount."}</p></div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lab}>Campaign coverage *</label>
              <select className={inp} value={d.coverage} onChange={(e) => up({ coverage: e.target.value })}>
                <option value="METRO">Metro</option><option value="STATE">State</option><option value="NATIONAL">National</option></select></div>
            <div><label className={lab}>Campaign centre / state *</label>
              {d.coverage === "METRO" && <input className={inp} value={d.centre} onChange={(e) => up({ centre: e.target.value })} placeholder="e.g. Parramatta NSW" />}
              {d.coverage === "STATE" && <select className={inp} value={d.state} onChange={(e) => up({ state: e.target.value })}><option value="">Select…</option>{["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => <option key={s}>{s}</option>)}</select>}
              {d.coverage === "NATIONAL" && <input className={cn(inp, "bg-slate-50")} value="All supported markets" disabled />}
              {d.coverage === "METRO" && <p className="m-0 mt-1 text-xs text-slate-500">Metro is one 30 km radius around a nominated centre.</p>}</div>
            <div><label className={lab}>Relevant service category *</label>
              <select className={inp} value={d.category} onChange={(e) => up({ category: e.target.value })}>{JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            <div><label className={lab}>Campaign duration *</label>
              <select className={inp} value={d.months} onChange={(e) => up({ months: Number(e.target.value) })}>{[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m}{m > 1 ? ` months` : ` month`}</option>)}</select></div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lab}>Business display name *</label><input className={inp} value={d.name} onChange={(e) => up({ name: e.target.value })} /></div>
            <div><label className={lab}>Brief service description *</label><input className={inp} value={d.description} onChange={(e) => up({ description: e.target.value })} placeholder="e.g. In-home and community support" /></div>
            <div className="sm:col-span-2"><label className={lab}>Business logo</label><input type="file" accept="image/*" className={cn(inp, "py-2.5")} /></div>
            <div><label className={lab}>Preferred start date *</label><input type="date" min={today()} className={inp} value={d.start} onChange={(e) => up({ start: e.target.value })} /></div>
            <div><label className={lab}>Inventory</label><p className="m-0 mt-2 text-sm text-slate-600">Availability is checked when you pay. A sold-out market will not be sold.</p></div>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm font-semibold text-brand-700">{money(price)} · {d.months} month{d.months > 1 ? "s" : ""}</div>
            <p className="m-0 font-semibold text-slate-900">Coverage and placement</p>
            <dl className="m-0">{row("Campaign coverage", COVERAGE_LABEL[d.coverage])}{row("Campaign centre / state", centreText)}{row("Relevant service category", categoryLabel)}{row("Campaign duration", `${d.months} month${d.months > 1 ? "s" : ""}`)}</dl>
            <p className="m-0 font-semibold text-slate-900">Creative and dates</p>
            <dl className="m-0">{row("Business display name", d.name)}{row("Brief service description", d.description)}{row("Preferred start date", d.start)}{row("Campaign runs", `${new Date().toLocaleDateString("en-AU")} to ${(() => { const e = new Date(); e.setMonth(e.getMonth() + d.months); return e.toLocaleDateString("en-AU"); })()} (starts when payment completes)`)}{row("Public profile destination", `${d.name || "Your organisation"} public profile`)}</dl>
            <p className="m-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Public preview excludes exact addresses, private care notes, escalation contacts and internal Provider notes. Your tile is labelled Sponsored and does not imply recommendation or compliance.</p>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-1" checked={d.confirmed} onChange={(e) => up({ confirmed: e.target.checked })} />
              I confirm these details are accurate, I have appropriate authority and consent, and I will update capacity or shift status when it changes.
            </label>
          </>
        )}
        {err && <p className="m-0 text-sm text-red-600">{err}</p>}
        {saved && <p className="m-0 text-sm text-emerald-700">Draft saved on this browser.</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft}>Save draft</Button>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{step + 1} of 3</span>
          {step < 2
            ? <Button disabled={!stepOk} onClick={() => setStep(step + 1)}>Continue</Button>
            : <Button disabled={!stepOk || busy} onClick={buy}>{busy ? "Completing…" : "Complete demo purchase"}</Button>}
        </div>
      </div>
    </ModalShell>
  );
}
