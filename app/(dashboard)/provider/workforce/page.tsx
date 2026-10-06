"use client";

// Provider PR-W01–W04 "Internal workforce". Built on the V2 Team Member model
// (Pricing V2 §4.4): Provider adds name, mobile, skills and Branch; the worker
// verifies their mobile and sees only their own offers and assignments.
// Workers created with their own login (managed accounts) are listed alongside,
// so one screen shows every state: invited, pending, active, inactive, removed.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { TeamMembersTab, type WorkforceBranch, type WorkforceTeamMember } from "@/components/provider/TeamMembersTab";

interface ManagedWorker { id: string; name: string; email: string | null; phone: string | null; status: string }

interface Capacity {
  planLabel: string;
  teamMembers: { used: number; max: number | null };
  administrators: { used: number; max: number | null };
  branches: { used: number; max: number | null };
}

export default function InternalWorkforcePage() {
  const [members, setMembers] = useState<WorkforceTeamMember[]>([]);
  const [branches, setBranches] = useState<WorkforceBranch[]>([]);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [managed, setManaged] = useState<ManagedWorker[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<{ teamMembers: WorkforceTeamMember[] }>("/provider-org/team-members"),
      api.get<{ branches: WorkforceBranch[] }>("/provider-org/branches"),
      api.get<{ capacity: Capacity | null }>("/provider-org/capacity"),
      api.get<{ users: ManagedWorker[] }>("/linking/workers").catch(() => ({ users: [] as ManagedWorker[] })),
    ])
      .then(([t, b, c, w]) => {
        setMembers(t.teamMembers ?? []);
        setBranches(b.branches ?? []);
        setCapacity(c.capacity ?? null);
        setManaged(w.users ?? []);
      })
      .catch(e => setError(e instanceof ApiError ? e.message : "Could not load your workforce"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleError(e: unknown) {
    if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) {
      setLimitMessage(`${e.message} Need more capacity? Contact Shiftify.`);
    } else {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    }
  }

  async function removeManaged(w: ManagedWorker) {
    if (!confirm(`Remove ${w.name} from your workforce? They will be suspended and unlinked.`)) return;
    setRemoving(w.id);
    try {
      await api.del(`/linking/workers/${w.id}`);
      load();
    } catch (e) {
      handleError(e);
    } finally {
      setRemoving(null);
    }
  }

  const managedActive = managed.filter(w => w.status === "ACTIVE").length;
  const rosterVerified = members.filter(m => m.inviteStatus === "VERIFIED").length;
  const verified = rosterVerified + managedActive;
  const pending = members.length - rosterVerified + (managed.length - managedActive);

  return (
    <>
      <PageHeader title="Internal Workforce" description="Your own workers — invite them, track verification and allocate opportunities." />
      <div className="mx-auto max-w-4xl px-5 py-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={limitMessage} />}

        {loading ? (
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
        ) : !capacity ? (
          <UpgradePrompt message="An active Provider organisation plan is required to manage an internal workforce." />
        ) : (
          <>
            {/* PR-W01 overview + PR-W04 plan limits */}
            <Card className="mb-5">
              <CardContent className="py-4 px-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 m-0">Team Members ({capacity.planLabel} plan)</p>
                  <p className="font-semibold text-slate-900 m-0">{capacity.teamMembers.used} of {capacity.teamMembers.max ?? "unlimited"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 m-0">Active</p>
                  <p className="font-semibold text-slate-900 m-0">{verified}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 m-0">Invited / pending</p>
                  <p className="font-semibold text-slate-900 m-0">{pending}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 m-0">Branches</p>
                  <p className="font-semibold text-slate-900 m-0">{capacity.branches.used} of {capacity.branches.max ?? "unlimited"}</p>
                </div>
                <p className="col-span-2 sm:col-span-4 text-xs text-slate-500 m-0">
                  Limits apply across your whole organisation. Each person counts once, even on several Branches, and people removed earlier this billing period still count until it ends. Exceeding a limit never affects a confirmed shift.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Workers with their own login ({managed.length})</CardTitle>
                <Link href="/team/new" className="text-sm font-semibold" style={{ color: "var(--td-pink)" }}>+ Add worker with login</Link>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mt-0 mb-3">
                  Create a worker account you manage (username and password), then complete their profile, availability and documents. Use &quot;Invite by mobile&quot; below for workers who just verify their mobile.
                </p>
                {managed.length === 0 ? (
                  <p className="text-sm text-slate-500 m-0">No workers with a login yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {managed.map(w => (
                      <div key={w.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="m-0 text-sm font-semibold text-slate-900 truncate">{w.name}</p>
                          <p className="m-0 text-xs text-slate-500 truncate">{w.email ?? w.phone ?? "No contact"}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${w.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {w.status === "ACTIVE" ? "Active" : w.status === "DRAFT" ? "Setup incomplete" : "Inactive"}
                        </span>
                        <Link href={`/team/${w.id}/edit`} className="text-xs font-semibold text-slate-700 underline">
                          {w.status === "DRAFT" ? "Continue setup" : "Edit"}
                        </Link>
                        <button type="button" onClick={() => removeManaged(w)} disabled={removing === w.id}
                          className="text-xs text-red-600 underline disabled:opacity-50">
                          {removing === w.id ? "…" : "Remove"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <TeamMembersTab
              teamMembers={members}
              branches={branches}
              onCreated={load}
              onError={handleError}
              clearMessages={() => { setError(null); setLimitMessage(null); }}
            />
          </>
        )}
      </div>
    </>
  );
}
