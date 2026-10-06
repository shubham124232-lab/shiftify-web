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

interface Inquiry {
  id: string; body: string; createdAt: string; readAt: string | null;
  kind: "DIRECT" | "CAPACITY" | "HOME_LIVING"; status: string; listingId: string | null; listingTitle: string | null;
  parentInquiryId: string | null; senderUserId: string; recipientUserId: string;
  sender?: { id: string; name: string }; recipient?: { id: string; name: string };
}
interface Thread { rootId: string; kind: Inquiry["kind"]; status: string; listingTitle: string | null; other: string; unread: boolean; messages: Inquiry[]; lastAt: string }
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
const ENQUIRY_STATUSES: Record<"DIRECT" | "CAPACITY", { v: string; l: string }[]> = {
  DIRECT: [{ v: "NEW", l: "New" }, { v: "RESPONDED", l: "Responded" }, { v: "FOLLOW_UP", l: "Follow-up" }, { v: "CONVERTED", l: "Converted" }, { v: "CLOSED", l: "Closed" }],
  CAPACITY: [{ v: "NEW", l: "New" }, { v: "RESPONDED", l: "Responded" }, { v: "FOLLOW_UP", l: "Follow-up" }, { v: "CONVERTED", l: "Converted" }, { v: "CLOSED", l: "Closed" }],
};
const VACANCY_STATUSES = [{ v: "NEW", l: "New" }, { v: "QUALIFIED", l: "Qualified" }, { v: "INSPECTION", l: "Inspection / discussion" }, { v: "IN_PROGRESS", l: "In progress" }, { v: "CLOSED", l: "Closed" }];
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
      messages: ordered, lastAt: ordered[ordered.length - 1].createdAt,
    };
  }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export default function ProviderResponsesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("workers");
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

  const newWorkers = workers.filter((w) => w.status === "INTERESTED" && !w.viewedAt).length;
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "workers", label: "Worker responses", count: newWorkers },
    { key: "opportunities", label: "Replies to my proposals", count: opps.filter((o) => o.status !== "INTERESTED").length },
    { key: "enquiries", label: "Capacity & direct enquiries", count: enquiryThreads.filter((t) => t.unread).length },
    { key: "homeliving", label: "Home and Living enquiries", count: homeThreads.filter((t) => t.unread).length },
    { key: "system", label: "System & verification", count: system.filter((s) => !s.read).length },
  ];

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
              {t.unread && <button type="button" onClick={() => markViewed(t.rootId)} className="text-xs font-semibold text-indigo-600 hover:underline">Mark as viewed</button>}
              {canReply && <button type="button" onClick={() => setReplyFor(replyFor === t.rootId ? null : t.rootId)} className="text-xs font-semibold text-indigo-600 hover:underline">Reply</button>}
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

  return (
    <>
      <PageHeader title="Responses & Enquiries" description="One inbox for worker responses, replies to your proposals, enquiries, Home and Living enquiries and system messages." />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`h-8 px-4 rounded-full border text-sm font-semibold inline-flex items-center gap-1.5 ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {t.label}{t.count > 0 && <span className="text-xs opacity-80">({t.count})</span>}
            </button>
          ))}
          <Link href="/job-invites" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Job invitations</Link>
          <Link href="/messages" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Messages</Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : tab === "workers" ? (
          workers.length === 0 ? empty("No worker responses yet", "Responses to your staffing requests will show up here.") : (
            <div className="flex flex-col gap-2.5">
              {workers.map((w) => (
                <Link key={w.id} href={`/jobs/${w.job.id}`} className="no-underline bg-white border border-slate-200 rounded-xl px-4 py-3.5 block hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-bold text-slate-800">{w.applicantName ?? "Worker"}</span>
                    <StatusPill label={staffingLabel(w)} />
                  </div>
                  <p className="text-sm text-slate-600 m-0">{w.job.title}{w.job.suburb ? ` · ${w.job.suburb}` : ""}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-0">
                    {[w.availabilityType ? AVAILABILITY[w.availabilityType] : null, w.rateResponse ? RATE[w.rateResponse] : null].filter(Boolean).join(" · ") || "Open the request to compare and confirm."}
                  </p>
                </Link>
              ))}
            </div>
          )
        ) : tab === "opportunities" ? (
          opps.length === 0 ? empty("No responses yet", "Opportunities you respond to as a Provider, and what the Participant or Coordinator did with them, are tracked here.") : (
            <div className="flex flex-col gap-2.5">
              {opps.map((o) => (
                <Link key={o.id} href={`/jobs/${o.job.id}`} className="no-underline bg-white border border-slate-200 rounded-xl px-4 py-3.5 block hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-bold text-slate-800">{o.job.title}</span>
                    <StatusPill label={opportunityLabel(o)} />
                  </div>
                  <p className="text-xs text-slate-500 m-0">{o.job.suburb ?? ""} · updated {new Date(o.updatedAt).toLocaleDateString("en-AU")}</p>
                </Link>
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
