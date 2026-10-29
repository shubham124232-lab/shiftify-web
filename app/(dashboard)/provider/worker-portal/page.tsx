"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, MapPin, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { ModalShell } from "@/components/jobs/post/shared";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { InternalOfferDetailDialog, OFFER_STATUS, type InternalOffer } from "@/components/provider/InternalOfferDialogs";
import { NearbyRequestsDialog } from "@/components/provider/RequestDialogs";

interface Member { key: string; name: string; kind: "MANAGED" | "ROSTER" }
interface Reply { id: string; memberName: string; status: "PENDING" | "AVAILABLE" | "CONDITIONS" | "UNAVAILABLE"; conditionsNote?: string | null }
interface Req { id: string; title: string; startsAt: string | null; replies: Reply[] }
interface Assignment { id: string; title: string; suburb: string; scheduledStartAt: string; workerName: string }

const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const REPLY_LABEL = { PENDING: "Pending", AVAILABLE: "Available", CONDITIONS: "Available with conditions", UNAVAILABLE: "Unavailable" } as const;

// Provider "Internal worker portal" (approved demo): preview what one internal worker sees and answer on their behalf.
export default function ProviderWorkerPortalPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [offers, setOffers] = useState<InternalOffer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [who, setWho] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [condFor, setCondFor] = useState<string | null>(null);
  const [condNote, setCondNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(() => Promise.all([
    api.get<{ members: Member[]; requests: Req[] }>("/provider-workspace/team-availability"),
    api.get<{ internalOffers?: InternalOffer[]; assignments: Assignment[] }>("/provider-workspace/offers-assignments"),
  ]).then(([t, o]) => {
    setMembers(t.members ?? []); setRequests(t.requests ?? []); setOffers(o.internalOffers ?? []); setAssignments(o.assignments ?? []);
    setWho((cur) => cur || (t.members?.[0]?.name ?? ""));
  }).catch((e) => { setError(e instanceof Error ? e.message : "Could not load the portal"); setMembers([]); }), []);
  useEffect(() => { load(); }, [load]);

  async function answer(replyId: string, status: "AVAILABLE" | "CONDITIONS" | "UNAVAILABLE", conditionsNote?: string) {
    setError(null);
    try { await api.patch(`/provider-workspace/team-availability/replies/${replyId}`, { status, ...(conditionsNote ? { conditionsNote } : {}) }); setCondFor(null); setCondNote(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not record the answer"); }
  }

  const mine = requests.map((r) => ({ r, reply: r.replies.find((x) => x.memberName === who) })).filter((x) => x.reply);
  const myOffers = offers.filter((o) => o.memberName === who);
  const myAssignments = assignments.filter((a) => a.workerName === who);
  const viewingOffer = myOffers.find((o) => o.id === viewing) ?? null;
  const first = who.split(" ")[0];

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Worker portal</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Internal worker portal</h1>
            <p>Personal access preview · funded by the Provider organisation.</p>
          </div>
          <div className="pd-buttons" />
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {members === null ? <div className="pd-quiet-empty">Loading…</div> : members.length === 0 ? (
          <section className="pd-panel"><div className="pd-quiet-empty">No internal team members yet. Add one from Internal Team to preview their portal.</div></section>
        ) : (
          <>
            <div className="pd-toolbar">
              <label className="pd-field" style={{ flex: "0 1 320px" }}>Preview as
                <select value={who} onChange={(e) => setWho(e.target.value)}>
                  {members.map((m) => <option key={m.key} value={m.name}>{m.name}</option>)}
                </select>
              </label>
              <span className="pd-badge pd-badge-blue">Own records only</span>
              <button type="button" className="pd-btn" onClick={() => setMapOpen(true)}><MapPin />Check travel on map</button>
              <button type="button" className="pd-btn" onClick={() => setInviteOpen(true)}>Passwordless invitation preview</button>
            </div>

            <div className="pd-card-header" style={{ marginBottom: 24 }}>
              <span className="pd-avatar pd-avatar-lg">{initials(who)}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Hello, {first}</h2>
                <span className="pd-small pd-muted">Your offers, assignments and assignment messages.</span>
              </div>
            </div>

            <div className="pd-grid2">
              <section className="pd-panel">
                <div className="pd-panel-head"><h2>My availability requests</h2></div>
                {mine.length === 0 ? (
                  <div className="pd-empty"><LayoutGrid /><h3>No availability requests</h3><p>Your Provider can send a personal availability request.</p></div>
                ) : mine.map(({ r, reply }) => (
                  <div key={r.id} className="pd-task-row" style={{ alignItems: "flex-start", flexDirection: "column" }}>
                    <div>
                      <strong>{r.title}</strong>
                      <p>{r.startsAt ? fmt(r.startsAt) : "Time to be confirmed"}</p>
                      <span className="pd-badge" style={{ marginTop: 8 }}>{REPLY_LABEL[reply!.status]}</span>
                      {reply!.status === "CONDITIONS" && reply!.conditionsNote && <p>Conditions: {reply!.conditionsNote}</p>}
                    </div>
                    {reply!.status === "PENDING" && (
                      <div className="pd-buttons">
                        <button type="button" className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => answer(reply!.id, "AVAILABLE")}>Available</button>
                        <button type="button" className="pd-btn pd-btn-sm" onClick={() => { setCondFor(reply!.id); setCondNote(""); }}>Available with conditions</button>
                        <button type="button" className="pd-btn pd-btn-sm" onClick={() => answer(reply!.id, "UNAVAILABLE")}>Unavailable</button>
                      </div>
                    )}
                    {condFor === reply!.id && (
                      <div className="pd-buttons" style={{ width: "100%" }}>
                        <input value={condNote} onChange={(e) => setCondNote(e.target.value)} maxLength={500} placeholder="e.g. Can start after 10am" aria-label="Conditions"
                          style={{ flex: 1, minHeight: 40, padding: "0 12px", border: "1px solid var(--pd-line)", borderRadius: 8 }} />
                        <button type="button" className="pd-btn pd-btn-primary pd-btn-sm" disabled={!condNote.trim()} onClick={() => answer(reply!.id, "CONDITIONS", condNote.trim())}>Send</button>
                        <button type="button" className="pd-btn pd-btn-sm" onClick={() => setCondFor(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </section>

              <section className="pd-panel">
                <div className="pd-panel-head"><h2>My assignments and calendar</h2></div>
                {myAssignments.length === 0 ? (
                  <div className="pd-empty"><LayoutGrid /><h3>No assignments</h3><p>Confirmed assignments will appear on your personal calendar.</p></div>
                ) : myAssignments.map((a) => (
                  <div key={a.id} className="pd-task-row"><div><strong>{a.title}</strong><p>{a.suburb} · {fmt(a.scheduledStartAt)}</p></div></div>
                ))}
              </section>

              <section className="pd-panel">
                <div className="pd-panel-head"><h2>My offers</h2></div>
                {myOffers.length === 0 ? (
                  <div className="pd-empty"><LayoutGrid /><h3>No personal offers</h3><p>An application or availability response does not confirm a shift.</p></div>
                ) : myOffers.map((o) => (
                  <div key={o.id} className="pd-task-row">
                    <div><strong>{o.job.title}</strong><p>{fmt(o.job.scheduledStartAt)}</p></div>
                    <span className="pd-buttons">
                      <span className={`pd-badge ${OFFER_STATUS[o.status].cls}`}>{OFFER_STATUS[o.status].label}</span>
                      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setViewing(o.id)}>View offer</button>
                    </span>
                  </div>
                ))}
              </section>

              <p className="pd-info-banner" style={{ alignSelf: "start" }}>
                <ShieldCheck width={18} height={18} className="shrink-0" />
                This portal does not grant Provider-wide board access or independent worker applications. Those belong to a separately verified role.
              </p>
            </div>
          </>
        )}
      </div>

      {viewingOffer && <InternalOfferDetailDialog offer={viewingOffer} onClose={() => setViewing(null)} onChanged={() => { setViewing(null); load(); }} />}
      {mapOpen && (
        <NearbyRequestsDialog
          requests={myAssignments.map((a) => ({ id: a.id, title: a.title, urgency: "ROUTINE" as never, suburb: a.suburb, scheduledStartAt: a.scheduledStartAt, status: "ASSIGNED" as never, state: null }))}
          onClose={() => setMapOpen(false)} onOpen={() => setMapOpen(false)} />
      )}
      {inviteOpen && (
        <ModalShell title="Passwordless invitation preview" subtitle={who} onClose={() => setInviteOpen(false)}>
          <div className="pd-modal-body">
            <div className="pd-form-title"><h3>What {first} receives</h3></div>
            <p className="pd-notice">Shiftify: {first}, your Provider has invited you to see your offers, assignments and calendar. Open the link on your phone to sign in. No password is needed, and the link expires after 7 days.</p>
            <p className="pd-note">Preview only. Nothing is sent from this screen.</p>
          </div>
          <div className="pd-modal-foot"><button type="button" className="pd-btn" onClick={() => setInviteOpen(false)}>Close</button></div>
        </ModalShell>
      )}
    </div>
  );
}
