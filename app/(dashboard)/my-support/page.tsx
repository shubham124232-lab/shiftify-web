"use client";

// SW doc Window 31 "My Support" — a worker-only, lifecycle-focused view of agreed work:
// Today / Upcoming / Recurring / Awaiting worker acceptance / Completed / Cancelled.
// Distinct from /jobs/my, which also covers open connections.

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

interface Job {
  id: string; title: string; category: string; urgency: string;
  suburb: string; state: string; scheduledStartAt: string; scheduledEndAt: string;
  totalHours: number | string | null; status: string; isRecurring?: boolean;
  workerConfirmedAt?: string | null;
  selectedApplicantUserId?: string | null; assignedWorkerUserId?: string | null;
  cancelledAt?: string | null; cancelledByRole?: string | null;
  postedByName?: string | null; postedByRoleLabel?: string | null;
  participantName?: string | null; ownApplicationStatus?: string | null;
}

type Tab = "TODAY" | "UPCOMING" | "RECURRING" | "AWAITING" | "COMPLETED" | "CANCELLED";

const TABS: { key: Tab; label: string }[] = [
  { key: "TODAY",     label: "Today" },
  { key: "UPCOMING",  label: "Upcoming" },
  { key: "RECURRING", label: "Recurring" },
  { key: "AWAITING",  label: "Awaiting your acceptance" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const EMPTY_COPY: Record<Tab, string> = {
  TODAY: "Support happening today will show up here.",
  UPCOMING: "Confirmed support awaiting its start date will show up here.",
  RECURRING: "Confirmed recurring support will show up here.",
  AWAITING: "When someone selects you, the confirmation to accept appears here.",
  COMPLETED: "Completed support will show up here.",
  CANCELLED: "Support that was cancelled will show up here.",
};

function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function MySupportPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then(r => setJobs(r.jobs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Only work the worker has actually been chosen for belongs here — not open connections.
  const mine = jobs.filter(j => j.selectedApplicantUserId === user?.id || j.assignedWorkerUserId === user?.id);
  const now = new Date();
  const bucket = (j: Job): Tab | null => {
    if (j.status === "CANCELLED") return "CANCELLED";
    if (j.status === "COMPLETED" || j.status === "CONFIRMED") return "COMPLETED";
    if (j.status === "ASSIGNED" && !j.workerConfirmedAt) return "AWAITING";
    if (j.status === "IN_PROGRESS") return "TODAY";
    if (j.status === "ASSIGNED") {
      if (sameLocalDay(new Date(j.scheduledStartAt), now)) return "TODAY";
      return j.isRecurring ? "RECURRING" : "UPCOMING";
    }
    return null;
  };
  const rows = (t: Tab) => mine.filter(j => bucket(j) === t || (t === "RECURRING" && j.isRecurring && j.status === "ASSIGNED" && !!j.workerConfirmedAt && bucket(j) === "TODAY"));
  const counts = Object.fromEntries(TABS.map(t => [t.key, rows(t.key).length])) as Record<Tab, number>;
  // Open on the first tab that has something in it.
  const active: Tab = tab ?? (TABS.find(t => counts[t.key] > 0)?.key ?? "TODAY");
  const shown = rows(active);

  function statusChip(j: Job) {
    const b = bucket(j);
    const label = b === "AWAITING" ? "Awaiting your acceptance" : b === "CANCELLED" ? "Cancelled" : b === "COMPLETED" ? "Completed" : j.status === "IN_PROGRESS" ? "In progress" : "Confirmed";
    const cls = b === "AWAITING" ? "bg-amber-100 text-amber-700" : b === "CANCELLED" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700";
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
  }

  return (
    <>
      <PageHeader title="My Support" description="Support you have been confirmed for — upcoming, recurring, completed and cancelled." />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex gap-2 flex-wrap mb-5">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`h-8 px-4 rounded-full border text-sm font-semibold transition-colors ${
                active === t.key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {t.label}{loading ? "" : ` (${counts[t.key]})`}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : shown.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base font-semibold text-slate-700">Nothing here yet</p>
            <p className="text-sm text-slate-400 mt-1">{EMPTY_COPY[active]}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map(job => {
              const cat = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
              return (
                <div key={job.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex flex-col gap-2 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800">{job.participantName ? `${job.participantName} · ${cat}` : cat}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(job.scheduledStartAt).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                        {job.totalHours ? ` · ${Number(job.totalHours)}h` : ""}
                        {" · "}{job.suburb}, {job.state}
                        {job.isRecurring ? " · Recurring" : ""}
                      </div>
                      {(job.postedByName || job.postedByRoleLabel) && (
                        <div className="text-[11px] text-slate-400 mt-0.5">Posted by {[job.postedByName, job.postedByRoleLabel].filter(Boolean).join(" · ")}</div>
                      )}
                    </div>
                    {statusChip(job)}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/jobs/${job.id}`}><Button size="sm" variant="outline">View details</Button></Link>
                    <Link href={`/jobs/${job.id}#job-messages`}><Button size="sm" variant="outline">Message</Button></Link>
                    {["ASSIGNED", "IN_PROGRESS"].includes(job.status) && !!job.workerConfirmedAt && (
                      <Link href={`/jobs/${job.id}#job-change`}><Button size="sm" variant="outline">Request change</Button></Link>
                    )}
                    {active === "AWAITING" && <Link href={`/jobs/${job.id}`}><Button size="sm">Review and accept</Button></Link>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
