"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InternalOfferDetailDialog, OFFER_STATUS, type InternalOffer } from "@/components/provider/InternalOfferDialogs";

interface Member { key: string; name: string; kind: "MANAGED" | "ROSTER" }
interface Reply { id: string; memberName: string; status: "PENDING" | "AVAILABLE" | "UNAVAILABLE" }
interface Req { id: string; title: string; startsAt: string | null; replies: Reply[] }
interface Assignment { id: string; title: string; suburb: string; scheduledStartAt: string; workerName: string }

const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// Provider "Internal worker portal" (approved demo): preview what one internal worker sees and answer on their behalf.
export default function ProviderWorkerPortalPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [offers, setOffers] = useState<InternalOffer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [who, setWho] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => Promise.all([
    api.get<{ members: Member[]; requests: Req[] }>("/provider-workspace/team-availability"),
    api.get<{ internalOffers?: InternalOffer[]; assignments: Assignment[] }>("/provider-workspace/offers-assignments"),
  ]).then(([t, o]) => {
    setMembers(t.members ?? []); setRequests(t.requests ?? []); setOffers(o.internalOffers ?? []); setAssignments(o.assignments ?? []);
    setWho((cur) => cur || (t.members?.[0]?.name ?? ""));
  }).catch((e) => { setError(e instanceof Error ? e.message : "Could not load the portal"); setMembers([]); }), []);
  useEffect(() => { load(); }, [load]);

  async function answer(replyId: string, status: "AVAILABLE" | "UNAVAILABLE") {
    setError(null);
    try { await api.patch(`/provider-workspace/team-availability/replies/${replyId}`, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not record the answer"); }
  }

  const mine = requests.map((r) => ({ r, reply: r.replies.find((x) => x.memberName === who) })).filter((x) => x.reply);
  const myOffers = offers.filter((o) => o.memberName === who);
  const myAssignments = assignments.filter((a) => a.workerName === who);
  const viewingOffer = myOffers.find((o) => o.id === viewing) ?? null;

  return (
    <>
      <PageHeader title="Internal worker portal" description="Personal access preview · funded by the Provider organisation." />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {members === null ? <div className="h-32 animate-pulse rounded-2xl bg-slate-100" /> : members.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">No internal team members yet. Add one from Internal Team to preview their portal.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-3 py-5">
                <label className="text-sm font-semibold text-slate-900">Preview as
                  <select value={who} onChange={(e) => setWho(e.target.value)} className="ml-3 h-11 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal">
                    {members.map((m) => <option key={m.key} value={m.name}>{m.name}</option>)}
                  </select>
                </label>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Own records only</span>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{initials(who)}</span>
              <div>
                <p className="m-0 text-xl font-bold text-slate-900">Hello, {who.split(" ")[0]}</p>
                <p className="m-0 text-sm text-slate-500">Your offers, assignments and assignment messages.</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>My availability requests</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {mine.length === 0 ? <p className="m-0 py-4 text-sm text-slate-500">No availability requests.</p> : mine.map(({ r, reply }) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="m-0 text-base font-bold text-slate-900">{r.title}</p>
                      <p className="m-0 mt-1 text-sm text-slate-500">{r.startsAt ? fmt(r.startsAt) : "Time to be confirmed"}</p>
                      <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{reply!.status === "PENDING" ? "Pending" : reply!.status === "AVAILABLE" ? "Available" : "Unavailable"}</span>
                      {reply!.status === "PENDING" && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => answer(reply!.id, "AVAILABLE")}>Available</Button>
                          <Button size="sm" variant="outline" onClick={() => answer(reply!.id, "UNAVAILABLE")}>Unavailable</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>My assignments and calendar</CardTitle></CardHeader>
                <CardContent>
                  {myAssignments.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <LayoutGrid className="h-9 w-9 text-slate-300" />
                      <p className="m-0 mt-3 text-lg font-bold text-slate-900">No assignments</p>
                      <p className="m-0 mt-1 text-base text-slate-500">Confirmed assignments will appear on your personal calendar.</p>
                    </div>
                  ) : <ul className="m-0 list-none divide-y divide-slate-100 p-0">{myAssignments.map((a) => (
                    <li key={a.id} className="py-3"><p className="m-0 text-sm font-semibold text-slate-900">{a.title}</p><p className="m-0 text-xs text-slate-500">{a.suburb} · {fmt(a.scheduledStartAt)}</p></li>
                  ))}</ul>}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>My offers</CardTitle></CardHeader>
                <CardContent className="py-2">
                  {myOffers.length === 0 ? <p className="m-0 py-4 text-sm text-slate-500">No offers.</p> : (
                    <ul className="m-0 list-none divide-y divide-slate-100 p-0">{myOffers.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                        <div><p className="m-0 text-sm font-semibold text-slate-900">{o.job.title}</p><p className="m-0 text-xs text-slate-500">{fmt(o.job.scheduledStartAt)}</p></div>
                        <span className="flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${OFFER_STATUS[o.status].cls}`}>{OFFER_STATUS[o.status].label}</span>
                          <Button size="sm" variant="outline" onClick={() => setViewing(o.id)}>View offer</Button>
                        </span>
                      </li>
                    ))}</ul>
                  )}
                </CardContent>
              </Card>
              <p className="m-0 flex gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                This portal does not grant Provider-wide board access or independent worker applications.
              </p>
            </div>
          </>
        )}
      </div>
      {viewingOffer && <InternalOfferDetailDialog offer={viewingOffer} onClose={() => setViewing(null)} onChanged={() => { setViewing(null); load(); }} />}
    </>
  );
}
