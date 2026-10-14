"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Heart, RefreshCw, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

// Provider "Find External Workers" and "Saved Workers" (approved demo): worker cards, View profile popup, Save, and Direct Connect
// (choose an active shift, review the conditional $9.99 charge, send the invitation).
export type WorkerBoardMode = "find" | "saved";

interface WorkerCardData {
  userId: string; name: string; headline: string | null; suburb: string | null; state: string | null;
  rating: number; totalReviews: number; hourlyRate: number | null; experienceLevel: string | null;
  services: string[]; availableNow: boolean; shortNotice: boolean; sleepover: boolean; overnight: boolean;
  languages?: string[]; yearsBucket?: string | null; radiusKm?: number | null; credentialCurrent?: boolean;
}
interface Listing {
  userId: string; suburb: string | null; state: string | null; listingHeadline: string | null; rating: number; totalReviews: number;
  hourlyRate: number | null; experienceLevel: string | null; servicesOffered: string[] | null; isAvailableNow: boolean;
  emergencyAvailability: boolean; acceptsSleepoverShifts: boolean; acceptsActiveOvernightShifts: boolean;
  user: { id: string; name: string };
  languagesSpoken?: string[] | null; experienceYearsBucket?: string | null; travelRadiusKm?: number | null; credentialSummaryCurrent?: boolean;
}
interface SavedRow {
  id: string; professionalUserId: string; listType: string; forParticipantUserId: string | null;
  professional: { name: string; workerProfile: { rating: number; totalReviews: number; hourlyRate: number | null; servicesOffered: string[] | null; suburb: string | null; state: string | null } | null };
}
interface ShiftOpt { id: string; title: string; suburb: string; urgency: string; status: string; scheduledStartAt: string }

const PAGE_SIZE = 20;
const URGENCY_LABEL: Record<string, string> = { RAPID: "Rapid", URGENT: "Urgent", LAST_MINUTE: "Last-Minute", ROUTINE: "Routine" };
const pretty = (v: string) => v.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function fromListing(w: Listing): WorkerCardData {
  return {
    userId: w.userId, name: w.user.name, headline: w.listingHeadline, suburb: w.suburb, state: w.state, rating: w.rating, totalReviews: w.totalReviews,
    hourlyRate: w.hourlyRate, experienceLevel: w.experienceLevel ? pretty(w.experienceLevel) : null, services: (w.servicesOffered ?? []).map(pretty), availableNow: w.isAvailableNow,
    shortNotice: w.emergencyAvailability, sleepover: w.acceptsSleepoverShifts, overnight: w.acceptsActiveOvernightShifts,
    languages: w.languagesSpoken ?? [], yearsBucket: w.experienceYearsBucket ?? null, radiusKm: w.travelRadiusKm ?? null, credentialCurrent: !!w.credentialSummaryCurrent,
  };
}
function fromSaved(s: SavedRow): WorkerCardData {
  const p = s.professional.workerProfile;
  return {
    userId: s.professionalUserId, name: s.professional.name, headline: null, suburb: p?.suburb ?? null, state: p?.state ?? null,
    rating: p?.rating ?? 0, totalReviews: p?.totalReviews ?? 0, hourlyRate: p?.hourlyRate ?? null, experienceLevel: null,
    services: (p?.servicesOffered ?? []).map(pretty), availableNow: false, shortNotice: false, sleepover: false, overnight: false,
  };
}

