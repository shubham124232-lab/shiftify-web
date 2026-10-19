"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { inp } from "@/components/jobs/post/shared";

interface Ticket { id: string; reference: string; subject: string; category: string; impact: string; relatedRef: string | null; description: string; status: string; createdAt: string }
interface Message { id: string; authorKind: "USER" | "SUPPORT"; body: string; createdAt: string }

const STATUS_LABEL: Record<string, string> = { OPEN: "Open", AWAITING_SUPPORT: "Awaiting support", RESOLVED: "Resolved", CLOSED: "Closed" };
const when = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// One ticket: the original request, the conversation, and Reply / Mark resolved / Reopen (Provider handoff).
export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ ticket: Ticket; messages: Message[] } | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => api.get<{ ticket: Ticket; messages: Message[] }>(`/support-tickets/${id}`)
    .then(setData).catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this ticket")), [id]);
  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(null);
    try { await fn(); setReply(""); await load(); } catch (e) { setError(e instanceof ApiError ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }

  const t = data?.ticket;
  const canReply = t && (t.status === "OPEN" || t.status === "AWAITING_SUPPORT");
  return (
    <div className="space-y-5 px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs text-slate-400">Help &amp; Tickets / {t?.reference ?? "Ticket"}</p>
          <h1 className="m-0 mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{t?.subject ?? "Ticket"}</h1>
          {t && <p className="m-0 mt-1.5 text-[15px] text-slate-500">{t.reference} · {t.category} · {t.impact} · {STATUS_LABEL[t.status] ?? t.status}</p>}
        </div>
        <Link href="/provider/help"><Button variant="outline">My tickets</Button></Link>
      </div>
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!data || !t ? <div className="h-32 animate-pulse rounded-2xl bg-slate-100" /> : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
            <p className="m-0 text-xs font-semibold text-slate-500">Your request · {when(t.createdAt)}{t.relatedRef ? ` · Reference: ${t.relatedRef}` : ""}</p>
            <p className="m-0 mt-2 whitespace-pre-wrap text-sm text-slate-800">{t.description}</p>
          </section>
          {data.messages.map((m) => (
            <section key={m.id} className={`rounded-2xl border px-6 py-4 ${m.authorKind === "SUPPORT" ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white"}`}>
              <p className="m-0 text-xs font-semibold text-slate-500">{m.authorKind === "SUPPORT" ? "Shiftify support" : "You"} · {when(m.createdAt)}</p>
              <p className="m-0 mt-2 whitespace-pre-wrap text-sm text-slate-800">{m.body}</p>
            </section>
          ))}
          {canReply ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <label className="block text-sm font-semibold text-slate-900">Reply
                <textarea className={`${inp} mt-1 h-28 w-full py-2`} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} placeholder="Add more detail or answer a question from support." /></label>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={busy || !reply.trim()} onClick={() => void run(() => api.post(`/support-tickets/${id}/replies`, { body: reply.trim() }))}>{busy ? "Sending…" : "Send reply"}</Button>
                <Button variant="outline" disabled={busy} onClick={() => void run(() => api.post(`/support-tickets/${id}/resolve`, {}))}>Mark as resolved</Button>
              </div>
            </section>
          ) : (
            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <p className="m-0 text-sm text-slate-600">{t.status === "RESOLVED" ? "This ticket is resolved." : "This ticket is closed. Raise a new ticket if you still need help."}</p>
              {t.status === "RESOLVED" && <Button variant="outline" disabled={busy} onClick={() => void run(() => api.post(`/support-tickets/${id}/reopen`, {}))}>Reopen ticket</Button>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
