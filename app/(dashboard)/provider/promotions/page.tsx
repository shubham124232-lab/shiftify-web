"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Link2 } from "lucide-react";
import { FeaturedShiftFlow, PlatinumSponsorshipFlow, FEATURED_PRICE, PLATINUM_PRICE } from "@/components/provider/PromotionFlows";

interface Promotions {
  featuredShifts: { id: string; tier: string; priceAud: number; purchasedAt: string; expiresAt: string; job: { id: string; title: string } }[];
  directConnect: { id: string; status: string; amountAud: number | null; createdAt: string; invitedUser: { name: string }; job: { id: string; title: string } }[];
  platinumCampaigns: { id: string; coverage: string; centreSuburb: string | null; durationMonths: number; priceAud: number; startsAt: string; endsAt: string }[];
  featuredHousing: { id: string; title: string; featuredQueuePosition: number | null; featuredExpiresAt: string | null; status: string }[];
  eligibleShifts: { id: string; title: string; urgency: string; suburb: string; scheduledStartAt: string; featuredUntil: string | null }[];
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const INVITE_LABEL: Record<string, string> = { PENDING: "Awaiting reply", ACCEPTED: "Accepted — charged", DECLINED: "Declined — no charge", WITHDRAWN: "Withdrawn", EXPIRED: "Expired — no charge" };

export default function ProviderPromotionsPage() {
  const [data, setData] = useState<Promotions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [flow, setFlow] = useState<"featured" | "platinum" | null>(null);
  const [org, setOrg] = useState("");

  const load = useCallback(() => {
    return api.get<Promotions>("/provider-workspace/promotions")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load promotions"));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { api.get<{ organisation: string | null }>("/provider-org/identity").then((r) => setOrg(r.organisation ?? "")).catch(() => {}); }, []);
  const finish = (msg: string) => { setFlow(null); setNotice(msg); setError(null); void load(); };

  return (
    <>
      <PageHeader crumb="Provider / Promotions" title="Provider promotions" description="Optional visibility and connections. Core matching stays included." />
      <div className="container-page space-y-6 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="flex h-full flex-col space-y-4 py-6">
              <Star className="h-5 w-5 text-slate-700" />
              <h2 className="m-0 text-xl font-bold text-slate-900">Featured Shift</h2>
              <p className="m-0 text-sm text-slate-600">Promote one active staffing request. Genuine urgency stays unchanged.</p>
              <ul className="m-0 list-none p-0 text-sm">
                {FEATURED_PRICE.map((p) => (
                  <li key={p.urgency} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                    <span className="text-slate-600">{p.label} · {p.window}</span>
                    <span className="font-semibold text-slate-900">${p.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => setFlow("featured")}>Choose active shift</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col space-y-4 py-6">
              <Link2 className="h-5 w-5 text-slate-700" />
              <h2 className="m-0 text-xl font-bold text-slate-900">Direct Connect</h2>
              <p className="m-0 text-4xl font-bold text-slate-900">$9.99</p>
              <p className="m-0 text-sm text-slate-600">Charged only when an eligible external worker accepts and the private connection opens. No charge for decline or expiry.</p>
              <p className="m-0 text-sm text-slate-600">One-worker shift: up to three invitations, first accepted connection only.</p>
              <Link href="/workers/available" className="mt-auto"><Button className="w-full">Find a worker</Button></Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-white to-slate-100">
            <CardContent className="flex h-full flex-col space-y-4 py-6">
              <Star className="h-5 w-5 text-slate-700" />
              <h2 className="m-0 text-xl font-bold text-slate-900">Platinum Tile Sponsorship</h2>
              <p className="m-0 text-sm text-slate-600">Promote your Provider organisation in a relevant market. Three sponsored positions per market inventory.</p>
              <ul className="m-0 list-none p-0 text-sm">
                {([["Metro · 30 km radius", PLATINUM_PRICE.METRO[1]], ["State", PLATINUM_PRICE.STATE[1]], ["National", PLATINUM_PRICE.NATIONAL[1]]] as const).map(([l, v]) => (
                  <li key={l} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                    <span className="text-slate-600">{l}</span><span className="font-semibold text-slate-900">${v.toLocaleString("en-AU", { minimumFractionDigits: 2 })}/mo</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-auto w-full" onClick={() => setFlow("platinum")}>Set up sponsorship</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Housing promotions</CardTitle>
              <Link href="/provider/housing" className="text-sm font-semibold text-brand-600 hover:underline">Manage vacancies</Link>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            {!data || data.featuredHousing.length === 0 ? (
              <p className="py-3 text-sm text-slate-500">No Featured vacancies. Feature a SIL/SDA vacancy from Housing Vacancies for a 30-day first-purchased-first-displayed position.</p>
            ) : (
              <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                {data.featuredHousing.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="font-semibold text-slate-900">{h.title}</span>
                    <span className="text-xs text-slate-500">Position {h.featuredQueuePosition ?? "—"}{h.featuredExpiresAt ? ` · until ${fmtDate(h.featuredExpiresAt)}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <h2 className="m-0 text-xl font-bold text-slate-900">Campaigns and Featured Shifts</h2>
        <Card>
          <CardHeader><CardTitle>Current activity</CardTitle></CardHeader>
          <CardContent className="py-2">
            {!data ? (
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ) : data.featuredShifts.length + data.directConnect.length + data.platinumCampaigns.length === 0 ? (
              <p className="py-8 text-center text-base font-semibold text-slate-900">No promotions purchased yet</p>
            ) : (
              <ul className="m-0 list-none divide-y divide-slate-100 p-0 text-sm">
                {data.platinumCampaigns.map((c) => (
                  <li key={`p-${c.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span><strong className="text-slate-900">Platinum Tile</strong> · {c.coverage}{c.centreSuburb ? ` (${c.centreSuburb})` : ""}</span>
                    <span className="text-xs text-slate-500">{fmtDate(c.startsAt)} – {fmtDate(c.endsAt)} · ${c.priceAud.toFixed(2)}</span>
                  </li>
                ))}
                {data.featuredShifts.map((f) => (
                  <li key={`f-${f.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span><strong className="text-slate-900">Featured Shift</strong> · {f.job.title}</span>
                    <span className="text-xs text-slate-500">{fmtDate(f.purchasedAt)} – {fmtDate(f.expiresAt)} · ${f.priceAud.toFixed(2)}</span>
                  </li>
                ))}
                {data.directConnect.map((d) => (
                  <li key={`d-${d.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span><strong className="text-slate-900">Direct Connect</strong> · {d.invitedUser.name} · {d.job.title}</span>
                    <span className="text-xs text-slate-500">{fmtDate(d.createdAt)} · {INVITE_LABEL[d.status] ?? d.status}{d.amountAud != null ? ` · $${d.amountAud.toFixed(2)}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      {flow === "featured" && <FeaturedShiftFlow shifts={data?.eligibleShifts ?? []} onClose={() => setFlow(null)} onDone={finish} />}
      {flow === "platinum" && <PlatinumSponsorshipFlow businessName={org} onClose={() => setFlow(null)} onDone={finish} />}
    </>
  );
}
