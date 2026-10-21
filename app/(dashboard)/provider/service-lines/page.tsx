"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LayoutGrid, Plus } from "lucide-react";

interface Listing { id: string; status: string; suburb: string; state: string | null; serviceCategory: string | null; serviceCategories: string[] | null }

const label = (v: string) => v.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// Provider "Service lines" (approved demo): one card per service category the organisation offers, built from its service listings.
export default function ProviderServiceLinesPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ listings: Listing[] }>("/provider/listings?category=SERVICE").then((r) => setListings(r.listings ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load service lines"); setListings([]); });
  }, []);

  const lines = useMemo(() => {
    const map = new Map<string, { areas: Set<string>; listingId: string }>();
    for (const l of listings ?? []) {
      if (l.status === "CLOSED") continue;
      const cats = l.serviceCategories?.length ? l.serviceCategories : l.serviceCategory ? [l.serviceCategory] : [];
      for (const raw of cats) {
        // Registration stores PERSONAL_CARE, listings may hold "Personal care": treat them as one line.
        const c = raw.trim().toLowerCase().replace(/[_\s]+/g, "_");
        const e = map.get(c) ?? { areas: new Set<string>(), listingId: l.id };
        e.areas.add(l.suburb);
        map.set(c, e);
      }
    }
    return [...map.entries()].map(([cat, v]) => ({ cat, areas: [...v.areas], listingId: v.listingId }));
  }, [listings]);

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Service lines</div>
        <div className="pd-page-head">
          <div>
            <h1>Service lines</h1>
            <p>Reuse organisation capability in matching and listing forms.</p>
          </div>
          <div className="pd-buttons">
            <Link href="/provider/post-service" className="pd-btn pd-btn-primary"><Plus />Add service line</Link>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {listings === null ? <div className="pd-quiet-empty">Loading…</div>
          : lines.length === 0 ? (
            <div className="pd-grid3">
              <div className="pd-empty">
                <LayoutGrid />
                <h3>No service lines yet</h3>
                <p>Add one to reuse it in matching and listings.</p>
              </div>
            </div>
          ) : (
            <div className="pd-grid3">
              {lines.map((l) => (
                <article key={l.cat} className="pd-record-card">
                  <LayoutGrid className="pd-icon-plain" />
                  <h2>{label(l.cat)}</h2>
                  <p className="pd-card-body" style={{ margin: 0 }}>{l.areas.join(", ")}</p>
                  <div><span className="pd-badge pd-badge-green">Scope review recorded</span></div>
                  <Link href={`/provider/post-service?edit=${l.listingId}`} className="pd-btn pd-btn-sm" style={{ alignSelf: "flex-start" }}>Edit capability</Link>
                </article>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
