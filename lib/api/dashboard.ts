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

export interface WorkerDashboardStats {
  upcomingShifts: number;
  activeApplications: number;
  matchedJobs: number;
  hoursThisWeek: number;
  completedShifts: number;
  savedJobs: number;
  unreadMessages: number;
}

export interface WorkerApplication {
  applicationId: string;
  status: string;
  createdAt?: string;
  note?: string | null;
  rateResponse?: string | null;
  proposedRate?: number | string | null;
  job: JobSummary;
}

export interface WorkerDashboard {
  stats?: WorkerDashboardStats;
  upcomingShifts: ShiftSummary[];
  matchedJobs: JobSummary[];
  availableNow?: { isAvailableNow: boolean; availableNowUntil: string | null };
  pendingApplications: WorkerApplication[];
  shortlistedApplications?: WorkerApplication[];
  allApplications?: WorkerApplication[];
  unreadNotifications?: number;
  unreadMessages?: number;
}

export interface ParticipantDashboardStats {
  activeRequests: number;
  applicationsReceived: number;
  confirmedSupports: number;
  upcomingBookings: number;
  awaitingConfirmation?: number;
  urgentRequests: number;
  draftRequests: number;
  unreadMessages: number;
  recurringSupports: number;
}

export interface ParticipantDashboard {
  stats?: ParticipantDashboardStats;
  openJobs: JobSummary[];
  upcomingShifts: ShiftSummary[];
  awaitingConfirmation: ShiftSummary[];
  unreadNotifications?: number;
}

export interface CoordinatorDashboardStats {
  activeRequests: number;
  draftRequests: number;
  urgentRequests: number;
  unfilledRequests: number;
  upcomingShifts: number;
  awaitingConfirmation: number;
  managedParticipants: number;
  unreadMessages: number;
}

export interface CoordinatorDashboard {
  stats?: CoordinatorDashboardStats;
  openJobs: JobSummary[];
  upcomingShifts: ShiftSummary[];
  awaitingConfirmation: ShiftSummary[];
  managedParticipantCount: number;
  unreadNotifications?: number;
}

export interface ProviderDashboardStats {
  /** Responses received on the Provider's own requests that are still new. */
  newEnquiries: number;
  /** Responses received on the Provider's own requests that are shortlisted. */
  shortlistedCount: number;
  /** Own requests that have received at least one response. */
  matchedRequests: number;
  confirmedIntakes: number;
  unfilledWorkforceGaps: number;
  unreadMessages: number;
  openRequests: number;
  responsesReceived: number;
  outgoingPendingApplications: number;
}

export interface ProviderDashboard {
  stats?: ProviderDashboardStats;
  /** Responses to the Provider's own staffing requests. */
  workerResponses?: { applicationId: string; status: string; applicantName: string | null; job: JobSummary }[];
  /** The Provider's own open staffing requests. */
  myRequests?: JobSummary[];
  /** The Provider's own outgoing expressions of interest on other people's requests. */
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
