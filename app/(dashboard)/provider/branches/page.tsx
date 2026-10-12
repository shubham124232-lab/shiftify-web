"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OrgCapacityBar } from "@/components/provider/OrgCapacityBar";
import { inp, lbl } from "@/components/jobs/post/shared";

export interface BranchRow {
  id: string;
  name: string;
  region: string | null;
  timezone: string | null;
  managerUserId: string | null;
  managerName: string | null;
  serviceLines: string[];
  isActive: boolean;
  _count: { administrators: number; teamMembers: number };
}

interface Administrator { id: string; user: { id: string; name: string; email: string } }

const TIMEZONES = [
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide",
  "Australia/Perth", "Australia/Darwin", "Australia/Hobart",
];

interface Draft { name: string; region: string; timezone: string; managerUserId: string; serviceLines: string }
const EMPTY: Draft = { name: "", region: "", timezone: "Australia/Sydney", managerUserId: "", serviceLines: "" };

export default function ProviderBranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(() => {
    return Promise.all([
      api.get<{ branches: BranchRow[] }>("/provider-org/branches"),
      api.get<{ administrators: Administrator[] }>("/provider-org/administrators"),
    ])
      .then(([b, a]) => {
        setBranches(b.branches ?? []);
        setAdmins(a.administrators ?? []);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load your branches"))
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

  function startEdit(b: BranchRow | null) {
    setError(null); setLimitMessage(null);
    if (!b) { setDraft(EMPTY); setEditing("new"); return; }
    setDraft({
      name: b.name, region: b.region ?? "", timezone: b.timezone ?? "Australia/Sydney",
      managerUserId: b.managerUserId ?? "", serviceLines: b.serviceLines.join(", "),
    });
    setEditing(b.id);
  }

  async function save() {
    if (!draft.name.trim()) return;
    setSaving(true); setError(null); setLimitMessage(null);
    const body = {
      name: draft.name.trim(),
      region: draft.region.trim() || undefined,
      timezone: draft.timezone || undefined,
      managerUserId: draft.managerUserId || null,
      serviceLines: draft.serviceLines.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing === "new") await api.post("/provider-org/branches", body);
      else await api.patch(`/provider-org/branches/${editing}`, body);
      setEditing(null);
      setRefresh((n) => n + 1);
      await load();
    } catch (e) { handleError(e); } finally { setSaving(false); }
  }

  async function setActive(b: BranchRow, isActive: boolean) {
    if (!isActive && !window.confirm(`Deactivate ${b.name}? Its team and history stay, but you can't add new Team Members to it until you activate it again.`)) return;
    setBusyId(b.id); setError(null);
    try {
      await api.patch(`/provider-org/branches/${b.id}`, { isActive });
      await load();
    } catch (e) { handleError(e); } finally { setBusyId(null); }
  }

  return (
    <>
      <PageHeader
        title="Branches"
        description="An operational office, hub or team — not every shift address."
        actions={<Button onClick={() => startEdit(null)}>Add Branch</Button>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={limitMessage} />}
        <OrgCapacityBar kind="branches" refreshKey={refresh} />

        {editing && (
          <Card>
            <CardContent className="space-y-3 px-5 py-4">
              <p className="m-0 text-sm font-semibold text-slate-900">{editing === "new" ? "Add Branch" : "Edit Branch"}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Branch name</label>
                  <input className={inp} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Parramatta" />
                </div>
                <div>
                  <label className={lbl}>Region</label>
                  <input className={inp} value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} placeholder="e.g. Western Sydney" />
                </div>
                <div>
                  <label className={lbl}>Time zone</label>
                  <select className={inp} value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
                    {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Manager</label>
                  <select className={inp} value={draft.managerUserId} onChange={(e) => setDraft({ ...draft, managerUserId: e.target.value })}>
                    <option value="">No manager set</option>
                    {user && <option value={user.id}>{user.name} (Owner)</option>}
                    {admins.map((a) => <option key={a.id} value={a.user.id}>{a.user.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Services (optional, comma-separated)</label>
                <input className={inp} value={draft.serviceLines} onChange={(e) => setDraft({ ...draft, serviceLines: e.target.value })} placeholder="e.g. Personal Care, Community Access" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={saving || !draft.name.trim()} onClick={save}>{saving ? "Saving…" : "Save Branch"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ) : branches.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">
            No branches yet. Add your first Branch to organise your team and administrators.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {branches.map((b) => (
              <Card key={b.id}>
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="m-0 text-base font-semibold text-slate-900">{b.name}</p>
                    <p className="m-0 mt-0.5 text-sm text-slate-500">{[b.region, b.timezone].filter(Boolean).join(" · ") || "No region set"}</p>
                  </div>
                  <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-slate-400">Manager</dt><dd className="m-0 text-slate-700">{b.managerName ?? "Not set"}</dd>
                    <dt className="text-slate-400">Team members</dt><dd className="m-0 text-slate-700">{b._count.teamMembers}</dd>
                    <dt className="text-slate-400">Administrators</dt><dd className="m-0 text-slate-700">{b._count.administrators}</dd>
                  </dl>
                  {b.serviceLines.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {b.serviceLines.map((s) => <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => startEdit(b)}>Edit Branch</Button>
                    <Link href={`/provider/branches/${b.id}`}><Button size="sm" variant="outline">Open workspace</Button></Link>
                    <Button size="sm" variant="outline" disabled={busyId === b.id} onClick={() => setActive(b, !b.isActive)}>
                      {b.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
