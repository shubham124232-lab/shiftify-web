"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Zap, Clock, CalendarDays, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { requirementLabels } from "@/lib/constants/job-filters";
import { ApplicationsFlow, type ApplicationsScreen } from "@/components/provider/ApplicationsFlow";
import type { JobSummary } from "@/lib/api/dashboard";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import { ProviderRespondModal } from "@/components/jobs/ProviderRespondModal";
import type { PostingTier } from "@/lib/types/posting";

interface JobDetail {
  id: string; title: string; description: string | null; category: string; urgency: string; status: string;
  suburb: string; state: string; scheduledStartAt: string; scheduledEndAt: string | null;
  fundingType?: string | null; budgetPerHour?: number | string | null; postedByRoleLabel?: string;
  postedBy?: { id: string; name: string };
  totalHours?: number | string | null; riskSafetyNotes?: string | null; addressLine?: string | null;
  workerPreferences?: Record<string, unknown> | null;
  selectedApplicant?: { id: string; name: string } | null;
  _count?: { applications: number; messages: number };
}

const STATUS: Record<string, string> = { OPEN: "Open", CONFIRMED: "Confirmed", COMPLETED: "Completed", CANCELLED: "Cancelled", DRAFT: "Draft", ASSIGNED: "Assigned", IN_PROGRESS: "In progress" };
const URGENCY: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  RAPID:       { label: "Rapid",       cls: "bg-red-50 text-red-700",       icon: <Zap className="h-3 w-3" /> },
  URGENT:      { label: "Urgent",      cls: "bg-amber-50 text-amber-700",   icon: <Clock className="h-3 w-3" /> },
  LAST_MINUTE: { label: "Last-Minute", cls: "bg-orange-50 text-orange-700", icon: <Clock className="h-3 w-3" /> },
  ROUTINE:     { label: "Routine",     cls: "bg-blue-50 text-blue-700",     icon: <CalendarDays className="h-3 w-3" /> },
};
const catLabel = (v: string) => JOB_CATEGORIES.find((c) => c.value === v)?.label ?? v;
const when = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-500">{k}</dt><dd className="m-0 text-right font-semibold text-slate-900">{v}</dd></div>;
}

