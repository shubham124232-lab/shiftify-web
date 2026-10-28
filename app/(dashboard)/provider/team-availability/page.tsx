"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Plus, ShieldCheck, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { SendInternalOfferFlow } from "@/components/provider/InternalOfferDialogs";
import { TeamMemberDialog } from "@/components/provider/TeamMemberDialog";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

interface Member {
  key: string;
  name: string;
  kind: "MANAGED" | "ROSTER";
  branch: string | null;
  status: "AVAILABLE" | "ON_SHIFT" | "INVITED" | "NOT_SET" | "VERIFIED";
  upcomingAssignments: number;
  skills?: string[];
}
interface Reply { id: string; memberType: "MANAGED" | "ROSTER"; memberName: string; status: "PENDING" | "AVAILABLE" | "CONDITIONS" | "UNAVAILABLE"; conditionsNote?: string | null }
interface AvailabilityRequest { id: string; title: string; startsAt: string | null; message: string | null; createdAt: string; replies: Reply[] }
interface ShiftOption { id: string; title: string; status: string; scheduledStartAt: string; suburb?: string | null; urgency?: string | null }
const URGENCY_LABEL: Record<string, string> = { RAPID: "Last Min", URGENT: "Urgent", LAST_MINUTE: "Short Notice", ROUTINE: "Routine" };

