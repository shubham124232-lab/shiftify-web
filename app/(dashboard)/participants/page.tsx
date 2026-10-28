"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserRole } from "@/lib/types";
import {
  WorkspacePage, Panel, FilterBar, fieldClass, Chip, Avatar, Empty, ErrorNote, OutlineButton, PrimaryButton, shortName,
} from "@/components/coordinator/workspace-ui";
import { RepeatSupportModal } from "@/components/jobs/RepeatSupportModal";

interface ManagedParticipant { id: string; name: string; email: string | null; phone: string | null; ndisNumber?: string; suburb?: string | null; state?: string | null; }
interface Connection {
  id: string; status: string; canPostRequests: boolean; initiatedBy?: string;
  participant: { id: string; name: string; defaultSuburb?: string | null; defaultState?: string | null };
}
interface JobSummary {
  id: string; status: string; urgency: string; forParticipantUserId?: string | null;
  scheduledStartAt: string; postedAt: string; _count?: { applications: number };
}

interface PortfolioEntry {
  id: string; name: string; email: string | null; phone: string | null;
  source: "MANAGED" | "CONNECTION";
  connectionStatus?: string; canPostRequests?: boolean; suburb?: string | null; state?: string | null;
  activeCount: number; unfilledCount: number; newResponseCount: number; lastActivity: string | null;
  mostRecentJobId: string | null;
}

