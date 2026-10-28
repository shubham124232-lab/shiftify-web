"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw, ShieldCheck, LayoutGrid } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { PROVIDER_TIERS } from "@/components/provider/timing";

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
  professional: { name: string; workerProfile: { rating: number; totalReviews: number; hourlyRate: number | null; servicesOffered: string[] | null; suburb: string | null; state: string | null; isAvailableNow?: boolean; languagesSpoken?: string[] | null; travelRadiusKm?: number | null } | null };
}
interface ConnectInvite { id: string; status: string; createdAt: string; invitedUser: { name: string }; job: { title: string } }
interface ShiftOpt { id: string; title: string; suburb: string; urgency: string; status: string; scheduledStartAt: string }

const PAGE_SIZE = 20;
const URGENCY_LABEL: Record<string, string> = Object.fromEntries(PROVIDER_TIERS.map((t) => [t.key, t.label]));
const ACRONYMS = new Set(["CPR", "NDIS", "SIL", "SDA"]);
const pretty = (v: string) => v.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S+/g, (w) => (ACRONYMS.has(w.trim().toUpperCase()) ? w.toUpperCase() : w.replace(/\S/, (c) => c.toUpperCase())));
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
    services: (p?.servicesOffered ?? []).map(pretty), availableNow: !!p?.isAvailableNow, shortNotice: false, sleepover: false, overnight: false,
    languages: p?.languagesSpoken ?? [], radiusKm: p?.travelRadiusKm ?? null,
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
  const [invites, setInvites] = useState<ConnectInvite[] | null>(null);
  const loadInvites = useCallback(() => {
    if (mode !== "find") return;
    api.get<{ directConnect?: ConnectInvite[] }>("/provider-workspace/promotions").then((r) => setInvites(r.directConnect ?? [])).catch(() => setInvites([]));
  }, [mode]);
  useEffect(() => { loadInvites(); }, [loadInvites]);

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
    ? (savedCards ?? []).filter((w) => (!needle || `${w.name} ${w.suburb ?? ""} ${w.services.join(" ")}`.toLowerCase().includes(needle)) && (!availableNow || w.availableNow))
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

  return (
    <div className="pd-workspace">
      <div className="pd-content">
      <div className="pd-breadcrumb">{mode === "find" ? "Provider / External" : "Provider / Saved workers"}</div>
      <div className="pd-page-head">
        <ProviderAreaTabs />
        <div>
          <h1>{mode === "find" ? "Find External Workers" : "Saved Workers"}</h1>
          <p>Discover eligible external workers. Direct Connect is included in paid Provider subscriptions.</p>
        </div>
        <div className="pd-buttons" />
      </div>
      <div className="pd-toolbar">
        <input placeholder="Search people, skills or language" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search workers" />
        <select value={availableNow ? "NOW" : ""} onChange={(e) => { setAvailableNow(e.target.value === "NOW"); setPage(1); }} aria-label={mode === "find" ? "Availability" : "Status"}>
          <option value="">All</option><option value="NOW">Available Now</option>
        </select>
        <button type="button" className="pd-btn" onClick={() => { setQ(""); setApplied(""); setAvailableNow(false); setPage(1); }}><RefreshCw />Clear filters</button>
      </div>
      {upgrade && <UpgradePrompt message={upgrade} />}
      {notice && <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {list === null ? (
        <div className="pd-quiet-empty">Loading…</div>
      ) : list.length === 0 ? (
        <section className="pd-panel">
          <div className="pd-empty">
            <LayoutGrid />
            <h3>No workers found</h3>
            <p>{mode === "saved" ? "Adjust your filters or save a worker from Find External Workers." : "Adjust your filters or check back later."}</p>
          </div>
        </section>
      ) : (
        <div className="pd-grid3">
          {list.map((w) => (
            <article key={w.userId} className="pd-record-card">
              <div className="pd-card-header">
                <span className="pd-avatar pd-avatar-lg">{initials(w.name)}</span>
                <div>
                  <h3>{w.name}</h3>
                  <span className="pd-small pd-muted">{w.yearsBucket ? `${w.yearsBucket} years experience` : (w.experienceLevel ?? "Support worker")}</span>
                </div>
              </div>
              {(w.availableNow || w.credentialCurrent) && (
                <div className="pd-tags">
                  {w.availableNow && <span className="pd-badge pd-badge-green">Available Now</span>}
                  {w.credentialCurrent && <span className="pd-badge pd-badge-blue">Checks current</span>}
                </div>
              )}
              {(w.services.length > 0 || w.shortNotice || w.sleepover || w.overnight) && (
                <div className="pd-tags">
                  {w.services.slice(0, 5).map((sv) => <span key={sv} className="pd-badge">{sv}</span>)}
                  {w.shortNotice && <span className="pd-badge pd-badge-orange">Short-notice shifts</span>}
                  {w.sleepover && <span className="pd-badge pd-badge-purple">Sleepover</span>}
                  {w.overnight && <span className="pd-badge pd-badge-purple">Overnight</span>}
                </div>
              )}
              <div className="pd-card-body">
                {w.languages?.length ? <>{w.languages.join(", ")}<br /></> : null}
                {[w.suburb ? `${w.suburb}${w.state ? `, ${w.state}` : ""}` : null, w.radiusKm ? `travels up to ${w.radiusKm} km` : null, w.hourlyRate != null ? `$${Number(w.hourlyRate).toFixed(2)}/hr` : null, w.totalReviews > 0 ? `★ ${w.rating.toFixed(1)} (${w.totalReviews})` : null].filter(Boolean).join(" · ")}
              </div>
              <div className="pd-buttons">
                <button type="button" className="pd-btn pd-btn-sm" onClick={() => setProfile(w)}>View profile</button>
                <button type="button" className="pd-btn pd-btn-sm" disabled={busyId === w.userId} onClick={() => void toggleSave(w)}><Heart />{saved.has(w.userId) ? "Saved" : "Save"}</button>
                <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => setConnect(w)}>Direct Connect</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {mode === "find" && invites && (
        <section className="pd-panel">
          <div className="pd-panel-head">
            <h2>Direct Connect invitations</h2>
            {invites.length > 0 && <span className="pd-small pd-muted">{invites.length} sent · {invites.filter((i) => i.status === "ACCEPTED").length} accepted</span>}
          </div>
          {invites.length === 0 ? (
            <div className="pd-empty">
              <LayoutGrid />
              <h3>No invitations yet</h3>
              <p>Choose an eligible worker and an active request to send an invitation.</p>
            </div>
          ) : (
            <div>
              {invites.map((i) => (
                <div key={i.id} className="pd-task-row">
                  <div><strong>{i.invitedUser.name}</strong><p>{i.job.title}</p></div>
                  <span className="pd-small pd-muted">{new Date(i.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · {i.status === "ACCEPTED" ? "Accepted" : i.status === "DECLINED" ? "Declined" : i.status === "PENDING" ? "Sent" : pretty(i.status)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {mode === "find" && total > PAGE_SIZE && (
        <div className="pd-buttons" style={{ justifyContent: "center" }}>
          <button type="button" className="pd-btn pd-btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="pd-small pd-muted">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
          <button type="button" className="pd-btn pd-btn-ghost" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
      </div>

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
              <Button onClick={() => { const w = profile; setProfile(null); setConnect(w); }}>Direct Connect</Button>
            </div>
          </div>
        </ModalShell>
      )}
      {connect && <DirectConnectFlow worker={connect} onClose={() => setConnect(null)} onSent={(msg) => { setConnect(null); setNotice(msg); loadInvites(); }} />}
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
  // Direct Connect is included in a paid Provider plan; without one it is a conditional $9.99.
  const [included, setIncluded] = useState(false);

  useEffect(() => {
    api.get<{ jobs: ShiftOpt[] }>("/jobs/my").then((r) => setShifts((r.jobs ?? []).filter((j) => j.status === "OPEN" && new Date(j.scheduledStartAt) > new Date()).sort((a, b) => +new Date(a.scheduledStartAt) - +new Date(b.scheduledStartAt))))
      .catch(() => setShifts([]));
    api.get<{ capacity: unknown | null }>("/provider-org/capacity").then((c) => setIncluded(!!c.capacity)).catch(() => setIncluded(false));
  }, []);

  async function send() {
    if (!shift) return;
    setBusy(true); setError(null);
    try {
      await api.post(`/job-invites/${shift.id}`, { invitedUserId: worker.userId });
      onSent(`Direct Connect invitation sent to ${worker.name} for ${shift.title}.${included ? "" : " You are charged $9.99 only if the worker accepts."}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the invitation"); }
    finally { setBusy(false); }
  }

  if (!shift) {
    return (
      <ModalShell title="Choose an active shift" onClose={onClose}>
        <div className="pd-modal-body">
          <p className="pd-muted m-0 mb-4 text-sm">Direct Connect must be linked to a valid active external shift.</p>
          {shifts === null ? <div className="pd-quiet-empty">Loading…</div> : shifts.length === 0 ? (
            <p className="pd-notice m-0">You have no active external staffing requests. Post a shift first, then invite a worker to it.</p>
          ) : (
            <div className="space-y-3">
              {shifts.map((j) => (
                <div key={j.id} className="pd-task-row" style={{ border: "1px solid var(--pd-line)", borderRadius: 10, padding: "12px 16px" }}>
                  <div><strong>{j.title}</strong><p>{j.suburb} · {URGENCY_LABEL[j.urgency] ?? j.urgency}</p></div>
                  <button type="button" className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setShift(j)}>Select</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pd-modal-foot"><button type="button" className="pd-btn" onClick={onClose}>Close</button></div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Review Direct Connect invitation" subtitle={`${worker.name} · ${shift.title}`} onClose={onClose}>
      <div className="pd-modal-body">
        <p className="m-0 mb-3 text-lg font-bold">{included ? "Included in your Provider subscription" : "$9.99 per accepted connection"}</p>
        <p className="pd-muted m-0 mb-3 text-sm">Invite this worker to discuss your active staffing request. The worker decides whether to accept and share permitted contact details.</p>
        <p className="pd-muted m-0 mb-3 text-sm">For a one-worker request, you may have up to three invitations open. The first accepted connection opens and the remaining invitations close. A connection does not confirm a shift or guarantee work.</p>
        {!included && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={ack} onChange={(e) => setAck(e.target.checked)} />I authorise the conditional $9.99 charge for this successful connection. You are not charged for sending, declined or expired invitations.</label>}
        {error && <p className="m-0 mt-3 text-sm text-red-700">{error}</p>}
      </div>
      <div className="pd-modal-foot">
        <button type="button" className="pd-btn" onClick={() => setShift(null)}>Back</button>
        <button type="button" className="pd-btn pd-btn-primary" disabled={(!included && !ack) || busy} onClick={() => void send()}>{busy ? "Sending…" : "Send invitation"}</button>
      </div>
    </ModalShell>
  );
}
