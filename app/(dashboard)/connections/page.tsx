"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface Connection {
  id: string; status: "pending" | "accepted" | "declined";
  participant: { id: string; name: string; email: string | null };
  createdAt: string;
}

export default function ConnectionsPage() {
  const { activeRole } = useAuth();
  const [conns,   setConns]   = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [userId,  setUserId]  = useState("");
  const [sending, setSending] = useState(false);
  const [acting,  setActing]  = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.get<{ connections: Connection[] }>("/pm/connections")
      .then(r => setConns(r.connections ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post("/pm/connect", { userId: userId.trim() });
      setUserId("");
      load();
    } catch (err: any) { setError(err?.message ?? "Failed to send request."); }
    finally { setSending(false); }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setActing(id);
    try {
      await api.patch(`/pm/connections/${id}/respond`, { action });
      load();
    } catch (err: any) { setError(err?.message); }
    finally { setActing(null); }
  }

  if (activeRole !== UserRole.PLAN_MANAGER) {
    return (
      <>
        <PageHeader title="Connections" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>This page is only available to Plan Managers.</p>
        </div>
      </>
    );
  }

  const pending  = conns.filter(c => c.status === "pending");
  const accepted = conns.filter(c => c.status === "accepted");

  return (
    <>
      <PageHeader title="Participant Connections" description="Manage participants linked to your plan management." />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Invite */}
        <Card>
          <CardHeader><CardTitle>Connect a participant</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} style={{ display: "flex", gap: 12 }}>
              <input
                value={userId} onChange={e => setUserId(e.target.value)}
                placeholder="Participant user ID..."
                style={{ flex: 1, height: 40, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
              />
              <Button type="submit" loading={sending} disabled={!userId.trim()}>
                Send request
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>{error}</div>}

        {/* Pending */}
        {pending.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Pending requests ({pending.length})</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid #fde68a", borderRadius: 10, background: "#fffbeb" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.participant.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.participant.email ?? "No email"}</div>
                  </div>
                  <Button size="sm" disabled={acting === c.id} onClick={() => respond(c.id, "accept")}>Accept</Button>
                  <Button size="sm" variant="ghost" disabled={acting === c.id} onClick={() => respond(c.id, "decline")}>Decline</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active */}
        <Card>
          <CardHeader><CardTitle>Active connections ({accepted.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
              : accepted.length === 0 ? <p style={{ color: "#94a3b8", fontSize: 13 }}>No active connections yet.</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {accepted.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#15803d" }}>
                        {c.participant.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.participant.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.participant.email ?? "No email"}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 10px", borderRadius: 20 }}>Active</span>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
