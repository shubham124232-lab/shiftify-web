"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActionTilesCard, type ActionTile } from "@/components/dashboard/action-tiles";
import { DashboardTabCard } from "@/components/dashboard/tab-card";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getDashboard, type ProviderDashboard } from "@/lib/api/dashboard";
import {
  Search, FilePlus, Home, Users, MessageSquare, SlidersHorizontal,
  FileText, Briefcase, ClipboardList,
} from "lucide-react";

interface ProviderListing {
  id: string;
  listingCategory: "SERVICE" | "HOUSING";
  status: string;
  title: string;
  suburb: string;
  vacancyCategory: string | null;
  createdAt: string;
}

const LISTING_TYPE_BADGE: Record<string, string> = {
  SERVICE: "bg-blue-100 text-blue-700",
  HOUSING: "bg-purple-100 text-purple-700",
};

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [data,     setData]     = useState<ProviderDashboard | null>(null);
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d as ProviderDashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api.get<{ listings: ProviderListing[] }>("/provider/listings")
      .then((r) => setListings(r.listings ?? []))
      .catch(() => setListings([]));
  }, []);

  if (!user) return null;

  const liveListings = listings.filter((l) => l.status === "ACTIVE");
  const unread = data?.unreadNotifications ?? 0;

  const tiles: ActionTile[] = [
    { key: "browse",  icon: Search,   title: "Browse Requests",         subtitle: "Find work for your team",  ctaLabel: "Browse Requests",         href: "/jobs", highlighted: true },
    { key: "service", icon: FilePlus, title: "Post Service Availability", subtitle: "Advertise your capacity", ctaLabel: "Post Service Availability", href: "/provider/post-service" },
    { key: "sil",     icon: Home,     title: "SIL / SDA Vacancy",       subtitle: "List a housing vacancy",   ctaLabel: "Post Vacancy",            href: "/provider/sil-vacancy" },
  ];

  const quickActions: QuickAction[] = [
    { key: "listings", icon: ClipboardList,     label: "My listings",   href: "/provider/listings" },
    { key: "team",     icon: Users,             label: "My team",       href: "/team" },
    { key: "messages", icon: MessageSquare,     label: unread > 0 ? `Messages (${unread})` : "Messages", href: "/messages" },
    { key: "profile",  icon: SlidersHorizontal, label: "Update profile", href: "/profile/edit" },
    { key: "documents",icon: FileText,          label: "Documents",     href: "/documents" },
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <DashboardHeader
        name={(user.name || (user as any).username || "there").split(" ")[0]}
        description="Manage your team's active jobs and service listings."
      />
      <SetupBanner />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          <ActionTilesCard title="Grow your business" tiles={tiles} />

          <DashboardTabCard
            title="Requests & shifts"
            tabs={[
              {
                key: "expressions", label: "Pending Expressions", count: loading ? undefined : (data?.pendingExpressions?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.pendingExpressions?.length
                    ? <p className="py-4 text-sm text-slate-500">No pending expressions.</p>
                    : data.pendingExpressions.map((e) => (
                      <DashboardListRow key={e.applicationId} icon={<Briefcase className="h-5 w-5" />} title={e.job.title} subtitle={e.job.suburb} href={`/jobs/${e.job.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "active", label: "Active Shifts", count: loading ? undefined : (data?.activeShifts?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.activeShifts?.length
                    ? <p className="py-4 text-sm text-slate-500">No active shifts right now.</p>
                    : data.activeShifts.map((s) => (
                      <DashboardListRow key={s.id} icon={<Briefcase className="h-5 w-5" />} title={s.title} subtitle={s.suburb} href={`/jobs/${s.id}`} rightLabel="View" />
                    )),
              },
              {
                key: "unassigned", label: "Awaiting Assignment", count: loading ? undefined : (data?.unassignedAccepted?.length ?? 0),
                content: loading
                  ? <p className="py-4 text-sm text-slate-400">Loading…</p>
                  : !data?.unassignedAccepted?.length
                    ? <p className="py-4 text-sm text-slate-500">Nothing awaiting assignment.</p>
                    : data.unassignedAccepted.map((j) => (
                      <DashboardListRow key={j.id} icon={<Briefcase className="h-5 w-5" />} title={j.title} subtitle={j.suburb} href={`/jobs/${j.id}`}
                        badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Assign a worker</span>} />
                    )),
              },
            ]}
          />

          <Card>
            <CardHeader><CardTitle>My live listings</CardTitle></CardHeader>
            <CardContent className="py-2">
              {!liveListings.length ? (
                <p className="py-4 text-sm text-slate-500">No live listings. Post your service availability or a SIL/SDA vacancy to attract referrals.</p>
              ) : (
                liveListings.slice(0, 5).map((l) => (
                  <DashboardListRow
                    key={l.id}
                    title={l.title}
                    badge={
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${LISTING_TYPE_BADGE[l.listingCategory] ?? ""}`}>
                          {l.listingCategory === "HOUSING" ? l.vacancyCategory ?? "HOUSING" : "SERVICE"}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Live</span>
                      </div>
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-6">
          <QuickActionsPanel actions={quickActions} />
          <ProfileProgressCard />
        </div>
      </div>
    </div>
  );
}
