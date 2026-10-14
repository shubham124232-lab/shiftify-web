"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { WorkerAlertControls } from "@/components/notifications/WorkerAlertControls";
import { ProviderNotificationControls } from "@/components/notifications/ProviderNotificationControls";

interface Notif {
  id: string; type: string; title: string; body: string;
  read: boolean; createdAt: string; data?: { jobId?: string } | null;
}

// SW doc Window 46 — channel + category opt-in.
interface NotificationPreference {
  pushEnabled: boolean; emailEnabled: boolean; smsEnabled: boolean;
  jobUpdates: boolean; messages: boolean; connectionsAndInvites: boolean; marketingTips: boolean;
  providerPrefs?: Record<string, unknown> | null;
}

type FlagKey = Exclude<keyof NotificationPreference, "providerPrefs">;

const CHANNEL_FIELDS: { key: FlagKey; label: string }[] = [
  { key: "pushEnabled",  label: "In-app / push" },
  { key: "emailEnabled", label: "Email" },
  { key: "smsEnabled",   label: "SMS" },
];

const CATEGORY_FIELDS: { key: FlagKey; label: string; description: string }[] = [
  { key: "jobUpdates",            label: "Job & shift updates",     description: "New matches, applications, assignments, cancellations, reminders." },
  { key: "messages",               label: "Messages",                description: "New messages on a job thread." },
  { key: "connectionsAndInvites",  label: "Connections & invites",   description: "Direct invites, coordinator connections, plan manager requests." },
  { key: "marketingTips",          label: "Tips & product updates",  description: "Occasional platform tips and announcements." },
];

const TYPE_ICON: Record<string, string> = {
  JOB_APPLIED: "📋", JOB_ASSIGNED: "✅", JOB_COMPLETED: "🏁",
  JOB_CANCELLED: "❌", ACCOUNT_APPROVED: "🎉", ACCOUNT_SUSPENDED: "⚠️",
  MESSAGE: "💬", DOCUMENT_VERIFIED: "📄", DOCUMENT_REJECTED: "🚫",
  PAYMENT_PROCESSED: "💳", SYSTEM: "🔔",
};

