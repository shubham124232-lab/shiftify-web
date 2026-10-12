"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderRequestCard, type ProviderRequestRow } from "@/components/provider/RequestCard";

export default function ProviderSavedRequestsPage() {
  const [rows, setRows] = useState<ProviderRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ requests: ProviderRequestRow[] }>("/provider-workspace/saved-requests")
      .then((r) => setRows(r.requests))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load saved requests"))
      .finally(() => setLoading(false));
  }, []);

  async function unsave(r: ProviderRequestRow) {
    setBusyId(r.id); setError(null);
    try {
      await api.delete(`/jobs/${r.id}/save`);
      setRows((list) => list.filter((x) => x.id !== r.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not remove this request"); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <PageHeader
        title="Saved Requests"
        description="Participant and Support Coordinator requests your organisation can service."
        actions={<Link href="/jobs"><Button variant="outline" size="sm">Browse Requests</Button></Link>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">
            No saved requests. Save opportunities from Browse Requests or Matched Requests to keep them here.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => <ProviderRequestCard key={r.id} r={{ ...r, saved: true }} onToggleSave={unsave} busy={busyId === r.id} />)}
          </div>
        )}
      </div>
    </>
  );
}
