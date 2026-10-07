"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { inp, lbl } from "@/components/jobs/post/shared";
import { TeamMembersTab, type WorkforceTeamMember } from "@/components/provider/TeamMembersTab";

interface Branch {
  id: string;
  name: string;
  createdAt: string;
  _count: { administrators: number; teamMembers: number };
}

interface Administrator {
  id: string;
  user: { id: string; name: string; email: string };
  branches: { id: string; name: string }[];
  createdAt: string;
}

type Tab = "branches" | "administrators" | "team";

export default function ProviderOrganisationPage() {
  const [tab, setTab] = useState<Tab>("branches");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [teamMembers, setTeamMembers] = useState<WorkforceTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get<{ branches: Branch[] }>("/provider-org/branches"),
      api.get<{ administrators: Administrator[] }>("/provider-org/administrators"),
      api.get<{ teamMembers: WorkforceTeamMember[] }>("/provider-org/team-members"),
    ])
      .then(([b, a, t]) => {
        setBranches(b.branches ?? []);
        setAdministrators(a.administrators ?? []);
        setTeamMembers(t.teamMembers ?? []);
      })
      .catch(e => setError(e instanceof ApiError ? e.message : "Could not load your organisation"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  function handleError(e: unknown) {
    if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) {
      setLimitMessage(`${e.message} Need more capacity? Contact Shiftify.`);
    } else {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    }
  }

  return (
    <>
      <PageHeader
        title="My Organisation"
        description="Manage Branches, Administrators, and Team Members across your provider organisation."
      />
      <div className="mx-auto max-w-4xl px-5 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {limitMessage && <UpgradePrompt message={limitMessage} />}

        <div className="flex gap-2 mb-5">
          {(["branches", "administrators", "team"] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "team" ? "Team Members" : t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
        ) : tab === "branches" ? (
          <BranchesTab
            branches={branches}
            onCreated={loadAll}
            onError={handleError}
            clearMessages={() => { setError(null); setLimitMessage(null); }}
          />
        ) : tab === "administrators" ? (
          <AdministratorsTab
            administrators={administrators}
            branches={branches}
            onCreated={loadAll}
            onError={handleError}
            clearMessages={() => { setError(null); setLimitMessage(null); }}
          />
        ) : (
          <TeamMembersTab
            teamMembers={teamMembers}
            branches={branches}
            onCreated={loadAll}
            onError={handleError}
            clearMessages={() => { setError(null); setLimitMessage(null); }}
          />
        )}
      </div>
    </>
  );
}

// ─── Branches ────────────────────────────────────────────────────────────────

function BranchesTab({
  branches, onCreated, onError, clearMessages,
}: {
  branches: Branch[];
  onCreated: () => void;
  onError: (e: unknown) => void;
  clearMessages: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    clearMessages();
    setSaving(true);
    try {
      await api.post("/provider-org/branches", { name: name.trim() });
      setName("");
      onCreated();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    clearMessages();
    try {
      await api.delete(`/provider-org/branches/${id}`);
      onCreated();
    } catch (e) {
      onError(e);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4 px-5 flex items-end gap-3">
          <div className="flex-1">
            <label className={lbl}>New branch name</label>
            <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Northside Office" />
          </div>
          <Button size="sm" disabled={saving || !name.trim()} onClick={create}>{saving ? "..." : "Add branch"}</Button>
        </CardContent>
      </Card>

      {branches.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No Branches yet.</p>
      ) : (
        <div className="space-y-2">
          {branches.map(b => (
            <Card key={b.id}>
              <CardContent className="py-3 px-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-400">{b._count.administrators} administrators · {b._count.teamMembers} team members</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>Remove</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Administrators ─────────────────────────────────────────────────────────

function AdministratorsTab({
  administrators, branches, onCreated, onError, clearMessages,
}: {
  administrators: Administrator[];
  branches: Branch[];
  onCreated: () => void;
  onError: (e: unknown) => void;
  clearMessages: () => void;
}) {
  const [email, setEmail] = useState("");
  const [branchIds, setBranchIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggleBranch(id: string) {
    setBranchIds(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function create() {
    if (!email.trim()) return;
    clearMessages();
    setSaving(true);
    try {
      await api.post("/provider-org/administrators", { email: email.trim(), branchIds: Array.from(branchIds) });
      setEmail("");
      setBranchIds(new Set());
      onCreated();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    clearMessages();
    try {
      await api.delete(`/provider-org/administrators/${id}`);
      onCreated();
    } catch (e) {
      onError(e);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4 px-5 space-y-3">
          <div>
            <label className={lbl}>Administrator's Shiftify email</label>
            <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
            <p className="text-xs text-slate-400 mt-1">They must already have a Shiftify account.</p>
          </div>
          {branches.length > 0 && (
            <div>
              <label className={lbl}>Branches they'll manage (optional)</label>
              <div className="flex flex-wrap gap-1.5">
                {branches.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      branchIds.has(b.id) ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button size="sm" disabled={saving || !email.trim()} onClick={create}>{saving ? "..." : "Add administrator"}</Button>
        </CardContent>
      </Card>

      {administrators.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No Administrators yet.</p>
      ) : (
        <div className="space-y-2">
          {administrators.map(a => (
            <Card key={a.id}>
              <CardContent className="py-3 px-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{a.user.name}</p>
                  <p className="text-xs text-slate-400">{a.user.email}{a.branches.length > 0 ? ` · ${a.branches.map(b => b.name).join(", ")}` : " · all branches"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Remove</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
