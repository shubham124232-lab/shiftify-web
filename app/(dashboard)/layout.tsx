"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store/auth.store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { StatusBanner } from "@/components/layout/status-banner";
import { Spinner } from "@/components/ui/spinner";
import { TOTAL_STEPS } from "@/lib/registration/stepConfig";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";

// Pages inside the dashboard that should be accessible even with an incomplete profile
// (so the user can actually go fix their profile without getting redirect-looped)
const GATE_EXEMPT = ["/profile", "/documents", "/subscription", "/availability", "/help-safety", "/blocked-users"];

// Pages accessible WITHOUT logging in at all — guest job-post draft flow.
// See [[guest-draft-job-post-design]] memory. Rendered without the sidebar/
// topbar chrome below, since there's no user to show it for.
const PUBLIC_EXEMPT = ["/jobs/post"];

// Areas that belong to specific roles (mirrors the "only available to …" notices on those pages).
const ROLE_ONLY_AREAS: { prefix: string; roles: string[] }[] = [
  { prefix: "/connect-invites",         roles: ["SUPPORT_WORKER"] },
  { prefix: "/connections",             roles: ["PLAN_MANAGER"] },
  { prefix: "/load-board",              roles: ["PLAN_MANAGER"] },
  { prefix: "/job-invites",             roles: ["SUPPORT_WORKER", "PROVIDER"] },
  { prefix: "/coordinator-connections", roles: ["COORDINATOR", "PARTICIPANT"] },
  { prefix: "/participants",            roles: ["COORDINATOR"] },
  { prefix: "/team",                    roles: ["PROVIDER"] },
  { prefix: "/provider",                roles: ["PROVIDER"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuth, loading, silentInit } = useAuth();
  const profileCompletion  = useAuthStore(s => s.profileCompletion);
  const marketplaceMissing = useAuthStore(s => s.marketplaceMissing);
  const initialized        = useAuthStore(s => s.initialized);
  const profileStep        = useAuthStore(s => s.profileStep);
  const phoneVerified      = useAuthStore(s => s.phoneVerified);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    silentInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPublicExempt = PUBLIC_EXEMPT.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;

    // 1. Not authenticated -> login (unless this page allows guests)
    if (!isAuth || !user) {
      if (!isPublicExempt) router.replace("/login");
      return;
    }

    // Role dashboards are per active role: a Worker opening /dashboard/provider (or a
    // stale bookmark after a role switch) is sent to the dashboard for their own role.
    const roleDashboards = Object.values(ROLE_DASHBOARD_PATHS) as string[];
    const onRoleDashboard = roleDashboards.find((p) => pathname === p || pathname.startsWith(p + "/"));
    if (onRoleDashboard) {
      const own = ROLE_DASHBOARD_PATHS[user.activeRole as keyof typeof ROLE_DASHBOARD_PATHS];
      if (own && onRoleDashboard !== own) {
        router.replace(own);
        return;
      }
      if (!own) {
        router.replace("/admin"); // ADMIN has no role dashboard
        return;
      }
    }

    // Role-specific management areas: opening one with the wrong active role goes back to that
    // role's own dashboard (the API enforces the same rule on every call).
    const roleOnly = ROLE_ONLY_AREAS.find((a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"));
    const ownDashboard = ROLE_DASHBOARD_PATHS[user.activeRole as keyof typeof ROLE_DASHBOARD_PATHS];
    if (roleOnly && ownDashboard && !roleOnly.roles.includes(user.activeRole as string)) {
      router.replace(ownDashboard);
      return;
    }

    // Skip gates for pages that let the user fix their profile
    const isExempt = GATE_EXEMPT.some(p => pathname.startsWith(p));
    if (isExempt) return;

    // 2. PENDING with unverified phone -- can't do anything until verified.
    //    JWT claims can say PENDING even after activation, so wait for initialized.
    if (!initialized) return;
    if (user.status === "PENDING" && !phoneVerified) {
      router.replace("/setup/verify");
      return;
    }

    // 3. Profile incomplete -- gate all roles (including PENDING-but-verified,
    //    now that registration no longer walks anyone through a wizard).
    //    ACTIVE users are already approved — don't gate them (handles seeded accounts).
    if (user.status !== "ACTIVE" && profileCompletion !== null && profileCompletion < 100 && marketplaceMissing.length > 0) {
      router.replace("/profile");
      return;
    }

    // 4. Profile complete but plan never activated (paid roles only) — send them
    //    to the subscription page instead of letting them sit in the dashboard
    //    with no active plan.
    const isParticipant = user.activeRole === "PARTICIPANT";
    if (!isParticipant && user.status !== "ACTIVE") {
      router.replace("/subscription");
    }
  }, [loading, isAuth, user, profileCompletion, marketplaceMissing, router, pathname, initialized, profileStep, phoneVerified, isPublicExempt]);

  // Guest on a publicly-exempt page (e.g. /jobs/post) -- render the page with
  // no sidebar/topbar chrome, since there's no logged-in user to show it for.
  if (!loading && (!isAuth || !user) && isPublicExempt) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  // Not authenticated and done loading -- render nothing, redirect fires above
  if (!loading && (!isAuth || !user)) return null;

  if (loading) {
    return (
      <div className="td-theme flex h-screen items-center justify-center text-slate-500">
        <Spinner /> <span className="ml-2">Loading</span>
      </div>
    );
  }

  return (
    <div className="td-theme flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <StatusBanner />
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
