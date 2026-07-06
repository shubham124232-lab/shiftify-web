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
  status: "ACTIVE" | "PAUSED" | "FILLED" | "CLOSED";
  title: string;
  suburb: string;
  state: string | null;
  listingType: string | null;
  serviceCategory: string | null;
  vacancyCategory: string | null;
  createdAt: string;
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
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Live",
  PAUSED: "Paused",
  FILLED: "Filled",
  CLOSED: "Closed",
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

  useEffect(() => {
    api
      .get<{ listings: Listing[] }>("/provider/listings")
      .then((r) => setListings(r.listings))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load listings"))
      .finally(() => setLoading(false));
  }, []);

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
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    <p>{l.suburb}{l.state ? `, ${l.state}` : ""}</p>
                    <p>{new Date(l.createdAt).toLocaleDateString("en-AU")}</p>
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