export default function ParticipantsPage() {
  const { activeRole } = useAuth();
  const [managed, setManaged] = useState<ManagedParticipant[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [repeatJobId, setRepeatJobId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "NEW_RESPONSES" | "UNFILLED">("ALL");
  // SC-PT01 — connection status filter (Connected / Managed / Awaiting approval).
  const [connFilter, setConnFilter] = useState<"ANY" | "CONNECTED" | "MANAGED" | "PENDING">("ANY");

  function load() {
    setLoading(true);
    Promise.all([
      api.get<{ users: ManagedParticipant[] }>("/linking/participants").catch(() => ({ users: [] })),
      api.get<{ connections: Connection[] }>("/coordinator-connections").catch(() => ({ connections: [] })),
      api.get<{ jobs: JobSummary[] }>("/jobs/my").catch(() => ({ jobs: [] })),
    ])
      .then(([m, c, j]) => {
        setManaged(m.users ?? []);
        setConnections(c.connections ?? []);
        setJobs(j.jobs ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (activeRole === UserRole.COORDINATOR) load(); }, [activeRole]); // eslint-disable-line

  async function handleUnlink(id: string, name: string) {
    if (!confirm(`Remove ${name} from your participants? They will no longer be linked to you.`)) return;
    setUnlinking(id);
    try {
      await api.del(`/linking/participants/${id}`);
      setManaged((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) { setError(err?.message ?? "Failed to remove participant."); }
    finally { setUnlinking(null); }
  }


  const portfolio: PortfolioEntry[] = useMemo(() => {
    const acceptedConnections = connections.filter((c) => c.status === "ACCEPTED" || c.status === "PENDING");
    const entries: PortfolioEntry[] = [
      ...managed.map((p) => ({
        id: p.id, name: p.name, email: p.email, phone: p.phone, source: "MANAGED" as const, suburb: p.suburb, state: p.state,
        activeCount: 0, unfilledCount: 0, newResponseCount: 0, lastActivity: null as string | null, mostRecentJobId: null as string | null,
      })),
      ...acceptedConnections.map((c) => ({
        id: c.participant.id, name: c.participant.name, email: null, phone: null, source: "CONNECTION" as const,
        connectionStatus: c.status, canPostRequests: c.canPostRequests, suburb: c.participant.defaultSuburb, state: c.participant.defaultState,
        activeCount: 0, unfilledCount: 0, newResponseCount: 0, lastActivity: null as string | null, mostRecentJobId: null as string | null,
      })),
    ];
    for (const entry of entries) {
      const theirJobs = jobs.filter((j) => j.forParticipantUserId === entry.id);
      entry.activeCount = theirJobs.filter((j) => !["CANCELLED", "COMPLETED", "CONFIRMED", "DRAFT"].includes(j.status)).length;
      entry.unfilledCount = theirJobs.filter((j) => j.status === "OPEN").length;
      entry.newResponseCount = theirJobs.filter((j) => j.status === "OPEN" && (j._count?.applications ?? 0) > 0).length;
      const sorted = [...theirJobs].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      entry.lastActivity = sorted[0]?.postedAt ?? null;
      entry.mostRecentJobId = sorted[0]?.id ?? null;
    }
    return entries;
  }, [managed, connections, jobs]);

  const filtered = portfolio.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !(p.suburb ?? "").toLowerCase().includes(q)) return false;
    if (connFilter === "CONNECTED" && !(p.source === "CONNECTION" && p.connectionStatus === "ACCEPTED")) return false;
    if (connFilter === "MANAGED" && p.source !== "MANAGED") return false;
    if (connFilter === "PENDING" && p.connectionStatus !== "PENDING") return false;
    if (statusFilter === "ACTIVE" && p.activeCount === 0) return false;
    if (statusFilter === "NEW_RESPONSES" && p.newResponseCount === 0) return false;
    if (statusFilter === "UNFILLED" && p.unfilledCount === 0) return false;
    return true;
  });

  if (activeRole !== UserRole.COORDINATOR) {
    return (
      <>
        <PageHeader title="My Participants" />
        <div className="px-5 py-8">
          <p className="text-sm text-slate-500">This page is only available to Coordinator accounts.</p>
        </div>
      </>
    );
  }

  const enquiries = connections.filter((c) => c.status === "PENDING" && c.initiatedBy === "PARTICIPANT").length;

  return (
    <WorkspacePage
      title="Participants"
      description="Manage connections, authority and participant-specific support."
      actions={
        <>
          <OutlineButton href="/participants/connect">Connect existing participant</OutlineButton>
          <PrimaryButton href="/participants/new">Add or connect participant</PrimaryButton>
        </>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}

      {/* SC-B03 — participant enquiries (connection requests started by the participant). */}
      {enquiries > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[13px] text-slate-800">
          <span><strong>{enquiries}</strong> participant {enquiries === 1 ? "enquiry is" : "enquiries are"} waiting for your response.</span>
          <OutlineButton href="/coordinator-connections" className="px-2.5 py-1.5 text-xs">View enquiry</OutlineButton>
        </div>
      )}

      <FilterBar>
        <input className={`${fieldClass} w-full max-w-xs`} placeholder="Search preferred name or suburb" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={fieldClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Request status">
          <option value="ALL">All participants</option>
          <option value="ACTIVE">With active requests</option>
          <option value="NEW_RESPONSES">With new responses</option>
          <option value="UNFILLED">With unfilled requests</option>
        </select>
        <select className={fieldClass} value={connFilter} onChange={(e) => setConnFilter(e.target.value as typeof connFilter)} aria-label="Connection status">
          <option value="ANY">Any connection</option>
          <option value="CONNECTED">Connected</option>
          <option value="MANAGED">Managed account</option>
          <option value="PENDING">Awaiting approval</option>
        </select>
      </FilterBar>

      {loading ? <Empty>Loading…</Empty> : filtered.length === 0 ? (
        <Panel><Empty>No participants found. Add participants to post requests on their behalf, or connect with an existing one.</Empty></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const pending = p.connectionStatus === "PENDING";
            const canPost = !pending && !(p.source === "CONNECTION" && p.canPostRequests === false);
            return (
              <div key={p.id} className="flex flex-col rounded-xl border border-[#e4e6ed] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-900">{shortName(p.name)}</p>
                    <p className="text-xs text-slate-500">
                      {p.suburb ? `${p.suburb}${p.state ? `, ${p.state}` : ""}` : (p.email ?? p.phone ?? "No location")}
                      {p.lastActivity && ` · Last activity ${new Date(p.lastActivity).toLocaleDateString("en-AU")}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.source === "MANAGED" ? <Chip tone="blue">Managed</Chip> : pending ? <Chip tone="amber">Pending</Chip> : <Chip tone="green">Connected</Chip>}
                  {p.source === "CONNECTION" && !pending && p.canPostRequests === false && <Chip tone="amber">Posting not authorised</Chip>}
                </div>
                <p className="mt-4 flex-1 text-sm text-slate-700">
                  {pending
                    ? "Participant approval is required before accessing their private information."
                    : `${p.activeCount} active · ${p.unfilledCount} unfilled · ${p.newResponseCount} with new responses`}
                </p>
                {p.mostRecentJobId && !pending && (
                  <button type="button" onClick={() => setRepeatJobId(p.mostRecentJobId!)} className="mt-2 self-start text-xs font-semibold text-brand-600 hover:underline">
                    Repeat previous request
                  </button>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <OutlineButton href={`/participants/${p.id}?source=${p.source}`}>Open participant</OutlineButton>
                    {p.source === "MANAGED" && (
                      <>
                        <OutlineButton href={`/participants/${p.id}/edit`}>Edit</OutlineButton>
                        <OutlineButton onClick={() => handleUnlink(p.id, p.name)} disabled={unlinking === p.id}>{unlinking === p.id ? "…" : "Remove"}</OutlineButton>
                      </>
                    )}
                  </div>
                  {canPost && <PrimaryButton href="/jobs/post">Post request</PrimaryButton>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {repeatJobId && <RepeatSupportModal jobId={repeatJobId} onClose={() => setRepeatJobId(null)} />}
    </WorkspacePage>
  );
}
