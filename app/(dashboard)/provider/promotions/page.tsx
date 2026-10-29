"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Star, LayoutGrid } from "lucide-react";
import { FeaturedShiftFlow, PlatinumSponsorshipFlow, FEATURED_PRICE, PLATINUM_PRICE } from "@/components/provider/PromotionFlows";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { ShiftBlastCard } from "@/components/provider/ShiftBlastCard";

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
      <div className="pd-workspace">
        <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Promotions</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Provider promotions</h1>
            <p>Optional paid visibility. Direct Connect is included in paid subscriptions.</p>
          </div>
          <div className="pd-buttons" />
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {notice && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

        <div className="pd-grid2">
          <article className="pd-record-card">
            <Star className="pd-icon-plain" />
            <h2>Featured Shift</h2>
            <p className="pd-card-body" style={{ margin: 0 }}>Paid visibility for live Short Notice and Routine requests only. Last Min and Urgent receive ordinary matching without a Featured upsell.</p>
            <div>
              {FEATURED_PRICE.filter((p) => p.urgency === "LAST_MINUTE" || p.urgency === "ROUTINE").map((p) => (
                <div key={p.urgency} className="pd-review-row"><span>{p.label} · {p.window}</span><strong>${p.price.toFixed(2)}</strong></div>
              ))}
            </div>
            <div className="pd-buttons"><button type="button" className="pd-btn pd-btn-primary" onClick={() => setFlow("featured")}>Choose active shift</button></div>
          </article>

          <article className="pd-record-card" style={{ background: "linear-gradient(130deg,#fff,#e9ebee)" }}>
            <Star className="pd-icon-plain" />
            <h2>Platinum Tile Sponsorship</h2>
            <p className="pd-card-body" style={{ margin: 0 }}>Promote your Provider organisation in a relevant market. Three sponsored positions per market inventory.</p>
            <div>
              {([["Metro · 30 km radius", PLATINUM_PRICE.METRO[1]], ["State", PLATINUM_PRICE.STATE[1]], ["National", PLATINUM_PRICE.NATIONAL[1]]] as const).map(([l, v]) => (
                <div key={l} className="pd-review-row"><span>{l}</span><strong>${v.toLocaleString("en-AU", { minimumFractionDigits: 2 })}/mo</strong></div>
              ))}
            </div>
            <div className="pd-buttons"><button type="button" className="pd-btn pd-btn-primary" onClick={() => setFlow("platinum")}>Set up sponsorship</button></div>
          </article>
        </div>

        <h2 style={{ margin: "24px 0 13px", fontSize: 20, fontWeight: 800 }}>Campaigns and Featured Shifts</h2>
        <section className="pd-panel">
          <div className="pd-panel-head"><h2>Current activity</h2></div>
          {!data ? (
            <div className="pd-quiet-empty">Loading…</div>
          ) : data.featuredShifts.length + data.directConnect.length + data.platinumCampaigns.length === 0 ? (
            <div className="pd-empty">
              <LayoutGrid />
              <h3>No promotions purchased in this session</h3>
            </div>
          ) : (
            <div>
              {data.platinumCampaigns.map((c) => (
                <div key={`p-${c.id}`} className="pd-task-row">
                  <div><strong>Platinum Tile</strong><p>{c.coverage}{c.centreSuburb ? ` (${c.centreSuburb})` : ""}</p></div>
                  <span className="pd-small pd-muted">{fmtDate(c.startsAt)} – {fmtDate(c.endsAt)} · ${c.priceAud.toFixed(2)}</span>
                </div>
              ))}
              {data.featuredShifts.map((f) => (
                <div key={`f-${f.id}`} className="pd-task-row">
                  <div><strong>Featured Shift</strong><p>{f.job.title}</p></div>
                  <span className="pd-small pd-muted">{fmtDate(f.purchasedAt)} – {fmtDate(f.expiresAt)} · ${f.priceAud.toFixed(2)}</span>
                </div>
              ))}
              {data.directConnect.map((d) => (
                <div key={`d-${d.id}`} className="pd-task-row">
                  <div><strong>Direct Connect</strong><p>{d.invitedUser.name} · {d.job.title}</p></div>
                  <span className="pd-small pd-muted">{fmtDate(d.createdAt)} · {INVITE_LABEL[d.status] ?? d.status}{d.amountAud != null ? ` · $${d.amountAud.toFixed(2)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <ShiftBlastCard />
        </div>
      </div>
      {flow === "featured" && <FeaturedShiftFlow shifts={data?.eligibleShifts ?? []} onClose={() => setFlow(null)} onDone={finish} />}
      {flow === "platinum" && <PlatinumSponsorshipFlow businessName={org} onClose={() => setFlow(null)} onDone={finish} />}
    </>
  );
}
