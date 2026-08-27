"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardListRow } from "@/components/dashboard/list-row";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { CalendarDays } from "lucide-react";

interface TeaserJob {
  id: string;
  title: string;
  category: string;
  suburb: string;
  state: string;
  urgency: string;
  scheduledStartAt: string;
  _count?: { applications: number };
}

function urgencyLabel(u: string): string {
  return u.replace("_", " ");
}

export function LiveShiftboardTeaser() {
  const [jobs, setJobs] = useState<TeaserJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ jobs: TeaserJob[] }>("/jobs/live-dashboard?limit=4&sortBy=newest")
      .then((r) => setJobs(r.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Live Public Shiftboard</CardTitle>
        <Link href="/live-dashboard" className="text-sm font-semibold text-brand-600 hover:underline">
          View Full Live Shiftboard →
        </Link>
      </CardHeader>
      <CardContent className="py-2">
        {loading ? (
          <p className="py-4 text-sm text-slate-400">Loading…</p>
        ) : !jobs.length ? (
          <p className="py-4 text-sm text-slate-500">No open shifts on the board right now.</p>
        ) : (
          jobs.map((j) => {
            const catLabel = JOB_CATEGORIES.find((c) => c.value === j.category)?.label ?? j.category;
            const applicants = j._count?.applications ?? 0;
            return (
              <DashboardListRow
                key={j.id}
                icon={<CalendarDays className="h-5 w-5" />}
                title={`${j.title} · ${catLabel}`}
                subtitle={`${j.suburb}, ${j.state} · ${urgencyLabel(j.urgency)} · ${new Date(j.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`}
                badge={<span className="text-xs font-semibold text-slate-500">{applicants} applicant{applicants === 1 ? "" : "s"}</span>}
                href={`/jobs/${j.id}`}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
