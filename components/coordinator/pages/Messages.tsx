"use client";

// Support Coordinator "Messages": two-pane thread list + inline conversation over the job-thread
// endpoints, plus one-off direct messages (SC-F06 "Message first").

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  WorkspacePage, Panel, SubTabs, Chip, Avatar, Empty, ErrorNote, OutlineButton, PrimaryButton, fieldClass, BORDER,
} from "@/components/coordinator/workspace-ui";

interface Message { id: string; senderId: string; senderName: string; body: string; createdAt: string }
interface Thread {
  id: string; title: string; status?: string; postedByRoleLabel?: string; counterpartRoleLabels?: string[];
  lastMessage: Message | null; unreadCount: number; archived: boolean;
}
interface DirectInquiry { id: string; body: string; createdAt: string; readAt: string | null; sender: { id: string; name: string } }

type View = "INBOX" | "ARCHIVED" | "DIRECT";

const clock = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function CoordinatorMessages() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("INBOX");
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [inquiries, setInquiries] = useState<DirectInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [chat, setChat] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const archived = view === "ARCHIVED";

  function loadThreads() {
    return api.get<{ threads: Thread[] }>(`/jobs/messages/threads?includeArchived=${archived}`)
      .then(({ threads: list }) => {
        const sorted = [...list].filter((t) => (archived ? t.archived : !t.archived))
          .sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""));
        setThreads(sorted);
        setSelected((cur) => (cur && sorted.some((t) => t.id === cur) ? cur : sorted[0]?.id ?? null));
      })
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load messages"); setThreads([]); });
  }
  function loadInquiries() {
    api.get<{ inquiries: DirectInquiry[] }>("/direct-inquiries/received")
      .then((r) => setInquiries(r.inquiries ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load direct messages"); setInquiries([]); });
  }
  useEffect(() => {
    if (view === "DIRECT") loadInquiries(); else { setThreads(null); void loadThreads(); }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(loadInquiries, []);

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

  async function toggleArchive(id: string) {
    setThreads((prev) => prev?.filter((t) => t.id !== id) ?? prev);
    try { await api.patch(`/jobs/${id}/messages/archive`, { archived: !archived }); } catch { void loadThreads(); }
  }

  async function markInquiryRead(id: string) {
    setInquiries((prev) => prev?.map((i) => (i.id === id ? { ...i, readAt: i.readAt ?? new Date().toISOString() } : i)) ?? prev);
    try { await api.patch(`/direct-inquiries/${id}/read`); } catch { loadInquiries(); }
  }

  const unreadDirect = (inquiries ?? []).filter((i) => !i.readAt).length;
  const q = search.trim().toLowerCase();
  const shown = (threads ?? []).filter((t) => !q || t.title.toLowerCase().includes(q) || (t.lastMessage?.body.toLowerCase().includes(q) ?? false));
  const current = shown.find((t) => t.id === selected) ?? null;
  const sub = (t: Thread) => [t.counterpartRoleLabels?.[0] ?? t.postedByRoleLabel, t.status ? t.status.replace("_", " ").toLowerCase() : null].filter(Boolean).join(" · ");

  return (
    <WorkspacePage title="Messages" description="Conversations linked to participant requests.">
      <SubTabs items={[
        { label: "Inbox", active: view === "INBOX", onClick: () => setView("INBOX") },
        { label: "Archived", active: view === "ARCHIVED", onClick: () => setView("ARCHIVED") },
        { label: unreadDirect ? `Direct messages (${unreadDirect})` : "Direct messages", active: view === "DIRECT", onClick: () => setView("DIRECT") },
      ]} />
      {error && <ErrorNote>{error}</ErrorNote>}

      {view === "DIRECT" ? (
        <Panel title="Direct messages" bodyClassName="px-5">
          {inquiries === null ? <Empty>Loading…</Empty> : !inquiries.length ? <Empty>One-off messages people send you before any request connects you show up here.</Empty> : (
            <div className="divide-y divide-[#e4e6ed]">
              {inquiries.map((inq) => (
                <div key={inq.id} className="flex items-start justify-between gap-3 py-5">
                  <div className="flex min-w-0 gap-3">
                    <Avatar name={inq.sender.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{inq.sender.name} {!inq.readAt && <Chip tone="red">New</Chip>}</p>
                      <p className="mt-1 text-xs text-slate-500">{clock(inq.createdAt)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{inq.body}</p>
                    </div>
                  </div>
                  {!inq.readAt && <OutlineButton onClick={() => void markInquiryRead(inq.id)}>Mark read</OutlineButton>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : threads === null ? <Empty>Loading…</Empty> : !threads.length ? (
        <Panel><Empty>{archived ? "Conversations you archive show up here." : "Each request gets its own thread once someone responds."}</Empty></Panel>
      ) : (
        <section className={`grid min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border ${BORDER} bg-white md:grid-cols-[320px_minmax(0,1fr)]`}>
          <div className={`flex flex-col border-b ${BORDER} md:border-b-0 md:border-r`}>
            <div className={`border-b ${BORDER} p-3`}>
              <input className={`${fieldClass} w-full`} placeholder="Search conversations…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {shown.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={`flex w-full items-start gap-3 border-b ${BORDER} px-4 py-3.5 text-left ${t.id === selected ? "bg-brand-50" : "hover:bg-slate-50"}`}
                >
                  <Avatar name={t.lastMessage?.senderName ?? t.title} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-slate-900">{t.lastMessage?.senderName ?? t.title}</span>
                      {t.unreadCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{t.unreadCount > 99 ? "99+" : t.unreadCount}</span>}
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-600">{t.title}</span>
                    <span className="block truncate text-xs text-slate-500">{t.lastMessage?.body ?? "No messages yet"}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-[480px] flex-col">
            <div className={`flex items-center justify-between gap-3 border-b ${BORDER} px-5 py-3`}>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-900">{current?.title ?? "Select a conversation"}</p>
                {current && <p className="text-xs text-slate-500">{sub(current) || "Request"}</p>}
              </div>
              {current && (
                <div className="flex gap-2">
                  <OutlineButton href={`/jobs/${current.id}`}>Request</OutlineButton>
                  <OutlineButton onClick={() => void toggleArchive(current.id)}>{archived ? "Unarchive" : "Archive"}</OutlineButton>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
              {!chat.length ? <p className="text-sm text-slate-500">No messages yet</p> : chat.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${mine ? "ml-auto bg-brand-600 text-white" : `border ${BORDER} bg-white text-slate-800`}`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-slate-500"}`}>{mine ? "You" : m.senderName} · {clock(m.createdAt)}</p>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            {current && (
              <form onSubmit={send} className={`flex gap-2 border-t ${BORDER} p-3`}>
                <input className={`${fieldClass} flex-1`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" aria-label="Message" maxLength={2000} />
                <PrimaryButton type="submit" disabled={sending || !draft.trim()}>Send</PrimaryButton>
              </form>
            )}
          </div>
        </section>
      )}
      <p className="text-xs text-slate-500">Please do not send unnecessary sensitive information in messages — share only what is needed to arrange the support.</p>
    </WorkspacePage>
  );
}