// Doc P71: every notification opens the exact record. Provider destinations by type.
function providerTarget(n: Notif): string {
  const jobId = n.data?.jobId;
  switch (n.type) {
    case "DOCUMENT_EXPIRING": case "DOC_VERIFIED": case "DOC_REJECTED": return "/documents";
    case "NEW_JOB_NEARBY": return "/provider/matched-requests";
    case "NEW_MESSAGE": return "/messages";
    case "TEAM_AVAILABILITY_REQUEST": return "/provider/team-availability";
    case "PROVIDER_JOIN_REQUEST": return "/provider/administrators";
    case "DIRECT_INQUIRY_RECEIVED": return "/provider/enquiries";
    default: return jobId ? `/jobs/${jobId}` : "/jobs/my";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { activeRole } = useAuth();
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [pref, setPref] = useState<NotificationPreference | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    api.get<{ notifications: Notif[]; total: number }>("/notifications")
      .then(r => setNotifs(r.notifications ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    api.get<{ preference: NotificationPreference }>("/notifications/preferences")
      .then(r => setPref(r.preference))
      .catch(() => {});
  }, []);

  async function togglePref(key: FlagKey) {
    if (!pref) return;
    const next = { ...pref, [key]: !pref[key] };
    setPref(next);
    setSavingPref(true);
    try {
      await api.patch("/notifications/preferences", { [key]: next[key] });
    } catch {
      setPref(pref); // roll back on failure
    } finally {
      setSavingPref(false);
    }
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`, {}).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    // Single dedicated endpoint instead of N per-item calls.
    await api.patch("/notifications/read-all", {}).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  if (activeRole === "PROVIDER") {
    const open = (n: Notif) => { if (!n.read) void markRead(n.id); router.push(providerTarget(n)); };
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-6">
        <p className="m-0 text-xs text-slate-500">Provider / Notifications</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="m-0 mt-1 text-sm text-slate-500">Updates from your requests, team and organisation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPrefs(v => !v)}>{showPrefs ? "Hide preferences" : "Notification preferences"}</Button>
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</Button>
          </div>
        </div>
        {error && <p className="m-0 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
        {showPrefs && pref && (
          <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap gap-5">
              {CHANNEL_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={pref[f.key]} disabled={savingPref} onChange={() => togglePref(f.key)} />{f.label}
                </label>
              ))}
            </div>
            <ProviderNotificationControls initial={pref.providerPrefs ?? null} />
            <p className="m-0 text-xs text-slate-500">Safety alerts and incident notifications always send, regardless of these settings.</p>
          </div>
        )}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white">
          <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Inbox</h2>
          {loading ? <p className="m-0 px-6 py-6 text-sm text-slate-500">Loading…</p>
            : notifs.length === 0 ? <p className="m-0 px-6 py-10 text-center text-base font-semibold text-slate-900">No notifications yet</p>
            : notifs.map((n) => (
              <div key={n.id} className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-0">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-600"}`}><Check className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className={`m-0 text-sm text-slate-900 ${n.read ? "font-medium" : "font-bold"}`}>{n.title}</p>
                  <p className="m-0 mt-0.5 text-xs text-slate-500">{n.body}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => open(n)}>Open</Button>
              </div>
            ))}
        </section>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ""}`}
        description="All your in-app alerts."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" size="sm" onClick={() => setShowPrefs(v => !v)}>
              {showPrefs ? "Hide preferences" : "Notification preferences"}
            </Button>
            {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>}
          </div>
        }
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
        {error && <div style={{ background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-pink-hover)", marginBottom: 16 }}>{error}</div>}

        {showPrefs && pref && (
          <Card style={{ marginBottom: 16 }}>
            <CardContent style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--td-dark-text-soft)", marginBottom: 8 }}>Channels</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CHANNEL_FIELDS.map(f => (
                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--td-ink-800)", cursor: "pointer" }}>
                      <input type="checkbox" checked={pref[f.key]} disabled={savingPref} onChange={() => togglePref(f.key)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--td-dark-text-soft)", marginBottom: 8 }}>Categories</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CATEGORY_FIELDS.map(f => (
                    <label key={f.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--td-ink-800)", cursor: "pointer" }}>
                      <input type="checkbox" checked={pref[f.key]} disabled={savingPref} onChange={() => togglePref(f.key)} style={{ marginTop: 2 }} />
                      <span>
                        <div style={{ fontWeight: 600 }}>{f.label}</div>
                        <div style={{ fontSize: 12, color: "var(--td-muted)" }}>{f.description}</div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {activeRole === "SUPPORT_WORKER" && <WorkerAlertControls initial={(pref.providerPrefs as { workerAlerts?: React.ComponentProps<typeof WorkerAlertControls>["initial"] } | null | undefined)?.workerAlerts ?? null} />}
              <p style={{ fontSize: 11, color: "var(--td-muted)", margin: 0 }}>Safety alerts and incident notifications always send, regardless of these settings.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: 24, color: "var(--td-muted)", fontSize: 14 }}>Loading...</p>
            ) : notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--td-dark-text-soft)" }}>No notifications yet</p>
                <p style={{ fontSize: 13, color: "var(--td-muted)", marginTop: 4 }}>You're all caught up.</p>
              </div>
            ) : notifs.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: "flex", gap: 14, padding: "14px 20px",
                  borderBottom: i < notifs.length - 1 ? "1px solid var(--td-grey)" : "none",
                  background: n.read ? "var(--td-white)" : "rgba(183,37,88,0.03)",
                  cursor: n.read ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--td-grey)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {TYPE_ICON[n.type] ?? "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 700, color: "var(--td-ink-800)" }}>{n.title}</div>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--td-pink)", flexShrink: 0, marginTop: 5 }} />}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--td-muted-dark)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: "var(--td-muted)", marginTop: 6 }}>{new Date(n.createdAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