// Popup for one request. `own` = a staffing request the Provider posted ("Staffing request"); otherwise another
// poster's opportunity ("Support opportunity", no private details, respond from the full page).
export function RequestDetailDialog({ jobId, own, onClose }: { jobId: string; own: boolean; onClose: () => void }) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [flow, setFlow] = useState<ApplicationsScreen | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [responding, setResponding] = useState(false);
  useEffect(() => {
    api.get<{ job: JobDetail }>(`/jobs/${jobId}`).then((r) => setJob(r.job)).catch((e) => setError(e instanceof Error ? e.message : "Could not load request"));
  }, [jobId, reload]);
  const u = job ? (URGENCY[job.urgency] ?? URGENCY.ROUTINE) : null;
  const confirmed = !!job && ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(job.status);
  const skills = job ? requirementLabels(job.workerPreferences) : [];

  if (editing && job) {
    return <ProviderStaffingWizard tier={job.urgency as PostingTier} editJobId={job.id} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setReload((n) => n + 1); }} />;
  }

  if (responding && job) {
    return <ProviderRespondModal job={{ id: job.id, title: job.title, suburb: job.suburb, state: job.state, scheduledStartAt: job.scheduledStartAt, scheduledEndAt: job.scheduledEndAt }}
      onClose={() => setResponding(false)} onSuccess={() => { setResponding(false); setReload((n) => n + 1); }} />;
  }

  if (flow && job) {
    const summary: JobSummary = {
      id: job.id, title: job.title, category: job.category, urgency: job.urgency, suburb: job.suburb, state: job.state,
      scheduledStartAt: job.scheduledStartAt, totalHours: job.totalHours != null ? Number(job.totalHours) : null, postedAt: job.scheduledStartAt, status: job.status,
    };
    return <ApplicationsFlow job={summary} start={flow} onClose={onClose} onViewDetails={() => setFlow(null)} />;
  }

  // Provider's own request: the demo's two-column "Staffing request" record.
  if (own && job) {
    return (
      <ModalShell title="Staffing request" subtitle={`Request · ${job.id.slice(0, 8)}`} onClose={onClose}>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {u && <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.icon}{u.label}</span>}
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${confirmed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{STATUS[job.status] ?? job.status}</span>
          </div>
          <h3 className="m-0 mt-3 text-2xl font-bold text-slate-900">{job.title}</h3>
          <p className="m-0 mt-1 text-sm text-slate-500">{job.suburb}{job.state ? `, ${job.state}` : ""}</p>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <section><h4 className="m-0 text-base font-bold text-slate-900">Support required</h4><p className="m-0 mt-1.5 text-sm text-slate-500">{job.description || catLabel(job.category)}</p></section>
              {skills.length > 0 && (
                <section className="border-t border-slate-100 pt-4"><h4 className="m-0 text-base font-bold text-slate-900">Essential worker requirements</h4>
                  <div className="mt-2 flex flex-wrap gap-2">{skills.map((k) => <span key={k} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{k}</span>)}</div></section>
              )}
              <section className="border-t border-slate-100 pt-4"><h4 className="m-0 text-base font-bold text-slate-900">Safety and handover</h4><p className="m-0 mt-1.5 text-sm text-slate-500">{job.riskSafetyNotes || "Review agreed routine and environmental notes."}</p></section>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>Exact address, care notes and escalation details remain private{confirmed ? " until confirmation, then shared with the confirmed worker" : ""}.</span>
              </div>
              {confirmed && job.selectedApplicant && (
                <p className="m-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Confirmed with {job.selectedApplicant.name}. Permitted private assignment information can now be shared.</p>
              )}
              {confirmed && job.addressLine && (
                <div className="rounded-xl bg-slate-50 p-4"><p className="m-0 text-base font-bold text-slate-900">Location</p><p className="m-0 mt-1 text-sm text-slate-600">{job.addressLine}</p></div>
              )}
            </div>
            <div className="space-y-4">
              <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-xs text-slate-500">Starts</dt><dd className="m-0 font-semibold text-slate-900">{when(job.scheduledStartAt)}</dd></div>
                <div><dt className="text-xs text-slate-500">Ends</dt><dd className="m-0 font-semibold text-slate-900">{when(job.scheduledEndAt)}</dd></div>
                <div><dt className="text-xs text-slate-500">Rate</dt><dd className="m-0 font-semibold text-slate-900">{job.budgetPerHour ? `$${Number(job.budgetPerHour).toFixed(2)} / hr` : "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Filled slots</dt><dd className="m-0 font-semibold text-slate-900">{confirmed ? 1 : 0} / 1</dd></div>
                <div><dt className="text-xs text-slate-500">Applications</dt><dd className="m-0 font-semibold text-slate-900">{job._count?.applications ?? 0}</dd></div>
                <div><dt className="text-xs text-slate-500">Owner</dt><dd className="m-0 font-semibold text-slate-900">{job.postedBy?.name ?? "—"}</dd></div>
              </dl>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setFlow("team")}>Check internal team</Button>
                <Button className="w-full" onClick={() => setFlow("applications")}>View applications</Button>
                <Link href="/messages" className="block"><Button variant="outline" className="w-full">Assignment conversation</Button></Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            <Button onClick={() => setFlow("manage")}>Manage request</Button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={own ? "Staffing request" : "Support opportunity"} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {error ? <p className="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : !job ? <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> : (
          <>
            <div className="flex flex-wrap gap-2">
              {u && <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.icon}{u.label}</span>}
              {job.postedByRoleLabel && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{job.postedByRoleLabel}</span>}
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{STATUS[job.status] ?? job.status}</span>
            </div>
            <h3 className="m-0 mt-3 text-2xl font-bold text-slate-900">{job.title}</h3>
            {job.description ? <p className="m-0 mt-3 text-sm text-slate-600">{job.description}</p> : null}
            <dl className="m-0 mt-4 divide-y divide-slate-100">
              <Row k="Support category" v={catLabel(job.category)} />
              <Row k="General location" v={`${job.suburb}${job.state ? `, ${job.state}` : ""}`} />
              {job.fundingType ? <Row k="Funding" v={job.fundingType.replace(/_/g, " ").toLowerCase()} /> : null}
              <Row k="Starts" v={when(job.scheduledStartAt)} />
              <Row k="Ends" v={when(job.scheduledEndAt)} />
              {job.budgetPerHour ? <Row k="Rate" v={`$${Number(job.budgetPerHour).toFixed(2)} / hr`} /> : null}
            </dl>
            <p className="m-0 mt-3 text-xs text-slate-500">Exact address, care notes and escalation details remain private.</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {own ? null : <Button onClick={() => setResponding(true)}>Respond as Provider</Button>}
      </div>
    </ModalShell>
  );
}

