"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVerificationQueue, updateUserStatus, type AdminUser } from "@/lib/api/admin";

export default function VerificationQueuePage() {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getVerificationQueue({ page, limit: 20 })
      .then((r) => { setUsers(r.users); setTotal(r.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction(id: string, newStatus: "ACTIVE" | "SUSPENDED") {
    setActionId(id);
    try {
      await updateUserStatus(id, newStatus);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <PageHeader title="Suspended Users" description="Review and action suspended accounts." />
      <div className="container-page py-8 space-y-6">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Roles</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
                  ) : !users.length ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No suspended users.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email ?? u.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{(u.roles ?? []).join(", ")}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={actionId === u.id}
                            onClick={() => handleAction(u.id, "ACTIVE")}>Approve</Button>
                          <Button size="sm" variant="outline" disabled={actionId === u.id}
                            onClick={() => handleAction(u.id, "SUSPENDED")}>Reject</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
