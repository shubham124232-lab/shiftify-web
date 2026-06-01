"use client";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  roleBreakdown: Record<string, number>;
  pendingUsers: number;
  suspendedUsers: number;
  activeJobs: number;
  completedToday: number;
  totalJobs: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  accountType: string;
  status: string;
  adminTier: string | null;
  roles: { role: string; isActiveDefault: boolean }[];
  createdAt: string;
}

export interface AdminJob {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  createdAt: string;
  postedBy: { id: string; name: string; email: string | null };
  _count: { applications: number };
}

export interface AuditEntry {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string | null; adminTier: string | null };
  targetUser: { id: string; name: string; email: string | null } | null;
}

export interface AdminDocument {
  id: string;
  docType: string;
  fileName: string;
  mimeType: string;
  status: string;
  uploadedAt: string;
  rejectionReason: string | null;
}

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getStats() {
  return api.get<PlatformStats>("/admin/stats");
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function listUsers(params?: { status?: string; role?: string; page?: number; limit?: number }) {
  return api.get<{ users: AdminUser[]; total: number; page: number; limit: number }>(
    "/admin/users",
    { params },
  );
}

export function getUser(id: string) {
  return api.get<{ user: AdminUser & { documents: AdminDocument[] } }>(`/admin/users/${id}`);
}

export function updateUserStatus(id: string, status: "ACTIVE" | "SUSPENDED", reason?: string) {
  return api.patch(`/admin/users/${id}/status`, { status, reason });
}

export function notifyUser(id: string, title: string, body: string) {
  return api.post(`/admin/users/${id}/notify`, { title, body });
}

// ─── Verification queue (SUSPENDED users) ────────────────────────────────────

export function getVerificationQueue(params?: { page?: number; limit?: number }) {
  return api.get<{ users: AdminUser[]; total: number; page: number; limit: number }>(
    "/admin/verification-queue",
    { params },
  );
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export function listAdminJobs(params?: {
  status?: string;
  category?: string;
  urgency?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  return api.get<{ jobs: AdminJob[]; total: number; page: number; limit: number }>(
    "/admin/jobs",
    { params },
  );
}

export function cancelJob(id: string, reason?: string) {
  return api.patch(`/admin/jobs/${id}/cancel`, { reason });
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function getDocumentViewUrl(id: string) {
  return api.get<{ document: AdminDocument; viewUrl: string; expiresIn: number }>(
    `/admin/documents/${id}/view`,
  );
}

export function verifyDocument(id: string, approved: boolean, reason?: string) {
  return api.patch(`/admin/documents/${id}/verify`, { approved, reason });
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export function broadcast(title: string, body: string, role?: string) {
  return api.post<{ sent: number; failed: number; total: number }>(
    "/admin/broadcast",
    { title, body, role },
  );
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export function getAuditLog(params?: {
  targetUserId?: string;
  action?: string;
  page?: number;
  limit?: number;
}) {
  return api.get<{ entries: AuditEntry[]; total: number; page: number; limit: number }>(
    "/admin/audit-log",
    { params },
  );
}
