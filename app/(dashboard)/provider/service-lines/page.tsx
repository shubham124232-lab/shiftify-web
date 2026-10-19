"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <>
      <div className="space-y-5 px-8 pt-6">
        <p className="m-0 text-xs text-slate-400">Provider / Service lines</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Service lines</h1>
            <p className="m-0 mt-1.5 text-[15px] text-slate-500">Reuse organisation capability in matching and listing forms.</p>
          </div>
          <Link href="/provider/post-service"><Button><Plus className="mr-1.5 h-4 w-4" />Add service line</Button></Link>
        </div>
      </div>
      <div className="space-y-5 px-8 py-6">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {listings === null ? <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          : lines.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">No service lines yet. Add one to reuse it in matching and listings.</div>
          : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {lines.map((l) => (
                <div key={l.cat} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <Briefcase className="h-5 w-5 text-slate-500" />
                  <h3 className="m-0 mt-5 text-xl font-bold text-slate-900">{label(l.cat)}</h3>
                  <p className="m-0 mt-4 text-base text-slate-500">{l.areas.join(", ")}</p>
                  <p className="m-0 mt-2 text-sm font-medium text-emerald-700">Scope review recorded</p>
                  <Link href={`/provider/post-service?edit=${l.listingId}`} className="mt-5 block"><Button variant="outline" className="w-full">Edit capability</Button></Link>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}
