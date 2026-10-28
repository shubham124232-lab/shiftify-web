"use client";

import { useBranchWorkspace } from "@/lib/store/branchWorkspace";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OrgCapacityBar } from "@/components/provider/OrgCapacityBar";
import { ModalShell, inp } from "@/components/jobs/post/shared";

type Preset = "ADMINISTRATOR" | "BRANCH_MANAGER" | "INTAKE" | "WORKFORCE" | "READ_ONLY";

interface Administrator {
  id: string;
  rolePreset: Preset;
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "EXPIRED";
  inviteExpiresAt?: string | null;
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
const STATUS_LABEL: Record<string, string> = { PENDING: "Pending", ACTIVE: "Active", INACTIVE: "Inactive", EXPIRED: "Expired" };
const STATUS_STYLE: Record<string, string> = {
  PENDING: "pd-badge-orange", ACTIVE: "pd-badge-green",
  INACTIVE: "", EXPIRED: "pd-badge-red",
};
const presetLabel = (p: string) => PRESETS.find((x) => x.value === p)?.label ?? p;
const label = "block text-sm font-semibold text-slate-900";

// Provider "Administrators and permissions" (approved demo + doc P16): list plus one invite/edit popup.
export default function ProviderAdministratorsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null);
  const [viewerIsOwner, setViewerIsOwner] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const workspaceBranch = useBranchWorkspace((s) => s.branchId);

  // One popup for both inviting ("new") and editing an existing administrator.
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState<Preset>("ADMINISTRATOR");
  const [billing, setBilling] = useState(false);
  const [referral, setReferral] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([
      api.get<{ administrators: Administrator[]; owner?: { name: string; email: string }; viewerIsOwner?: boolean }>("/provider-org/administrators"),
      api.get<{ branches: Branch[] }>("/provider-org/branches"),
    ])
      .then(([a, b]) => { setAdmins(a.administrators ?? []); setOwner(a.owner ?? null); setViewerIsOwner(a.viewerIsOwner ?? true); setBranches(b.branches ?? []); })
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

  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  function openPopup(a: Administrator | null) {
    setError(null); setLimitMessage(null); setPopupError(null);
    if (!a) { setName(""); setEmail(""); setReferral(""); setPreset("ADMINISTRATOR"); setBilling(false); setStatus("ACTIVE"); setPicked(new Set()); setEditing("new"); return; }
    setName(a.user.name); setEmail(a.user.email); setPreset(a.rolePreset); setBilling(!!a.billingAccess);
    setStatus(a.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"); setPicked(new Set(a.branches.map((b) => b.id))); setEditing(a.id);
  }

  // Editing an existing administrator may leave every Branch unticked, which means access to all Branches.
  const canSave = editing === "new" ? !!name.trim() && !!email.trim() && picked.size > 0 : true;

  async function save() {
    if (!canSave || !editing) return;
    setSaving(true); setPopupError(null);
    try {
      if (editing === "new") {
        await api.post("/provider-org/administrators", { email: email.trim(), rolePreset: preset, billingAccess: billing, branchIds: [...picked], ...(referral.trim() ? { referralCode: referral.trim() } : {}) });
      } else {
        await api.patch(`/provider-org/administrators/${editing}`, { rolePreset: preset, status, billingAccess: billing, branchIds: [...picked] });
      }
      setEditing(null);
      setRefresh((n) => n + 1);
      await load();
    } catch (e) {
      if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) { setEditing(null); handleError(e); }
      else setPopupError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  async function inviteAction(a: Administrator, action: "resend" | "revoke") {
    setBusyId(a.id); setError(null);
    try {
      await api.post(`/provider-org/administrators/${a.id}/${action}`, {});
      setRefresh((n) => n + 1);
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

  const ownerInfo = owner ?? (viewerIsOwner ? user : null);

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Admins</div>
        <div className="pd-page-head">
          <div>
            <h1>Administrators and permissions</h1>
            <p>Named users with Branch-scoped access. Each person counts once.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => openPopup(null)}><Plus />Invite Administrator</button>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={limitMessage} />}
        <OrgCapacityBar kind="administrators" refreshKey={refresh} />

        {editing && (
          <ModalShell title="Invite Administrator" subtitle={editing === "new" ? undefined : "Edit existing record"} onClose={() => setEditing(null)}>
            <div className="border-b border-slate-100 px-6"><p className="m-0 w-fit border-b-2 border-brand-600 py-3 text-xs font-semibold text-brand-700">1. Administrator invitation</p></div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {popupError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{popupError}</div>}
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-900">Administrator invitation</h3>
                <p className="m-0 mt-1 text-sm text-slate-500">One named user counts once even across several Branches.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>Full name <span className="text-brand-600">*</span>
                  <input className={`${inp} mt-1 w-full`} value={name} disabled={editing !== "new"} onChange={(e) => setName(e.target.value)} /></label>
                <label className={label}>Work email <span className="text-brand-600">*</span>
                  <input className={`${inp} mt-1 w-full`} type="email" value={email} disabled={editing !== "new"} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></label>
                <label className={label}>Referral code (optional)
                  <input className={`${inp} mt-1 w-full`} value={referral} disabled={editing !== "new"} onChange={(e) => setReferral(e.target.value)} /></label>
                <label className={label}>Permission preset <span className="text-brand-600">*</span>
                  <select className={`${inp} mt-1 w-full`} value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
                    {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
                <label className={label}>Billing access
                  <select className={`${inp} mt-1 w-full`} value={billing ? "YES" : "NO"} onChange={(e) => setBilling(e.target.value === "YES")}>
                    <option value="NO">No</option><option value="YES">Yes</option></select></label>
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-slate-900">Authorised Branches{editing === "new" && <span className="text-brand-600"> *</span>}</p>
                {editing !== "new" && <p className="m-0 mt-0.5 text-xs text-slate-500">Leave all unticked for access to every Branch.</p>}
                {branches.length === 0 ? <p className="m-0 mt-2 text-xs text-slate-500">Add a Branch first, then authorise it here.</p> : (
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                    {branches.map((b) => (
                      <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={picked.has(b.id)} onChange={() => toggle(b.id)} />{b.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {editing !== "new" && (
                <label className={label}>Status
                  <select className={`${inp} mt-1 w-full sm:w-1/2`} value={status} onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}>
                    <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
              )}
              {editing === "new" && <p className="m-0 text-xs text-slate-500">They must already have a Shiftify account. They accept the invitation in the app, and it expires after 7 days.</p>}
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

        {loading ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : (
          <div className="pd-table-wrap">
            <table>
              <thead>
                <tr><th>Administrator</th><th>Role</th><th>Branch access</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {ownerInfo && (
                  <tr>
                    <td><strong>{ownerInfo.name}</strong><br /><span className="pd-small pd-muted">{ownerInfo.email}</span></td>
                    <td>Owner</td>
                    <td>All Branches</td>
                    <td><span className="pd-badge pd-badge-green">Active</span></td>
                    <td />
                  </tr>
                )}
                {admins.filter((a) => !workspaceBranch || a.branches.length === 0 || a.branches.some((b) => b.id === workspaceBranch)).map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.user.name}</strong><br /><span className="pd-small pd-muted">{a.user.email}</span></td>
                    <td>{presetLabel(a.rolePreset)}</td>
                    <td>{a.branches.length ? a.branches.map((b) => b.name).join(", ") : "All Branches"}</td>
                    <td>
                      <span className={`pd-badge ${STATUS_STYLE[a.status] ?? ""}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
                      {a.status === "PENDING" && a.inviteExpiresAt && (
                        <><br /><span className="pd-small pd-muted">Expires {new Date(a.inviteExpiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span></>
                      )}
                    </td>
                    <td>
                      {a.status === "PENDING" || a.status === "EXPIRED" ? (
                        <>
                          <button type="button" className="pd-btn pd-btn-sm" disabled={busyId === a.id} onClick={() => inviteAction(a, "resend")}>Resend</button>
                          <button type="button" className="pd-btn pd-btn-sm pd-btn-ghost" disabled={busyId === a.id} onClick={() => inviteAction(a, "revoke")}>Revoke</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="pd-btn pd-btn-sm" onClick={() => openPopup(a)}>Edit permissions</button>
                          <button type="button" className="pd-btn pd-btn-sm pd-btn-ghost" disabled={busyId === a.id} onClick={() => remove(a)}>Remove</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pd-info-banner" style={{ marginTop: 18 }}>
          <ShieldCheck width={18} height={18} className="shrink-0" />
          Owner, Administrator, Branch Manager, Intake, Workforce and Read-only are proposed permission presets; every administration user still counts toward plan capacity.
        </div>
      </div>
    </div>
  );
}
