"use client";

// SC-F01-06 "Find directly" (Journey 9) — Coordinator searches workers and/or
// providers directly and invites/shortlists/saves them, instead of posting a
// request and waiting for responses. Coordinator-only, matching the SC doc
// and the backend route guard (requireRole("COORDINATOR")).

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import dynamic from "next/dynamic";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import {
  WorkspacePage, Panel, SubTabs, useParticipantScope, fieldClass, Chip, Avatar, Empty, ErrorNote, OutlineButton, PrimaryButton, HeaderLink,
} from "@/components/coordinator/workspace-ui";
import { FIND_TABS } from "@/components/coordinator/pages/find-tabs";

// Leaflet touches `window` on import, so the map only loads in the browser.
const NearbyMap = dynamic(() => import("@/components/provider/NearbyMap"), {
  ssr: false,
  loading: () => <div className="h-[340px] w-full rounded-xl border border-slate-200 bg-slate-50" />,
});
// Public suburb centre only — participant addresses are never mapped.
const SERVICE_CENTRE = { lat: -33.815, lng: 151.001 };

type SearchType = "SUPPORT_WORKER" | "PROVIDER" | "BOTH";

interface Connection {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  participant: { id: string; name: string };
}

interface FitSummary { met: string[]; missing: string[] }

interface SearchResult {
  kind: "SUPPORT_WORKER" | "PROVIDER";
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  documentStatus: "COMPLETE" | "INCOMPLETE";
  fitSummary?: FitSummary;
  // worker-only
  suburb?: string | null;
  state?: string | null;
  listingHeadline?: string | null;
  hourlyRate?: number | null;
  experienceLevel?: string | null;
  servicesOffered?: string[] | null;
  isAvailableNow?: boolean;
  rating?: number;
  totalReviews?: number;
  // provider-only
  businessName?: string | null;
  businessDescription?: string | null;
  ndisRegistered?: boolean;
  coreServices?: string[] | null;
  currentCapacityStatus?: string | null;
  averageRating?: number;
  totalRatings?: number;
}

interface MyJob { id: string; title: string; status: string }

const PAGE_SIZE = 20;

interface Filters {
  suburb: string;
  state: string;
  service: string;
  genderRequirement: string;
  language: string;
  transportRequired: boolean;
  overnightRequired: boolean;
  rapidAvailability: boolean;
  highIntensityExperience: boolean;
  registeredProviderOnly: boolean;
  documentsComplete: boolean;
  rateMin: string;
  rateMax: string;
}

const EMPTY_FILTERS: Filters = {
  suburb: "", state: "", service: "", genderRequirement: "", language: "",
  transportRequired: false, overnightRequired: false, rapidAvailability: false,
  highIntensityExperience: false, registeredProviderOnly: false, documentsComplete: false,
  rateMin: "", rateMax: "",
};

type InviteMode = null | { result: SearchResult };
type MessageMode = null | { result: SearchResult };

