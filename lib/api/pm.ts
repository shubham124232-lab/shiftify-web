"use client";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkedParticipant {
  connectionId: string;
  linkedSince: string;
  openJobs: number;
  invoiceCount: number;
  participant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    participantProfile: {
      ndisNumber: string | null;
      fundingManagementType: string | null;
      primaryDisability: string | null;
      ndisStartDate: string | null;
      ndisEndDate: string | null;
      seekingPlanManager: boolean;
    } | null;
  };
}

export interface BudgetStatement {
  participant: {
    id: string;
    name: string;
    email: string | null;
    participantProfile: {
      ndisNumber: string | null;
      fundingManagementType: string | null;
      ndisStartDate: string | null;
      ndisEndDate: string | null;
    } | null;
  } | null;
  linkedSince: string;
  invoices: {
    id: string;
    sentAt: string;
    hours: number | null;
    note: string | null;
    sender: { id: string; name: string };
    job: { id: string; title: string; category: string; scheduledStartAt: string } | null;
  }[];
  invoiceCount: number;
  totalHoursInvoiced: number;
  openJobCount: number;
  completedJobCount: number;
}

export interface PostReferralInput {
  participantUserId: string;
  title: string;
  description: string;
  category: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  urgency?: string;
  fundingType?: string;
  totalHours?: number;
}

// ─── Linked participants ───────────────────────────────────────────────────────
// Backend: success(res, { participants }) → { data: { participants: [...] } }

export function listLinkedParticipants() {
  return api
    .get<{ participants: LinkedParticipant[] }>("/pm/participants")
    .then((r) => r.participants);
}

// ─── Budget statement ─────────────────────────────────────────────────────────
// Backend: success(res, { statement }) → { data: { statement: {...} } }

export function getParticipantBudgetStatement(participantId: string) {
  return api
    .get<{ statement: BudgetStatement }>(`/pm/participants/${participantId}/budget-statement`)
    .then((r) => r.statement);
}

// ─── Post referral ────────────────────────────────────────────────────────────
// Backend: success(res, { job }, 201) → { data: { job: {...} } }

export function postReferral(input: PostReferralInput) {
  return api
    .post<{ job: { id: string; title: string; status: string } }>("/pm/referral", input)
    .then((r) => r.job);
}

// ─── PM connections ───────────────────────────────────────────────────────────

export function listPmConnections() {
  return api.get<{ connections: unknown[] }>("/pm/connections").then((r) => r.connections);
}

