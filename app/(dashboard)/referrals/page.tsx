"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listReferrals, type Referral } from "@/lib/api/pm";

const STATUS_BADGE: Record<string, string> = {
  DRAFT:       "bg-yellow-100 text-yellow-700",
  OPEN:        "bg-blue-100 text-blue-700",
  ASSIGNED:    "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED:   "bg-emerald-100 text-emerald-700",
  CONFIRMED:   "bg-emerald-100 text-emerald-700",
  CANCELLED:   "bg-slate-100 text-slate-500",
};

const TABS = ["", "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED"] as const;

export default function PmReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listReferrals({ page, limit: 20, status: status || undefined })
      .then((r) => { setReferrals(r.referrals); setTotal(r.total); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load referrals"))
      .finally(() => setLoading(false));
  }, [page, status]);

  return (
    <>
      <PageHeader
        title="My Referrals"
        description="Support requests you have posted on behalf of participants."
        actions={
          <div className="flex gap-2">
            <Link href="/referrals/post"><Button size="sm">Post Referral</Button></Link>
            <Link href="/load-board"><Button variant="outline" size="sm">Browse Load Board</Button></Link>
          </div>
        }
      />
      <div className="container-page py-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t || "ALL"}
              type="button"
              onClick={() => { setStatus(t); setPage(1); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                status === t
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t ? t.replaceAll("_", " ") : "All"}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="px-6 py-10 text-sm text-slate-400 text-center">Loading referrals…</p>
            ) : !referrals.length ? (
              <p className="px-6 py-10 text-sm text-slate-500 text-center">
                No referrals{status ? ` with status ${status}` : " posted yet"}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Participant</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Scheduled</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Applicants</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                        <td className="px-4 py-3 text-slate-500">{r.forParticipant?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{r.category.replaceAll("_", " ")}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(r.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3">{r._count.applications}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {r.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/jobs/${r.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} referral{total === 1 ? "" : "s"}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
