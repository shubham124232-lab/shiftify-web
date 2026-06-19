"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listAdminSubscriptions,
  cancelAdminSubscription,
  type AdminSubscription,
} from "@/lib/api/admin";

const STATUSES = ["", "ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"];

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  TRIAL:     "bg-blue-100 text-blue-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  EXPIRED:   "bg-red-100 text-red-700",
};

export default function AdminSubscriptionsPage() {
  const [subs,     setSubs]     = useState<AdminSubscription[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAdminSubscriptions({ page, limit: 20, status: status || undefined })
      .then((r) => { setSubs(r.subscriptions); setTotal(r.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel(id: string) {
    if (!confirm("Cancel this subscription?")) return;
    setActionId(id);
    try {
      await cancelAdminSubscription(id, "Cancelled by admin");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <PageHeader title="Subscriptions" description="View and manage all platform subscriptions." />
      <div className="container-page py-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">User</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Since</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading...</td>
                    </tr>
                  ) : !subs.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">No subscriptions found.</td>
                    </tr>
                  ) : subs.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-4 py-3 font-medium">{sub.user.name}</td>
                      <td className="px-4 py-3 text-slate-500">{sub.user.email ?? sub.user.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{sub.plan?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {sub.plan ? `$${Number(sub.plan.amountAud).toFixed(2)}/mo` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[sub.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(sub.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        {sub.status === "ACTIVE" || sub.status === "TRIAL" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === sub.id}
                            onClick={() => handleCancel(sub.id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} total subscriptions</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
