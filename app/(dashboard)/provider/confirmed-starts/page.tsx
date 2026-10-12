"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { URGENCY_BADGE } from "@/components/provider/RequestCard";

interface StartRow {
  id: string;
  title: string;
  categoryLabel: string;
  urgency: string;
  suburb: string;
  scheduledStartAt: string;
  posterKind: string;
  status: string;
  workerName?: string | null;
  applicationStatus?: string;
}

interface Data { awaitingAcceptance: StartRow[]; awaitingIntake: StartRow[]; startConfirmed: StartRow[] }

function Section({ title, hint, rows, action }: { title: string; hint: string; rows: StartRow[]; action: (r: StartRow) => React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <span className="text-sm font-semibold text-slate-500">{rows.length}</span>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">{hint}</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-slate-100 p-0">
            {rows.map((r) => {
              const u = URGENCY_BADGE[r.urgency] ?? URGENCY_BADGE.ROUTINE;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-slate-900">{r.title}</p>
                    <p className="m-0 mt-0.5 text-xs text-slate-500">
                      {r.suburb} · {r.categoryLabel} · {r.posterKind} · {new Date(r.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      {r.workerName ? ` · Worker: ${r.workerName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.label}</span>
                    {action(r)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProviderConfirmedStartsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Data>("/provider-workspace/confirmed-starts")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load service starts"));
  }, []);

  const view = (label: string) => (r: StartRow) => <Link href={`/jobs/${r.id}`}><Button size="sm" variant="outline">{label}</Button></Link>;

  return (
    <>
      <PageHeader
        title="Confirmed Service Starts"
        description="Keep referral acceptance, onboarding and delivered support separate."
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!data && !error && <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}
        {data && (
          <>
            <Section title="Awaiting acceptance" hint="No proposals are waiting for a reply. Proposals you send on Matched Requests appear here until the poster decides." rows={data.awaitingAcceptance} action={view("View request")} />
            <Section title="Awaiting intake" hint="No accepted referrals yet. An accepted Provider proposal appears here for intake and worker allocation." rows={data.awaitingIntake} action={view("Allocate worker")} />
            <Section title="Start confirmed" hint="Confirmed starts will appear here once a worker is allocated and confirms." rows={data.startConfirmed} action={view("View")} />
          </>
        )}
      </div>
    </>
  );
}