// "View nearby requests" (approved demo): sample suburb pins, radius circle and estimated journeys. No live traffic or precise addresses.
const NearbyMap = dynamic(() => import("@/components/provider/NearbyMap"), {
  ssr: false,
  loading: () => <div className="flex h-[340px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">Loading map…</div>,
});

const ORIGINS: Record<string, { lat: number; lng: number }> = {
  Parramatta: { lat: -33.815, lng: 151.001 },
  Liverpool: { lat: -33.92, lng: 150.923 },
  Greenacre: { lat: -33.9, lng: 151.057 },
  Sydney: { lat: -33.8688, lng: 151.2093 },
};
const SUBURBS: Record<string, { lat: number; lng: number }> = {
  ...ORIGINS,
  Blacktown: { lat: -33.771, lng: 150.906 }, Penrith: { lat: -33.751, lng: 150.694 }, Bankstown: { lat: -33.917, lng: 151.035 },
  Auburn: { lat: -33.849, lng: 151.033 }, Strathfield: { lat: -33.873, lng: 151.094 }, Campbelltown: { lat: -34.065, lng: 150.814 },
  Chatswood: { lat: -33.796, lng: 151.183 }, Manly: { lat: -33.797, lng: 151.288 }, Bondi: { lat: -33.891, lng: 151.274 },
  Epping: { lat: -33.772, lng: 151.082 }, Hornsby: { lat: -33.703, lng: 151.099 }, Ryde: { lat: -33.815, lng: 151.103 },
  Cabramatta: { lat: -33.895, lng: 150.936 }, Fairfield: { lat: -33.872, lng: 150.957 }, Merrylands: { lat: -33.837, lng: 150.992 },
  Homebush: { lat: -33.866, lng: 151.084 }, Newtown: { lat: -33.897, lng: 151.179 }, Randwick: { lat: -33.914, lng: 151.242 },
  Melbourne: { lat: -37.8136, lng: 144.9631 }, Brisbane: { lat: -27.4698, lng: 153.0251 }, Perth: { lat: -31.9505, lng: 115.8605 },
  Adelaide: { lat: -34.9285, lng: 138.6007 },
};
const STATE_CENTRE: Record<string, { lat: number; lng: number }> = {
  NSW: { lat: -33.87, lng: 151.0 }, VIC: { lat: -37.81, lng: 144.96 }, QLD: { lat: -27.47, lng: 153.03 },
  WA: { lat: -31.95, lng: 115.86 }, SA: { lat: -34.93, lng: 138.6 }, TAS: { lat: -42.88, lng: 147.33 }, ACT: { lat: -35.28, lng: 149.13 },
};
const PIN_COLOUR: Record<string, string> = { RAPID: "#dc2626", URGENT: "#d97706", LAST_MINUTE: "#ea580c", ROUTINE: "#2563eb" };
const SCENARIOS = [
  { value: "normal", label: "Normal demo", factor: 1 },
  { value: "slow", label: "Slow traffic demo", factor: 1.6 },
  { value: "none", label: "Unavailable demo", factor: 0 },
];

