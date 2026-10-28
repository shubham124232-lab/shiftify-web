"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

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
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Help &amp; Tickets / {t?.reference ?? "Ticket"}</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>{t?.subject ?? "Ticket"}</h1>
            {t && <p>{t.reference} · {t.category} · {t.impact} · {STATUS_LABEL[t.status] ?? t.status}</p>}
          </div>
          <div className="pd-buttons">
            <Link href="/provider/help" className="pd-btn">My tickets</Link>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!data || !t ? <div className="pd-quiet-empty">Loading…</div> : (
          <>
            <section className="pd-panel pd-panel-pad">
              <p className="pd-small pd-muted" style={{ margin: 0, fontWeight: 600 }}>Your request · {when(t.createdAt)}{t.relatedRef ? ` · Reference: ${t.relatedRef}` : ""}</p>
              <p className="pd-card-body" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{t.description}</p>
            </section>
            {data.messages.map((m) => (
              <section key={m.id} className="pd-panel pd-panel-pad" style={m.authorKind === "SUPPORT" ? { background: "#fff8fb" } : undefined}>
                <p className="pd-small pd-muted" style={{ margin: 0, fontWeight: 600 }}>{m.authorKind === "SUPPORT" ? "Shiftify support" : "You"} · {when(m.createdAt)}</p>
                <p className="pd-card-body" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{m.body}</p>
              </section>
            ))}
            {canReply ? (
              <section className="pd-panel pd-panel-pad">
                <label className="pd-form-field">Reply
                  <textarea style={{ minHeight: 112 }} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} placeholder="Add more detail or answer a question from support." /></label>
                <div className="pd-buttons">
                  <button type="button" className="pd-btn pd-btn-primary" disabled={busy || !reply.trim()} onClick={() => void run(() => api.post(`/support-tickets/${id}/replies`, { body: reply.trim() }))}>{busy ? "Sending…" : "Send reply"}</button>
                  <button type="button" className="pd-btn" disabled={busy} onClick={() => void run(() => api.post(`/support-tickets/${id}/resolve`, {}))}>Mark as resolved</button>
                </div>
              </section>
            ) : (
              <section className="pd-panel pd-panel-pad">
                <div className="pd-buttons" style={{ alignItems: "center" }}>
                  <p className="pd-card-body" style={{ margin: 0 }}>{t.status === "RESOLVED" ? "This ticket is resolved." : "This ticket is closed. Raise a new ticket if you still need help."}</p>
                  {t.status === "RESOLVED" && <button type="button" className="pd-btn" disabled={busy} onClick={() => void run(() => api.post(`/support-tickets/${id}/reopen`, {}))}>Reopen ticket</button>}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