export function ProviderWorkerBoard({ mode }: { mode: WorkerBoardMode }) {
  const [workers, setWorkers] = useState<WorkerCardData[] | null>(null);
  const [saved, setSaved] = useState<Map<string, SavedRow>>(new Map());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<WorkerCardData | null>(null);
  const [connect, setConnect] = useState<WorkerCardData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => { setApplied(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const loadSaved = useCallback(() => api.get<{ saved: SavedRow[] }>("/saved-professionals")
    .then((r) => setSaved(new Map((r.saved ?? []).filter((s) => s.listType === "GENERAL" || mode === "saved").map((s) => [s.professionalUserId, s]))))
    .catch(() => undefined), [mode]);
  useEffect(() => { void loadSaved(); }, [loadSaved]);

  useEffect(() => {
    if (mode === "saved") return;
    setWorkers(null); setUpgrade(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (applied) params.set("suburb", applied);
    if (availableNow) params.set("availableNow", "true");
    api.get<{ items: Listing[]; total: number }>(`/workers/available?${params}`)
      .then((r) => { setWorkers((r.items ?? []).map(fromListing)); setTotal(r.total ?? 0); })
      .catch((e) => {
        if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) setUpgrade(e.message);
        else setError(e instanceof Error ? e.message : "Could not load workers");
        setWorkers([]);
      });
  }, [mode, page, applied, availableNow]);

  const savedCards = mode === "saved" ? [...saved.values()].map(fromSaved) : null;
  const needle = applied.toLowerCase();
  const list = mode === "saved"
    ? (savedCards ?? []).filter((w) => !needle || `${w.name} ${w.suburb ?? ""} ${w.services.join(" ")}`.toLowerCase().includes(needle))
    : workers;
  const filtered = !!(applied || availableNow);

  async function toggleSave(w: WorkerCardData) {
    setBusyId(w.userId); setError(null);
    try {
      const row = saved.get(w.userId);
      if (row) {
        const qs = new URLSearchParams({ listType: row.listType });
        if (row.forParticipantUserId) qs.set("forParticipantUserId", row.forParticipantUserId);
        await api.delete(`/saved-professionals/${w.userId}?${qs}`);
      } else {
        await api.post("/saved-professionals", { professionalUserId: w.userId });
      }
      await loadSaved();
      setNotice(row ? "Removed from your saved workers." : "Saved to your workspace.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update saved workers"); }
    finally { setBusyId(null); }
  }

  const field = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900";
  return (
    <div className="space-y-5 px-8 py-6">
      <p className="m-0 text-xs text-slate-400">{mode === "find" ? "Provider / External" : "Provider / Saved workers"}</p>
      <div>
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">{mode === "find" ? "Find External Workers" : "Saved Workers"}</h1>
        <p className="m-0 mt-1.5 text-[15px] text-slate-500">Discover eligible external workers and invite them to an active shift.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${field} w-full pl-9`} placeholder={mode === "find" ? "Search people, skills or suburb" : "Search people, skills or suburb"} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {mode === "find" && (
          <select className={field} value={availableNow ? "NOW" : ""} onChange={(e) => { setAvailableNow(e.target.value === "NOW"); setPage(1); }} aria-label="Availability">
            <option value="">All workers</option><option value="NOW">Available Now</option>
          </select>
        )}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setQ(""); setApplied(""); setAvailableNow(false); setPage(1); }}><RefreshCw className="mr-1.5 h-4 w-4" />Clear filters</Button>
      </div>
      {upgrade && <UpgradePrompt message={upgrade} />}
      {notice && <p className="m-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {list === null ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="m-0 text-base font-bold text-slate-900">No workers found</p>
          <p className="m-0 mt-1 text-sm text-slate-500">{mode === "saved" ? "Adjust your filters or save a worker from Find External Workers." : "Adjust your filters or check back later."}</p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
          {list.map((w) => (
            <li key={w.userId} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{initials(w.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-base font-bold text-slate-900">{w.name}</p>
                  <p className="m-0 text-sm text-slate-500">{w.experienceLevel ?? "Support worker"}{w.suburb ? ` · ${w.suburb}${w.state ? `, ${w.state}` : ""}` : ""}</p>
                </div>
                {w.availableNow && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Available Now</span>}
              </div>
              {w.headline && <p className="m-0 mt-2 text-sm text-slate-700">{w.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.services.slice(0, 5).map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s}</span>)}
                {w.shortNotice && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Short-notice shifts</span>}
                {w.sleepover && <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">Sleepover</span>}
                {w.overnight && <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">Overnight</span>}
                {w.credentialCurrent && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Credential summary current</span>}
              </div>
              {(w.languages?.length || w.yearsBucket || w.radiusKm) ? (
                <p className="m-0 mt-2 text-xs text-slate-500">
                  {[w.languages?.length ? w.languages.join(", ") : null, w.yearsBucket ? `${w.yearsBucket} yrs experience` : null, w.radiusKm ? `Travels up to ${w.radiusKm} km` : null].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <p className="m-0 mt-3 text-sm text-slate-600">
                {w.totalReviews > 0 ? `★ ${w.rating.toFixed(1)} (${w.totalReviews})` : "No reviews yet"}{w.hourlyRate != null ? ` · $${Number(w.hourlyRate).toFixed(2)}/hr` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setProfile(w)}>View profile</Button>
                <Button variant="outline" size="sm" disabled={busyId === w.userId} onClick={() => void toggleSave(w)}><Heart className="mr-1.5 h-4 w-4" />{saved.has(w.userId) ? "Saved" : "Save"}</Button>
                <Button size="sm" className="ml-auto" onClick={() => setConnect(w)}>Invite to Active Shift</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {mode === "find" && total > PAGE_SIZE && (
        <div className="flex justify-center gap-3">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
          <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {profile && (
        <ModalShell title="Worker profile" onClose={() => setProfile(null)}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{initials(profile.name)}</span>
              <div>
                <p className="m-0 text-xl font-bold text-slate-900">{profile.name}</p>
                <p className="m-0 text-sm text-slate-500">External worker{profile.experienceLevel ? ` · ${profile.experienceLevel}` : ""}</p>
                {profile.availableNow && <span className="mt-2 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Available Now</span>}
              </div>
            </div>
            {profile.services.length > 0 && (
              <section><h4 className="m-0 text-base font-bold text-slate-900">Capabilities</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">{profile.services.map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s}</span>)}</div></section>
            )}
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 text-sm">
              <div><dt className="text-xs text-slate-500">Area</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.suburb ?? "—"}</dd></div>
              <div><dt className="text-xs text-slate-500">Relationship</dt><dd className="m-0 text-base font-semibold text-slate-900">Independent worker</dd></div>
              <div><dt className="text-xs text-slate-500">Rate</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.hourlyRate != null ? `$${Number(profile.hourlyRate).toFixed(2)} / hr` : "—"}</dd></div>
            </dl>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>Only authorised credential summaries are visible. Raw personal evidence and private contact information follow consent and access rules.</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <Button variant="outline" onClick={() => setProfile(null)}>Close</Button>
            <div className="flex gap-2">
              <Button variant="outline" disabled={busyId === profile.userId} onClick={() => void toggleSave(profile)}>{saved.has(profile.userId) ? "Unsave" : "Save worker"}</Button>
              <Button onClick={() => { const w = profile; setProfile(null); setConnect(w); }}>Invite to Active Shift</Button>
            </div>
          </div>
        </ModalShell>
      )}
      {connect && <DirectConnectFlow worker={connect} onClose={() => setConnect(null)} onSent={(msg) => { setConnect(null); setNotice(msg); }} />}
    </div>
  );
}

// Doc P37-P39: Direct Connect starts only from a valid active external staffing request; the $9.99 is charged only if the worker accepts.
function DirectConnectFlow({ worker, onClose, onSent }: { worker: WorkerCardData; onClose: () => void; onSent: (msg: string) => void }) {
  const [shifts, setShifts] = useState<ShiftOpt[] | null>(null);
  const [shift, setShift] = useState<ShiftOpt | null>(null);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ jobs: ShiftOpt[] }>("/jobs/my").then((r) => setShifts((r.jobs ?? []).filter((j) => j.status === "OPEN" && new Date(j.scheduledStartAt) > new Date())))
      .catch(() => setShifts([]));
  }, []);

  async function send() {
    if (!shift) return;
    setBusy(true); setError(null);
    try {
      await api.post(`/job-invites/${shift.id}`, { invitedUserId: worker.userId });
      onSent(`Invitation to active shift sent to ${worker.name} for ${shift.title}. You are charged $9.99 only if the worker accepts.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the invitation"); }
    finally { setBusy(false); }
  }

  if (!shift) {
    return (
      <ModalShell title="Choose an active shift" onClose={onClose}>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="m-0 mb-3 text-sm text-slate-500">An invitation must be linked to a valid active external shift.</p>
          {shifts === null ? <div className="h-20 animate-pulse rounded-xl bg-slate-100" /> : shifts.length === 0 ? (
            <p className="m-0 text-sm text-slate-600">You have no active external staffing requests. Post a shift first, then invite a worker to it.</p>
          ) : (
            <ul className="m-0 list-none divide-y divide-slate-100 p-0">
              {shifts.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="m-0 truncate text-base font-semibold text-slate-900">{j.title}</p><p className="m-0 text-sm text-slate-500">{j.suburb} · {URGENCY_LABEL[j.urgency] ?? j.urgency}</p></div>
                  <Button variant="outline" size="sm" onClick={() => setShift(j)}>Select</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Invite to Active Shift" subtitle={`${worker.name} · ${shift.title}`} onClose={onClose}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
        <p className="m-0 text-lg font-bold text-slate-900">$9.99 per accepted connection</p>
        <p className="m-0 text-sm text-slate-600">You will not be charged for sending this invitation. If the worker accepts and the private connection opens, $9.99 will be charged. A connection does not guarantee that the worker will accept, perform or complete the shift.</p>
        <p className="m-0 text-sm text-slate-600">If declined or expired: $0. For a one-worker shift, only the first accepted invitation opens and remaining invitations close. Subscriptions do not include invitation credits.</p>
        <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={ack} onChange={(e) => setAck(e.target.checked)} />I authorise the conditional charge for this successful connection.</label>
        {error && <p className="m-0 text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="outline" onClick={() => setShift(null)}>Back</Button>
        <Button disabled={!ack || busy} onClick={() => void send()}>{busy ? "Sending…" : "Send invitation"}</Button>
      </div>
    </ModalShell>
  );
}
