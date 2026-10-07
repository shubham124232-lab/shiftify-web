"use client";

// Provider PR-LV01 "Live request control centre": matching status, time since posted, time to start,
// workers reached, responses received, and no-response guidance for the fast tiers.

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  urgency: string;
  createdAt: string;
  scheduledStartAt: string;
  paused: boolean;
  liveStats?: { eligibleWorkers: number; responses: number } | null;
}

function span(ms: number): string {
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 48) return `${h} h ${mins % 60} min`;
  return `${Math.floor(h / 24)} days`;
}

export function ProviderLiveRequestPanel({ urgency, createdAt, scheduledStartAt, paused, liveStats }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const toStart = new Date(scheduledStartAt).getTime() - now;
  const sincePosted = now - new Date(createdAt).getTime();
  const responses = liveStats?.responses ?? 0;
  const fast = urgency === "RAPID" || urgency === "URGENT";

  return (
    <Card>
      <CardHeader><CardTitle>Live request</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="m-0 font-semibold text-slate-800">
          {paused ? "Paused — not being shown to workers" : responses > 0 ? "Matching in progress — workers are responding" : "Matching in progress — waiting for the first response"}
        </p>
        <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><dt className="text-xs text-slate-500">Posted</dt><dd className="m-0 font-semibold">{span(sincePosted)} ago</dd></div>
          <div><dt className="text-xs text-slate-500">{toStart >= 0 ? "Starts in" : "Start time passed"}</dt><dd className="m-0 font-semibold">{toStart >= 0 ? span(toStart) : `${span(toStart)} ago`}</dd></div>
          <div><dt className="text-xs text-slate-500">Workers who can see it</dt><dd className="m-0 font-semibold">{liveStats ? liveStats.eligibleWorkers : "—"}</dd></div>
          <div><dt className="text-xs text-slate-500">Responses received</dt><dd className="m-0 font-semibold">{responses}</dd></div>
        </dl>
        {fast && responses === 0 && !paused && toStart > 0 && (
          <p className="m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No response yet. You can rebroadcast, invite a worker directly, or message your own internal workforce. Shiftify is not an emergency service — if anyone is at immediate risk, call 000.
          </p>
        )}
        <p className="m-0 text-xs text-slate-500">Editing essentials, pausing, extending or cancelling does not use another Provider Action. Duplicating this request as a new one does.</p>
      </CardContent>
    </Card>
  );
}
