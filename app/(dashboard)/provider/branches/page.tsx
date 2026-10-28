"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OrgCapacityBar } from "@/components/provider/OrgCapacityBar";
import { ModalShell, inp } from "@/components/jobs/post/shared";
import { BRANCH_SERVICE_LINES } from "@/components/provider/branchOptions";

export interface BranchRow {
  id: string;
  name: string;
  region: string | null;
  timezone: string | null;
  managerUserId: string | null;
  managerName: string | null;
  serviceLines: string[];
  address?: string | null;
  escalationContact?: string | null;
  contact?: string | null;
  serviceRadiusKm?: number | null;
  isActive: boolean;
  _count: { administrators: number; teamMembers: number };
}

interface Administrator { id: string; user: { id: string; name: string; email: string }; branches?: { id: string; name: string }[] }
interface TeamPerson { id: string; name: string; branch: { id: string; name: string } }

const TIMEZONES = [
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide",
  "Australia/Perth", "Australia/Darwin", "Australia/Hobart",
];

interface Draft { name: string; region: string; address: string; timezone: string; managerUserId: string; serviceLines: string[]; escalationContact: string; contact: string; radius: string }
const EMPTY: Draft = { name: "", region: "", address: "", timezone: "Australia/Sydney", managerUserId: "", serviceLines: [], escalationContact: "", contact: "", radius: "" };

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
  // Deactivate asks first; if the Branch still has active work the server refuses and that message is shown in its own popup.
  const [confirmOff, setConfirmOff] = useState<BranchRow | null>(null);
  const [activeWork, setActiveWork] = useState<{ branch: BranchRow; message: string } | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [people, setPeople] = useState<TeamPerson[]>([]);
  const [assigning, setAssigning] = useState<BranchRow | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    return Promise.all([
      api.get<{ branches: BranchRow[] }>("/provider-org/branches"),
      api.get<{ administrators: Administrator[] }>("/provider-org/administrators"),
      api.get<{ teamMembers: TeamPerson[] }>("/provider-org/team-members").catch(() => ({ teamMembers: [] as TeamPerson[] })),
    ])
      .then(([b, a, t]) => {
        setBranches(b.branches ?? []);
        setAdmins(a.administrators ?? []);
        setPeople(t.teamMembers ?? []);
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
      name: b.name, region: b.region ?? "", address: b.address ?? "", timezone: b.timezone ?? "Australia/Sydney",
      managerUserId: b.managerUserId ?? "", serviceLines: b.serviceLines, escalationContact: b.escalationContact ?? "",
      contact: b.contact ?? "", radius: b.serviceRadiusKm != null ? String(b.serviceRadiusKm) : "",
    });
    setEditing(b.id);
  }

  const canSave = !!draft.name.trim() && !!draft.region.trim() && draft.serviceLines.length > 0;

  async function save() {
    if (!canSave) return;
    setSaving(true); setError(null); setLimitMessage(null);
    const body = {
      name: draft.name.trim(),
      region: draft.region.trim() || undefined,
      address: draft.address.trim() || null,
      escalationContact: draft.escalationContact.trim() || null,
      contact: draft.contact.trim() || null,
      serviceRadiusKm: draft.radius.trim() ? Math.max(1, Math.round(Number(draft.radius))) || null : null,
      timezone: draft.timezone || undefined,
      managerUserId: draft.managerUserId || null,
      serviceLines: draft.serviceLines,
    };
    try {
      if (editing === "new") await api.post("/provider-org/branches", body);
      else await api.patch(`/provider-org/branches/${editing}`, body);
      setEditing(null);
      setRefresh((n) => n + 1);
      await load();
    } catch (e) { handleError(e); } finally { setSaving(false); }
  }

  async function setActive(b: BranchRow, isActive: boolean, transferToBranchId?: string) {
    setBusyId(b.id); setError(null);
    try {
      await api.patch(`/provider-org/branches/${b.id}`, { isActive, ...(transferToBranchId ? { transferToBranchId } : {}) });
      setActiveWork(null); setTransferTo("");
      await load();
    } catch (e) {
      if (!isActive && e instanceof ApiError && e.code === "BRANCH_HAS_ACTIVE_WORK") setActiveWork({ branch: b, message: e.message });
      else handleError(e);
    } finally { setBusyId(null); setConfirmOff(null); }
  }

  function startAssign(b: BranchRow) {
    setPicked(new Set(people.filter((p) => p.branch.id === b.id).map((p) => p.id)));
    setAssigning(b);
  }

  // Moves people between Branches: those ticked join this Branch; those unticked who were here are left where they are (move them from the other Branch).
  async function saveAssign() {
    if (!assigning) return;
    setSaving(true); setError(null);
    try {
      const toMove = people.filter((p) => picked.has(p.id) && p.branch.id !== assigning.id);
      await Promise.all(toMove.map((p) => api.patch(`/provider-org/team-members/${p.id}`, { branchId: assigning.id })));
      setAssigning(null);
      await load();
    } catch (e) { handleError(e); } finally { setSaving(false); }
  }

  const label = "block text-sm font-semibold text-slate-900";

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Branches</div>
        <div className="pd-page-head">
          <div>
            <h1>Branch workspaces</h1>
            <p>An operational office, hub or team — not every shift address.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => startEdit(null)}><Plus />Add Branch</button>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={limitMessage} />}
        <OrgCapacityBar kind="branches" refreshKey={refresh} />

        {editing && (
          <ModalShell title="Branch workspace" subtitle={editing === "new" ? undefined : "Edit existing record"} onClose={() => setEditing(null)}>
            <div className="border-b border-slate-100 px-6"><p className="m-0 w-fit border-b-2 border-brand-600 py-3 text-xs font-semibold text-brand-700">1. Branch workspace</p></div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-900">Branch workspace</h3>
                <p className="m-0 mt-1 text-sm text-slate-500">An operational group, office or service hub.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>Branch name <span className="text-brand-600">*</span>
                  <input className={`${inp} mt-1 w-full`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Parramatta" /></label>
                <label className={label}>Coverage area <span className="text-brand-600">*</span>
                  <input className={`${inp} mt-1 w-full`} value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} placeholder="e.g. Western Sydney" /></label>
                <label className={label}>Operational base
                  <input className={`${inp} mt-1 w-full`} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Office or hub address (internal only)" /></label>
                <label className={label}>Timezone
                  <select className={`${inp} mt-1 w-full`} value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
                    {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                <label className={label}>Branch manager
                  <select className={`${inp} mt-1 w-full`} value={draft.managerUserId} onChange={(e) => setDraft({ ...draft, managerUserId: e.target.value })}>
                    <option value="">No manager set</option>
                    {user && <option value={user.id}>{user.name} (Owner)</option>}
                    {admins.map((a) => <option key={a.id} value={a.user.id}>{a.user.name}</option>)}</select></label>
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-slate-900">Service lines <span className="text-brand-600">*</span></p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {[...BRANCH_SERVICE_LINES, ...draft.serviceLines.filter((x) => !(BRANCH_SERVICE_LINES as readonly string[]).includes(x))].map((line) => {
                    const on = draft.serviceLines.includes(line);
                    return (
                      <label key={line} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={on} onChange={() => setDraft({ ...draft, serviceLines: on ? draft.serviceLines.filter((x) => x !== line) : [...draft.serviceLines, line] })} />
                        {line}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>Branch contact
                  <input className={`${inp} mt-1 w-full`} value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} placeholder="Phone or email for this Branch" /></label>
                <label className={label}>Service radius (km)
                  <input className={`${inp} mt-1 w-full`} type="number" min={1} max={500} value={draft.radius} onChange={(e) => setDraft({ ...draft, radius: e.target.value })} placeholder="e.g. 25" /></label>
              </div>
              <label className={label}>Escalation contact
                <input className={`${inp} mt-1 w-full`} value={draft.escalationContact} onChange={(e) => setDraft({ ...draft, escalationContact: e.target.value })} placeholder="Who to call when something goes wrong (name and phone)" /></label>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">1 of 1</span>
                <Button disabled={saving || !canSave} onClick={save}>{saving ? "Saving…" : editing === "new" ? "Save and continue" : "Save changes"}</Button>
              </div>
            </div>
          </ModalShell>
        )}

        {confirmOff && (
          <ModalShell title={`Deactivate ${confirmOff.name}?`} onClose={() => setConfirmOff(null)}>
            <div className="px-6 py-5"><p className="m-0 text-sm text-slate-600">Its team and history stay, but you cannot add new Team Members to it until you activate it again.</p></div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button variant="outline" onClick={() => setConfirmOff(null)}>Cancel</Button>
              <Button disabled={busyId === confirmOff.id} onClick={() => void setActive(confirmOff, false)}>Deactivate Branch</Button>
            </div>
          </ModalShell>
        )}
        {activeWork && (
          <ModalShell title="Branch has active work" onClose={() => { setActiveWork(null); setTransferTo(""); }}>
            <div className="space-y-3 px-6 py-5">
              <p className="m-0 text-sm text-slate-600">Transfer active requests and assignments before deactivating {activeWork.branch.name}. History and ownership must remain accessible.</p>
              <p className="m-0 text-xs text-slate-500">{activeWork.message}</p>
              <label className={label}>Transfer to
                <select className={`${inp} mt-1 w-full`} value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                  <option value="">Choose a Branch</option>
                  {branches.filter((x) => x.isActive && x.id !== activeWork.branch.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select></label>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Link href="/jobs/my"><Button variant="outline">View Branch requests</Button></Link>
              <Button disabled={!transferTo || busyId === activeWork.branch.id} onClick={() => void setActive(activeWork.branch, false, transferTo)}>Transfer and deactivate</Button>
            </div>
          </ModalShell>
        )}
        {assigning && (
          <ModalShell title={`Assign Team to ${assigning.name}`} subtitle="Tick the Team Members who work from this Branch." onClose={() => setAssigning(null)}>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto px-6 py-5">
              {people.length === 0 ? <p className="m-0 text-sm text-slate-500">No internal Team Members yet. Add one from Team Availability.</p> : people.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={picked.has(p.id)} onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} />
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="ml-auto text-xs text-slate-500">{p.branch.name}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
              <Button disabled={saving} onClick={() => void saveAssign()}>{saving ? "Saving…" : "Save team"}</Button>
            </div>
          </ModalShell>
        )}

        {loading ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : branches.length === 0 ? (
          <div className="pd-grid2">
            <div className="pd-empty">
              <Building2 />
              <h3>No branches yet</h3>
              <p>Add your first Branch to organise your team and administrators.</p>
            </div>
          </div>
        ) : (
          <div className="pd-grid2">
            {branches.map((b) => (
              <article key={b.id} className="pd-record-card">
                <div className="pd-card-header">
                  <Building2 className="pd-icon-plain" />
                  <h2>{b.name}</h2>
                  <span className={`pd-badge ${b.isActive ? "pd-badge-green" : ""}`}>{b.isActive ? "Active" : "Inactive"}</span>
                </div>
                <p className="pd-card-body">
                  {b.region || "No coverage area set"}{b.serviceRadiusKm ? ` · ${b.serviceRadiusKm} km radius` : ""}<br />
                  {b.timezone ?? "Australia/Sydney"}<br />
                  Manager: {b.managerName ?? "Not set"}
                  {b.address && <><br />Base: {b.address}</>}
                  {b.contact && <><br />Contact: {b.contact}</>}
                  {b.escalationContact && <><br />Escalation: {b.escalationContact}</>}
                  <br />Administrators: {admins.filter((a) => a.branches?.some((x) => x.id === b.id)).map((a) => a.user.name).join(", ") || "None assigned"}
                  <br /><span className="pd-small">{b._count.teamMembers} team members · {b._count.administrators} administrators</span>
                </p>
                {b.serviceLines.length > 0 && (
                  <div className="pd-tags">
                    {b.serviceLines.map((s) => <span key={s} className="pd-badge">{s}</span>)}
                  </div>
                )}
                <div className="pd-buttons">
                  <button type="button" className="pd-btn pd-btn-sm" onClick={() => startEdit(b)}>Edit Branch</button>
                  <button type="button" className="pd-btn pd-btn-sm" onClick={() => startAssign(b)}>Assign Team</button>
                  <Link href={`/provider/calendar?branch=${b.id}`} className="pd-btn pd-btn-sm">View Calendar</Link>
                  <button type="button" className="pd-btn pd-btn-sm" disabled={busyId === b.id} onClick={() => (b.isActive ? setConfirmOff(b) : void setActive(b, true))}>
                    {b.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <Link href={`/provider/branches/${b.id}`} className="pd-btn pd-btn-sm pd-btn-primary">Open workspace</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
