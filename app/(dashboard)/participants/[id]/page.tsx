"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";
import { RepeatSupportModal } from "@/components/jobs/RepeatSupportModal";

// SC journey Journey 12, PT03 "Participant overview" — a read-focused detail
// screen sitting between the portfolio list (participants/page.tsx) and the
// managed-account edit form (participants/[id]/edit). Two source types render
// differently: a MANAGED participant's full profile can be fetched (the
// coordinator is its parentUserId, per user.controller.ts's getChild guard);
// a CONNECTION participant's profile can't be — GET /users/:id 403s unless
// you're the parent — so that view only shows what the connection/job records
// already exposed on the portfolio list. This mirrors the same privacy
// boundary the rest of the app already enforces, not a gap in this page.
interface ManagedUser {
  id: string; name: string; email: string | null; phone: string | null; defaultSuburb: string | null;
  participantProfile?: {
    ndisNumber?: string | null; participantType?: string | null; primaryDisability?: string | null;
    fundingManagementType?: string | null; suburb?: string | null; state?: string | null;
    emergencyContactName?: string | null; emergencyContactPhone?: string | null;
  } | null;
}
interface Connection {
  id: string; status: string;
  canPostRequests: boolean; canViewInfo: boolean; canMessage: boolean;
  canShortlist: boolean; canConfirmBookings: boolean; canManageReplacements: boolean;
  postingApprovalStatus: "PENDING" | "APPROVED" | "DECLINED" | null;
  permissionRequestPending: boolean;
  requestedPermissions: Record<string, boolean> | null;
  participant: { id: string; name: string };
}

const PERMISSION_FLAGS: { key: keyof Connection; label: string }[] = [
  { key: "canViewInfo", label: "Can view approved information" },
  { key: "canPostRequests", label: "Can post requests" },
  { key: "canShortlist", label: "Can shortlist" },
  { key: "canMessage", label: "Can message" },
  { key: "canConfirmBookings", label: "Can confirm support" },
  { key: "canManageReplacements", label: "Can manage replacements" },
];
interface JobSummary {
  id: string; title: string; status: string; urgency: string; forParticipantUserId?: string | null;
  scheduledStartAt: string; postedAt: string; _count?: { applications: number };
}