const STATUS: Record<Member["status"], { label: string; cls: string }> = {
  AVAILABLE: { label: "Available", cls: "pd-badge-green" },
  ON_SHIFT:  { label: "On shift",  cls: "pd-badge-blue" },
  INVITED:   { label: "Invited",   cls: "pd-badge-orange" },
  NOT_SET:   { label: "No availability set", cls: "" },
  VERIFIED:  { label: "Available", cls: "pd-badge-green" },
};
const REPLY: Record<Reply["status"], { label: string; cls: string }> = {
  PENDING:     { label: "Waiting", cls: "bg-slate-100 text-slate-500" },
  AVAILABLE:   { label: "Available", cls: "bg-emerald-100 text-emerald-700" },
  CONDITIONS:  { label: "Available with conditions", cls: "bg-amber-100 text-amber-700" },
  UNAVAILABLE: { label: "Unavailable", cls: "bg-red-100 text-red-700" },
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function ProviderTeamAvailabilityPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<Member | null>(null);
  const [offering, setOffering] = useState(false);
  // "Choose an active shift" popup comes first; picking a shift opens the composer with it preselected.
  const [choosing, setChoosing] = useState(false);
  const [editRosterId, setEditRosterId] = useState<string | null>(null);

  // Arriving from the dashboard "Check" link: open the composer with that shift preselected.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("jobId");
    if (id) { setJobId(id); setComposing(true); }
  }, []);

  const load = useCallback(() => {
    return Promise.all([
      api.get<{ members: Member[]; requests: AvailabilityRequest[] }>("/provider-workspace/team-availability"),
      api.get<{ jobs: ShiftOption[] }>("/jobs/my").catch(() => ({ jobs: [] as ShiftOption[] })),
    ])
      .then(([t, j]) => {
        setMembers(t.members); setRequests(t.requests);
        setShifts((j.jobs ?? []).filter((x) => (x.status === "OPEN" || x.status === "ASSIGNED") && new Date(x.scheduledStartAt) > new Date()));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load team availability"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => setSelected((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const ask = (key: string) => { setSelected(new Set([key])); setChoosing(true); setNotice(null); };
  const selectedCount = selected.size;
  const canSend = useMemo(() => !!jobId && selectedCount > 0, [jobId, selectedCount]);

  async function send() {
    setSending(true); setError(null); setNotice(null);
    try {
      await api.post("/provider-workspace/team-availability/requests", { jobId, message: message.trim() || undefined, memberKeys: [...selected] });
      setNotice("Availability request sent.");
      setComposing(false); setSelected(new Set()); setJobId(""); setMessage("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the request"); }
    finally { setSending(false); }
  }

  async function record(reply: Reply, status: "AVAILABLE" | "UNAVAILABLE") {
    setError(null);
    try { await api.patch(`/provider-workspace/team-availability/replies/${reply.id}`, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not record the reply"); }
  }

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Availability</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Internal team availability</h1>
            <p>Check eligible team members before filling or broadcasting a gap.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => { setChoosing(true); setNotice(null); }}><Plus />Request availability</button>
          </div>
        </div>
        {choosing && (
          <ModalShell title="Choose an active shift" onClose={() => setChoosing(false)}>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
              <p className="m-0 text-sm text-slate-500">Select the staffing request for this action.</p>
              {shifts.length === 0 ? (
                <p className="m-0 rounded-xl border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No upcoming shifts. Post a staffing request first.</p>
              ) : shifts.map((sh) => (
                <div key={sh.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-4">
                  <div className="min-w-0">
                    <p className="m-0 text-base font-bold text-slate-900">{sh.title}</p>
                    <p className="m-0 mt-0.5 text-sm text-slate-500">{[sh.suburb, sh.urgency ? URGENCY_LABEL[sh.urgency] ?? sh.urgency : fmt(sh.scheduledStartAt)].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Button size="sm" onClick={() => { setJobId(sh.id); setChoosing(false); setComposing(true); }}>Select</Button>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Button variant="outline" onClick={() => setChoosing(false)}>Close</Button></div>
          </ModalShell>
        )}
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {notice && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

        {composing && (
          <section className="pd-panel">
            <div className="pd-panel-head"><h2>Request availability</h2></div>
            <div className="pd-panel-pad space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Shift
                <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-1 block h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal">
                  <option value="">{shifts.length ? "Choose a shift" : "No upcoming shifts — post one first"}</option>
                  {shifts.map((s) => <option key={s.id} value={s.id}>{s.title} · {fmt(s.scheduledStartAt)}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">Message (optional)
                <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Anything they should know"
                  className="mt-1 block h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
              </label>
              <p className="m-0 text-xs text-slate-500">
                {selectedCount === 0 ? "Tick the team members to ask below." : `${selectedCount} team member${selectedCount === 1 ? "" : "s"} selected.`}
                {" "}Availability checks never use a Provider Action.
              </p>
              <div className="pd-buttons">
                <button type="button" className="pd-btn pd-btn-primary" disabled={!canSend || sending} onClick={send}>{sending ? "Sending…" : "Send request"}</button>
                <button type="button" className="pd-btn" onClick={() => { setComposing(false); setSelected(new Set()); }}>Cancel</button>
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : members.length === 0 ? (
          <section className="pd-panel"><div className="pd-quiet-empty text-center">
            No team members yet. <Link href="/provider/workforce" className="pd-textbtn">Add people to your Internal Team</Link> to check their availability.
          </div></section>
        ) : (
          <div className="pd-grid3">
            {members.map((m) => {
              const st = STATUS[m.status];
              return (
                <article key={m.key} className="pd-record-card">
                  <div className="pd-card-header">
                    <span className="pd-avatar">{m.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <div>
                      <h3>{m.name}</h3>
                      <span className="pd-small pd-muted">{m.branch ?? "Worker with login"}{m.upcomingAssignments ? ` · ${m.upcomingAssignments} upcoming` : ""}</span>
                    </div>
                    {composing && (
                      <input type="checkbox" checked={selected.has(m.key)} onChange={() => toggle(m.key)} className="h-4 w-4" aria-label={`Ask ${m.name}`} />
                    )}
                  </div>
                  <span className={`pd-badge ${st.cls}`}>{st.label}</span>
                  {m.status === "INVITED" && <div className="pd-small pd-muted">Complete credentials before confirmation.</div>}
                  <button type="button" className="pd-btn pd-btn-sm" onClick={() => setProfile(m)}>View worker</button>
                  <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => ask(m.key)}>Send availability request</button>
                </article>
              );
            })}
          </div>
        )}

        {profile && !offering && (
          <ModalShell title="Worker profile" onClose={() => setProfile(null)}>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">{profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
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
                <div><dt className="text-xs text-slate-500">Area</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.branch ?? "Worker with login"}</dd></div>
                <div><dt className="text-xs text-slate-500">Relationship</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.kind === "MANAGED" ? "Worker with login" : "Roster member"}</dd></div>
                <div><dt className="text-xs text-slate-500">Upcoming assignments</dt><dd className="m-0 text-base font-semibold text-slate-900">{profile.upcomingAssignments}</dd></div>
              </dl>
              {profile.status === "INVITED" && <p className="m-0 text-sm text-amber-700">Complete credentials before confirmation.</p>}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>Only authorised credential summaries are visible. Raw personal evidence and private contact information follow consent and access rules.</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button variant="outline" onClick={() => setProfile(null)}>Close</Button>
              <div className="flex gap-2">
                {profile.kind === "MANAGED"
                  ? <Link href={`/team/${profile.key.slice(2)}/edit`}><Button variant="outline">Edit Team Member</Button></Link>
                  : <Button variant="outline" onClick={() => { setEditRosterId(profile.key.slice(2)); setProfile(null); }}>Edit Team Member</Button>}
                <Button onClick={() => setOffering(true)}>Send offer</Button>
              </div>
            </div>
          </ModalShell>
        )}
        {editRosterId && <TeamMemberDialog memberId={editRosterId} onClose={() => setEditRosterId(null)} onSaved={(m) => { setEditRosterId(null); setNotice(m); void load(); }} />}
        {offering && <SendInternalOfferFlow onClose={() => { setOffering(false); setProfile(null); }} onSent={() => { setOffering(false); setProfile(null); setNotice("Offer sent. A response is not a confirmed assignment."); }} />}

        <section className="pd-panel">
          <div className="pd-panel-head"><h2>Availability requests</h2></div>
          <div>
            {requests.length === 0 ? (
              <div className="pd-empty">
                <LayoutGrid />
                <h3>No internal requests sent</h3>
                <p>Choose a shift and ask your team about availability.</p>
              </div>
            ) : (
              <ul className="m-0 list-none divide-y divide-slate-100 px-6 py-2">
                {requests.map((r) => (
                  <li key={r.id} className="space-y-2 py-3">
                    <div>
                      <p className="m-0 text-sm font-semibold text-slate-900">{r.title}</p>
                      <p className="m-0 text-xs text-slate-500">{r.startsAt ? `${fmt(r.startsAt)} · ` : ""}Sent {fmt(r.createdAt)}{r.message ? ` · ${r.message}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.replies.map((rep) => (
                        <span key={rep.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-xs">
                          <span className="font-medium text-slate-800">{rep.memberName}</span>
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${REPLY[rep.status].cls}`}>{REPLY[rep.status].label}</span>
                          {rep.status === "CONDITIONS" && rep.conditionsNote && <span className="text-slate-500">{rep.conditionsNote}</span>}
                          {rep.memberType === "ROSTER" && rep.status === "PENDING" && (
                            <>
                              <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => record(rep, "AVAILABLE")}>Mark available</button>
                              <button type="button" className="font-semibold text-red-600 hover:underline" onClick={() => record(rep, "UNAVAILABLE")}>Mark unavailable</button>
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
