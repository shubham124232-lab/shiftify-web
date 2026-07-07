"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { browseLoadBoard, type LoadBoardRequest } from "@/lib/api/pm";

const URGENCY_BADGE: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700",
  SAME_DAY:  "bg-orange-100 text-orange-700",
  SCHEDULED: "bg-slate-100 text-slate-500",
};

const CATEGORIES = [
  "", "PERSONAL_CARE", "COMMUNITY_ACCESS", "DOMESTIC_ASSISTANCE", "TRANSPORT",
  "SOCIAL_RECREATIONAL", "NURSING_COMPLEX_CARE", "THERAPY_ASSISTANCE",
  "OVERNIGHT_SUPPORT", "SIL_SUPPORT", "RESPITE", "OTHER",
];

const URGENCIES = ["", "EMERGENCY", "SAME_DAY", "SCHEDULED"];

export default function PmLoadBoardPage() {
  const [requests, setRequests] = useState<LoadBoardRequest[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [category, setCategory] = useState("");
  const [urgency, setUrgency]   = useState("");
  const [suburb, setSuburb]     = useState("");
  const [suburbInput, setSuburbInput] = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [linkedOnly, setLinkedOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    browseLoadBoard({
      page, limit: 20,
      category: category || undefined,
      urgency: urgency || undefined,
      suburb: suburb || undefined,
    })
      .then((r) => { setRequests(r.requests); setTotal(r.total); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load requests"))
      .finally(() => setLoading(false));
  }, [page, category, urgency, suburb]);

  const visible = useMemo(
    () => (linkedOnly ? requests.filter((r) => r.isLinkedParticipant) : requests),
    [requests, linkedOnly],
  );

  return (
    <>
      <PageHeader
        title="Load Board"
        description="Open support requests across the platform — spot service gaps for your participants."
      />
      <div className="container-page py-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c ? c.replaceAll("_", " ") : "All categories"}</option>)}
          </select>
          <select value={urgency} onChange={(e) => { setUrgency(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            {URGENCIES.map((u) => <option key={u} value={u}>{u || "All urgencies"}</option>)}
          </select>
          <form
            onSubmit={(e) => { e.preventDefault(); setSuburb(suburbInput.trim()); setPage(1); }}
            className="flex gap-2"
          >
            <input
              value={suburbInput}
              onChange={(e) => setSuburbInput(e.target.value)}
              placeholder="Suburb…"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white w-40"
            />
            <Button type="submit" variant="outline" size="sm">Search</Button>
          </form>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer ml-auto">
            <input type="checkbox" checked={linkedOnly} onChange={(e) => setLinkedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300" />
            My participants only
          </label>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="px-6 py-10 text-sm text-slate-400 text-center">Loading requests…</p>
            ) : !visible.length ? (
              <p className="px-6 py-10 text-sm text-slate-500 text-center">
                No open requests{linkedOnly ? " for your linked participants" : ""} right now.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visible.map((r) => (
                  <li key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/jobs/${r.id}`} className="text-sm font-semibold text-slate-900 hover:underline truncate">
                          {r.title}
                        </Link>
                        {r.isLinkedParticipant && (
                          <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">Your participant</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {r.category.replaceAll("_", " ")} · {r.suburb}{r.state ? `, ${r.state}` : ""} ·{" "}
                        {new Date(r.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                        {r.forParticipant ? ` · for ${r.forParticipant.name}` : ""} · posted by {r.postedBy.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">{r._count.applications} applicant{r._count.applications === 1 ? "" : "s"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY_BADGE[r.urgency] ?? "bg-slate-100 text-slate-500"}`}>
                        {r.urgency}
                      </span>
                      <Link href={`/jobs/${r.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} open request{total === 1 ? "" : "s"}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
