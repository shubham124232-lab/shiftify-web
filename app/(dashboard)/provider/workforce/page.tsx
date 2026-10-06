"use client";

// Provider PR-W01–W04 "Internal workforce". Built on the V2 Team Member model
// (Pricing V2 §4.4): Provider adds name, mobile, skills and Branch; the worker
// verifies their mobile and sees only their own offers and assignments.

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { TeamMembersTab, type WorkforceBranch, type WorkforceTeamMember } from "@/components/provider/TeamMembersTab";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<{ teamMembers: WorkforceTeamMember[] }>("/provider-org/team-members"),
      api.get<{ branches: WorkforceBranch[] }>("/provider-org/branches"),
      api.get<{ capacity: Capacity | null }>("/provider-org/capacity"),
    ])
      .then(([t, b, c]) => {
        setMembers(t.teamMembers ?? []);
        setBranches(b.branches ?? []);
        setCapacity(c.capacity ?? null);
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

  const verified = members.filter(m => m.inviteStatus === "VERIFIED").length;
  const pending = members.length - verified;

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
