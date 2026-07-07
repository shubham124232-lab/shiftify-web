"use client";

import { SetupBanner } from "@/components/dashboard/setup-banner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getDashboard, type ProviderDashboard } from "@/lib/api/dashboard";

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

  const liveListings   = listings.filter((l) => l.status === "ACTIVE");
  const serviceCount   = liveListings.filter((l) => l.listingCategory === "SERVICE").length;
  const housingCount   = liveListings.filter((l) => l.listingCategory === "HOUSING").length;

  return (
    <>
      <PageHeader
        title={`Welcome, ${(user.name || (user as any).username || "there").split(" ")[0]}`}
        description="Manage your team's active jobs and service listings."
        actions={
          <div className="flex gap-2">
            <Link href="/jobs"><Button>Browse Requests</Button></Link>
            <Link href="/provider/post-service"><Button variant="outline" size="sm">Post Service Availability</Button></Link>
          </div>
        }
      />
      <SetupBanner />

      <div className="container-page py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Stat cards (all LIVE) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Expressions of Interest" value={loading ? "…" : (data?.pendingExpressions?.length  ?? 0)} tone="ok"   />
          <StatCard label="Active Shifts"            value={loading ? "…" : (data?.activeShifts?.length       ?? 0)}              />
          <StatCard label="Unassigned (accepted)"    value={loading ? "…" : (data?.unassignedAccepted?.length ?? 0)} tone="warn" />
          <StatCard label="Unread Notifications"     value={loading ? "…" : (data?.unreadNotifications        ?? 0)}              />
          <StatCard label="Live Listings"            value={loading ? "…" : liveListings.length}               tone="ok"          />
          <StatCard label="Service Listings"         value={loading ? "…" : serviceCount}                                          />
          <StatCard label="Housing Vacancies"        value={loading ? "…" : housingCount}                      tone="ok"          />
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs">                  <Button variant="outline" size="sm">Browse Requests</Button></Link>
          <Link href="/provider/post-service"> <Button variant="outline" size="sm">Post Service Availability</Button></Link>
          <Link href="/provider/sil-vacancy">  <Button variant="outline" size="sm">Post SIL/SDA Vacancy</Button></Link>
          <Link href="/provider/listings">     <Button variant="outline" size="sm">My Listings</Button></Link>
          <Link href="/jobs/my">               <Button variant="outline" size="sm">View Enquiries</Button></Link>
          <Link href="/team">                  <Button variant="outline" size="sm">My Team</Button></Link>
          <Link href="/messages">              <Button variant="outline" size="sm">Messages</Button></Link>
          <Link href="/profile/edit">          <Button variant="outline" size="sm">Update Profile</Button></Link>
          <Link href="/documents">             <Button variant="outline" size="sm">Documents</Button></Link>
        </div>

        {/* ── Row 1: LIVE ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending expressions</CardTitle>
              <Link href="/jobs/my"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.pendingExpressions?.length
                  ? <p className="text-sm text-slate-500">No pending expressions.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.pendingExpressions.map((e) => (
                        <li key={e.applicationId} className="py-2 flex justify-between">
                          <span className="font-medium">{e.job.title}</span>
                          <span className="text-slate-500">{e.job.suburb}</span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active shifts</CardTitle></CardHeader>
            <CardContent>
              {loading
                ? <p className="text-sm text-slate-400">Loading…</p>
                : !data?.activeShifts?.length
                  ? <p className="text-sm text-slate-500">No active shifts right now.</p>
                  : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {data.activeShifts.map((s) => (
                        <li key={s.id} className="py-2 flex justify-between">
                          <span className="font-medium">{s.title}</span>
                          <span className="text-slate-500">{s.suburb}</span>
                        </li>
                      ))}
                    </ul>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* ── LIVE: my listings ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My live listings</CardTitle>
            <Link href="/provider/listings"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {!liveListings.length
              ? <p className="text-sm text-slate-500">No live listings. Post your service availability or a SIL/SDA vacancy to attract referrals.</p>
              : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {liveListings.slice(0, 5).map((l) => (
                    <li key={l.id} className="py-2 flex justify-between items-center">
                      <span className="font-medium">{l.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${LISTING_TYPE_BADGE[l.listingCategory] ?? ""}`}>
                          {l.listingCategory === "HOUSING" ? l.vacancyCategory ?? "HOUSING" : "SERVICE"}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Live</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>

        {/* ── LIVE: unassigned accepted jobs (needs a worker assigned) ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Accepted — awaiting worker assignment</CardTitle>
            <Link href="/team"><Button variant="ghost" size="sm">My Team</Button></Link>
          </CardHeader>
          <CardContent>
            {loading
              ? <p className="text-sm text-slate-400">Loading…</p>
              : !data?.unassignedAccepted?.length
                ? <p className="text-sm text-slate-500">Nothing awaiting assignment.</p>
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {data.unassignedAccepted.map((j) => (
                      <li key={j.id} className="py-2 flex justify-between items-center">
                        <div>
                          <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                          <span className="ml-2 text-slate-400">{j.suburb}</span>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Assign a worker</span>
                      </li>
                    ))}
                  </ul>
                )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
