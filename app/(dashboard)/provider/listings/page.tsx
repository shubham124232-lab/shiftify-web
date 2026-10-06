"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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

interface PlatinumCampaign {
  id: string;
  coverage: "METRO" | "STATE" | "NATIONAL";
  centreSuburb: string | null;
  durationMonths: number;
  priceAud: number;
  startsAt: string;
  endsAt: string;
}

// Pricing V2 §7 / 15.3 — must match Backend's PLATINUM_TILE_PRICE_AUD exactly.
const PLATINUM_TILE_PRICE: Record<string, Record<number, number>> = {
  METRO:    { 1: 499.99,  3: 1124.99, 6: 2099.99,  12: 3899.99 },
  STATE:    { 1: 999.99,  3: 2249.99, 6: 4199.99,  12: 7799.99 },
  NATIONAL: { 1: 1499.99, 3: 3374.99, 6: 6299.99,  12: 11699.99 },
};
const DURATIONS = [1, 3, 6, 12] as const;

function PlatinumTilePanel() {
  const [campaigns, setCampaigns] = useState<PlatinumCampaign[]>([]);
  const [coverage, setCoverage] = useState<"METRO" | "STATE" | "NATIONAL">("METRO");
  const [duration, setDuration] = useState<number>(1);
  const [centreSuburb, setCentreSuburb] = useState("");
  const [marketState, setMarketState] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<{ campaigns: PlatinumCampaign[] }>("/provider/listings/platinum-tile")
      .then(r => setCampaigns(r.campaigns))
      .catch(() => {});
  }
  useEffect(() => { load(); }, []);

  const activeCampaign = campaigns.find(c => new Date(c.endsAt) > new Date());
  const price = PLATINUM_TILE_PRICE[coverage][duration];

  async function purchase() {
    // Pricing V2 §11 — confirm coverage, campaign dates and sponsored-placement terms before payment.
    const ends = new Date();
    ends.setMonth(ends.getMonth() + duration);
    const area = coverage === "METRO" ? `Metro (30 km around ${centreSuburb})` : coverage === "STATE" ? `State (${marketState})` : "National";
    const ok = window.confirm(
      `Platinum Tile Sponsorship — ${area}\n${new Date().toLocaleDateString("en-AU")} to ${ends.toLocaleDateString("en-AU")} (${duration} month${duration > 1 ? "s" : ""})\n` +
      `Price: $${price.toFixed(2)}. Your tile is labelled Sponsored, one of three per market, and does not imply recommendation, quality or compliance. Non-refundable once the campaign begins. Continue?`,
    );
    if (!ok) return;
    setPurchasing(true);
    setError(null);
    try {
      await api.post("/provider/listings/platinum-tile", {
        coverage, durationMonths: duration,
        centreSuburb: coverage === "METRO" ? centreSuburb : undefined,
        marketState: coverage === "STATE" ? marketState : undefined,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to purchase Platinum Tile campaign");
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Platinum Tile Sponsorship</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500">Promotes your organisation — not individual shifts — in Provider discovery surfaces.</p>
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}

        {activeCampaign ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⭐ Active campaign — {activeCampaign.coverage}{activeCampaign.centreSuburb ? ` (${activeCampaign.centreSuburb})` : ""}, ends {new Date(activeCampaign.endsAt).toLocaleDateString("en-AU")}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Coverage</label>
              <select className="h-9 px-2 border border-slate-200 rounded-lg text-sm" value={coverage} onChange={e => setCoverage(e.target.value as any)}>
                <option value="METRO">Metro (30km radius)</option>
                <option value="STATE">State</option>
                <option value="NATIONAL">National</option>
              </select>
            </div>
            {coverage === "METRO" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign centre suburb</label>
                <input className="h-9 px-2 border border-slate-200 rounded-lg text-sm" value={centreSuburb} onChange={e => setCentreSuburb(e.target.value)} placeholder="e.g. Parramatta" />
              </div>
            )}
            {coverage === "STATE" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State or territory</label>
                <select className="h-9 px-2 border border-slate-200 rounded-lg text-sm" value={marketState} onChange={e => setMarketState(e.target.value)}>
                  <option value="">Select…</option>
                  {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
              <select className="h-9 px-2 border border-slate-200 rounded-lg text-sm" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d} month{d > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <Button
              disabled={purchasing || (coverage === "METRO" && !centreSuburb.trim()) || (coverage === "STATE" && !marketState)}
              onClick={purchase}
            >
              {purchasing ? "Purchasing…" : `Purchase — $${price.toFixed(2)}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
