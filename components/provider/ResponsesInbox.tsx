"use client";

// Provider PR-D04 "Responses & Enquiries" — PR-M01 unified inbox with the PR-M02 status model:
//   Worker responses (Staffing statuses) · Responses to my proposals (Opportunity statuses) ·
//   Capacity & direct enquiries · Home and Living enquiries (Vacancy statuses) · System & verification.
// Answering or progressing an enquiry is free — it never uses a Provider Action.

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/hooks/useAuth";
import { RequestDetailDialog, NearbyRequestsDialog } from "@/components/provider/RequestDialogs";
import { Button } from "@/components/ui/button";
import { MapPin, Search, RefreshCw, ShieldCheck } from "lucide-react";

interface Inquiry {
  id: string; body: string; createdAt: string; readAt: string | null;
  kind: "DIRECT" | "CAPACITY" | "HOME_LIVING"; status: string; listingId: string | null; listingTitle: string | null;
  parentInquiryId: string | null; senderUserId: string; recipientUserId: string;
  sender?: { id: string; name: string }; recipient?: { id: string; name: string };
  intake?: Intake | null;
}
interface Intake { ownerUserId: string | null; ownerName: string | null; internalNote: string | null; appointmentAt: string | null; appointmentType: string | null }
interface Thread { rootId: string; kind: Inquiry["kind"]; status: string; listingTitle: string | null; other: string; unread: boolean; messages: Inquiry[]; lastAt: string; intake: Intake | null }
interface AdminOpt { id: string; status: string; user: { id: string; name: string } }
interface InboxJob { id: string; title: string; suburb: string | null; urgency: string | null; status: string; scheduledStartAt: string | null }
interface WorkerResponse {
  id: string; status: string; applicantName: string | null; applicantRole: string;
  rateResponse: string | null; availabilityType: string | null; updatedAt: string; job: InboxJob;
  viewedAt?: string | null; clarification?: boolean;
}
interface OpportunityResponse { id: string; status: string; updatedAt: string; job: InboxJob; viewedAt?: string | null }
interface SystemNote { id: string; type: string; title: string; body: string; createdAt: string; read: boolean }

const SYSTEM_TYPES = new Set(["REGISTRATION_APPROVED", "REGISTRATION_REJECTED", "DOC_VERIFIED", "DOC_REJECTED", "DOCUMENT_EXPIRING", "REQUEST_STARTING_UNCONFIRMED"]);

// PR-M02 status model. Viewed = the poster has opened the request since the response arrived.
function staffingLabel(w: WorkerResponse): string {
  if (w.status === "INTERESTED") return w.clarification ? "Clarification" : w.viewedAt ? "Viewed" : "New";
  return ({ SHORTLISTED: "Shortlisted", SELECTED: "Confirmed", DECLINED: "Declined", WITHDRAWN: "Withdrawn", REQUEST_FILLED: "Filled" } as Record<string, string>)[w.status] ?? w.status;
}
function opportunityLabel(o: OpportunityResponse): string {
  if (o.status === "INTERESTED") return o.viewedAt ? "Viewed" : "Submitted";
  return ({ SHORTLISTED: "Shortlisted", SELECTED: "Accepted", DECLINED: "Unsuccessful", WITHDRAWN: "Withdrawn", REQUEST_FILLED: "Closed" } as Record<string, string>)[o.status] ?? o.status;
}
// Provider doc P65: New -> Responded -> Follow-up/Assessment -> Converted/Confirmed -> Closed; housing adds inspection/compatibility.
const SERVICE_STATUSES = [
  { v: "NEW", l: "New" }, { v: "RESPONDED", l: "Responded" }, { v: "FOLLOW_UP", l: "Follow-up" }, { v: "ASSESSMENT", l: "Assessment" },
  { v: "CONFIRMED", l: "Confirmed" }, { v: "CONVERTED", l: "Converted" }, { v: "UNSUITABLE", l: "Unsuitable" }, { v: "CLOSED", l: "Closed" }, { v: "ARCHIVED", l: "Archived" },
];
const ENQUIRY_STATUSES: Record<"DIRECT" | "CAPACITY", { v: string; l: string }[]> = { DIRECT: SERVICE_STATUSES, CAPACITY: SERVICE_STATUSES };
const VACANCY_STATUSES = [
  { v: "NEW", l: "New" }, { v: "QUALIFIED", l: "Qualified" }, { v: "INSPECTION", l: "Inspection / discussion" }, { v: "COMPATIBILITY", l: "Compatibility" },
  { v: "IN_PROGRESS", l: "In progress" }, { v: "CONFIRMED", l: "Confirmed" }, { v: "UNSUITABLE", l: "Unsuitable" }, { v: "CLOSED", l: "Closed" }, { v: "ARCHIVED", l: "Archived" },
];
const APPOINTMENT_TYPES = [{ v: "INTAKE_CALL", l: "Intake call" }, { v: "PROPERTY_INSPECTION", l: "Property inspection" }, { v: "COMPATIBILITY_MEETING", l: "Compatibility meeting" }];
const AVAILABILITY: Record<string, string> = {
  YES_EXACT: "Available at the requested time", YES_ADJUSTED: "Available at an adjusted time",
  PARTIAL: "Can cover part of the request", DISCUSS: "Wants to discuss availability", UNAVAILABLE: "Unavailable",
};
const RATE: Record<string, string> = {
  ACCEPT: "Accepts the offered rate", OFFER_OWN: "Proposes own rate", QUOTE_AFTER: "Will quote after discussion", DISCUSS: "Rate to discuss",
};

