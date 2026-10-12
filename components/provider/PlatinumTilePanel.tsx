"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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

export function PlatinumTilePanel({ onPurchased }: { onPurchased?: () => void } = {}) {
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
      onPurchased?.();
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

