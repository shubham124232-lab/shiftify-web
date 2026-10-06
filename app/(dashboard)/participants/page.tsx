"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";
import { inp } from "@/components/jobs/post/shared";
import { RepeatSupportModal } from "@/components/jobs/RepeatSupportModal";

interface ManagedParticipant { id: string; name: string; email: string | null; phone: string | null; ndisNumber?: string; }
interface Connection {
  id: string; status: string; canPostRequests: boolean;
  participant: { id: string; name: string };
}
interface JobSummary {
  id: string; status: string; urgency: string; forParticipantUserId?: string | null;
  scheduledStartAt: string; postedAt: string; _count?: { applications: number };
}

interface PortfolioEntry {
  id: string; name: string; email: string | null; phone: string | null;
  source: "MANAGED" | "CONNECTION";
  connectionStatus?: string; canPostRequests?: boolean;
  activeCount: number; unfilledCount: number; newResponseCount: number; lastActivity: string | null;
  mostRecentJobId: string | null;
}

export default function ParticipantsPage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const [managed, setManaged] = useState<ManagedParticipant[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [repeatJobId, setRepeatJobId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "NEW_RESPONSES" | "UNFILLED">("ALL");

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
    const acceptedConnections = connections.filter((c) => c.status === "ACCEPTED");
    const entries: PortfolioEntry[] = [
      ...managed.map((p) => ({
        id: p.id, name: p.name, email: p.email, phone: p.phone, source: "MANAGED" as const,
        activeCount: 0, unfilledCount: 0, newResponseCount: 0, lastActivity: null as string | null, mostRecentJobId: null as string | null,
      })),
      ...acceptedConnections.map((c) => ({
        id: c.participant.id, name: c.participant.name, email: null, phone: null, source: "CONNECTION" as const,
        connectionStatus: c.status, canPostRequests: c.canPostRequests,
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
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
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

  return (
    <>
      <PageHeader
        title="My Participants"
        description="Participants you support and can post jobs on behalf of."
        actions={<div className="flex gap-2"><Button variant="outline" onClick={() => router.push("/participants/connect")}>Connect existing participant</Button><Button onClick={() => router.push("/participants/new")}>+ Add Participant</Button></div>}
      />
      <div className="mx-auto max-w-3xl px-5 py-6 flex flex-col gap-5">

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3 flex-wrap items-center">
          <input className={`${inp} max-w-xs`} placeholder="Search by name or suburb" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-2">
            {([
              { v: "ALL", l: "All" }, { v: "ACTIVE", l: "Active" },
              { v: "NEW_RESPONSES", l: "New responses" }, { v: "UNFILLED", l: "Unfilled" },
            ] as const).map((opt) => (
              <button key={opt.v} type="button" onClick={() => setStatusFilter(opt.v)}
                className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${statusFilter === opt.v ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Participants ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-slate-400">Loading...</p>
              : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👤</div>
                  <p className="text-sm font-semibold text-slate-700">No participants found</p>
                  <p className="text-xs text-slate-400 mt-1">Add participants to post jobs on their behalf, or connect with an existing one.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filtered.map((p) => (
                    <div key={p.id} className="flex flex-col gap-2 px-3.5 py-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-pink-50 flex items-center justify-center text-base font-bold text-pink-700 shrink-0">
                          {p.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.source === "MANAGED" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                              {p.source === "MANAGED" ? "Managed account" : "Connected"}
                            </span>
                            {p.source === "CONNECTION" && p.canPostRequests === false && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Posting not authorised</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {p.email ?? p.phone ?? "No contact"}
                            {p.lastActivity && <span> · Last activity {new Date(p.lastActivity).toLocaleDateString("en-AU")}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Link href={`/participants/${p.id}?source=${p.source}`}><Button variant="outline" size="sm">View</Button></Link>
                          {p.source === "MANAGED" && (
                            <>
                              <Link href={`/participants/${p.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                              <Button variant="outline" size="sm" onClick={() => handleUnlink(p.id, p.name)} disabled={unlinking === p.id}>
                                {unlinking === p.id ? "..." : "Remove"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pl-12">
                        <span className="text-[11px] text-slate-500">{p.activeCount} active</span>
                        <span className="text-[11px] text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500">{p.unfilledCount} unfilled</span>
                        <span className="text-[11px] text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500">{p.newResponseCount} new responses</span>
                        {p.mostRecentJobId && (
                          <button type="button" onClick={() => setRepeatJobId(p.mostRecentJobId!)}
                            className="ml-auto text-[11px] font-medium text-brand-600 hover:text-brand-700 underline">
                            Repeat previous request
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
      {repeatJobId && <RepeatSupportModal jobId={repeatJobId} onClose={() => setRepeatJobId(null)} />}
    </>
  );
}