type Tab = "workers" | "opportunities" | "enquiries" | "homeliving" | "system";

function StatusPill({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{label}</span>;
}

const STATUS_LABELS: Record<string, string> = Object.fromEntries([...SERVICE_STATUSES, ...VACANCY_STATUSES].map((s) => [s.v, s.l]));

// Provider doc P65 "Enquiry detail": assign an intake owner, set the status, keep a private note, schedule a call or inspection.
function IntakeDialog({ thread, me, admins, onClose, onSaved }: { thread: Thread; me: string; admins: AdminOpt[]; onClose: () => void; onSaved: () => void }) {
  const root = thread.messages.find((m) => m.id === thread.rootId) ?? thread.messages[0];
  const statuses = thread.kind === "HOME_LIVING" ? VACANCY_STATUSES : SERVICE_STATUSES;
  const [owner, setOwner] = useState(thread.intake?.ownerUserId ?? "");
  const [status, setStatus] = useState(thread.status);
  const [note, setNote] = useState(thread.intake?.internalNote ?? "");
  const [scheduling, setScheduling] = useState(false);
  const [apptAt, setApptAt] = useState("");
  const [apptType, setApptType] = useState(thread.kind === "HOME_LIVING" ? "PROPERTY_INSPECTION" : "INTAKE_CALL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save(extra: Record<string, unknown> = {}, message = "Intake update saved") {
    setBusy(true); setError(null);
    try {
      await api.put(`/direct-inquiries/${thread.rootId}/intake`, { ownerUserId: owner || null, internalNote: note, status, ...extra });
      setDone(message);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the intake update"); }
    finally { setBusy(false); }
  }

  const shell = "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4";
  const card = "w-full max-w-[80vw] rounded-2xl bg-white p-6 shadow-xl";
  if (done) {
    return (
      <div className={shell}><div role="dialog" aria-modal="true" className={card}>
        <h2 className="m-0 text-lg font-bold text-slate-900">{done}</h2>
        <p className="mt-2 text-sm text-slate-600">Internal notes remain separate from messages. Direct enquiry management is free.</p>
        <div className="mt-5 flex justify-end"><button type="button" onClick={onSaved} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Done</button></div>
      </div></div>
    );
  }
  if (scheduling) {
    return (
      <div className={shell}><div role="dialog" aria-modal="true" className={card}>
        <h2 className="m-0 text-lg font-bold text-slate-900">Schedule intake discussion</h2>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Date and time
          <input type="datetime-local" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={apptAt} onChange={(e) => setApptAt(e.target.value)} /></label>
        <label className="mt-3 block text-sm font-semibold text-slate-700">Discussion type
          <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={apptType} onChange={(e) => setApptType(e.target.value)}>
            {APPOINTMENT_TYPES.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}</select></label>
        {error && <p className="m-0 mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={() => setScheduling(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Back</button>
          <button type="button" disabled={busy || !apptAt} onClick={() => void save({ appointmentAt: new Date(apptAt).toISOString(), appointmentType: apptType }, "Appointment saved")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save appointment"}</button>
        </div>
      </div></div>
    );
  }
  return (
    <div className={shell} onClick={onClose}>
      <div role="dialog" aria-modal="true" className={`${card} max-h-[92vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <p className="m-0 text-xs font-semibold text-slate-500">{thread.kind === "HOME_LIVING" ? "Housing enquiry" : thread.kind === "CAPACITY" ? "Capacity enquiry" : "Service enquiry"} · {STATUS_LABELS[thread.status] ?? thread.status}</p>
        <h2 className="m-0 mt-1 text-xl font-bold text-slate-900">{thread.listingTitle ?? "Direct enquiry"}</h2>
        <p className="m-0 mt-1 text-sm text-slate-500">{thread.other}</p>
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{root.body}</p>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Assign intake owner
          <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">Unassigned</option>
            <option value={me}>You (organisation owner)</option>
            {admins.map((a) => <option key={a.id} value={a.user.id}>{a.user.name}</option>)}
          </select></label>
        <label className="mt-3 block text-sm font-semibold text-slate-700">Status
          <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select></label>
        <label className="mt-3 block text-sm font-semibold text-slate-700">Private internal note
          <textarea className="mt-1 min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></label>
        <p className="m-0 mt-3 text-xs text-slate-500">Receiving and responding to a direct enquiry is free. A CRM status does not replace Participant consent or confirmed support.</p>
        {error && <p className="m-0 mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Close</button>
          <div className="flex flex-wrap gap-2">
            <Link href="/messages" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 no-underline">Open conversation</Link>
            <button type="button" onClick={() => setScheduling(true)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Schedule call or inspection</button>
            <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save intake update"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildThreads(rows: Inquiry[], me: string): Thread[] {
  const byRoot = new Map<string, Inquiry[]>();
  for (const r of rows) {
    const root = r.parentInquiryId ?? r.id;
    byRoot.set(root, [...(byRoot.get(root) ?? []), r]);
  }
  return [...byRoot.entries()].map(([rootId, msgs]) => {
    const ordered = msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = ordered.find((m) => m.id === rootId) ?? ordered[0];
    const iAmRecipientOfRoot = first.recipientUserId === me;
    return {
      rootId, kind: first.kind, status: first.status, listingTitle: first.listingTitle,
      other: (iAmRecipientOfRoot ? first.sender?.name : first.recipient?.name) ?? "Someone",
      unread: ordered.some((m) => m.recipientUserId === me && !m.readAt),
      messages: ordered, lastAt: ordered[ordered.length - 1].createdAt, intake: first.intake ?? null,
    };
  }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export type InboxView = "all" | "enquiries" | "responses";

// Shared inbox. "all" is the original Responses & Enquiries page; the Provider menu uses the two focused views:
//   enquiries  -> Enquiries & Applications (worker applications, enquiries, Home and Living enquiries)
//   responses  -> My Responses (replies to the Provider's own proposals)
export function ResponsesInbox({ view = "all" }: { view?: InboxView }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(view === "responses" ? "opportunities" : "workers");
  const [received, setReceived] = useState<Inquiry[]>([]);
  const [sent, setSent] = useState<Inquiry[]>([]);
  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [opps, setOpps] = useState<OpportunityResponse[]>([]);
  const [system, setSystem] = useState<SystemNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [intakeFor, setIntakeFor] = useState<string | null>(null);
  const [viewJob, setViewJob] = useState<{ id: string; own: boolean } | null>(null);
  const [admins, setAdmins] = useState<AdminOpt[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  useEffect(() => {
    if (view === "responses") return;
    api.get<{ administrators: AdminOpt[] }>("/provider-org/administrators").then((r) => setAdmins((r.administrators ?? []).filter((a) => a.status === "ACTIVE"))).catch(() => undefined);
  }, [view]);

  function load() {
    return Promise.all([
      api.get<{ inquiries: Inquiry[] }>("/direct-inquiries/received"),
      api.get<{ inquiries: Inquiry[] }>("/direct-inquiries/sent"),
      api.get<{ workerResponses: WorkerResponse[]; opportunityResponses: OpportunityResponse[] }>("/provider-org/inbox"),
      api.get<{ notifications: SystemNote[] }>("/notifications"),
    ])
      .then(([q, s, inbox, n]) => {
        setReceived(q.inquiries ?? []); setSent(s.inquiries ?? []);
        setWorkers(inbox.workerResponses ?? []); setOpps(inbox.opportunityResponses ?? []);
        setSystem((n.notifications ?? []).filter((x) => SYSTEM_TYPES.has(x.type)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { void load(); }, []);

  const me = user?.id ?? "";
  const threads = useMemo(() => buildThreads([...received, ...sent], me), [received, sent, me]);
  const enquiryThreads = threads.filter((t) => t.kind !== "HOME_LIVING");
  const homeThreads = threads.filter((t) => t.kind === "HOME_LIVING");

  async function setStatus(rootId: string, status: string) {
    setBusy(true); setError(null);
    try { await api.patch(`/direct-inquiries/${rootId}/status`, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update the status"); }
    finally { setBusy(false); }
  }
  async function markViewed(rootId: string) {
    try { await api.patch(`/direct-inquiries/${rootId}/read`, {}); await load(); } catch { /* non-critical */ }
  }
  async function sendReply(thread: Thread) {
    // Reply to the latest message addressed to me; if I sent the last one there is nothing to reply to yet.
    const target = [...thread.messages].reverse().find((m) => m.recipientUserId === me);
    if (!target || !replyBody.trim()) return;
    setBusy(true); setError(null);
    try { await api.post(`/direct-inquiries/${target.id}/reply`, { body: replyBody.trim() }); setReplyBody(""); setReplyFor(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send the reply"); }
    finally { setBusy(false); }
  }

  // PR-M03 — stop further contact from the other party on an enquiry thread (existing block API; reversible in Blocked users).
  async function blockOther(thread: Thread) {
    const other = thread.messages.find((m) => m.senderUserId !== me)?.senderUserId;
    if (!other) return;
    if (!window.confirm(`Block ${thread.other}? They will no longer be able to message you or see your profile. You can undo this in Blocked users.`)) return;
    setBusy(true); setError(null);
    try { await api.post("/users/blocks", { blockedUserId: other, blockMessages: true, hideProfile: true }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not block this user"); }
    finally { setBusy(false); }
  }

  async function reportThread(thread: Thread) {
    const reason = window.prompt("What is wrong with this conversation? Shiftify administrators will review it.");
    if (!reason || reason.trim().length < 3) return;
    setBusy(true); setError(null);
    try { await api.post(`/direct-inquiries/${thread.rootId}/report`, { reason: reason.trim() }); window.alert("Thanks — your report was sent to Shiftify administrators."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send the report"); }
    finally { setBusy(false); }
  }

  const newWorkers = workers.filter((w) => w.status === "INTERESTED" && !w.viewedAt).length;
  const allTabs: { key: Tab; label: string; count: number }[] = [
    { key: "workers", label: view === "enquiries" ? "Worker applications" : "Worker responses", count: newWorkers },
    { key: "opportunities", label: "Replies to my proposals", count: opps.filter((o) => o.status !== "INTERESTED").length },
    { key: "enquiries", label: "Capacity & direct enquiries", count: enquiryThreads.filter((t) => t.unread).length },
    { key: "homeliving", label: "Home and Living enquiries", count: homeThreads.filter((t) => t.unread).length },
    { key: "system", label: "System & verification", count: system.filter((s) => !s.read).length },
  ];
  const visibleKeys: Tab[] = view === "enquiries" ? ["workers", "enquiries", "homeliving"] : view === "responses" ? ["opportunities"] : ["workers", "opportunities", "enquiries", "homeliving", "system"];
  const tabs = allTabs.filter((t) => visibleKeys.includes(t.key));

  const intakeThread = intakeFor ? threads.find((t) => t.rootId === intakeFor) ?? null : null;
  const empty = (title: string, hint: string) => (
    <div className="text-center py-12">
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{hint}</p>
    </div>
  );

  const threadList = (list: Thread[], emptyTitle: string) => list.length === 0 ? empty(emptyTitle, "Answering an enquiry is free — it never uses a Provider Action.") : (
    <div className="flex flex-col gap-2.5">
      {list.map((t) => {
        const statuses = t.kind === "HOME_LIVING" ? VACANCY_STATUSES : ENQUIRY_STATUSES[t.kind];
        const canReply = t.messages.some((m) => m.recipientUserId === me);
        return (
          <div key={t.rootId} className={`bg-white border rounded-xl px-4 py-3.5 ${t.unread ? "border-indigo-300" : "border-slate-200"}`}>
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-sm font-bold text-slate-800">{t.other}</span>
              <div className="flex items-center gap-2">
                {t.unread && <StatusPill label="New message" />}
                <span className="text-xs text-slate-400">{new Date(t.lastAt).toLocaleDateString("en-AU")}</span>
              </div>
            </div>
            {t.listingTitle && <p className="text-xs text-slate-500 m-0 mb-1">About: {t.listingTitle}</p>}
            <p className="text-xs text-slate-500 m-0 mb-1">{STATUS_LABELS[t.status] ?? t.status} · Owner: {t.intake?.ownerName ?? "Unassigned"}{t.intake?.appointmentAt ? ` · ${APPOINTMENT_TYPES.find((a) => a.v === t.intake?.appointmentType)?.l ?? "Appointment"} ${new Date(t.intake.appointmentAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}</p>
            <div className="space-y-1.5">
              {t.messages.map((m) => (
                <p key={m.id} className={`text-sm whitespace-pre-wrap m-0 rounded-lg px-2.5 py-1.5 ${m.senderUserId === me ? "bg-indigo-50 text-slate-700" : "bg-slate-50 text-slate-700"}`}>
                  <span className="text-[10px] font-semibold text-slate-400 block">{m.senderUserId === me ? "You" : t.other} · {new Date(m.createdAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</span>
                  {m.body}
                </p>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {t.messages.some((m) => m.recipientUserId === me && m.id === t.rootId) && (
                <label className="text-xs text-slate-500 flex items-center gap-1.5">
                  Status
                  <select className="rounded-md border border-slate-200 px-2 py-1 text-xs" value={t.status} disabled={busy} onChange={(e) => setStatus(t.rootId, e.target.value)}>
                    {statuses.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </label>
              )}
              {t.messages.some((m) => m.recipientUserId === me && m.id === t.rootId) && <button type="button" onClick={() => setIntakeFor(t.rootId)} className="text-xs font-semibold text-indigo-600 hover:underline">Open enquiry</button>}
              {t.unread && <button type="button" onClick={() => markViewed(t.rootId)} className="text-xs font-semibold text-indigo-600 hover:underline">Mark as viewed</button>}
              {canReply && <button type="button" onClick={() => setReplyFor(replyFor === t.rootId ? null : t.rootId)} className="text-xs font-semibold text-indigo-600 hover:underline">Reply</button>}
              {t.messages.some((m) => m.senderUserId !== me) && <button type="button" disabled={busy} onClick={() => blockOther(t)} className="text-xs font-semibold text-rose-600 hover:underline">Block</button>}
              {t.messages.some((m) => m.senderUserId !== me) && <button type="button" disabled={busy} onClick={() => reportThread(t)} className="text-xs font-semibold text-slate-500 hover:underline">Report</button>}
            </div>
            {replyFor === t.rootId && (
              <div className="mt-2 flex gap-2">
                <input className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply" maxLength={2000} />
                <button type="button" disabled={busy || !replyBody.trim()} onClick={() => sendReply(t)} className="rounded-md bg-slate-900 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50">Send</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const filteredOpps = opps.filter((o) => (!statusF || opportunityLabel(o) === statusF) && (!q.trim() || `${o.job.title} ${o.job.suburb ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));
  const oppStatuses = Array.from(new Set(opps.map(opportunityLabel)));

  return (
    <>
      {view === "responses" ? (
        <div className="px-8 pt-6">
          <p className="m-0 text-xs text-slate-400">Provider / Responses</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">My Provider responses</h1>
              <p className="m-0 mt-1.5 text-[15px] text-slate-500">Track proposals, discussions and agreed service starts.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setMapOpen(true)}><MapPin className="mr-1.5 h-4 w-4" />Map view</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm" placeholder="Search responses" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {oppStatuses.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setQ(""); setStatusF(""); }}><RefreshCw className="mr-1.5 h-4 w-4" />Clear filters</Button>
          </div>
          <p className="m-0 mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
            Participant identifiers, exact addresses and sensitive details are protected. Payment cannot unlock private information.
          </p>
        </div>
      ) : (
      <PageHeader
        title={view === "enquiries" ? "Enquiries & Applications" : "Responses & Enquiries"}
        description={view === "enquiries"
          ? "Respond, allocate an intake owner and track the next step on applications and enquiries about your posts and listings."
          : "One inbox for worker responses, replies to your proposals, enquiries, Home and Living enquiries and system messages."}
      />
      )}
      {mapOpen && <NearbyRequestsDialog mode="opportunity" requests={filteredOpps.map((o) => ({ id: o.job.id, title: o.job.title, urgency: o.job.urgency as never, suburb: o.job.suburb ?? "", scheduledStartAt: o.job.scheduledStartAt ?? "", status: o.job.status as never, state: null }))}
        onClose={() => setMapOpen(false)} onOpen={(id) => { setMapOpen(false); setViewJob({ id, own: false }); }} />}
      <div className={view === "responses" ? "px-8 py-6" : "max-w-3xl mx-auto px-5 py-6"}>
        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.length > 1 && tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`h-8 px-4 rounded-full border text-sm font-semibold inline-flex items-center gap-1.5 ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {t.label}{t.count > 0 && <span className="text-xs opacity-80">({t.count})</span>}
            </button>
          ))}
          {view === "all" && <Link href="/job-invites" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Job invitations</Link>}
          {view === "responses" && <Link href="/jobs" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Browse requests</Link>}
          <Link href="/messages" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Messages</Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {viewJob && <RequestDetailDialog jobId={viewJob.id} own={viewJob.own} onClose={() => setViewJob(null)} />}
        {intakeThread && (
          <IntakeDialog thread={intakeThread} me={me} admins={admins} onClose={() => setIntakeFor(null)}
            onSaved={() => { setIntakeFor(null); void load(); }} />
        )}
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : tab === "workers" ? (
          workers.length === 0 ? empty(view === "enquiries" ? "No applications yet" : "No worker responses yet", "Applications to your staffing requests will show up here.") : (
            <div className="flex flex-col gap-2.5">
              {workers.map((w) => (
                <button key={w.id} type="button" onClick={() => setViewJob({ id: w.job.id, own: true })} className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3.5 block hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-bold text-slate-800">{w.applicantName ?? "Worker"}</span>
                    <StatusPill label={staffingLabel(w)} />
                  </div>
                  <p className="text-sm text-slate-600 m-0">{w.job.title}{w.job.suburb ? ` · ${w.job.suburb}` : ""}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-0">
                    {[w.availabilityType ? AVAILABILITY[w.availabilityType] : null, w.rateResponse ? RATE[w.rateResponse] : null].filter(Boolean).join(" · ") || "Open the request to compare and confirm."}
                  </p>
                </button>
              ))}
            </div>
          )
        ) : tab === "opportunities" ? (
          filteredOpps.length === 0 ? empty("No responses yet", "Opportunities you respond to as a Provider, and what the Participant or Coordinator did with them, are tracked here.") : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOpps.map((o) => (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <StatusPill label={opportunityLabel(o)} />
                  <h3 className="m-0 mt-3 text-lg font-bold text-slate-900">{o.job.title}</h3>
                  <p className="m-0 mt-1.5 text-sm text-slate-500">Submitted as Provider{o.job.suburb ? ` · ${o.job.suburb}` : ""}</p>
                  <p className="m-0 mt-1 text-xs text-slate-400">Updated {new Date(o.updatedAt).toLocaleDateString("en-AU")}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewJob({ id: o.job.id, own: false })}>View response</Button>
                    <Link href="/messages"><Button variant="outline" size="sm" type="button">Open conversation</Button></Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "enquiries" ? threadList(enquiryThreads, "No enquiries yet")
        : tab === "homeliving" ? threadList(homeThreads, "No Home and Living enquiries yet")
        : system.length === 0 ? empty("No system messages", "Verification, document-expiry and request-timing messages appear here.") : (
          <div className="flex flex-col gap-2.5">
            {system.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-bold text-slate-800">{s.title}</span>
                  <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString("en-AU")}</span>
                </div>
                <p className="text-sm text-slate-600 m-0">{s.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
