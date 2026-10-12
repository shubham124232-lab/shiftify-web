"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderRequestCard, type ProviderRequestRow } from "@/components/provider/RequestCard";

export default function ProviderMatchedRequestsPage() {
  const [rows, setRows] = useState<ProviderRequestRow[]>([]);
  const [hasLive, setHasLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ hasLiveServices: boolean; requests: ProviderRequestRow[] }>("/provider-workspace/matched-requests")
      .then((r) => { setRows(r.requests); setHasLive(r.hasLiveServices); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load matched requests"))
      .finally(() => setLoading(false));
  }, []);

  async function toggleSave(r: ProviderRequestRow) {
    setBusyId(r.id); setError(null);
    try {
      if (r.saved) await api.delete(`/jobs/${r.id}/save`);
      else await api.patch(`/jobs/${r.id}/save`, { saved: true });
      setRows((list) => list.map((x) => (x.id === r.id ? { ...x, saved: !r.saved } : x)));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update your saved requests"); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <PageHeader
        title="Matched Requests"
        description="Requests that match your live services and areas. Confirm current capacity and required checks before responding."
        actions={<Link href="/jobs"><Button variant="outline" size="sm">Browse all requests</Button></Link>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">
            {hasLive
              ? "No matching requests right now. New matches appear as Participants and Coordinators post."
              : <>Matches are based on your live service listings. <Link href="/provider/services" className="font-semibold text-brand-600 hover:underline">Post your services</Link> to see matching requests.</>}
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => <ProviderRequestCard key={r.id} r={r} onToggleSave={toggleSave} busy={busyId === r.id} />)}
          </div>
        )}
      </div>
    </>
  );
}