export default function ParticipantOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { activeRole } = useAuth();
  const isManaged = searchParams.get("source") !== "CONNECTION";

  const [managedUser, setManagedUser] = useState<ManagedUser | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repeatJobId, setRepeatJobId] = useState<string | null>(null);
  const [requestingPerms, setRequestingPerms] = useState(false);
  const [permsToRequest, setPermsToRequest] = useState<Record<string, boolean>>({});
  const [permError, setPermError] = useState<string | null>(null);

  useEffect(() => {
    if (activeRole !== UserRole.COORDINATOR || !id) return;
    setLoading(true);
    Promise.all([
      isManaged
        ? api.get<{ user: ManagedUser }>(`/users/${id}`).catch(() => ({ user: null }))
        : Promise.resolve({ user: null }),
      api.get<{ connections: Connection[] }>("/coordinator-connections").catch(() => ({ connections: [] })),
      api.get<{ jobs: JobSummary[] }>("/jobs/my").catch(() => ({ jobs: [] })),
    ])
      .then(([u, c, j]) => {
        setManagedUser(u.user);
        setConnection((c.connections ?? []).find((conn) => conn.participant.id === id) ?? null);
        setJobs((j.jobs ?? []).filter((job) => job.forParticipantUserId === id));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this participant"))
      .finally(() => setLoading(false));
  }, [activeRole, id, isManaged]);

  const name = managedUser?.name ?? connection?.participant.name ?? "Participant";
  const pp = managedUser?.participantProfile;

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()),
    [jobs],
  );
  const activeJobs = sortedJobs.filter((j) => !["CANCELLED", "COMPLETED", "CONFIRMED", "DRAFT"].includes(j.status));
  const pastJobs = sortedJobs.filter((j) => ["COMPLETED", "CONFIRMED", "CANCELLED"].includes(j.status));

  async function requestPermissions() {
    if (!connection) return;
    const requested = Object.fromEntries(Object.entries(permsToRequest).filter(([, v]) => v));
    if (Object.keys(requested).length === 0) { setPermError("Choose at least one permission to request."); return; }
    setPermError(null);
    try {
      await api.post("/coordinator-connections/request-permissions", { participantUserId: connection.participant.id, requested });
      setRequestingPerms(false);
      setPermsToRequest({});
      setConnection((prev) => (prev ? { ...prev, permissionRequestPending: true } : prev));
    } catch (err: any) {
      setPermError(err instanceof ApiError ? err.message : "Could not send that request.");
    }
  }

  if (activeRole !== UserRole.COORDINATOR) {
    return (
      <>
        <PageHeader title="Participant" />
        <div className="px-5 py-8"><p className="text-sm text-slate-500">This page is only available to Coordinator accounts.</p></div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={name}
        description={isManaged ? "Managed account" : "Connected participant"}
        actions={
          <div className="flex gap-2">
            {isManaged && <Link href={`/participants/${id}/edit`}><Button variant="outline">Edit</Button></Link>}
            <Link href="/jobs/post"><Button>Post a request</Button></Link>
          </div>
        }
      />
      <div className="mx-auto max-w-3xl px-5 py-6 flex flex-col gap-5">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {isManaged ? (
                  <>
                    <Row label="Email" value={managedUser?.email} />
                    <Row label="Phone" value={managedUser?.phone} />
                    <Row label="Suburb" value={pp?.suburb ?? managedUser?.defaultSuburb} />
                    <Row label="NDIS number" value={pp?.ndisNumber} />
                    <Row label="Participant type" value={pp?.participantType} />
                    <Row label="Primary disability" value={pp?.primaryDisability} />
                    <Row label="Funding management" value={pp?.fundingManagementType} />
                    <Row label="Emergency contact" value={pp?.emergencyContactName ? `${pp.emergencyContactName}${pp.emergencyContactPhone ? ` — ${pp.emergencyContactPhone}` : ""}` : null} />
                  </>
                ) : connection ? (
                  <>
                    <Row label="Connection status" value={connection.status} />
                    {connection.postingApprovalStatus && <Row label="Posting approval" value={connection.postingApprovalStatus} />}
                    <p className="text-xs text-slate-400 mt-1">
                      This participant manages their own account — only what they've shared via your connection is shown here.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 m-0">No connection details available.</p>
                )}
              </CardContent>
            </Card>

            {!isManaged && connection && (
              <Card>
                <CardHeader><CardTitle>Permission status</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  {connection.status !== "ACCEPTED" ? (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
                      Connection paused/disconnected — no permissions are currently active.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5 text-sm">
                      {PERMISSION_FLAGS.map((p) => (
                        <div key={p.key} className="flex items-center gap-2">
                          <span className={connection[p.key] ? "text-emerald-600" : "text-slate-300"}>{connection[p.key] ? "✓" : "✕"}</span>
                          <span className={connection[p.key] ? "text-slate-700" : "text-slate-400"}>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {connection.permissionRequestPending ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                      Waiting on {name} to respond to your permission request.
                    </p>
                  ) : requestingPerms ? (
                    <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 pt-2.5">
                      <span className="text-xs font-medium text-slate-600">Which permissions would you like to request?</span>
                      {PERMISSION_FLAGS.filter((p) => !connection[p.key]).map((p) => (
                        <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(permsToRequest[p.key as string])}
                            onChange={(e) => setPermsToRequest((prev) => ({ ...prev, [p.key as string]: e.target.checked }))}
                          />
                          {p.label}
                        </label>
                      ))}
                      {PERMISSION_FLAGS.every((p) => connection[p.key]) && (
                        <p className="text-xs text-slate-400 m-0">You already have every available permission.</p>
                      )}
                      {permError && <p className="text-xs text-red-600 m-0">{permError}</p>}
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="outline" onClick={() => { setRequestingPerms(false); setPermsToRequest({}); setPermError(null); }}>Cancel</Button>
                        <Button size="sm" onClick={requestPermissions}>Send request</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="self-start mt-1" onClick={() => setRequestingPerms(true)}>Request additional permission</Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Active requests ({activeJobs.length})</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2">
                {activeJobs.length === 0 ? (
                  <p className="text-sm text-slate-400 m-0">No active requests for this participant right now.</p>
                ) : activeJobs.map((j) => <JobRow key={j.id} job={j} onRepeat={setRepeatJobId} />)}
              </CardContent>
            </Card>

            {/* SC-PT03 — what the coordinator can manage for this participant. */}
            <Card>
              <CardHeader><CardTitle>Manage for {name}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link href="/upcoming-support"><Button size="sm" variant="outline">Upcoming confirmed support</Button></Link>
                <Link href="/jobs/my"><Button size="sm" variant="outline">Recent responses</Button></Link>
                <Link href="/saved-professionals"><Button size="sm" variant="outline">Saved workers and providers</Button></Link>
                <Link href="/messages"><Button size="sm" variant="outline">Messages</Button></Link>
                <Link href="/find"><Button size="sm" variant="outline">Find support</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Past requests ({pastJobs.length})</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2">
                {pastJobs.length === 0 ? (
                  <p className="text-sm text-slate-400 m-0">No past requests yet.</p>
                ) : pastJobs.slice(0, 10).map((j) => <JobRow key={j.id} job={j} onRepeat={setRepeatJobId} />)}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {repeatJobId && <RepeatSupportModal jobId={repeatJobId} onClose={() => setRepeatJobId(null)} />}
    </>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}

function JobRow({ job, onRepeat }: { job: JobSummary; onRepeat: (jobId: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 border border-slate-200 rounded-lg">
      <div className="min-w-0">
        <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-brand-700 hover:underline truncate block">{job.title}</Link>
        <span className="text-xs text-slate-400">{job.status} · {new Date(job.scheduledStartAt).toLocaleDateString("en-AU")}</span>
      </div>
      {["COMPLETED", "CONFIRMED", "CANCELLED"].includes(job.status) && (
        <button type="button" onClick={() => onRepeat(job.id)}
          className="text-[11px] font-medium text-brand-600 hover:text-brand-700 underline shrink-0">
          Repeat
        </button>
      )}
    </div>
  );
}
