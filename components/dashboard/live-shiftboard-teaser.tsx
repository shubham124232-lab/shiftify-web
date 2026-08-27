"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";
import { MapPin, Users } from "lucide-react";

interface TeaserJob {
  id: string;
  title: string;
  category: string;
  suburb: string;
  state: string;
  urgency: string;
  scheduledStartAt: string;
  isOwnRequest?: boolean;
  _count?: { applications: number };
}

export function LiveShiftboardTeaser() {
  const [jobs, setJobs] = useState<TeaserJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ jobs: TeaserJob[] }>("/jobs/live-dashboard?limit=3&sortBy=newest")
      .then((r) => setJobs(r.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Public Shiftboard</CardTitle>
        <p className="text-sm text-slate-500">See privacy-safe support requests currently open across the Shiftify community.</p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !jobs.length ? (
          <p className="py-4 text-sm text-slate-500">No open shifts on the board right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {jobs.map((j) => {
              const urg = URGENCY_STYLE[j.urgency] ?? URGENCY_STYLE.SCHEDULED;
              const catLabel = JOB_CATEGORIES.find((c) => c.value === j.category)?.label ?? j.category;
              const applicants = j._count?.applications ?? 0;
              return (
                <div key={j.id} className="rounded-xl border border-slate-200 overflow-hidden flex flex-col" style={{ borderTop: `3px solid ${urg.color}` }}>
                  <div className="p-3.5 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase" style={{ background: urg.bg, color: urg.color }}>
                        {j.urgency.replace("_", " ")}
                      </span>
                      {j.isOwnRequest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-700">
                          Your Request
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">{j.title}</p>
                    <p className="text-xs text-slate-500 mb-2">{catLabel}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{j.suburb}, {j.state} · {new Date(j.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{applicants} application{applicants === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                  <div className="px-3.5 py-2.5 border-t border-slate-100">
                    <Link href={`/jobs/${j.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        {j.isOwnRequest ? "Manage Request" : "View Public Details"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Link href="/live-dashboard" className="block mt-3">
          <Button variant="primary" className="w-full">View Full Live Shiftboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
