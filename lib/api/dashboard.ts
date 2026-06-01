"use client";
import { api } from "@/lib/api";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface JobSummary {
  id: string;
  title: string;
  category: string;
  urgency: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  postedAt: string;
  status: string;
  ownApplication?: { status: string } | null;
}

export interface ShiftSummary {
  id: string;
  title: string;
  suburb: string;
  scheduledStartAt: string;
  status: string;
}

// ─── Dashboard feed ───────────────────────────────────────────────────────────

export interface WorkerDashboard {
  upcomingShifts: ShiftSummary[];
  nearbyJobs: JobSummary[];
  pendingApplications: { applicationId: string; status: string; job: JobSummary }[];
  unreadNotifications?: number;
  unreadMessages?: number;
}

export interface ParticipantDashboard {
  openJobs: JobSummary[];
  upcomingShifts: ShiftSummary[];
  awaitingConfirmation: ShiftSummary[];
  unreadNotifications?: number;
}

export interface CoordinatorDashboard {
  openJobs: JobSummary[];
  upcomingShifts: ShiftSummary[];
  awaitingConfirmation: ShiftSummary[];
  managedParticipantCount: number;
  unreadNotifications?: number;
}

export interface ProviderDashboard {
  pendingExpressions: { applicationId: string; job: JobSummary }[];
  activeShifts: ShiftSummary[];
  unassignedAccepted: JobSummary[];
  unreadNotifications?: number;
}

export interface PlanManagerDashboard {
  recentInvoices: {
    id: string;
    jobId: string;
    sentAt: string;
    hours: number | null;
    note: string | null;
    sender: { id: string; name: string };
    participant: { id: string; name: string };
  }[];
  connectionCounts: {
    pending: number;
    accepted: number;
    declined: number;
  };
  unreadNotifications?: number;
}

export type DashboardData =
  | WorkerDashboard
  | ParticipantDashboard
  | CoordinatorDashboard
  | ProviderDashboard
  | PlanManagerDashboard;

export function getDashboard() {
  return api.get<{ summary: DashboardData }>("/dashboard/summary").then(r => r.summary);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function getNotifications() {
  return api.get<{ notifications: Notification[]; total: number }>("/notifications");
}

export function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`, {});
}
