"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store/auth.store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { StatusBanner } from "@/components/layout/status-banner";
import { Spinner } from "@/components/ui/spinner";
import { TOTAL_STEPS, WIZARD_START_STEP } from "@/lib/registration/stepConfig";

// Pages inside the dashboard that should be accessible even with an incomplete profile
// (so the user can actually go fix their profile without getting redirect-looped)
const GATE_EXEMPT = ["/profile", "/documents", "/subscription", "/availability"];

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

  useEffect(() => {
    if (loading) return;

    // 1. Not authenticated -> login
    if (!isAuth || !user) {
      router.replace("/login");
      return;
    }

    // Skip gates for pages that let the user fix their profile
    const isExempt = GATE_EXEMPT.some(p => pathname.startsWith(p));
    if (isExempt) return;

    // 2. PENDING status -- wait for /users/me to confirm DB status before redirecting.
    //    JWT claims can say PENDING even after the user has completed activation,
    //    so we hold off until the background /users/me call sets initialized: true.
    if (!initialized) return;
    if (user.status === "PENDING") {
      // Route to the correct setup step instead of always /setup/verify.
      const role = user.activeRole ?? "SUPPORT_WORKER";
      const total = TOTAL_STEPS[role] ?? TOTAL_STEPS["SUPPORT_WORKER"];
      if (!phoneVerified) {
        // Phone not yet verified — send to OTP step
        router.replace("/setup/verify");
      } else if (profileStep < WIZARD_START_STEP) {
        // Verified but wizard not started — begin at first wizard step
        router.replace("/setup/profile/" + WIZARD_START_STEP);
      } else if (profileStep < total) {
        // Wizard in progress — resume at current step
        router.replace("/setup/profile/" + profileStep);
      } else {
        router.replace("/setup/plan");
      }
      return;
    }

    // 3. Profile incomplete -- only gate paid roles; Participants are free and
    //    their wizard covers the required fields, so don't force-redirect them.
    const isParticipant = user.activeRole === "PARTICIPANT";
    if (!isParticipant && profileCompletion !== null && profileCompletion < 100 && marketplaceMissing.length > 0) {
      router.replace("/profile");
    }
  }, [loading, isAuth, user, profileCompletion, marketplaceMissing, router, pathname, initialized, profileStep, phoneVerified]);

  // Not authenticated and done loading -- render nothing, redirect fires above
  if (!loading && (!isAuth || !user)) return null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        <Spinner /> <span className="ml-2">Loading</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <StatusBanner />
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
