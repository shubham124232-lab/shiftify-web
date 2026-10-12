"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatinumTilePanel } from "@/components/provider/PlatinumTilePanel";
import { URGENCY_BADGE } from "@/components/provider/RequestCard";

interface Promotions {
  featuredShifts: { id: string; tier: string; priceAud: number; purchasedAt: string; expiresAt: string; job: { id: string; title: string } }[];
  directConnect: { id: string; status: string; amountAud: number | null; createdAt: string; invitedUser: { name: string }; job: { id: string; title: string } }[];
  platinumCampaigns: { id: string; coverage: string; centreSuburb: string | null; durationMonths: number; priceAud: number; startsAt: string; endsAt: string }[];
  featuredHousing: { id: string; title: string; featuredQueuePosition: number | null; featuredExpiresAt: string | null; status: string }[];
  eligibleShifts: { id: string; title: string; urgency: string; suburb: string; scheduledStartAt: string; featuredUntil: string | null }[];
}

// Pricing V2 §8 — must match Backend FEATURED_SHIFT_CONFIG.
const FEATURED_PRICE: { urgency: string; label: string; window: string; price: number }[] = [
  { urgency: "RAPID", label: "Rapid", window: "up to 60 min", price: 19.99 },
  { urgency: "URGENT", label: "Urgent", window: "up to 24 hr", price: 14.99 },
  { urgency: "LAST_MINUTE", label: "Last-Minute", window: "48 hr", price: 9.99 },
  { urgency: "ROUTINE", label: "Routine", window: "7 days", price: 21.99 },
];
const priceFor = (urgency: string) => FEATURED_PRICE.find((p) => p.urgency === urgency);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const INVITE_LABEL: Record<string, string> = { PENDING: "Awaiting reply", ACCEPTED: "Accepted — charged", DECLINED: "Declined — no charge", WITHDRAWN: "Withdrawn", EXPIRED: "Expired — no charge" };

export default function ProviderPromotionsPage() {
  const [data, setData] = useState<Promotions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    return api.get<Promotions>("/provider-workspace/promotions")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load promotions"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const chosen = data?.eligibleShifts.find((s) => s.id === shiftId);
  const chosenPrice = chosen ? priceFor(chosen.urgency) : undefined;
  const alreadyFeatured = !!chosen?.featuredUntil && new Date(chosen.featuredUntil) > new Date();

  async function featureShift() {
    if (!chosen || !chosenPrice) return;
    const ok = window.confirm(
      `Feature "${chosen.title}" (${chosenPrice.label}, ${chosenPrice.window})?\nPrice: $${chosenPrice.price.toFixed(2)}.\n` +
      `Genuine urgency stays unchanged — a Featured Shift only pins within its own urgency tier. Platform products do not guarantee applicants or outcomes.`,
    );
    if (!ok) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await api.post(`/jobs/${chosen.id}/featured-shift`, {});
      setNotice("Featured Shift purchased.");
      setShiftId("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not purchase the Featured Shift"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Promotions" description="Optional visibility and connections. Core matching stays included." />
      <div className="container-page space-y-6 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Featured Shift</CardTitle></CardHeader>
            <CardContent className="space-y-3 py-3">
              <p className="m-0 text-sm text-slate-600">Promote one active staffing request. Genuine urgency stays unchanged.</p>
              <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 text-sm">
                {FEATURED_PRICE.map((p) => (
                  <li key={p.urgency} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-slate-600">{p.label} <span className="text-xs text-slate-400">· {p.window}</span></span>
                    <span className="font-semibold text-slate-900">${p.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} disabled={!data || data.eligibleShifts.length === 0}
                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm">
                <option value="">{data && data.eligibleShifts.length === 0 ? "No active shifts to promote" : "Choose active shift"}</option>
                {data?.eligibleShifts.map((s) => <option key={s.id} value={s.id}>{s.title} · {s.suburb} · {URGENCY_BADGE[s.urgency]?.label}</option>)}
              </select>
              <Button size="sm" disabled={!chosen || !chosenPrice || alreadyFeatured || busy} onClick={featureShift}>
                {alreadyFeatured ? "Already featured" : busy ? "Purchasing…" : chosenPrice ? `Feature shift — $${chosenPrice.price.toFixed(2)}` : "Choose active shift"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Direct Connect</CardTitle></CardHeader>
            <CardContent className="space-y-3 py-3">
              <p className="m-0 text-2xl font-semibold text-slate-900">$9.99</p>
              <p className="m-0 text-sm text-slate-600">Charged only when an eligible external worker accepts and the private connection opens. No charge for decline or expiry.</p>
              <p className="m-0 text-xs text-slate-500">One-worker shift: up to three invitations, first accepted connection only.</p>
              <Link href="/workers/available"><Button size="sm" variant="outline">Find a worker</Button></Link>
            </CardContent>
          </Card>
        </div>

        <PlatinumTilePanel onPurchased={load} />

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

        <Card>
          <CardHeader><CardTitle>Campaigns and connections</CardTitle></CardHeader>
          <CardContent className="py-2">
            {!data ? (
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ) : data.featuredShifts.length + data.directConnect.length + data.platinumCampaigns.length === 0 ? (
              <p className="py-3 text-sm text-slate-500">Nothing purchased yet. Promotions you buy appear here with their dates.</p>
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
    </>
  );
}
