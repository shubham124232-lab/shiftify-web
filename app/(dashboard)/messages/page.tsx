"use client";

import { useEffect, useRef, useState } from "react";
import { Send, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { api } from "@/lib/api";
import { CoordinatorMessages } from "@/components/coordinator/pages/Messages";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface Thread {
  id: string;
  title: string;
  status?: string;
  postedByRoleLabel?: string;
  counterpartRoleLabels?: string[];
  lastMessage: Message | null;
  unreadCount: number;
  archived: boolean;
}

// SC-F06 "Message first" (Journey 9) — a flat, one-shot pre-connection
// message (DirectInquiry), not a job thread. No replies/threading, so it
// gets its own simple list rather than living inside the job-thread inbox.
interface DirectInquiry {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; name: string; avatarUrl: string | null };
}

// SW doc Window 28 — Unread / who is on the other side / Request / Confirmed support.
const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: "ROLE:Participant", label: "Participant" },
  { value: "ROLE:Support Coordinator", label: "Coordinator" },
  { value: "ROLE:Provider", label: "Provider" },
  { value: "ROLE:Support worker", label: "Support worker" },
  { value: "OPEN", label: "Request" },
  { value: "CONFIRMED", label: "Confirmed support" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

type View = "threads" | "inquiries";

const initialsOf = (t: string) => t.split(/[\s·]+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "··";
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();

// Provider workspace: the approved demo's two-pane layout (thread list + inline conversation) over the same job-thread endpoints.
function ProviderMessages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [chat, setChat] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function loadThreads() {
    return api.get<{ threads: Thread[] }>(`/jobs/messages/threads?includeArchived=${showArchived}`)
      .then(({ threads: list }) => {
        const sorted = [...list].filter((t) => showArchived || !t.archived).sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""));
        setThreads(sorted);
        setSelected((cur) => (cur && sorted.some((t) => t.id === cur) ? cur : sorted[0]?.id ?? null));
      })
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load messages"); setThreads([]); });
  }
  useEffect(() => { void loadThreads(); }, [showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadChat(id: string) {
    return api.get<{ messages: Message[] }>(`/jobs/${id}/messages`).then((r) => setChat(r.messages ?? [])).catch(() => setChat([]));
  }
  useEffect(() => {
    if (!selected) { setChat([]); return; }
    void loadChat(selected);
    api.patch(`/jobs/${selected}/messages/read`, {}).catch(() => undefined);
  }, [selected]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [chat]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/jobs/${selected}/messages`, { body: draft.trim() });
      setDraft("");
      await loadChat(selected);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send the message"); }
    finally { setSending(false); }
  }

  const current = threads?.find((t) => t.id === selected) ?? null;
  const sub = (t: Thread) => [t.counterpartRoleLabels?.[0] ?? t.postedByRoleLabel, t.status ? t.status.replace("_", " ").toLowerCase() : null].filter(Boolean).join(" · ");

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Messages</div>
        <div className="pd-page-head">
          <div>
            <h1>Messages</h1>
            <p>Conversations stay linked to their request, listing or assignment.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn" onClick={() => setShowArchived((v) => !v)}>{showArchived ? "Inbox" : "Archived"}</button>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {threads === null ? <div className="pd-quiet-empty">Loading…</div> : threads.length === 0 ? (
          <section className="pd-panel">
            <div className="pd-empty">
              <LayoutGrid />
              <h3>{showArchived ? "No archived conversations" : "No active conversations"}</h3>
              <p>{showArchived ? "Conversations you archive show up here." : "Each request gets its own thread once someone applies or accepts."}</p>
            </div>
          </section>
        ) : (
          <section className="pd-panel pd-message-layout">
            <div className="pd-thread-list">
              {threads.map((t) => (
                <button key={t.id} type="button" className={`pd-thread${t.id === selected ? " active" : ""}`} onClick={() => setSelected(t.id)}>
                  <span className="pd-avatar">{initialsOf(t.title)}</span>
                  <span>
                    <strong>{t.title}</strong>{t.unreadCount > 0 ? ` (${t.unreadCount > 99 ? "99+" : t.unreadCount})` : ""}<br />
                    <small>{sub(t) || "Request"}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="pd-chat">
              <div className="pd-chat-head">
                <strong>{current?.title}</strong>
                <div className="pd-small pd-muted">{current ? sub(current) : ""}</div>
              </div>
              <div className="pd-chat-messages">
                {chat.length === 0 ? <p className="pd-small pd-muted" style={{ margin: 0 }}>No messages yet</p> : chat.map((m) => (
                  <div key={m.id} className={`pd-bubble${m.senderId === user?.id ? " mine" : ""}`}>
                    {m.body}
                    <small>{m.senderId === user?.id ? "You" : m.senderName} · {clock(m.createdAt)}</small>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className="pd-chat-compose" onSubmit={send}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write an assignment or enquiry message…" aria-label="Message" maxLength={2000} />
                <button type="submit" className="pd-btn pd-btn-primary" disabled={sending || !draft.trim()}><Send />Send</button>
              </form>
            </div>
          </section>
        )}
        <div className="pd-notice">Please do not send unnecessary sensitive information in messages — share only what is needed to arrange the support.</div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { activeRole } = useAuth();
  if (activeRole === "COORDINATOR") return <CoordinatorMessages />;
  return activeRole === "PROVIDER" ? <ProviderMessages /> : <GeneralMessages />;
}

function GeneralMessages() {
  const { activeRole } = useAuth();
  const [view, setView] = useState<View>("threads");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [inquiries, setInquiries] = useState<DirectInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);

  function loadInquiries() {
    setInquiriesLoading(true);
    api.get<{ inquiries: DirectInquiry[] }>("/direct-inquiries/received")
      .then(({ inquiries }) => setInquiries(inquiries ?? []))
      .catch((e: any) => setInquiriesError(e.message))
      .finally(() => setInquiriesLoading(false));
  }

  useEffect(() => {
    if (view === "inquiries") loadInquiries();
  }, [view]);

  async function markInquiryRead(id: string) {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, readAt: i.readAt ?? new Date().toISOString() } : i)));
    try {
      await api.patch(`/direct-inquiries/${id}/read`);
    } catch {
      loadInquiries();
    }
  }

  function load(includeArchived: boolean) {
    setLoading(true);
    api.get<{ threads: Thread[] }>(`/jobs/messages/threads?includeArchived=${includeArchived}`)
      .then(({ threads }) => {
        const sorted = [...threads].sort((a, b) => {
          const at = a.lastMessage?.createdAt ?? "";
          const bt = b.lastMessage?.createdAt ?? "";
          return bt.localeCompare(at);
        });
        setThreads(sorted);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(showArchived);
  }, [showArchived]);

  async function toggleArchive(threadId: string, archived: boolean) {
    // Optimistic: drop it from (or keep it out of) the current view immediately.
    setThreads(prev => prev.filter(t => t.id !== threadId));
    try {
      await api.patch(`/jobs/${threadId}/messages/archive`, { archived });
    } catch {
      load(showArchived);
    }
  }

  const visible = showArchived ? threads : threads.filter(t => !t.archived);
  const filtered = visible.filter((thread) => {
    if (statusFilter === "UNREAD" && thread.unreadCount === 0) return false;
    else if (statusFilter.startsWith("ROLE:") && !(thread.counterpartRoleLabels?.length ? thread.counterpartRoleLabels.includes(statusFilter.slice(5)) : thread.postedByRoleLabel === statusFilter.slice(5))) return false;
    else if (statusFilter === "CONFIRMED" && !["ASSIGNED", "IN_PROGRESS"].includes(thread.status ?? "")) return false;
    else if (["OPEN", "COMPLETED", "CANCELLED"].includes(statusFilter) && thread.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const inTitle = thread.title.toLowerCase().includes(q);
      const inBody = thread.lastMessage?.body.toLowerCase().includes(q) ?? false;
      if (!inTitle && !inBody) return false;
    }
    return true;
  });

  const unreadInquiries = inquiries.filter((i) => !i.readAt).length;

  return (
    <>
      <PageHeader title="Messages" description="Per-job conversation threads, plus one-off messages sent before a request connects you." />
      <div className="container-page py-8">
        <div className="flex gap-1.5 mb-4 border-b border-slate-200 pb-4">
          <button type="button" onClick={() => setView("threads")}
            className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
              view === "threads" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            Job threads
          </button>
          <button type="button" onClick={() => setView("inquiries")}
            className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
              view === "inquiries" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            Direct messages{unreadInquiries > 0 ? ` (${unreadInquiries})` : ""}
          </button>
          <Link href="/jobs" className="ml-auto h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center" title="Open a request and use Ask a question, or message one of your connections">New message</Link>
        </div>

        {view === "inquiries" ? (
          <>
            {inquiriesError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{inquiriesError}</div>
            )}
            {inquiriesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : inquiries.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon="✉️"
                    title="No direct messages"
                    description="One-off messages people send you from Find Directly, before any request connects you, show up here."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{inq.sender.name}</p>
                        {!inq.readAt && (
                          <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold">
                            New
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{inq.body}</p>
                    </div>
                    {!inq.readAt && (
                      <button
                        type="button"
                        onClick={() => markInquiryRead(inq.id)}
                        className="shrink-0 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
        <>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <p className="mb-3 mt-0 text-xs text-slate-500">Please do not send unnecessary sensitive information in messages — share only what is needed to arrange the support.</p>

        <div className="flex gap-1.5 mb-4">
          <button type="button" onClick={() => setShowArchived(false)}
            className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
              !showArchived ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            Inbox
          </button>
          <button type="button" onClick={() => setShowArchived(true)}
            className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
              showArchived ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            Archived
          </button>
        </div>

        {!loading && threads.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="h-9 px-3 border border-slate-200 rounded-lg text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.filter(f => (activeRole === "COORDINATOR" ? f.value !== "ROLE:Support Coordinator" : f.value !== "ROLE:Support worker")).map(f => (
                <button key={f.value} type="button" onClick={() => setStatusFilter(f.value)}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    statusFilter === f.value ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon="💬"
                title={showArchived ? "No archived conversations" : "No active conversations"}
                description={showArchived ? "Conversations you archive show up here." : "Each job gets its own thread once someone applies or accepts."}
              />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState icon="🔍" title="No matching conversations" description="Try a different search or filter." />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((thread) => (
              <div
                key={thread.id}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-brand-300 transition-colors"
              >
                <Link href={`/jobs/${thread.id}`} className="min-w-0 flex-1 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{thread.title}</p>
                      {thread.unreadCount > 0 && (
                        <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold">
                          {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                        </span>
                      )}
                    </div>
                    {(thread.counterpartRoleLabels?.[0] ?? thread.postedByRoleLabel) && <p className="text-[11px] text-slate-400 m-0">{thread.counterpartRoleLabels?.[0] ?? thread.postedByRoleLabel} · {thread.status ? thread.status.replace("_", " ").toLowerCase() : "request"}</p>}
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {thread.lastMessage ? `${thread.lastMessage.senderName}: ${thread.lastMessage.body}` : "No messages yet"}
                    </p>
                  </div>
                  {thread.lastMessage && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(thread.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleArchive(thread.id, !thread.archived)}
                  className="shrink-0 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {thread.archived ? "Unarchive" : "Archive"}
                </button>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </>
  );
}
