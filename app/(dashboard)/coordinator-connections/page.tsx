"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface Connection {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  initiatedBy: "COORDINATOR" | "PARTICIPANT";
  message: string | null;
  createdAt: string;
  coordinator: { id: string; name: string };
  participant: { id: string; name: string };
  canViewInfo: boolean;
  canPostRequests: boolean;
  canShortlist: boolean;
  canMessage: boolean;
  canConfirmBookings: boolean;
  canManageReplacements: boolean;
  postingApprovalStatus: "PENDING" | "APPROVED" | "DECLINED" | null;
  permissionRequestPending: boolean;
  requestedPermissions: Record<string, boolean> | null;
}

const PERMISSION_LABELS: { key: keyof Connection; label: string }[] = [
  { key: "canViewInfo", label: "View my information" },
  { key: "canPostRequests", label: "Post requests on my behalf" },
  { key: "canShortlist", label: "Shortlist candidates" },
  { key: "canMessage", label: "Message workers/providers" },
  { key: "canConfirmBookings", label: "Confirm bookings" },
  { key: "canManageReplacements", label: "Manage replacements" },
];

export default function CoordinatorConnectionsPage() {
  const { activeRole } = useAuth();
  const [conns, setConns] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [resentId, setResentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isParticipant = activeRole === UserRole.PARTICIPANT;
  const isCoordinator = activeRole === UserRole.COORDINATOR;

  function load() {
    setLoading(true);
    api.get<{ connections: Connection[] }>("/coordinator-connections")
      .then(r => setConns(r.connections ?? []))
      .catch(e => setError(e instanceof ApiError ? e.message : "Could not load connections"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (isParticipant || isCoordinator) load(); }, [activeRole]);

  async function respond(id: string, action: "ACCEPT" | "DECLINE") {
    setActing(id); setError(null);
    try {
      await api.patch(`/coordinator-connections/${id}/respond`, { action });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed.");
    } finally { setActing(null); }
  }

  async function togglePermission(conn: Connection, key: keyof Connection) {
    setActing(conn.id); setError(null);
    try {
      await api.patch(`/coordinator-connections/${conn.id}/permissions`, { [key]: !conn[key] });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update permission.");
    } finally { setActing(null); }
  }

  async function respondToApproval(id: string, action: "APPROVE" | "DECLINE") {
    setActing(id); setError(null);
    try {
      await api.patch(`/coordinator-connections/${id}/respond-posting-approval`, { action });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed.");
    } finally { setActing(null); }
  }

  async function respondToPermissionRequest(id: string, action: "APPROVE" | "DECLINE") {
    setActing(id); setError(null);
    try {
      await api.patch(`/coordinator-connections/${id}/respond-permissions`, { action });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed.");
    } finally { setActing(null); }
  }

  async function resendRequest(id: string) {
    setActing(id); setError(null);
    try {
      await api.post(`/coordinator-connections/${id}/resend`, {});
      setResentId(id);
      setTimeout(() => setResentId((prev) => (prev === id ? null : prev)), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not resend the invitation.");
    } finally { setActing(null); }
  }

  async function cancelRequest(id: string) {
    setActing(id); setError(null);
    try {
      await api.patch(`/coordinator-connections/${id}/cancel`, {});
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not cancel the invitation.");
    } finally { setActing(null); }
  }

  async function copyInvitationLink(id: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/coordinator-connections?requestId=${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 3000);
    } catch {
      setError("Could not copy the link — copy it from the address bar instead.");
    }
  }

  if (!isParticipant && !isCoordinator) {
    return (
      <>
        <PageHeader title="Coordinator Connections" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>This page is only available to Coordinators and Participants.</p>
        </div>
      </>
    );
  }

  // The recipient of a request is whichever side did NOT initiate it.
  const pending = conns.filter(c => c.status === "PENDING" && c.initiatedBy !== activeRole);
  const sent    = conns.filter(c => c.status === "PENDING" && c.initiatedBy === activeRole);
  const active  = conns.filter(c => c.status === "ACCEPTED");
  const postingApprovals = isParticipant ? conns.filter(c => c.status === "ACCEPTED" && c.postingApprovalStatus === "PENDING") : [];
  const permissionRequests = isParticipant ? conns.filter(c => c.status === "ACCEPTED" && c.permissionRequestPending) : [];

  return (
    <>
      <PageHeader
        title="Coordinator Connections"
        description={isCoordinator
          ? "Participants who've connected with you, and requests you've sent."
          : "Coordinators connected to you, and what they're allowed to do."}
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>{error}</div>}

        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
        ) : (
          <>
            {postingApprovals.length > 0 && (
              <Card>
                <CardContent className="pt-4 flex flex-col gap-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase">
                    Posting approval requests ({postingApprovals.length})
                  </div>
                  {postingApprovals.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-3.5 py-2.5 border-[1.5px] border-amber-200 rounded-lg bg-amber-50">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{c.coordinator.name}</div>
                        <div className="text-xs text-slate-400">wants to post a support request on your behalf</div>
                      </div>
                      <Button size="sm" disabled={acting === c.id} onClick={() => respondToApproval(c.id, "APPROVE")}>Approve</Button>
                      <Button size="sm" variant="ghost" disabled={acting === c.id} onClick={() => respondToApproval(c.id, "DECLINE")}>Decline</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {permissionRequests.length > 0 && (
              <Card>
                <CardContent className="pt-4 flex flex-col gap-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase">
                    Permission requests ({permissionRequests.length})
                  </div>
                  {permissionRequests.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-3.5 py-2.5 border-[1.5px] border-amber-200 rounded-lg bg-amber-50">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{c.coordinator.name}</div>
                        <div className="text-xs text-slate-400">
                          wants: {PERMISSION_LABELS.filter(p => c.requestedPermissions?.[p.key as string]).map(p => p.label).join(", ") || "additional access"}
                        </div>
                      </div>
                      <Button size="sm" disabled={acting === c.id} onClick={() => respondToPermissionRequest(c.id, "APPROVE")}>Approve</Button>
                      <Button size="sm" variant="ghost" disabled={acting === c.id} onClick={() => respondToPermissionRequest(c.id, "DECLINE")}>Decline</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {pending.length > 0 && (
              <Card>
                <CardContent style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                    Requests to respond to ({pending.length})
                  </div>
                  {pending.map(c => {
                    const otherName = isCoordinator ? c.participant.name : c.coordinator.name;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid #fde68a", borderRadius: 10, background: "#fffbeb" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{otherName}</div>
                          {c.message && <div style={{ fontSize: 12, color: "#94a3b8" }}>&ldquo;{c.message}&rdquo;</div>}
                        </div>
                        <Button size="sm" disabled={acting === c.id} onClick={() => respond(c.id, "ACCEPT")}>Accept</Button>
                        <Button size="sm" variant="ghost" disabled={acting === c.id} onClick={() => respond(c.id, "DECLINE")}>Decline</Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {sent.length > 0 && (
              <Card>
                <CardContent style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                    Sent — awaiting response ({sent.length})
                  </div>
                  {sent.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, minWidth: 120 }}>{isCoordinator ? c.participant.name : c.coordinator.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", background: "#fef9c3", padding: "2px 10px", borderRadius: 20 }}>
                        {resentId === c.id ? "Resent" : "Pending"}
                      </span>
                      <Button size="sm" variant="outline" disabled={acting === c.id} onClick={() => resendRequest(c.id)}>Resend</Button>
                      <Button size="sm" variant="outline" disabled={acting === c.id} onClick={() => copyInvitationLink(c.id)}>
                        {copiedId === c.id ? "Copied!" : "Copy link"}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={acting === c.id} onClick={() => cancelRequest(c.id)}>Cancel</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  Active connections ({active.length})
                </div>
                {active.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 13 }}>No active connections yet.</p>
                ) : active.map(c => (
                  <div key={c.id} style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isParticipant ? 10 : 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#15803d" }}>
                        {(isCoordinator ? c.participant.name : c.coordinator.name)[0]}
                      </div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{isCoordinator ? c.participant.name : c.coordinator.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 10px", borderRadius: 20 }}>Active</span>
                    </div>
                    {isParticipant && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                        {PERMISSION_LABELS.map(p => (
                          <label key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                            <input
                              type="checkbox" checked={Boolean(c[p.key])}
                              disabled={acting === c.id}
                              onChange={() => togglePermission(c, p.key)}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
