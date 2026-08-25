"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkerListing {
  id: string;
  userId: string;
  suburb: string | null;
  state: string | null;
  listingHeadline: string | null;
  bio: string | null;
  rating: number;
  totalReviews: number;
  hourlyRate: number | null;
  hourlyRateType: string | null;
  experienceLevel: string | null;
  servicesOffered: string[] | null;
  availabilityType: string | null;
  emergencyAvailability: boolean;
  acceptsSleepoverShifts: boolean;
  acceptsActiveOvernightShifts: boolean;
  isAvailableNow: boolean;
  cancellationRate: number;
  user: { id: string; name: string; avatarUrl: string | null };
}

const inp = "w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";
const PAGE_SIZE = 20;

interface Filters { suburb: string; state: string; }
const EMPTY_FILTERS: Filters = { suburb: "", state: "" };

type DirectConnectState = "NONE" | "PENDING" | "ACCEPTED" | "DECLINED" | "SENDING";

function WorkerCard({
  worker,
  isProvider,
  connectState,
  onConnect,
}: {
  worker: WorkerListing;
  isProvider: boolean;
  connectState: DirectConnectState;
  onConnect: (workerUserId: string) => void;
}) {
  const rate = worker.hourlyRate != null ? `$${worker.hourlyRate}/hr` : null;
  const services = worker.servicesOffered ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-semibold text-slate-900">{worker.user.name}</span>
        <div className="flex items-center gap-2">
          {worker.isAvailableNow && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              Available now
            </span>
          )}
          {isProvider && connectState === "NONE" && (
            <Button size="sm" variant="outline" onClick={() => onConnect(worker.userId)}>
              Direct Connect
            </Button>
          )}
          {isProvider && connectState === "SENDING" && (
            <Button size="sm" variant="outline" disabled>Sending…</Button>
          )}
          {isProvider && connectState === "PENDING" && (
            <span className="text-xs font-semibold text-amber-600">Invite sent</span>
          )}
          {isProvider && connectState === "ACCEPTED" && (
            <span className="text-xs font-semibold text-emerald-600">Connected</span>
          )}
          {isProvider && connectState === "DECLINED" && (
            <span className="text-xs font-semibold text-slate-400">Declined</span>
          )}
        </div>
      </div>

      {worker.listingHeadline && (
        <p className="text-sm text-slate-700 mb-2">{worker.listingHeadline}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        {worker.suburb && <span>{worker.suburb}, {worker.state}</span>}
        {worker.totalReviews > 0 && <span>★ {worker.rating.toFixed(1)} ({worker.totalReviews})</span>}
        {rate && <span className="font-semibold text-emerald-700">{rate}</span>}
        {worker.experienceLevel && <span>{worker.experienceLevel}</span>}
        {worker.cancellationRate > 0 && (
          <span className="text-amber-600">{Math.round(worker.cancellationRate * 100)}% cancellation rate</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-1">
        {services.slice(0, 4).map(s => (
          <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">{s}</span>
        ))}
        {worker.emergencyAvailability && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">Emergency shifts</span>
        )}
        {worker.acceptsSleepoverShifts && (
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-xs text-violet-700">Sleepover</span>
        )}
        {worker.acceptsActiveOvernightShifts && (
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-xs text-violet-700">Overnight</span>
        )}
      </div>
    </div>
  );
}

interface DirectConnectRequest {
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  worker: { id: string };
}

export default function BrowseWorkersPage() {
  const { activeRole } = useAuth();
  const isProvider = activeRole === "PROVIDER";

  const [workers, setWorkers] = useState<WorkerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [connectStates, setConnectStates] = useState<Record<string, DirectConnectState>>({});

  useEffect(() => {
    if (!isProvider) return;
    api.get<{ requests: DirectConnectRequest[] }>("/direct-connect")
      .then(r => {
        const next: Record<string, DirectConnectState> = {};
        for (const req of r.requests ?? []) next[req.worker.id] = req.status;
        setConnectStates(next);
      })
      .catch(() => { /* non-fatal — button just starts from NONE */ });
  }, [isProvider]);

  function sendDirectConnect(workerUserId: string) {
    setConnectStates(s => ({ ...s, [workerUserId]: "SENDING" }));
    api.post("/direct-connect", { workerUserId })
      .then(() => setConnectStates(s => ({ ...s, [workerUserId]: "PENDING" })))
      .catch(e => {
        setConnectStates(s => ({ ...s, [workerUserId]: "NONE" }));
        setError(e instanceof Error ? e.message : "Could not send the invite");
      });
  }

  const load = useCallback((f: Filters, p: number) => {
    setLoading(true);
    setUpgradeMessage(null);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (f.suburb) params.set("suburb", f.suburb);
    if (f.state)  params.set("state", f.state);

    api.get<{ items: WorkerListing[]; total: number }>(`/workers/available?${params}`)
      .then(r => {
        setWorkers(r.items ?? []);
        setTotal(r.total ?? 0);
      })
      .catch(e => {
        if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) {
          setUpgradeMessage(e.message);
        } else {
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(appliedFilters, page); }, [appliedFilters, page, load]);

  function applyFilters() { setAppliedFilters({ ...filters }); setPage(1); }
  function resetFilters() { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setPage(1); }

  return (
    <>
      <PageHeader
        title="Browse Workers"
        description={`${total} worker${total !== 1 ? "s" : ""} publicly listing their availability`}
      />
      <div className="mx-auto max-w-6xl px-5 py-6">
        {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Card className="mb-4">
          <CardContent className="py-4 px-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-48">
                <label className={lbl}>Suburb</label>
                <input className={inp} placeholder="e.g. Parramatta" value={filters.suburb} onChange={e => setFilters(f => ({ ...f, suburb: e.target.value }))} />
              </div>
              <div className="w-40">
                <label className={lbl}>State</label>
                <input className={inp} placeholder="e.g. NSW" value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))} />
              </div>
              <Button size="sm" onClick={applyFilters}>Apply</Button>
              <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline">Reset</button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No workers found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {workers.map(w => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  isProvider={isProvider}
                  connectState={connectStates[w.userId] ?? "NONE"}
                  onConnect={sendDirectConnect}
                />
              ))}
            </div>
            {total > PAGE_SIZE && (
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="flex items-center text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
                <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
