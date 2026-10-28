"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAdminListings, updateListingStatus, type AdminListing } from "@/lib/api/admin";

const STATUSES   = ["", "ACTIVE", "PAUSED", "FILLED", "CLOSED"];
const CATEGORIES = ["", "SERVICE", "HOUSING"];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700",
  FILLED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAdminListings({ status: status || undefined, listingCategory: category || undefined, page, limit: 20 })
      .then((r) => { setListings(r.listings); setTotal(r.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, status, category]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(listing: AdminListing, newStatus: string) {
    if (newStatus === listing.status) return;
    const reason = (newStatus === "PAUSED" || newStatus === "CLOSED")
      ? (prompt(`Reason for setting "${listing.title}" to ${newStatus} (optional):`) ?? undefined)
      : undefined;
    setActionId(listing.id);
    try {
      await updateListingStatus(listing.id, newStatus, reason);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <PageHeader title="Listings Moderation" description={`${total} provider listings on the platform`} />
      <div className="container-page py-8 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c || "All categories"}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => { setStatus(""); setCategory(""); setPage(1); }}>Clear</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Provider</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Posted</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                  ) : listings.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No listings found.</td></tr>
                  ) : listings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium max-w-[220px] truncate">{l.title}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {l.provider.name}
                        {l.provider.email && <div className="text-xs text-slate-400">{l.provider.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{l.listingCategory}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[l.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{l.suburb}{l.state ? `, ${l.state}` : ""}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          disabled={actionId === l.id}
                          onChange={(e) => handleStatusChange(l, e.target.value)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        >
                          {STATUSES.filter((s) => s).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {Math.ceil(total / 20) > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Page {page} of {Math.ceil(total / 20)} ({total} listings)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
