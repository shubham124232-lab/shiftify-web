"use client";

// SC-F01-06 "Find directly" (Journey 9) — Coordinator searches workers and/or
// providers directly and invites/shortlists/saves them, instead of posting a
// request and waiting for responses. Coordinator-only, matching the SC doc
// and the backend route guard (requireRole("COORDINATOR")).

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

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

const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";
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
  const [participantId, setParticipantId] = useState<string>("");

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

  return (
    <>
      <PageHeader title="Find directly" description="Search support workers and providers, then invite, shortlist, or save them." />
      <div className="mx-auto max-w-6xl px-5 py-6">
        {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* SC-F01 — who to find */}
        <Card className="mb-4">
          <CardContent className="py-4 px-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className={lbl}>Who would you like to find?</label>
                <div className="flex gap-1.5">
                  {(["SUPPORT_WORKER", "PROVIDER", "BOTH"] as SearchType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setSearchType(t); setPage(1); }}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border ${
                        searchType === t ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {t === "SUPPORT_WORKER" ? "Support workers" : t === "PROVIDER" ? "Provider organisations" : "Both"}
                    </button>
                  ))}
                </div>
              </div>

              {/* SC-F02 — participant context */}
              <div className="w-64">
                <label className={lbl}>Who are you finding support for?</label>
                <select
                  className={inp}
                  value={participantId}
                  onChange={(e) => { setParticipantId(e.target.value); setPage(1); }}
                >
                  <option value="">No participant selected</option>
                  {participants.map((c) => (
                    <option key={c.participant.id} value={c.participant.id}>{c.participant.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SC-F03 — filters */}
        <Card className="mb-4">
          <CardContent className="py-4 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={lbl}>Suburb</label>
                <input className={inp} value={filters.suburb} onChange={(e) => setFilters((f) => ({ ...f, suburb: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>State</label>
                <input className={inp} value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Support service</label>
                <input className={inp} value={filters.service} onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Gender requirement</label>
                <input className={inp} value={filters.genderRequirement} onChange={(e) => setFilters((f) => ({ ...f, genderRequirement: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Language / Auslan</label>
                <input className={inp} value={filters.language} onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Rate min ($/hr)</label>
                <input className={inp} type="number" value={filters.rateMin} onChange={(e) => setFilters((f) => ({ ...f, rateMin: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Rate max ($/hr)</label>
                <input className={inp} type="number" value={filters.rateMax} onChange={(e) => setFilters((f) => ({ ...f, rateMax: e.target.value }))} />
              </div>
              <div className="flex flex-col justify-end gap-1 text-xs text-slate-600">
                {([
                  ["transportRequired", "Transport"],
                  ["overnightRequired", "Overnight"],
                  ["rapidAvailability", "Rapid/Urgent availability"],
                  ["highIntensityExperience", "High-intensity experience"],
                  ["registeredProviderOnly", "Registered provider only"],
                  ["documentsComplete", "Documents submitted"],
                ] as [keyof Filters, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={filters[key] as boolean}
                      onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <Button size="sm" onClick={applyFilters}>Show matches</Button>
              <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline">Reset</button>
            </div>
          </CardContent>
        </Card>

        {/* SC-F04 — results */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No matches found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {results.map((r) => (
                <ResultCard key={`${r.kind}-${r.userId}`} result={r} onInvite={() => openInvite(r)} onMessage={() => openMessage(r)} />
              ))}
            </div>
            {total > PAGE_SIZE && (
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="flex items-center text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
                <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}

        {/* SC-F06 — connect actions */}
        {inviteMode && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setInviteMode(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                How would you like to connect with {inviteMode.result.user.name}?
              </h3>
              {actionMessage && <p className="text-sm text-emerald-700 mb-2">{actionMessage}</p>}

              <div className="space-y-3 mt-4">
                <div>
                  <label className={lbl}>Invite to an existing request</label>
                  <div className="flex gap-2">
                    <select className={inp} value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                      <option value="">Select an open request…</option>
                      {myJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                    <Button size="sm" disabled={!selectedJobId || actionBusy} onClick={inviteToExisting}>Send</Button>
                  </div>
                </div>

                <a href="/jobs/post" className="block text-sm text-brand-600 hover:underline">
                  Create a new request instead →
                </a>

                <button
                  type="button"
                  onClick={() => { setInviteMode(null); openMessage(inviteMode.result); }}
                  className="block text-sm text-brand-600 hover:underline text-left"
                >
                  Message first instead →
                </button>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button size="sm" variant="outline" disabled={actionBusy} onClick={() => saveAction("SAVE_TO_SHORTLIST")}>
                    Save to shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionBusy}
                    onClick={() => saveAction("SAVE_AS_PREFERRED_BACKUP", inviteMode.result.kind === "PROVIDER" ? "PREFERRED_PROVIDER" : "PREFERRED_WORKER")}
                  >
                    Save as preferred
                  </Button>
                  <Button size="sm" variant="outline" disabled={actionBusy} onClick={() => saveAction("SAVE_AS_PREFERRED_BACKUP", "BACKUP")}>
                    Save as backup
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-right">
                <button onClick={() => setInviteMode(null)} className="text-xs text-slate-500 hover:underline">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* SC-F06 — "Message first" */}
        {messageMode && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setMessageMode(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Message {messageMode.result.kind === "PROVIDER" ? (messageMode.result.businessName ?? messageMode.result.user.name) : messageMode.result.user.name}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                A one-off note before any request connects you — they&apos;ll see it in their messages.
              </p>
              {messageSent && <p className="text-sm text-emerald-700 mb-2">{messageSent}</p>}
              {messageError && <p className="text-sm text-red-600 mb-2">{messageError}</p>}

              <textarea
                className="w-full min-h-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Introduce yourself and what you're looking for…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                maxLength={2000}
              />

              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setMessageMode(null)} className="text-xs text-slate-500 hover:underline">Close</button>
                <Button size="sm" disabled={!messageBody.trim() || messageBusy} onClick={sendDirectMessage}>
                  {messageBusy ? "Sending…" : "Send message"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ResultCard({ result, onInvite, onMessage }: { result: SearchResult; onInvite: () => void; onMessage: () => void }) {
  const isWorker = result.kind === "SUPPORT_WORKER";
  const name = isWorker ? result.user.name : (result.businessName ?? result.user.name);
  const services = (isWorker ? result.servicesOffered : result.coreServices) ?? [];
  const rating = isWorker ? result.rating : result.averageRating;
  const totalReviews = isWorker ? result.totalReviews : result.totalRatings;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-900">{name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isWorker ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700"}`}>
            {isWorker ? "Support worker" : "Provider"}
          </span>
          {isWorker && result.isAvailableNow && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Available now</span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${result.documentStatus === "COMPLETE" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {result.documentStatus === "COMPLETE" ? "Documents submitted" : "Documents pending"}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={onMessage}>Message first</Button>
          <Button size="sm" variant="outline" onClick={onInvite}>Invite to request</Button>
        </div>
      </div>

      {(isWorker ? result.listingHeadline : result.businessDescription) && (
        <p className="text-sm text-slate-700 mb-2">{isWorker ? result.listingHeadline : result.businessDescription}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
        {isWorker && result.suburb && <span>{result.suburb}, {result.state}</span>}
        {typeof totalReviews === "number" && totalReviews > 0 && <span>★ {rating?.toFixed(1)} ({totalReviews})</span>}
        {isWorker && result.hourlyRate != null && <span className="font-semibold text-emerald-700">${result.hourlyRate}/hr</span>}
        {!isWorker && result.ndisRegistered && <span className="font-semibold text-emerald-700">NDIS registered</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {services.slice(0, 4).map((s) => (
          <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">{s}</span>
        ))}
      </div>

      {result.fitSummary && (result.fitSummary.met.length > 0 || result.fitSummary.missing.length > 0) && (
        <div className="text-xs mt-2 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-600">Fit for this participant: </span>
          {result.fitSummary.met.map((m) => <span key={m} className="text-emerald-600 mr-2">✓ {m}</span>)}
          {result.fitSummary.missing.map((m) => <span key={m} className="text-amber-600 mr-2">△ {m}</span>)}
        </div>
      )}
    </div>
  );
}
