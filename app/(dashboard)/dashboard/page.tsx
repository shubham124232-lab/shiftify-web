"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardRedirect() {
  const { user, isAuth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuth || !user) {
      router.replace('/login');
      return;
    }
    router.replace(ROLE_DASHBOARD_PATHS[user.activeRole]);
  }, [loading, isAuth, user, router]);

  return (
    <div className="flex h-full items-center justify-center text-slate-500">
      <Spinner /> <span className="ml-2">Loading your dashboard…</span>
    </div>
  );
}
