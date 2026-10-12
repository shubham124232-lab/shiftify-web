"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { URGENCY_BADGE } from "@/components/provider/RequestCard";

interface Offer {
  id: string;
  kind: "INVITE" | "SELECTED";
  to: string;
  sentAt: string | null;
  amountAud: number | null;
  job: { id: string; title: string; suburb: string; scheduledStartAt: string; urgency: string };
}
interface Assignment {
  id: string; title: string; suburb: string; scheduledStartAt: string; scheduledEndAt: string;
  urgency: string; status: string; workerName: string;
}

const STATUS_LABEL: Record<string, string> = { ASSIGNED: "Assigned", CONFIRMED: "Confirmed", IN_PROGRESS: "In progress" };
const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function ProviderOffersAssignmentsPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ offers: Offer[]; assignments: Assignment[] }>("/provider-workspace/offers-assignments")
      .then((r) => { setOffers(r.offers); setAssignments(r.assignments); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load offers and assignments"));
  }, []);

  return (
    <>
      <PageHeader
        title="Offers and Assignments"
        description="An availability response or application is not a confirmed assignment."
        actions={<Link href="/jobs/my"><Button>Send offer</Button></Link>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!offers && !error && <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}
        {offers && (
          <>
            <Card>
              <CardHeader><div className="flex items-center justify-between"><CardTitle>Pending offers</CardTitle><span className="text-sm font-semibold text-slate-500">{offers.length}</span></div></CardHeader>
              <CardContent className="py-2">
                {offers.length === 0 ? (
                  <div className="py-4 text-sm text-slate-500">
                    <p className="m-0 font-semibold text-slate-700">No offers pending</p>
                    <p className="m-0 mt-1">Send an offer from a staffing request or an application.</p>
                  </div>
                ) : (
                  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                    {offers.map((o) => {
                      const u = URGENCY_BADGE[o.job.urgency] ?? URGENCY_BADGE.ROUTINE;
                      return (
                        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="m-0 text-sm font-semibold text-slate-900">{o.job.title}</p>
                            <p className="m-0 mt-0.5 text-xs text-slate-500">
                              {o.kind === "INVITE" ? "Invitation to" : "Offered to"} {o.to} · {o.job.suburb} · {fmt(o.job.scheduledStartAt)}
                              {o.amountAud != null ? ` · Direct Connect $${o.amountAud.toFixed(2)} if accepted` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.label}</span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Awaiting reply</span>
                            <Link href={`/jobs/${o.job.id}`}><Button size="sm" variant="outline">View request</Button></Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="flex items-center justify-between"><CardTitle>Confirmed assignments</CardTitle><span className="text-sm font-semibold text-slate-500">{assignments.length}</span></div></CardHeader>
              <CardContent className="py-2">
                {assignments.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No confirmed assignments yet. Confirmed shifts show who is working on each one.</p>
                ) : (
                  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                    {assignments.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold text-slate-900">{a.title}</p>
                          <p className="m-0 mt-0.5 text-xs text-slate-500">{a.workerName} · {a.suburb} · {fmt(a.scheduledStartAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{STATUS_LABEL[a.status] ?? a.status}</span>
                          <Link href={`/jobs/${a.id}`}><Button size="sm" variant="outline">View assignment</Button></Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
