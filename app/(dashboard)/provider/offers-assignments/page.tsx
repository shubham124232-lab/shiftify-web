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
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Assignments</div>
        <div className="pd-page-head">
          <div>
            <h1>Offers and assignments</h1>
            <p>An availability response or application is not a confirmed assignment.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => setSending(true)}><Plus />Send offer</button>
          </div>
        </div>
        {dashFilter === "upcoming" && <DashboardFilterBanner text="upcoming confirmed assignments" onClear={clearDashFilter} />}
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!offers && !error && <div className="pd-quiet-empty">Loading…</div>}
        {offers && (
          <>
            <section className="pd-panel">
              <div className="pd-panel-head"><h2>Pending offers</h2></div>
              {pendingCount === 0 ? (
                <div className="pd-empty">
                  <LayoutGrid />
                  <h3>No offers pending</h3>
                  <p>Send an offer from a staffing request or an application.</p>
                </div>
              ) : (
                <div style={{ paddingTop: 16 }}>
                  {shownInternal.map((o) => (
                    <div key={o.id} className="pd-request-row">
                      <div>
                        <strong>{o.memberName}</strong>
                        <div className="pd-small pd-muted">{o.job.title} · {fmtDay(o.job.scheduledStartAt)}</div>
                      </div>
                      <div className="pd-buttons">
                        <span className={`pd-badge ${OFFER_STATUS[o.status].cls}`}>{OFFER_STATUS[o.status].label}</span>
                        <button type="button" className="pd-btn pd-btn-sm" onClick={() => setViewing(o.id)}>View offer</button>
                      </div>
                    </div>
                  ))}
                  {shownOffers.map((o) => {
                    const u = URGENCY_BADGE[o.job.urgency] ?? URGENCY_BADGE.ROUTINE;
                    return (
                      <div key={o.id} className="pd-request-row">
                        <div>
                          <strong>{o.job.title}</strong>
                          <div className="pd-small pd-muted">
                            {o.kind === "INVITE" ? "Invitation to" : "Offered to"} {o.to} · {o.job.suburb} · {fmt(o.job.scheduledStartAt)}
                            {o.amountAud != null ? ` · Direct Connect $${o.amountAud.toFixed(2)} if accepted` : ""}
                          </div>
                        </div>
                        <div className="pd-buttons">
                          <span className={`pd-badge ${u.cls}`}>{u.label}</span>
                          <span className="pd-badge pd-badge-orange">Awaiting reply</span>
                          <button type="button" className="pd-btn pd-btn-sm" onClick={() => setAssignment(o.job.id)}>View request</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="pd-panel">
              <div className="pd-panel-head"><h2>Confirmed assignments</h2></div>
              {shownAssignments.length === 0 ? (
                <div className="pd-quiet-empty">No confirmed assignments yet. Confirmed shifts show who is working on each one.</div>
              ) : (
                <div style={{ paddingTop: 16 }}>
                  {shownAssignments.map((a) => (
                    <div key={a.id} className="pd-request-row">
                      <div>
                        <strong>{a.title}</strong>
                        <div className="pd-small pd-muted">{a.workerName} · {a.suburb} · {fmtDay(a.scheduledStartAt)}</div>
                      </div>
                      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setAssignment(a.id)}>View assignment</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {assignment && <RequestDetailDialog jobId={assignment} own onClose={() => setAssignment(null)} />}
      {sending && <SendInternalOfferFlow onClose={() => setSending(false)} onSent={(id) => { setSending(false); load().then(() => setViewing(id)); }} />}
      {viewingOffer && <InternalOfferDetailDialog offer={viewingOffer} onClose={() => setViewing(null)} onChanged={() => { setViewing(null); load(); }} />}
    </div>
  );
}
