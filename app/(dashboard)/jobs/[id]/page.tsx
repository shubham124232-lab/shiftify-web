"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

interface Applicant { id: string; userId: string; userName: string; status: string; createdAt: string; }
interface Message   { id: string; senderId: string; senderName: string; body: string; createdAt: string; }

interface JobDetail {
  id: string; title: string; description: string | null;
  category: string; urgency: string; suburb: string; state: string;
  scheduledStartAt: string; scheduledEndAt: string | null;
  totalHours: number | null; status: string; postedAt: string;
  poster: { id: string; name: string };
  assignedWorker?: { id: string; name: string } | null;
  applicants?: Applicant[];
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  OPEN:        { bg: "#dbeafe", color: "#1d4ed8" },
  ASSIGNED:    { bg: "#dcfce7", color: "#15803d" },
  IN_PROGRESS: { bg: "#fef9c3", color: "#854d0e" },
  COMPLETED:   { bg: "#f1f5f9", color: "#475569" },
  CONFIRMED:   { bg: "#dcfce7", color: "#15803d" },
  CANCELLED:   { bg: "#fee2e2", color: "#b91c1c" },
};
const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  EMERGENCY: { bg: "#fee2e2", color: "#b91c1c" },
  SAME_DAY:  { bg: "#ffedd5", color: "#c2410c" },
  SCHEDULED: { bg: "#f1f5f9", color: "#475569" },
};

export default function JobDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const { user, activeRole } = useAuth();

  const [job,      setJob]      = useState<JobDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [msgBody,  setMsgBody]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [acting,   setActing]   = useState(false);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function loadJob() {
    return api.get<{ job: JobDetail }>(`/jobs/${id}`)
      .then(r => setJob(r.job))
      .catch(e => setError(e.message));
  }

  function loadMessages() {
    api.get<{ messages: Message[] }>(`/jobs/${id}/messages`)
      .then(r => setMessages(r.messages ?? []))
      .catch(() => {});
  }

  // Scroll to bottom whenever messages update (covers initial load + new messages)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadJob().finally(() => setLoading(false));
    loadMessages();
    pollRef.current = setInterval(loadMessages, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage() {
    if (!msgBody.trim()) return;
    setSending(true);
    try {
      await api.post(`/jobs/${id}/messages`, { body: msgBody.trim() });
      setMsgBody("");
      loadMessages();
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  }

  async function jobAction(action: string, payload: Record<string, any> = {}) {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/${action}`, payload);
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  async function selectApplicant(applicationId: string) {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/applications/${applicationId}/select`, {});
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading...</div>;
  if (error && !job) return <div style={{ padding: 40, color: "#b91c1c" }}>{error}</div>;
  if (!job) return null;

  const isOwner   = user?.id === job.poster.id;
  const isWorker  = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.SCHEDULED;
  const sta = STATUS_STYLE[job.status]  ?? { bg: "#f1f5f9", color: "#475569" };
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
  const canInvoice = ["COMPLETED", "CONFIRMED"].includes(job.status);

  return (
    <>
      <PageHeader title={job.title} description={`Posted by ${job.poster.name}`} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>{error}</div>}

        {/* Status + badges */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: sta.bg, color: sta.color }}>{job.status.replace("_", " ")}</span>
          <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: urg.bg, color: urg.color }}>{job.urgency.replace("_", " ")}</span>
          <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>{catLabel}</span>
        </div>

        {/* Main info */}
        <Card>
          <CardContent style={{ paddingTop: 20 }}>
            {job.description && <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 16 }}>{job.description}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Location:</span> {job.suburb}, {job.state}</div>
              <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Start:</span> {new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</div>
              {job.scheduledEndAt && <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>End:</span> {new Date(job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</div>}
              {job.totalHours && <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Hours:</span> {job.totalHours}h</div>}
              {job.assignedWorker && <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Assigned to:</span> {job.assignedWorker.name}</div>}
            </div>
          </CardContent>
        </Card>

        {/* Owner actions */}
        {isOwner && (
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {job.status === "IN_PROGRESS" && <Button variant="outline" disabled={acting} onClick={() => jobAction("confirm")}>Confirm Completion</Button>}
              {["OPEN", "ASSIGNED"].includes(job.status) && <Button variant="outline" disabled={acting} onClick={() => jobAction("cancel")}>Cancel Job</Button>}
              {canInvoice && <Button variant="outline" onClick={() => router.push(`/jobs/${id}/invoice`)}>Create Invoice</Button>}
            </CardContent>
          </Card>
        )}

        {/* Worker actions */}
        {isWorker && job.assignedWorker?.id === user?.id && job.status === "ASSIGNED" && (
          <Card>
            <CardHeader><CardTitle>Your actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10 }}>
              <Button variant="outline" disabled={acting} onClick={() => jobAction("start")}>Mark Started</Button>
            </CardContent>
          </Card>
        )}
        {isWorker && job.assignedWorker?.id === user?.id && job.status === "IN_PROGRESS" && (
          <Card>
            <CardHeader><CardTitle>Your actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10 }}>
              <Button variant="outline" disabled={acting} onClick={() => jobAction("complete")}>Mark Complete</Button>
            </CardContent>
          </Card>
        )}

        {/* Applicants (owner only) */}
        {isOwner && job.applicants && job.applicants.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Applicants ({job.applicants.length})</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {job.applicants.map(app => (
                  <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10 }}>
                    <div style={{ flex: 1 }}>
                      <Link href={`/profile/${app.userId}`} style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", textDecoration: "none" }} className="hover:underline">
                        {app.userName}
                      </Link>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(app.createdAt).toLocaleDateString("en-AU")}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: app.status === "INTERESTED" ? "#854d0e" : "#15803d" }}>{app.status}</span>
                    {job.status === "OPEN" && app.status === "INTERESTED" && (
                      <Button size="sm" disabled={acting} onClick={() => selectApplicant(app.id)}>Select</Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <Card>
          <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 320, overflowY: "auto" }}>
              {messages.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>No messages yet.</p>
              ) : messages.map(m => (
                <div key={m.id} style={{ padding: "10px 14px", borderRadius: 10, background: m.senderId === user?.id ? "rgba(194,24,91,0.06)" : "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>
                    {m.senderName} · {new Date(m.createdAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                  <div style={{ fontSize: 14, color: "#1e293b" }}>{m.body}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, height: 40, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
              />
              <Button onClick={sendMessage} disabled={sending || !msgBody.trim()}>
                {sending ? "..." : "Send"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
