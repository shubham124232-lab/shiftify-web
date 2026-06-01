"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAdminJobs, cancelJob, type AdminJob } from "@/lib/api/admin";

const STATUSES   = ["", "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED", "DRAFT"];
const URGENCIES  = ["", "EMERGENCY", "SAME_DAY", "SCHEDULED"];

export default function AdminJobsPage() {
  const [jobs, setJobs]       = useState<AdminJob[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState("");
  const [urgency, setUrgency] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAdminJobs({ status: status || undefined, urgency: urgency || undefined, page, limit: 20 })
      .then((r) => { setJobs(r.jobs); setTotal(r.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, status, urgency]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel(job: AdminJob) {
    if (!confirm(`Force-cancel "${job.title}"?`)) return;
    const reason = prompt("Reason (optional):") ?? undefined;
    setActionId(job.id);
    try {
      await cancelJob(job.id, reason);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  }

  const canCancel = (status: string) => !["CANCELLED", "CONFIRMED"].includes(status);

  return (
    <>
      <PageHeader title="Jobs Overview" description={`${total} jobs on the platform`} />
      <div className="container-page py-8 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
          <select value={urgency} onChange={(e) => { setUrgency(e.target.value); setPage(1); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            {URGENCIES.map((u) => <option key={u} value={u}>{u || "All urgencies"}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => { setStatus(""); setUrgency(""); setPage(1); }}>Clear</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Posted by</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Urgency</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Scheduled</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Applicants</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                  ) : jobs.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No jobs found.</td></tr>
                  ) : jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">{j.title}</td>
                      <td className="px-4 py-3 text-slate-500">{j.postedBy.name}</td>
                      <td className="px-4 py-3 text-slate-500">{j.category.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          j.urgency === "EMERGENCY" ? "bg-red-100 text-red-700" :
                          j.urgency === "SAME_DAY"  ? "bg-orange-100 text-orange-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{j.urgency}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          j.status === "OPEN"        ? "bg-blue-100 text-blue-700" :
                          j.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-700" :
                          j.status === "CONFIRMED"   ? "bg-green-100 text-green-700" :
                          j.status === "CANCELLED"   ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{j.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{j.suburb}, {j.state}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(j.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 text-center">{j._count.applications}</td>
                      <td className="px-4 py-3">
                        {canCancel(j.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionId === j.id}
                            onClick={() => handleCancel(j)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        )}
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
            <span>Page {page} of {Math.ceil(total / 20)} ({total} jobs)</span>
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
