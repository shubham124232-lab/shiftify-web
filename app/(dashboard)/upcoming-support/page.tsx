"use client";

// SC-D04 "Upcoming Support" — confirmed arrangements the coordinator has set up,
// from confirmation through to completion.

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";

interface Job {
  id: string; title: string; suburb: string; state: string;
  scheduledStartAt: string; status: string;
}

type Tab = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

const TABS: { key: Tab; label: string }[] = [
  { key: "UPCOMING",    label: "Upcoming" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED",   label: "Completed" },
];

export default function UpcomingSupportPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("UPCOMING");

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then(r => setJobs(r.jobs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = jobs.filter(j => {
    if (tab === "UPCOMING") return j.status === "ASSIGNED";
    if (tab === "IN_PROGRESS") return j.status === "IN_PROGRESS";
    return j.status === "COMPLETED" || j.status === "CONFIRMED";
  });

  return (
    <>
      <PageHeader title="Upcoming Support" description="Confirmed support arrangements you have set up, from confirmation through to completion." />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex gap-2 flex-wrap mb-5">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`h-8 px-4 rounded-full border text-sm font-semibold transition-colors ${
                tab === t.key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : shown.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base font-semibold text-slate-700">Nothing here yet</p>
            <p className="text-sm text-slate-400 mt-1">Confirmed support will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map(job => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-xl px-4.5 py-3.5">
                <div className="text-sm font-bold text-slate-800 mb-1">{job.title}</div>
                <div className="text-xs text-slate-500 mb-2.5">
                  {job.suburb}, {job.state} · {new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/jobs/${job.id}`} className="h-8 px-3.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">View</Link>
                  <Link href={`/jobs/${job.id}#messages`} className="h-8 px-3.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Message</Link>
                  {tab === "UPCOMING" && (
                    <Link href={`/jobs/${job.id}`} className="h-8 px-3.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">Replace / Cancel</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
