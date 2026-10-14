"use client";

// Provider "Internal Team" (approved demo + doc P18-P20). Roster Team Members (verify by email) and workers with their own
// managed login share one list; the profile popup edits, offers a shift or removes the person.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldCheck, Users, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OrgCapacityBar } from "@/components/provider/OrgCapacityBar";
import { ModalShell } from "@/components/jobs/post/shared";
import { SendInternalOfferFlow } from "@/components/provider/InternalOfferDialogs";
import { TeamMemberDialog } from "@/components/provider/TeamMemberDialog";

interface Member {
  key: string; name: string; kind: "MANAGED" | "ROSTER"; branch: string | null;
  status: "AVAILABLE" | "ON_SHIFT" | "INVITED" | "NOT_SET" | "VERIFIED";
  upcomingAssignments: number; skills?: string[]; relationship?: string; access?: string;
  languages?: string[]; credentialStatus?: string | null; experienceYears?: number | null;
}

const STATUS: Record<Member["status"], { label: string; cls: string }> = {
  AVAILABLE: { label: "Available", cls: "bg-emerald-50 text-emerald-700" },
  ON_SHIFT: { label: "On shift", cls: "bg-sky-50 text-sky-700" },
  INVITED: { label: "Invited", cls: "bg-amber-50 text-amber-700" },
  NOT_SET: { label: "No availability set", cls: "bg-slate-100 text-slate-500" },
  VERIFIED: { label: "Verified", cls: "bg-emerald-50 text-emerald-700" },
};
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
const field = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900";

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
    <>
      <div className="space-y-5 px-8 pt-6">
        <p className="m-0 text-xs text-slate-400">Provider / Team</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Internal Team</h1>
            <p className="m-0 mt-1.5 text-[15px] text-slate-500">Your internal team, Branches, compliance and personal access.</p>
          </div>
          <Button onClick={() => { setAdding(true); setNotice(null); }}>+ Add Team Member</Button>
        </div>
      </div>
      <div className="space-y-5 px-8 py-6">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {limitMessage && <UpgradePrompt message={`${limitMessage} Need more capacity? Contact Shiftify.`} />}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
        <OrgCapacityBar kind="teamMembers" refreshKey={refresh} />

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${field} w-full pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, skills or Branch" />
          </div>
          <select className={`${field} w-[220px]`} value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Status">
            <option value="">All</option>
            {(Object.keys(STATUS) as Member["status"][]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setQ(""); setStatusF(""); }}><RefreshCw className="mr-1.5 h-4 w-4" />Clear filters</Button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
          <Users className="h-4 w-4 shrink-0 text-slate-500" />
          <span>Internal workers see their own offers, assignments, calendar and messages. No independent marketplace action is used for internal work.</span>
          <Link href="/team/new" className="ml-auto shrink-0 text-sm font-semibold text-brand-600 hover:underline">Add worker with login</Link>
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="m-0 text-base font-bold text-slate-900">{members.length === 0 ? "No Team Members yet" : "No people match these filters"}</p>
            <p className="m-0 mt-1 text-sm text-slate-500">{members.length === 0 ? "Add your first Team Member to offer shifts and check availability." : "Adjust your filters."}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((m) => {
              const st = STATUS[m.status];
              return (
                <div key={m.key} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{initials(m.name)}</span>
                    <div className="min-w-0">
                      <p className="m-0 text-base font-bold text-slate-900">{m.name}</p>
                      <p className="m-0 text-sm text-slate-500">{m.branch ?? "Worker with login"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    {m.credentialStatus === "CURRENT" && <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">Checks current</span>}
                    {m.upcomingAssignments > 0 && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{m.upcomingAssignments} upcoming</span>}
                  </div>
                  {m.skills && m.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">{m.skills.slice(0, 5).map((k) => <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{k}</span>)}</div>
                  )}
                  {m.languages && m.languages.length > 0 && <p className="m-0 mt-3 text-base text-slate-600">{m.languages.join(", ")}</p>}
                  <p className="m-0 mt-1 text-base text-slate-600">{[m.relationship, m.access].filter(Boolean).join(" · ")}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={() => setProfile(m)}>View profile</Button>
                    <Button size="sm" onClick={() => { setProfile(m); setOffering(true); }}>Offer shift</Button>
                  </div>
                </div>
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
                  <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS[profile.status].cls}`}>{STATUS[profile.status].label}</span>
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
    </>
  );
}
