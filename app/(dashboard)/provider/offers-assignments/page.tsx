"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { URGENCY_BADGE } from "@/components/provider/RequestCard";
import { DashboardFilterBanner, useDashboardFilter } from "@/components/provider/DashboardFilterBanner";
import { RequestDetailDialog } from "@/components/provider/RequestDialogs";
import { SendInternalOfferFlow, InternalOfferDetailDialog, OFFER_STATUS, type InternalOffer } from "@/components/provider/InternalOfferDialogs";

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

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function ProviderOffersAssignmentsPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalOffers, setInternalOffers] = useState<InternalOffer[]>([]);
  const [sending, setSending] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<string | null>(null);
  const [dashFilter, clearDashFilter] = useDashboardFilter(); // "upcoming" from the dashboard tile

  const load = () => api.get<{ offers: Offer[]; assignments: Assignment[]; internalOffers?: InternalOffer[] }>("/provider-workspace/offers-assignments")
    .then((r) => { setOffers(r.offers); setAssignments(r.assignments); setInternalOffers(r.internalOffers ?? []); })
    .catch((e) => setError(e instanceof Error ? e.message : "Failed to load offers and assignments"));
  useEffect(() => { load(); }, []);

  const shownOffers = dashFilter === "upcoming" ? [] : (offers ?? []);
  const shownInternal = dashFilter === "upcoming" ? [] : internalOffers;
  const viewingOffer = internalOffers.find((o) => o.id === viewing) ?? null;
  const pendingCount = shownOffers.length + shownInternal.length;
  const shownAssignments = dashFilter === "upcoming" ? assignments.filter((a) => new Date(a.scheduledStartAt).getTime() > Date.now()) : assignments;

  return (
    <>
      <PageHeader
        crumb="Provider / Offers & Assignments"
        title="Offers and Assignments"
        description="An availability response or application is not a confirmed assignment."
        actions={<Button onClick={() => setSending(true)}><Plus className="mr-1.5 h-4 w-4" /> Send offer</Button>}
      />
      <div className="container-page space-y-5 py-8">
        {dashFilter === "upcoming" && <DashboardFilterBanner text="upcoming confirmed assignments" onClear={clearDashFilter} />}
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!offers && !error && <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}
        {offers && (
          <>
            <Card>
              <CardHeader><div className="flex items-center justify-between"><CardTitle>Pending offers</CardTitle><span className="text-sm font-semibold text-slate-500">{pendingCount}</span></div></CardHeader>
              <CardContent className="py-2">
                {pendingCount === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <LayoutGrid className="h-9 w-9 text-slate-300" />
                    <p className="m-0 mt-3 text-lg font-bold text-slate-900">No offers pending</p>
                    <p className="m-0 mt-1 text-base text-slate-500">Send an offer from a staffing request or an application.</p>
                  </div>
                ) : (
                  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                    {shownInternal.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold text-slate-900">{o.memberName}</p>
                          <p className="m-0 mt-0.5 text-xs text-slate-500">{o.job.title} · {fmtDay(o.job.scheduledStartAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${OFFER_STATUS[o.status].cls}`}>{OFFER_STATUS[o.status].label}</span>
                          <Button size="sm" variant="outline" onClick={() => setViewing(o.id)}>View offer</Button>
                        </div>
                      </li>
                    ))}
                    {shownOffers.map((o) => {
                      const u = URGENCY_BADGE[o.job.urgency] ?? URGENCY_BADGE.ROUTINE;
                      return (
                        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="m-0 text-sm font-semibold text-slate-900">{o.job.title}</p>
                            <p className="m-0 mt-0.5 text-xs text-slate-500">
                              {o.kind === "INVITE" ? "Invitation to" : "Offered to"} {o.to} · {o.job.suburb} · {fmt(o.job.scheduledStartAt)}
                              {o.amountAud != null ? " · Direct Connect" : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.label}</span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Awaiting reply</span>
                            <Button size="sm" variant="outline" onClick={() => setAssignment(o.job.id)}>View request</Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="flex items-center justify-between"><CardTitle>Confirmed assignments</CardTitle><span className="text-sm font-semibold text-slate-500">{shownAssignments.length}</span></div></CardHeader>
              <CardContent className="py-2">
                {shownAssignments.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No confirmed assignments yet. Confirmed shifts show who is working on each one.</p>
                ) : (
                  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                    {shownAssignments.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold text-slate-900">{a.title}</p>
                          <p className="m-0 mt-0.5 text-xs text-slate-500">{a.workerName} · {a.suburb} · {fmtDay(a.scheduledStartAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setAssignment(a.id)}>View assignment</Button>
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
      {assignment && <RequestDetailDialog jobId={assignment} own onClose={() => setAssignment(null)} />}
      {sending && <SendInternalOfferFlow onClose={() => setSending(false)} onSent={(id) => { setSending(false); load().then(() => setViewing(id)); }} />}
      {viewingOffer && <InternalOfferDetailDialog offer={viewingOffer} onClose={() => setViewing(null)} onChanged={() => { setViewing(null); load(); }} />}
    </>
  );
}
