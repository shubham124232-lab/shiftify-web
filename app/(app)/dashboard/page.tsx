"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardRedirect() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(ROLE_DASHBOARD_PATHS[user.activeRole]);
    }
  }, [status, user, router]);

  return (
    <div className="flex h-full items-center justify-center text-slate-500">
      <Spinner /> <span className="ml-2">Loading your dashboard…</span>
    </div>
  );
}
