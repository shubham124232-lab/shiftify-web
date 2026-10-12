"use client";

import { useBranchWorkspace } from "@/lib/store/branchWorkspace";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OrgCapacityBar } from "@/components/provider/OrgCapacityBar";
import { inp, lbl } from "@/components/jobs/post/shared";

type Preset = "ADMINISTRATOR" | "BRANCH_MANAGER" | "INTAKE" | "WORKFORCE" | "READ_ONLY";

interface Administrator {
  id: string;
  rolePreset: Preset;
  status: "ACTIVE" | "INACTIVE";
  billingAccess?: boolean;
  user: { id: string; name: string; email: string };
  branches: { id: string; name: string }[];
}
interface Branch { id: string; name: string }

const PRESETS: { value: Preset; label: string }[] = [
  { value: "ADMINISTRATOR", label: "Organisation Administrator" },
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
  { value: "INTAKE", label: "Intake" },
  { value: "WORKFORCE", label: "Workforce" },
  { value: "READ_ONLY", label: "Read-only" },
];
const presetLabel = (p: string) => PRESETS.find((x) => x.value === p)?.label ?? p;

export default function ProviderAdministratorsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Invite form
  const workspaceBranch = useBranchWorkspace((s) => s.branchId);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [invitePreset, setInvitePreset] = useState<Preset>("ADMINISTRATOR");
  const [inviteBilling, setInviteBilling] = useState(false);
  const [inviteBranches, setInviteBranches] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Edit permissions
  const [editId, setEditId] = useState<string | null>(null);
  const [editPreset, setEditPreset] = useState<Preset>("ADMINISTRATOR");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editBranches, setEditBranches] = useState<Set<string>>(new Set());
  const [editBilling, setEditBilling] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      api.get<{ administrators: Administrator[] }>("/provider-org/administrators"),
      api.get<{ branches: Branch[] }>("/provider-org/branches"),
    ])
      .then(([a, b]) => { setAdmins(a.administrators ?? []); setBranches(b.branches ?? []); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load administrators"))
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

  const toggleIn = (set: Set<string>, id: string) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n; };

  async function invite() {
    if (!email.trim()) return;
    setSaving(true); setError(null); setLimitMessage(null);
    try {
      await api.post("/provider-org/administrators", { email: email.trim(), rolePreset: invitePreset, billingAccess: inviteBilling, branchIds: [...inviteBranches] });
      setInviting(false); setEmail(""); setInvitePreset("ADMINISTRATOR"); setInviteBilling(false); setInviteBranches(new Set());
      setRefresh((n) => n + 1);
      await load();
    } catch (e) { handleError(e); } finally { setSaving(false); }
  }

  function startEdit(a: Administrator) {
    setError(null); setLimitMessage(null);
    setEditId(a.id); setEditPreset(a.rolePreset); setEditStatus(a.status); setEditBranches(new Set(a.branches.map((b) => b.id))); setEditBilling(!!a.billingAccess);
  }

  async function saveEdit() {
    if (!editId) return;
    setBusyId(editId); setError(null);
    try {
      await api.patch(`/provider-org/administrators/${editId}`, { rolePreset: editPreset, status: editStatus, billingAccess: editBilling, branchIds: [...editBranches] });
      setEditId(null);
      await load();
    } catch (e) { handleError(e); } finally { setBusyId(null); }
  }

  async function remove(a: Administrator) {
    if (!window.confirm(`Remove ${a.user.name} as an Administrator?`)) return;
    setBusyId(a.id); setError(null);
    try {
      await api.delete(`/provider-org/administrators/${a.id}`);
      setRefresh((n) => n + 1);
      await load();
    } catch (e) { handleError(e); } finally { setBusyId(null); }
  }

  const BranchChips = ({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) => (
    branches.length === 0 ? <p className="m-0 text-xs text-slate-400">No branches yet — access applies to all.</p> : (
      <div className="flex flex-wrap gap-1.5">
        {branches.map((b) => (
          <button key={b.id} type="button" onClick={() => onToggle(b.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${selected.has(b.id) ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {b.name}
          </button>
        ))}
      </div>
    )
  );

  return (
    <>
      <PageHeader
        title="Administrators"
        description="Named users with branch-scoped access. Each person counts once."
        actions={<Button onClick={() => { setInviting(true); setError(null); setLimitMessage(null); }}>Invite Administrator</Button>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={limitMessage} />}
        <OrgCapacityBar kind="administrators" refreshKey={refresh} />

        {inviting && (
          <Card>
            <CardContent className="space-y-3 px-5 py-4">
              <p className="m-0 text-sm font-semibold text-slate-900">Invite Administrator</p>
              <div>
                <label className={lbl}>Administrator&apos;s Shiftify email</label>
                <input className={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                <p className="m-0 mt-1 text-xs text-slate-400">They must already have a Shiftify account.</p>
              </div>
              <div>
                <label className={lbl}>Role</label>
                <select className={inp} value={invitePreset} onChange={(e) => setInvitePreset(e.target.value as Preset)}>
                  {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Billing access</label>
                <select className={inp} value={inviteBilling ? "YES" : "NO"} onChange={(e) => setInviteBilling(e.target.value === "YES")}>
                  <option value="NO">No</option><option value="YES">Yes</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Branch access (leave empty for all branches)</label>
                <BranchChips selected={inviteBranches} onToggle={(id) => setInviteBranches((s) => toggleIn(s, id))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={saving || !email.trim()} onClick={invite}>{saving ? "Inviting…" : "Add administrator"}</Button>
                <Button size="sm" variant="outline" onClick={() => setInviting(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="m-5 h-24 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Administrator</th>
                      <th className="px-3 py-3 font-medium">Role</th>
                      <th className="px-3 py-3 font-medium">Branch access</th>
                      <th className="px-3 py-3 font-medium">Billing</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user && (
                      <tr className="border-b border-slate-100">
                        <td className="px-5 py-3"><p className="m-0 font-semibold text-slate-900">{user.name}</p><p className="m-0 text-xs text-slate-400">{user.email}</p></td>
                        <td className="px-3 py-3 text-slate-700">Owner</td>
                        <td className="px-3 py-3 text-slate-700">All branches</td>
                        <td className="px-3 py-3 text-slate-700">Yes</td>
                        <td className="px-3 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span></td>
                        <td className="px-5 py-3" />
                      </tr>
                    )}
                    {admins.filter((a) => !workspaceBranch || a.branches.length === 0 || a.branches.some((b) => b.id === workspaceBranch)).map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 align-top last:border-0">
                        <td className="px-5 py-3"><p className="m-0 font-semibold text-slate-900">{a.user.name}</p><p className="m-0 text-xs text-slate-400">{a.user.email}</p></td>
                        <td className="px-3 py-3 text-slate-700">
                          {editId === a.id ? (
                            <select className={inp} value={editPreset} onChange={(e) => setEditPreset(e.target.value as Preset)}>
                              {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                          ) : presetLabel(a.rolePreset)}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {editId === a.id
                            ? <BranchChips selected={editBranches} onToggle={(id) => setEditBranches((s) => toggleIn(s, id))} />
                            : a.branches.length ? a.branches.map((b) => b.name).join(", ") : "All branches"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {editId === a.id ? (
                            <select className={inp} value={editBilling ? "YES" : "NO"} onChange={(e) => setEditBilling(e.target.value === "YES")}>
                              <option value="NO">No</option><option value="YES">Yes</option>
                            </select>
                          ) : a.billingAccess ? "Yes" : "No"}
                        </td>
                        <td className="px-3 py-3">
                          {editId === a.id ? (
                            <select className={inp} value={editStatus} onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")}>
                              <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                            </select>
                          ) : (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {a.status === "ACTIVE" ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {editId === a.id ? (
                            <span className="inline-flex gap-2">
                              <Button size="sm" disabled={busyId === a.id} onClick={saveEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                            </span>
                          ) : (
                            <span className="inline-flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(a)}>Edit permissions</Button>
                              <Button size="sm" variant="ghost" disabled={busyId === a.id} onClick={() => remove(a)}>Remove</Button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="m-0 text-xs text-slate-500">
          Owner, Organisation Administrator, Branch Manager, Intake, Workforce, Read-only and Billing access are labels for now. Every administrator still counts toward your plan capacity.
        </p>
      </div>
    </>
  );
}
