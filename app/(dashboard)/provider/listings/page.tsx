"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { PlatinumTilePanel } from "@/components/provider/PlatinumTilePanel";

interface Listing {
  id: string;
  listingCategory: "SERVICE" | "HOUSING";
  status: "ACTIVE" | "PAUSED" | "FILLED" | "CLOSED" | "DRAFT";
  title: string;
  suburb: string;
  state: string | null;
  listingType: string | null;
  serviceCategory: string | null;
  vacancyCategory: string | null;
  createdAt: string;
  isFeatured?: boolean;
  featuredExpiresAt?: string | null;
  featuredQueuePosition?: number | null;
}

const TYPE_BADGE: Record<string, string> = {
  SERVICE: "bg-blue-100 text-blue-700",
  HOUSING: "bg-purple-100 text-purple-700",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-slate-100 text-slate-500",
  FILLED: "bg-sky-100 text-sky-700",
  CLOSED: "bg-slate-100 text-slate-400",
  DRAFT: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Live",
  PAUSED: "Paused",
  FILLED: "Filled",
  CLOSED: "Closed",
  DRAFT: "Draft — not published",
};

const TABS = [
  { key: "ALL",     label: "All" },
  { key: "SERVICE", label: "Service" },
  { key: "HOUSING", label: "SIL / SDA" },
] as const;

export default function ProviderListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<(typeof TABS)[number]["key"]>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

  function loadListings() {
    return api
      .get<{ listings: Listing[] }>("/provider/listings")
      .then((r) => setListings(r.listings))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load listings"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadListings();
  }, []);

  async function changeStatus(id: string, status: Listing["status"]) {
    setUpdatingId(id);
    setError(null);
    try {
      await api.patch(`/provider/listings/${id}`, { status });
      await loadListings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update listing");
    } finally {
      setUpdatingId(null);
    }
  }

  async function featureListing(id: string) {
    setFeaturingId(id);
    setError(null);
    try {
      // Disclose the queue position before payment (Pricing V2 §7.3).
      const preview = await api.get<{ queuePosition: number; priceAud: number; durationDays: number }>(`/provider/listings/${id}/featured-preview`);
      const ok = window.confirm(
        `Your listing will appear as Featured position ${preview.queuePosition} in its area and category for ${preview.durationDays} days. ` +
        `Price: $${preview.priceAud.toFixed(2)}. A later Featured purchase cannot displace an earlier one, and it is non-refundable once it begins. Continue?`,
      );
      if (!ok) { setFeaturingId(null); return; }
      await api.post(`/provider/listings/${id}/featured`, {});
      await loadListings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to purchase Featured Listing");
    } finally {
      setFeaturingId(null);
    }
  }

  const visible = useMemo(
    () => (tab === "ALL" ? listings : listings.filter((l) => l.listingCategory === tab)),
    [listings, tab],
  );

  return (
    <>
      <PageHeader
        crumb="Provider / My Listings"
        title="My Listings"
        description="Manage your service availability and SIL/SDA vacancies."
        actions={
          <div className="flex gap-2">
            <Link href="/provider/post-service"><Button>Post Service</Button></Link>
            <Link href="/provider/sil-vacancy"><Button variant="outline" size="sm">SIL/SDA Vacancy</Button></Link>
          </div>
        }
      />

      <div className="container-page py-8 space-y-6">
        <PlatinumTilePanel />

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                tab === t.key
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{loading ? "Loading…" : `Listings (${visible.length})`}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!loading && visible.length === 0 && !error && (
              <p className="px-6 py-10 text-sm text-slate-400 text-center">
                No listings yet. Post your service availability or a SIL/SDA vacancy to get started.
              </p>
            )}
            <ul className="divide-y divide-slate-100">
              {visible.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{l.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE[l.listingCategory] ?? "bg-slate-100 text-slate-500"}`}>
                        {l.listingCategory === "HOUSING" ? l.vacancyCategory ?? "HOUSING" : "SERVICE"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[l.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                      {l.serviceCategory && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">{l.serviceCategory}</span>
                      )}
                      {l.isFeatured && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
                          ⭐ Featured — position {l.featuredQueuePosition}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0 space-y-2">
                    <p>{l.suburb}{l.state ? `, ${l.state}` : ""}</p>
                    <p>{new Date(l.createdAt).toLocaleDateString("en-AU")}</p>
                    {l.listingCategory === "HOUSING" && l.status === "ACTIVE" && !l.isFeatured && (
                      <Button
                        size="sm" variant="outline" disabled={featuringId === l.id}
                        onClick={() => featureListing(l.id)}
                      >
                        {featuringId === l.id ? "Purchasing…" : "Feature — $399.00/30 days"}
                      </Button>
                    )}
                    <div className="flex gap-1 justify-end">
                      {l.listingCategory === "HOUSING" && l.status !== "CLOSED" && (
                        <Button size="sm" variant="outline" onClick={() => { window.location.href = `/provider/sil-vacancy?edit=${l.id}`; }}>
                          Edit
                        </Button>
                      )}
                      {l.status === "DRAFT" && (
                        <Button
                          size="sm" variant="outline" disabled={updatingId === l.id}
                          onClick={() => changeStatus(l.id, "ACTIVE")}
                        >
                          Publish draft
                        </Button>
                      )}
                      {l.status !== "PAUSED" && l.status !== "CLOSED" && l.status !== "DRAFT" && (
                        <Button
                          size="sm" variant="outline" disabled={updatingId === l.id}
                          onClick={() => changeStatus(l.id, "PAUSED")}
                        >
                          Pause
                        </Button>
                      )}
                      {l.status === "PAUSED" && (
                        <Button
                          size="sm" variant="outline" disabled={updatingId === l.id}
                          onClick={() => changeStatus(l.id, "ACTIVE")}
                        >
                          Reactivate
                        </Button>
                      )}
                      {l.status !== "CLOSED" && (
                        <Button
                          size="sm" variant="outline" disabled={updatingId === l.id}
                          onClick={() => changeStatus(l.id, "CLOSED")}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
