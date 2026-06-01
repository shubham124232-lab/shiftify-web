"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Notif {
  id: string; type: string; title: string; body: string;
  read: boolean; createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  JOB_APPLIED: "📋", JOB_ASSIGNED: "✅", JOB_COMPLETED: "🏁",
  JOB_CANCELLED: "❌", ACCOUNT_APPROVED: "🎉", ACCOUNT_SUSPENDED: "⚠️",
  MESSAGE: "💬", DOCUMENT_VERIFIED: "📄", DOCUMENT_REJECTED: "🚫",
  PAYMENT_PROCESSED: "💳", SYSTEM: "🔔",
};

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    api.get<{ notifications: Notif[]; total: number }>("/notifications")
      .then(r => setNotifs(r.notifications ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`, {}).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.read);
    await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/read`, {}).catch(() => {})));
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <>
      <PageHeader
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ""}`}
        description="All your in-app alerts."
        actions={unreadCount > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button> : undefined}
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 16 }}>{error}</div>}
        <Card>
          <CardContent style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: 24, color: "#94a3b8", fontSize: 14 }}>Loading...</p>
            ) : notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No notifications yet</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>You're all caught up.</p>
              </div>
            ) : notifs.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: "flex", gap: 14, padding: "14px 20px",
                  borderBottom: i < notifs.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: n.read ? "#fff" : "rgba(194,24,91,0.03)",
                  cursor: n.read ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {TYPE_ICON[n.type] ?? "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 700, color: "#1e293b" }}>{n.title}</div>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c2185b", flexShrink: 0, marginTop: 5 }} />}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{new Date(n.createdAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
