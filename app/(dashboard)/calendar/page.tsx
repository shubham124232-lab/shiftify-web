"use client";

// Support Coordinator "Calendar" — weekly view of confirmed support (Sydney time).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, OutlineButton, ErrorNote, BORDER, useCoordinatorParticipants, shortName,
} from "@/components/coordinator/workspace-ui";

interface Job {
  id: string; title: string; scheduledStartAt: string; status: string;
  participantName?: string | null; deliveredByName?: string | null; forParticipantUserId?: string | null;
}

const CONFIRMED = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CONFIRMED"];
const TZ = "Australia/Sydney";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });

export default function CalendarPage() {
  const participants = useCoordinatorParticipants();
  const [participant, setParticipant] = useState("ALL");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    api.get<{ jobs: Job[] }>("/jobs/my").then((r) => setJobs(r.jobs ?? [])).catch((e) => setError(e.message));
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const byDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    jobs
      .filter((j) => CONFIRMED.includes(j.status) && (participant === "ALL" || j.forParticipantUserId === participant))
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .forEach((j) => {
        const k = dayKey(new Date(j.scheduledStartAt));
        map.set(k, [...(map.get(k) ?? []), j]);
      });
    return map;
  }, [jobs, participant]);

  const shift = (weeks: number) => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + weeks * 7); return d; });
  const range = `${days[0].toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
  const today = dayKey(new Date());

  return (
    <WorkspacePage
      title="Calendar"
      description="Weekly view of confirmed support. Dates shown in Sydney time."
      participantView={{ value: participant, onChange: setParticipant, participants }}
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <Panel
        title="Weekly view"
        action={
          <div className="flex items-center gap-2">
            <OutlineButton onClick={() => shift(-1)}>←</OutlineButton>
            <OutlineButton onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</OutlineButton>
            <span className="px-2 text-sm font-semibold text-slate-700">{range}</span>
            <OutlineButton onClick={() => shift(1)}>→</OutlineButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((d) => {
            const k = dayKey(d);
            const items = byDay.get(k) ?? [];
            return (
              <div key={k} className={`min-h-[150px] rounded-lg border p-3 ${k === today ? "border-brand-600 bg-brand-50" : `${BORDER} bg-white`}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500">{d.toLocaleDateString("en-AU", { weekday: "short" })}</span>
                  <span className="text-lg font-extrabold text-slate-900">{d.getDate()}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {!items.length ? <p className="text-[11px] text-slate-400">No confirmed support</p> : items.map((j) => (
                    <Link key={j.id} href={`/jobs/${j.id}`} className={`block rounded-md border ${BORDER} bg-white p-2 hover:bg-slate-50`}>
                      <span className="block text-[11px] font-semibold text-brand-600">
                        {new Date(j.scheduledStartAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: TZ })}
                      </span>
                      <span className="block text-xs font-bold text-slate-900">{j.title}</span>
                      <span className="block text-[11px] text-slate-500">{[j.participantName && shortName(j.participantName), j.deliveredByName].filter(Boolean).join(" · ")}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </WorkspacePage>
  );
}
