"use client";

// Provider "Internal Team" (approved demo + doc P18-P20). Roster Team Members (verify by email) and workers with their own
// managed login share one list; the profile popup edits, offers a shift or removes the person.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldCheck, Users, Plus, LayoutGrid } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OrgCapacityBar } from "@/components/provider/OrgCapacityBar";
import { ModalShell } from "@/components/jobs/post/shared";
import { SendInternalOfferFlow } from "@/components/provider/InternalOfferDialogs";
import { TeamMemberDialog } from "@/components/provider/TeamMemberDialog";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

interface Member {
  key: string; name: string; kind: "MANAGED" | "ROSTER"; branch: string | null;
  status: "AVAILABLE" | "ON_SHIFT" | "INVITED" | "NOT_SET" | "VERIFIED";
  upcomingAssignments: number; skills?: string[]; relationship?: string; access?: string;
  languages?: string[]; credentialStatus?: string | null; experienceYears?: number | null;
}

const STATUS: Record<Member["status"], { label: string; cls: string }> = {
  AVAILABLE: { label: "Available", cls: "pd-badge-green" },
  ON_SHIFT: { label: "On shift", cls: "pd-badge-blue" },
  INVITED: { label: "Invited", cls: "pd-badge-orange" },
  NOT_SET: { label: "No availability set", cls: "" },
  VERIFIED: { label: "Verified", cls: "pd-badge-green" },
};
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function InternalTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  const [adding, setAdding] = useState(false);
  const [editRosterId, setEditRosterId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Member | null>(null);
  const [offering, setOffering] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(() => {
    return api.get<{ members: Member[] }>("/provider-workspace/team-availability")
      .then((r) => setMembers(r.members ?? []))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load your team"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) =>
      (!statusF || m.status === statusF) &&
      (!needle || [m.name, m.branch ?? "", ...(m.skills ?? [])].join(" ").toLowerCase().includes(needle)));
  }, [members, q, statusF]);

  async function remove(m: Member) {
    if (!window.confirm(`Remove ${m.name} from your Internal Team? ${m.kind === "MANAGED" ? "They will be suspended and unlinked." : "Their history stays on record."}`)) return;
    setRemoving(true); setError(null);
    try {
      if (m.kind === "MANAGED") await api.delete(`/linking/workers/${m.key.slice(2)}`);
      else await api.delete(`/provider-org/team-members/${m.key.slice(2)}`);
      setProfile(null); setRefresh((n) => n + 1);
      setNotice(`${m.name} was removed from your Internal Team.`);
      await load();
    } catch (e) {
      if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) setLimitMessage(e.message);
      else setError(e instanceof ApiError ? e.message : "Could not remove this person");
    } finally { setRemoving(false); }
  }

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Team</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Internal Team</h1>
            <p>Your internal team, Branches, compliance and personal access.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => { setAdding(true); setNotice(null); }}><Plus />Add Team Member</button>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={`${limitMessage} Need more capacity? Contact Shiftify.`} />}
        {notice && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}
        <OrgCapacityBar kind="teamMembers" refreshKey={refresh} />

        <div className="pd-toolbar">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, skills or language" aria-label="Search people, skills or Branch" />
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Status">
            <option value="">All</option>
            {(Object.keys(STATUS) as Member["status"][]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
          <button type="button" className="pd-btn" onClick={() => { setQ(""); setStatusF(""); }}><RefreshCw />Clear filters</button>
        </div>

        <div className="pd-info-banner">
          <Users width={18} height={18} className="shrink-0" />
          <span>Internal workers see their own offers, assignments, calendar and messages. No independent marketplace action is used for internal work.</span>
          <Link href="/team/new" className="pd-textbtn" style={{ marginLeft: "auto", flexShrink: 0 }}>Add worker with login</Link>
        </div>

        {loading ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : list.length === 0 ? (
          <div className="pd-grid3">
            <div className="pd-empty">
              <LayoutGrid />
              <h3>{members.length === 0 ? "No Team Members yet" : "No people match these filters"}</h3>
              <p>{members.length === 0 ? "Add your first Team Member to offer shifts and check availability." : "Adjust your filters."}</p>
            </div>
          </div>
        ) : (
          <div className="pd-grid3">
            {list.map((m) => {
              const st = STATUS[m.status];
              return (
                <article key={m.key} className="pd-record-card">
                  <div className="pd-card-header">
                    <span className="pd-avatar pd-avatar-lg">{initials(m.name)}</span>
                    <div>
                      <h3>{m.name}</h3>
                      <span className="pd-small pd-muted">{m.branch ?? "Worker with login"}</span>
                    </div>
                  </div>
                  <div className="pd-tags">
                    <span className={`pd-badge ${st.cls}`}>{st.label}</span>
                    {m.credentialStatus === "CURRENT" && <span className="pd-badge pd-badge-blue">Checks current</span>}
                    {m.upcomingAssignments > 0 && <span className="pd-badge">{m.upcomingAssignments} upcoming</span>}
                  </div>
                  {m.skills && m.skills.length > 0 && (
                    <div className="pd-tags">{m.skills.slice(0, 5).map((k) => <span key={k} className="pd-badge">{k}</span>)}</div>
                  )}
                  <div className="pd-card-body">
                    {m.languages && m.languages.length > 0 && <>{m.languages.join(", ")}<br /></>}
                    {[m.relationship, m.access].filter(Boolean).join(" · ")}
                  </div>
                  <div className="pd-buttons">
                    <button type="button" className="pd-btn pd-btn-sm" onClick={() => setProfile(m)}>View profile</button>
                    <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => { setProfile(m); setOffering(true); }}>Offer shift</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {adding && <TeamMemberDialog onClose={() => setAdding(false)} onSaved={(msg) => { setAdding(false); setNotice(msg); setRefresh((n) => n + 1); void load(); }} />}
        {editRosterId && <TeamMemberDialog memberId={editRosterId} onClose={() => setEditRosterId(null)} onSaved={(msg) => { setEditRosterId(null); setNotice(msg); void load(); }} />}
        {offering && <SendInternalOfferFlow onClose={() => { setOffering(false); setProfile(null); }} onSent={() => { setOffering(false); setProfile(null); setNotice("Offer sent. A response is not a confirmed assignment."); }} />}

        {profile && !offering && (
          <ModalShell title="Worker profile" onClose={() => setProfile(null)}>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">{initials(profile.name)}</span>
                <div>
                  <p className="m-0 text-xl font-bold text-slate-900">{profile.name}</p>
                  <p className="m-0 text-sm text-slate-500">Internal worker</p>
                  <span className={`pd-badge mt-2 ${STATUS[profile.status].cls}`}>{STATUS[profile.status].label}</span>
                </div>
              </div>
              {profile.skills && profile.skills.length > 0 && (
                <section><h4 className="m-0 text-base font-bold text-slate-900">Capabilities</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">{profile.skills.map((k) => <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{k}</span>)}</div></section>
              )}
              <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 text-sm">
                <div><dt className="text-xs text-slate-500">Branch</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.branch ?? "Worker with login"}</dd></div>
                <div><dt className="text-xs text-slate-500">Relationship</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.relationship ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Access</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.access ?? "—"}</dd></div>
                {profile.languages && profile.languages.length > 0 && <div><dt className="text-xs text-slate-500">Languages</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.languages.join(", ")}</dd></div>}
                {profile.experienceYears != null && <div><dt className="text-xs text-slate-500">Experience</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.experienceYears} years</dd></div>}
                <div><dt className="text-xs text-slate-500">Upcoming assignments</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.upcomingAssignments}</dd></div>
              </dl>
              {profile.credentialStatus === "CURRENT" && <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">Credential summary current</span>}
              {profile.status === "INVITED" && <p className="m-0 text-sm text-amber-700">Complete credentials before confirmation.</p>}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>Only authorised credential summaries are visible. Raw personal evidence and private contact information follow consent and access rules.</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setProfile(null)}>Close</Button>
                <Button variant="ghost" disabled={removing} onClick={() => void remove(profile)}>Remove</Button>
              </div>
              <div className="flex gap-2">
                {profile.kind === "MANAGED"
                  ? <Link href={`/team/${profile.key.slice(2)}/edit`}><Button variant="outline">Edit Team Member</Button></Link>
                  : <Button variant="outline" onClick={() => { setEditRosterId(profile.key.slice(2)); setProfile(null); }}>Edit Team Member</Button>}
                <Button onClick={() => setOffering(true)}>Offer shift</Button>
              </div>
            </div>
          </ModalShell>
        )}
      </div>
    </div>
  );
}
