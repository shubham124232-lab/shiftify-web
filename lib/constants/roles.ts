import type { UserRole } from "@/lib/types/user";

export const SIGNUP_ROLES = [
  "PARTICIPANT",
  "SUPPORT_WORKER",
  "PROVIDER",
  "COORDINATOR",
  "PLAN_MANAGER",
] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  PARTICIPANT: "Participant",
  SUPPORT_WORKER: "Support Worker",
  PROVIDER: "Provider",
  COORDINATOR: "Support Coordinator",
  PLAN_MANAGER: "Plan Manager",
  ADMIN: "Admin",
};

export const ROLE_TAGLINES: Record<SignupRole, string> = {
  PARTICIPANT: "Find support workers & manage your NDIS plan",
  SUPPORT_WORKER: "Find shifts and connect with participants",
  PROVIDER: "Manage your team and grow your NDIS business",
  COORDINATOR: "Coordinate support for participants in your care",
  PLAN_MANAGER: "Manage budgets, invoices and NDIS funds",
};

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  PARTICIPANT: "/dashboard/participant",
  SUPPORT_WORKER: "/dashboard/worker",
  PROVIDER: "/dashboard/provider",
  COORDINATOR: "/dashboard/coordinator",
  PLAN_MANAGER: "/dashboard/plan-manager",
  ADMIN: "/admin",
};
