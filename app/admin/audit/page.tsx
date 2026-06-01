"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuditLog, type AuditEntry } from "@/lib/api/admin";

const ACTION_COLOURS: Record<string, string> = {
  USER_APPROVED:    "bg-green-100 text-green-700",
  USER_REJECTED:    "bg-red-100 text-red-700",
  USER_SUSPENDED:   "bg-yellow-100 text-yellow-700",
  USER_REACTIVATED: "bg-blue-100 text-blue-700",
  USER_EDITED:      "bg-slate-100 text-slate-600",
  DOC_VERIFIED:     "bg-green-100 text-green-700",
  DOC_REJECTED:     "bg-red-100 text-red-700",
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  function load() {
    setLoading(true);
    getAuditLog({ page, limit: 50 })
      .then((r) => { setEntries(r.entries); setTotal(r.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  return (
    <>
      <PageHeader title="Audit Log" description="All admin actions on the platform." />
      <div className="container-page py-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">{error}</div>}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Admin</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Target</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Note</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
                  ) : !entries.length ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No audit entries.</td></tr>
                  ) : entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOURS[e.action] ?? "bg-slate-100 text-slate-600"}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{e.admin.name}</td>
                      <td className="px-4 py-3 text-slate-700">{e.targetUser?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{e.reason ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(e.createdAt).toLocaleString("en-AU")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">{total} total entries</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