// Deterministic jitter so two requests in one suburb do not sit on the same pixel.
function suburbPoint(j: NearbyItem) {
  const base = SUBURBS[j.suburb] ?? STATE_CENTRE[j.state ?? "NSW"] ?? STATE_CENTRE.NSW;
  let h = 0;
  for (const ch of j.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { lat: base.lat + ((h % 100) - 50) / 6000, lng: base.lng + (((h >> 7) % 100) - 50) / 6000 };
}
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(x));
}
const dur = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)} hr ${Math.round(mins % 60)} min` : `${Math.max(0, Math.round(mins))} min`);

type NearbyItem = Pick<JobSummary, "id" | "title" | "urgency" | "suburb" | "scheduledStartAt" | "status"> & { state: string | null };

// mode "staffing": the Provider's own requests (Check internal team). mode "opportunity": other posters' requests (Respond as Provider,
// preceded by the "Confirm travel assumptions" step).
export function NearbyRequestsDialog({ requests, onClose, onOpen, mode = "staffing", onRespond }: { requests: NearbyItem[]; onClose: () => void; onOpen: (id: string) => void; mode?: "staffing" | "opportunity"; onRespond?: (id: string) => void }) {
  const [origin, setOrigin] = useState("Parramatta");
  const [radius, setRadius] = useState(20);
  const [prep, setPrep] = useState(30);
  const [buffer, setBuffer] = useState(10);
  const [scenario, setScenario] = useState("normal");
  const [selected, setSelected] = useState<string | null>(null);
  const [stamp, setStamp] = useState(() => new Date());
  const [locating, setLocating] = useState<{ lat: number; lng: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirmTravel, setConfirmTravel] = useState<{ id: string; title: string; travel: number | null; ok: boolean } | null>(null);
  const [travelAck, setTravelAck] = useState(false);

  const pickOrigin = (v: string) => {
    setNote(null);
    if (v === "__current") {
      if (!navigator.geolocation) { setNote("Current location is not available in this browser."); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocating({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setOrigin(v); },
        () => setNote("Current location was not shared. Pick a branch starting point instead."),
      );
      return;
    }
    setOrigin(v);
  };
  const point = origin === "__current" && locating ? locating : ORIGINS[origin] ?? ORIGINS.Parramatta;
  const factor = SCENARIOS.find((s) => s.value === scenario)?.factor ?? 1;

  const rows = requests
    .filter((j) => j.status === "OPEN" || j.status === "CONFIRMED")
    .map((j) => {
      const pt = suburbPoint(j);
      const dist = km(point, pt);
      const travel = factor > 0 ? Math.round((dist / 38) * 60 * factor) : null; // sample 38 km/h average
      const startsIn = (new Date(j.scheduledStartAt).getTime() - stamp.getTime()) / 60000;
      const margin = travel == null ? null : Math.round(startsIn - prep - buffer - travel);
      return { j, pt, dist, travel, startsIn, margin };
    })
    .filter((r) => r.dist <= radius)
    .sort((a, b) => a.dist - b.dist);

  const field = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";

  return (
    <ModalShell wide title={mode === "opportunity" ? "Nearby support requests" : "Nearby staffing requests"} subtitle="Sample suburb locations only. No precise Participant address is shown." onClose={onClose}>
      {confirmTravel ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <h3 className="m-0 text-lg font-bold text-slate-900">Confirm travel assumptions</h3>
          <p className="m-0 text-sm font-semibold text-slate-900">{confirmTravel.title}</p>
          <p className="m-0 text-sm text-slate-600">{confirmTravel.travel == null ? "Travel estimate unavailable." : `Sample travel ${confirmTravel.travel} minutes · ${confirmTravel.ok ? "Within estimated time" : "May not arrive in time"}.`}</p>
          <p className="m-0 text-sm text-slate-600">Confirm the actual worker’s origin, readiness, credentials and current travel estimate. A Provider response does not assign a worker or guarantee arrival.</p>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={travelAck} onChange={(e) => setTravelAck(e.target.checked)} />I will confirm travel feasibility and clearly disclose any alternative start time.</label>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => { setConfirmTravel(null); setTravelAck(false); }}>Back to map</Button>
            <Button disabled={!travelAck} onClick={() => onRespond?.(confirmTravel.id)}>Continue to Provider response</Button>
          </div>
        </div>
      ) : (<>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <p className="m-0 rounded-lg border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">
          Interactive demo map · sample public suburb pins and estimated journeys. Google traffic is not connected. Exact Participant locations remain private.
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label className="text-xs font-semibold text-slate-600">Starting location
            <select className={field} value={origin} onChange={(e) => pickOrigin(e.target.value)}>
              {Object.keys(ORIGINS).filter((k) => k !== "Sydney").map((k) => <option key={k} value={k}>{k}</option>)}
              <option value="Sydney">Other starting point (Sydney CBD)</option>
              <option value="__current">Current location</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Search radius
            <select className={field} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              {[5, 10, 20, 30, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Preparation (min)
            <input className={field} type="number" min={0} max={240} value={prep} onChange={(e) => setPrep(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Arrival buffer (min)
            <input className={field} type="number" min={0} max={120} value={buffer} onChange={(e) => setBuffer(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Travel scenario
            <select className={field} value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {SCENARIOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
        {note && <p className="m-0 text-xs text-amber-700">{note}</p>}

        <p className="m-0 text-sm text-slate-600">
          <strong className="text-slate-900">{rows.length} matching sample shift{rows.length === 1 ? "" : "s"} within {radius} km</strong> · Radius is straight-line distance, not driving distance. Refreshed {stamp.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
        <NearbyMap
          origin={point}
          radiusKm={radius}
          pins={rows.map((r) => ({ id: r.j.id, lat: r.pt.lat, lng: r.pt.lng, color: PIN_COLOUR[r.j.urgency] ?? "#2563eb", title: r.j.title, suburb: r.j.suburb, selected: selected === r.j.id, onSelect: () => setSelected(r.j.id) }))}
        />

        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
          {Object.entries(URGENCY).map(([k, u]) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIN_COLOUR[k] }} />{u.label}</span>
          ))}
        </div>
        <p className="m-0 text-xs text-slate-500">A Branch origin helps discovery. Check the actual worker starting point before committing. Estimates do not guarantee arrival or eligibility.</p>
        </div>

        <div className="min-w-0">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <p className="m-0 text-sm font-semibold text-slate-900">No requests inside this radius</p>
            <p className="m-0 mt-1 text-sm text-slate-500">Increase the radius or change the starting point.</p>
          </div>
        ) : (
          <ul className="m-0 list-none space-y-3 p-0">
            {rows.map(({ j, dist, travel, startsIn, margin }) => {
              const u = URGENCY[j.urgency] ?? URGENCY.ROUTINE;
              const ok = margin != null && margin >= 0;
              return (
                <li key={j.id} className={`rounded-xl border p-4 ${selected === j.id ? "border-pink-400 bg-pink-50/40" : "border-slate-200"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.icon}{u.label}</span>
                    {margin == null
                      ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Travel estimate unavailable</span>
                      : <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{ok ? "Within estimated time" : "May not arrive in time"}</span>}
                  </div>
                  <p className="m-0 mt-2 text-base font-semibold text-slate-900">{j.title}</p>
                  <p className="m-0 text-sm text-slate-500">{j.suburb}{j.state ? `, ${j.state}` : ""} · {startsIn > 0 ? `Starts in ${dur(startsIn)}` : "Already started"}</p>
                  <dl className="m-0 mt-2 grid grid-cols-3 gap-3 text-sm">
                    <div><dt className="text-xs text-slate-500">Radius distance</dt><dd className="m-0 font-semibold text-slate-900">{dist.toFixed(1)} km</dd></div>
                    <div><dt className="text-xs text-slate-500">Sample travel</dt><dd className="m-0 font-semibold text-slate-900">{travel == null ? "—" : `${travel} min`}</dd></div>
                    <div><dt className="text-xs text-slate-500">Arrival margin</dt><dd className="m-0 font-semibold text-slate-900">{margin == null ? "—" : `${margin} min`}</dd></div>
                  </dl>
                  <p className="m-0 mt-2 text-xs text-slate-500">Preparation {prep} min + buffer {buffer} min. Approximate suburb destination.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelected(j.id)}>Select pin</Button>
                    <Button variant="outline" size="sm" onClick={() => onOpen(j.id)}>{mode === "opportunity" ? "View request" : "View shift"}</Button>
                    <a href={`https://www.google.com/maps/dir/?api=1&origin=${point.lat},${point.lng}&destination=${encodeURIComponent(`${j.suburb} ${j.state}`)}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" type="button">Google Maps directions</Button>
                    </a>
                    {mode === "opportunity"
                      ? onRespond && <Button size="sm" onClick={() => { setTravelAck(false); setConfirmTravel({ id: j.id, title: j.title, travel, ok }); }}>Respond as Provider</Button>
                      : <Link href="/provider/workforce"><Button variant="outline" size="sm" type="button">Check internal team</Button></Link>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Return to list</Button>
        <Button variant="outline" onClick={() => setStamp(new Date())}>Refresh estimates</Button>
      </div>
      </>)}
    </ModalShell>
  );
}