export default function FindDirectlyPage() {
  const [searchType, setSearchType] = useState<SearchType>("BOTH");
  const [participants, setParticipants] = useState<Connection[]>([]);
  const [scope, setScope] = useParticipantScope();
  const participantId = scope === "ALL" ? "" : scope;
  const setParticipantId = (v: string) => setScope(v || "ALL");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const [inviteMode, setInviteMode] = useState<InviteMode>(null);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [messageMode, setMessageMode] = useState<MessageMode>(null);
  const [messageBody, setMessageBody] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageSent, setMessageSent] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [moreFilters, setMoreFilters] = useState(false);

  useEffect(() => {
    api.get<{ connections: Connection[] }>("/coordinator-connections")
      .then((r) => setParticipants((r.connections ?? []).filter((c) => c.status === "ACCEPTED")))
      .catch(() => { /* non-fatal — search just runs without participant context */ });
  }, []);

  const load = useMemo(() => (f: Filters, type: SearchType, forParticipant: string, p: number) => {
    setLoading(true);
    setUpgradeMessage(null);
    setError(null);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), searchType: type });
    if (forParticipant) params.set("forParticipantUserId", forParticipant);
    if (f.suburb) params.set("suburb", f.suburb);
    if (f.state) params.set("state", f.state);
    if (f.service) params.set("service", f.service);
    if (f.genderRequirement) params.set("genderRequirement", f.genderRequirement);
    if (f.language) params.set("language", f.language);
    if (f.transportRequired) params.set("transportRequired", "true");
    if (f.overnightRequired) params.set("overnightRequired", "true");
    if (f.rapidAvailability) params.set("rapidAvailability", "true");
    if (f.highIntensityExperience) params.set("highIntensityExperience", "true");
    if (f.registeredProviderOnly) params.set("registeredProviderOnly", "true");
    if (f.documentsComplete) params.set("documentsComplete", "true");
    if (f.rateMin) params.set("rateMin", f.rateMin);
    if (f.rateMax) params.set("rateMax", f.rateMax);

    api.get<{ items: SearchResult[]; total: number }>(`/professional-search?${params}`)
      .then((r) => { setResults(r.items ?? []); setTotal(r.total ?? 0); })
      .catch((e) => {
        if (e instanceof ApiError && (e.code === "SUBSCRIPTION_REQUIRED" || e.code === "SUBSCRIPTION_LIMIT")) {
          setUpgradeMessage(e.message);
        } else {
          setError(e instanceof Error ? e.message : "Could not load results");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(appliedFilters, searchType, participantId, page); }, [appliedFilters, searchType, participantId, page, load]);

  function applyFilters() { setAppliedFilters({ ...filters }); setPage(1); }
  function resetFilters() { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setPage(1); }

  function openInvite(result: SearchResult) {
    setInviteMode({ result });
    setActionMessage(null);
    setSelectedJobId("");
    api.get<{ jobs: MyJob[] }>("/jobs?status=OPEN&limit=50")
      .then((r) => setMyJobs(r.jobs ?? []))
      .catch(() => setMyJobs([]));
  }

  async function inviteToExisting() {
    if (!inviteMode || !selectedJobId) return;
    setActionBusy(true);
    try {
      await api.post(`/job-invites/${selectedJobId}`, { invitedUserId: inviteMode.result.userId });
      setActionMessage("Invitation sent.");
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : "Could not send the invitation");
    } finally {
      setActionBusy(false);
    }
  }

  function openMessage(result: SearchResult) {
    setMessageMode({ result });
    setMessageBody("");
    setMessageSent(null);
    setMessageError(null);
  }

  async function sendDirectMessage() {
    if (!messageMode || !messageBody.trim()) return;
    setMessageBusy(true);
    setMessageError(null);
    try {
      const connection = participants.find((c) => c.participant.id === participantId);
      await api.post("/direct-inquiries", {
        recipientUserId: messageMode.result.userId,
        body: messageBody.trim(),
        participantConnectionId: connection?.id,
      });
      setMessageSent("Message sent.");
      setMessageBody("");
    } catch (e) {
      setMessageError(e instanceof Error ? e.message : "Could not send the message");
    } finally {
      setMessageBusy(false);
    }
  }

  async function saveAction(action: "SAVE_TO_SHORTLIST" | "SAVE_AS_PREFERRED_BACKUP", listType?: string) {
    if (!inviteMode) return;
    setActionBusy(true);
    try {
      await api.post("/professional-search/connect", {
        professionalUserId: inviteMode.result.userId,
        action,
        listType,
        forParticipantUserId: participantId || undefined,
      });
      setActionMessage(action === "SAVE_TO_SHORTLIST" ? "Saved to shortlist." : "Saved as preferred/backup.");
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : "Could not save");
    } finally {
      setActionBusy(false);
    }
  }

  const check = (key: keyof Filters, label: string) => (
    <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" checked={filters[key] as boolean} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))} />
      {label}
    </label>
  );

  return (
    <WorkspacePage
      title="Find Workers & Providers"
      description="Browse suitable professionals. Availability is self-reported and confirmed for each request."
      participantView={{
        value: participantId || "ALL",
        onChange: (v) => { setParticipantId(v === "ALL" ? "" : v); setPage(1); },
        participants: participants.map((c) => c.participant),
      }}
      actions={<PrimaryButton href="/jobs/post">Post Support Request</PrimaryButton>}
    >
      <SubTabs items={FIND_TABS("FIND")} />
      {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
      {error && <ErrorNote>{error}</ErrorNote>}

      {/* SC-F01 / SC-F03 — who to find and filters */}
      <div className="space-y-3 rounded-xl border border-[#e4e6ed] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input className={`${fieldClass} w-44`} placeholder="Search suburb or area" value={filters.suburb}
            onChange={(e) => setFilters((f) => ({ ...f, suburb: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }} />
          <select className={fieldClass} value={searchType} onChange={(e) => { setSearchType(e.target.value as SearchType); setPage(1); }} aria-label="Who would you like to find?">
            <option value="BOTH">All</option>
            <option value="SUPPORT_WORKER">Independent Support Worker</option>
            <option value="PROVIDER">Provider</option>
          </select>
          <input className={`${fieldClass} w-48`} placeholder="All services" value={filters.service} onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))} />
          <input className={`${fieldClass} w-24`} placeholder="State" value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-[#e4e6ed] px-3 text-sm text-slate-700">
            <input type="checkbox" checked={filters.rapidAvailability} onChange={(e) => setFilters((f) => ({ ...f, rapidAvailability: e.target.checked }))} />
            Available Now · Speed
          </label>
          <PrimaryButton onClick={applyFilters}>Show matches</PrimaryButton>
          <OutlineButton onClick={() => setMoreFilters((m) => !m)}>{moreFilters ? "Fewer filters" : "More filters"}</OutlineButton>
          <button type="button" onClick={resetFilters} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Reset</button>
        </div>
        {moreFilters && (
          <div className="grid grid-cols-1 gap-3 border-t border-[#e4e6ed] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <input className={fieldClass} placeholder="Gender requirement" value={filters.genderRequirement} onChange={(e) => setFilters((f) => ({ ...f, genderRequirement: e.target.value }))} />
            <input className={fieldClass} placeholder="Language / Auslan" value={filters.language} onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))} />
            <input className={fieldClass} type="number" placeholder="Rate min ($/hr)" value={filters.rateMin} onChange={(e) => setFilters((f) => ({ ...f, rateMin: e.target.value }))} />
            <input className={fieldClass} type="number" placeholder="Rate max ($/hr)" value={filters.rateMax} onChange={(e) => setFilters((f) => ({ ...f, rateMax: e.target.value }))} />
            {check("transportRequired", "Transport")}
            {check("overnightRequired", "Overnight")}
            {check("highIntensityExperience", "High-intensity experience")}
            {check("registeredProviderOnly", "Registered provider only")}
            {check("documentsComplete", "Documents submitted")}
          </div>
        )}
      </div>

      <Panel title="Nearby service areas" action={<HeaderLink href="/live-dashboard">Open full map ↗</HeaderLink>}>
        <NearbyMap origin={SERVICE_CENTRE} radiusKm={25} pins={[]} />
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Service-area centre. Public suburb centres only. Participant addresses are never mapped publicly. Listings below remain available if the map cannot load.</p>
      </Panel>

      {/* SC-F04 — results */}
      {loading ? <Empty>Loading…</Empty> : results.length === 0 ? (
        <Panel><Empty>No matches found. Try adjusting your filters.</Empty></Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {results.map((r) => (
              <ResultCard key={`${r.kind}-${r.userId}`} result={r} onInvite={() => openInvite(r)} onMessage={() => openMessage(r)} />
            ))}
          </div>
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3">
              <OutlineButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</OutlineButton>
              <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
              <OutlineButton disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</OutlineButton>
            </div>
          )}
        </>
      )}

      {/* SC-F06 — connect actions */}
      {inviteMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setInviteMode(null)}>
          <div className="w-full max-w-md rounded-xl border border-[#e4e6ed] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-extrabold text-slate-900">How would you like to connect with {inviteMode.result.user.name}?</h3>
            {actionMessage && <p className="mt-2 text-sm text-emerald-700">{actionMessage}</p>}
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">Invite to an existing request</p>
                <div className="flex gap-2">
                  <select className={`${fieldClass} flex-1`} value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                    <option value="">Select an open request…</option>
                    {myJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  <PrimaryButton disabled={!selectedJobId || actionBusy} onClick={inviteToExisting}>Send</PrimaryButton>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <OutlineButton href="/jobs/post">Create a new request</OutlineButton>
                <OutlineButton onClick={() => { setInviteMode(null); openMessage(inviteMode.result); }}>Message first</OutlineButton>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-[#e4e6ed] pt-4">
                <OutlineButton disabled={actionBusy} onClick={() => saveAction("SAVE_TO_SHORTLIST")}>Save to shortlist</OutlineButton>
                <OutlineButton disabled={actionBusy} onClick={() => saveAction("SAVE_AS_PREFERRED_BACKUP", inviteMode.result.kind === "PROVIDER" ? "PREFERRED_PROVIDER" : "PREFERRED_WORKER")}>Save as preferred</OutlineButton>
                <OutlineButton disabled={actionBusy} onClick={() => saveAction("SAVE_AS_PREFERRED_BACKUP", "BACKUP")}>Save as backup</OutlineButton>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button type="button" onClick={() => setInviteMode(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SC-F06 — "Message first" */}
      {messageMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setMessageMode(null)}>
          <div className="w-full max-w-md rounded-xl border border-[#e4e6ed] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-extrabold text-slate-900">
              Message {messageMode.result.kind === "PROVIDER" ? (messageMode.result.businessName ?? messageMode.result.user.name) : messageMode.result.user.name}
            </h3>
            <p className="mb-3 mt-1 text-xs text-slate-500">A one-off note before any request connects you — they&apos;ll see it in their messages.</p>
            {messageSent && <p className="mb-2 text-sm text-emerald-700">{messageSent}</p>}
            {messageError && <p className="mb-2 text-sm text-red-600">{messageError}</p>}
            <textarea
              className={`${fieldClass} h-32 w-full py-2`}
              placeholder="Introduce yourself and what you're looking for…"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              maxLength={2000}
            />
            <div className="mt-3 flex justify-end gap-2">
              <OutlineButton onClick={() => setMessageMode(null)}>Close</OutlineButton>
              <PrimaryButton disabled={!messageBody.trim() || messageBusy} onClick={sendDirectMessage}>{messageBusy ? "Sending…" : "Send message"}</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </WorkspacePage>
  );
}

function ResultCard({ result, onInvite, onMessage }: { result: SearchResult; onInvite: () => void; onMessage: () => void }) {
  const isWorker = result.kind === "SUPPORT_WORKER";
  const name = isWorker ? result.user.name : (result.businessName ?? result.user.name);
  const services = (isWorker ? result.servicesOffered : result.coreServices) ?? [];
  const rating = isWorker ? result.rating : result.averageRating;
  const totalReviews = isWorker ? result.totalReviews : result.totalRatings;
  const about = isWorker ? result.listingHeadline : result.businessDescription;

  return (
    <div className="flex flex-col rounded-xl border border-[#e4e6ed] bg-white p-6">
      <div className="flex items-start gap-3">
        <Avatar name={name} tone={isWorker ? "pink" : "blue"} />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{isWorker ? "Independent Support Worker" : "Provider"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {result.documentStatus === "COMPLETE" ? <Chip tone="green">Current</Chip> : <Chip tone="amber">Documents pending</Chip>}
        {isWorker && result.isAvailableNow && <Chip tone="blue">Available Now</Chip>}
        {!isWorker && result.ndisRegistered && <Chip tone="blue">Registered provider</Chip>}
        {services.slice(0, 3).map((sv) => <Chip key={sv} tone="slate">{sv}</Chip>)}
      </div>
      {about && <p className="mt-4 text-sm text-slate-800">{about}</p>}
      <p className="mt-4 text-xs text-slate-500">
        {[isWorker && result.suburb && `${result.suburb}${result.state ? `, ${result.state}` : ""}`,
          isWorker && result.hourlyRate != null && `$${result.hourlyRate.toFixed(2)}/hour indicative`,
          typeof totalReviews === "number" && totalReviews > 0 && `★ ${rating?.toFixed(1)} (${totalReviews})`].filter(Boolean).join(" · ")}
      </p>
      {result.fitSummary && (result.fitSummary.met.length > 0 || result.fitSummary.missing.length > 0) && (
        <p className="mt-3 border-t border-[#e4e6ed] pt-3 text-xs">
          <span className="font-semibold text-slate-600">Fit for this participant: </span>
          {result.fitSummary.met.map((m) => <span key={m} className="mr-2 text-emerald-700">✓ {m}</span>)}
          {result.fitSummary.missing.map((m) => <span key={m} className="mr-2 text-amber-700">△ {m}</span>)}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <OutlineButton href={`/profile/${result.userId}`}>View profile</OutlineButton>
        <OutlineButton onClick={onMessage}>Message first</OutlineButton>
        <OutlineButton onClick={onInvite}>Save</OutlineButton>
        <PrimaryButton onClick={onInvite}>Invite to request</PrimaryButton>
      </div>
    </div>
  );
}
