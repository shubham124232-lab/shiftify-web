"use client";

// Provider Team Member dashboard (Pricing V2 §4.4 / Provider doc PR-MR01). A managed worker is NOT an
// independent Support Worker: no marketplace browsing, no Connect allowance, no Available Now, no public
// shiftboard. They see only the assignments their organisation gives them.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type WorkerDashboard } from "@/lib/api/dashboard";
import { CalendarDays, MessageSquare, FileText, SlidersHorizontal, Briefcase } from "lucide-react";

export function ManagedWorkerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<WorkerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as WorkerDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;
  const upcoming = data?.upcomingShifts ?? [];
  const unread = data?.stats?.unreadMessages ?? data?.unreadMessages ?? 0;

  const quickActions: QuickAction[] = [
    { key: "upcoming", icon: CalendarDays, label: "Upcoming support", href: "/upcoming-support" },
    { key: "availability", icon: SlidersHorizontal, label: "My availability", href: "/availability" },
    { key: "messages", icon: MessageSquare, label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
    { key: "documents", icon: FileText, label: "My documents", href: "/documents" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || "there").split(" ")[0]}
        description="Your assignments from your organisation. Your organisation allocates and confirms your work."
      />
      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>My assignments</CardTitle></CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <p className="py-4 text-sm text-slate-400">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No assignments right now. When your organisation assigns you to a shift it appears here.</p>
              ) : upcoming.map((s) => (
                <DashboardListRow key={s.id} icon={<Briefcase className="h-5 w-5" />} title={s.title}
                  subtitle={`${s.suburb} · ${new Date(s.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}`}
                  href={`/jobs/${s.id}`} rightLabel="Open" />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 text-sm text-slate-600">
              <p className="m-0 font-semibold text-slate-800">How this works</p>
              <p className="mt-1 mb-0 text-xs text-slate-500">
                You are part of your organisation&apos;s workforce. Your organisation finds the work, confirms it and allocates you; the exact address and participant contact details are released to you once the organisation has confirmed.
                Questions about work or rosters go to your organisation — see <Link href="/messages" className="underline">Messages</Link>.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuickActionsPanel actions={quickActions} />
        </div>
      </div>
    </div>
  );
}
