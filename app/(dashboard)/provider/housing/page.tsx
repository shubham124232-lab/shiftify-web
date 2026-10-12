"use client";

import { useBranchWorkspace } from "@/lib/store/branchWorkspace";
import { VACANCY_LABEL } from "@/components/provider/housingOptions";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingEnquiries, type ListingInquiry } from "@/components/provider/ListingEnquiries";
import { api } from "@/lib/api";

interface HousingListing {
  branchId?: string | null;
  id: string;
  status: "ACTIVE" | "PAUSED" | "FILLED" | "CLOSED" | "DRAFT";
  title: string;
  description: string;
  suburb: string;
  state: string | null;
  vacancyCategory: string | null;
  propertyType: string | null;
  vacancyCount: number | null;
  supportModel: string | null;
  suitableFor: string[] | null;
  fundingRoutes: string[] | null;
  urgency: string | null;
  housingDetails: { accessibilityFeatures?: string[]; vacancyDate?: string; rosterArrangement?: string; compatibility?: string } | null;
  isFeatured: boolean;
  featuredQueuePosition: number | null;
  listingExpiresAt: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-slate-100 text-slate-500",
  FILLED: "bg-sky-100 text-sky-700",
  CLOSED: "bg-slate-100 text-slate-400",
  DRAFT: "bg-amber-100 text-amber-700",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Live", PAUSED: "Paused", FILLED: "Filled", CLOSED: "Closed", DRAFT: "Draft — not published" };
const URGENCY_LABEL: Record<string, string> = { AVAILABLE_NOW: "Available now", AVAILABLE_SOON: "Available soon", FUTURE: "Future vacancy", EXPRESSION_OF_INTEREST: "Expression of interest" };

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Live" },
  { key: "DRAFT", label: "Draft" },
  { key: "PAUSED", label: "Paused" },
  { key: "FILLED", label: "Filled" },
  { key: "CLOSED", label: "Closed" },
] as const;

const STANDARD_PRICE = 199;
const FEATURED_PRICE = 399;

const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function ProviderHousingPage() {
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [inquiries, setInquiries] = useState<ListingInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; panel: "view" | "enquiries" } | null>(null);

  function load() {
    return Promise.all([
      api.get<{ listings: HousingListing[] }>("/provider/listings?category=HOUSING"),
      api.get<{ inquiries: ListingInquiry[] }>("/direct-inquiries/received").catch(() => ({ inquiries: [] })),
    ])
      .then(([l, q]) => { setListings(l.listings); setInquiries(q.inquiries ?? []); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load vacancies"))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const workspaceBranch = useBranchWorkspace((s) => s.branchId);
  const visible = useMemo(() => {
    const inBranch = workspaceBranch ? listings.filter((l) => l.branchId === workspaceBranch) : listings;
    return filter === "ALL" ? inBranch : inBranch.filter((l) => l.status === filter);
  }, [listings, filter, workspaceBranch]);

  async function run(id: string, action: () => Promise<unknown>, done?: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await action();
      await load();
      if (done) setNotice(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  const changeStatus = (id: string, status: HousingListing["status"], done?: string) =>
    run(id, () => api.patch(`/provider/listings/${id}`, { status }), done);

  function markFilled(l: HousingListing) {
    if (!window.confirm(`Mark "${l.title}" as filled? It will no longer be shown to enquirers${l.isFeatured ? " and will leave the Featured queue" : ""}.`)) return;
    changeStatus(l.id, "FILLED", "Vacancy marked as filled.");
  }

  function renew(l: HousingListing) {
    const price = l.isFeatured ? FEATURED_PRICE : STANDARD_PRICE;
    const kind = l.isFeatured ? "Featured" : "Standard";
    const ok = window.confirm(
      `Renew "${l.title}" for another 30 days (${kind} package)?\nPrice: $${price.toFixed(2)}.` +
      `${l.isFeatured ? " Your Featured queue position is kept." : ""} The new term starts when the current one ends. ` +
      `Platform products do not guarantee applicants or outcomes.`,
    );
    if (!ok) return;
    run(l.id, () => api.post(`/provider/listings/${l.id}/renew`, {}), "Vacancy renewed for 30 days.");
  }

  function feature(l: HousingListing) {
    run(l.id, async () => {
      // Disclose the queue position before payment (Pricing V2 §7.3).
      const preview = await api.get<{ queuePosition: number; priceAud: number; durationDays: number }>(`/provider/listings/${l.id}/featured-preview`);
      const ok = window.confirm(
        `Your listing will appear as Featured position ${preview.queuePosition} in its area and category for ${preview.durationDays} days. ` +
        `Price: $${preview.priceAud.toFixed(2)}. A later Featured purchase cannot displace an earlier one, and it is non-refundable once it begins. Continue?`,
      );
      if (!ok) return;
      await api.post(`/provider/listings/${l.id}/featured`, {});
    });
  }

  function toggle(id: string, panel: "view" | "enquiries") {
    setOpen(open?.id === id && open.panel === panel ? null : { id, panel });
  }

  return (
    <>
      <PageHeader
        title="Housing Vacancies"
        description="Manage SIL, SDA, respite and supported-housing vacancies and their enquiries."
        actions={<Link href="/provider/sil-vacancy"><Button>List a vacancy</Button></Link>}
      />
      <div className="container-page space-y-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === f.key ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : visible.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">
            No housing vacancies yet. List a SIL, SDA or respite vacancy to start receiving enquiries.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((l) => {
              const enq = inquiries.filter((q) => q.listingId === l.id);
              const busy = busyId === l.id;
              const panel = open?.id === l.id ? open.panel : null;
              const live = l.status === "ACTIVE" || l.status === "PAUSED";
              const features = l.housingDetails?.accessibilityFeatures ?? [];
              const expired = !!l.listingExpiresAt && new Date(l.listingExpiresAt) < new Date();
              return (
                <Card key={l.id}>
                  <CardContent className="space-y-3 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">{(l.vacancyCategory && VACANCY_LABEL[l.vacancyCategory]) || "Housing"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[l.status] ?? ""}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                      {l.isFeatured
                        ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Featured · position {l.featuredQueuePosition}</span>
                        : l.status === "ACTIVE" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Standard</span>}
                      {expired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Expired</span>}
                    </div>
                    <div>
                      <p className="m-0 text-base font-semibold text-slate-900">{l.title}</p>
                      <p className="m-0 mt-0.5 text-sm text-slate-500">{l.suburb}{l.state ? `, ${l.state}` : ""}{l.propertyType ? ` · ${l.propertyType}` : ""}</p>
                    </div>
                    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-slate-400">Vacancies</dt><dd className="m-0 font-semibold text-slate-900">{l.vacancyCount ?? "—"}</dd>
                      <dt className="text-slate-400">Expiry</dt><dd className="m-0 text-slate-700">{fmtDate(l.listingExpiresAt)}</dd>
                      <dt className="text-slate-400">Enquiries</dt><dd className="m-0 text-slate-700">{enq.length}</dd>
                    </dl>
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {features.slice(0, 4).map((f) => <span key={f} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{f}</span>)}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => toggle(l.id, "view")}>View vacancy</Button>
                      {l.status !== "CLOSED" && l.status !== "FILLED" && <Link href={`/provider/sil-vacancy?edit=${l.id}`}><Button size="sm" variant="outline">Edit</Button></Link>}
                      {live && <Button size="sm" variant="outline" disabled={busy} onClick={() => renew(l)}>Renew</Button>}
                      {live && <Button size="sm" variant="outline" disabled={busy} onClick={() => markFilled(l)}>Mark filled</Button>}
                      {l.status === "DRAFT" && <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus(l.id, "ACTIVE", "Draft published.")}>Publish draft</Button>}
                      {l.status === "ACTIVE" && <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus(l.id, "PAUSED")}>Pause</Button>}
                      {l.status === "PAUSED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus(l.id, "ACTIVE")}>Resume</Button>}
                      {l.status === "ACTIVE" && !l.isFeatured && <Button size="sm" variant="outline" disabled={busy} onClick={() => feature(l)}>Feature — ${FEATURED_PRICE}.00</Button>}
                      <Button size="sm" variant="outline" onClick={() => toggle(l.id, "enquiries")}>View enquiries ({enq.length})</Button>
                    </div>

                    {panel === "view" && (
                      <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <p className="m-0">{l.description}</p>
                        <p className="m-0"><span className="text-slate-400">Availability: </span>{l.urgency ? URGENCY_LABEL[l.urgency] ?? l.urgency : "—"}{l.housingDetails?.vacancyDate ? ` · ${l.housingDetails.vacancyDate}` : ""}</p>
                        <p className="m-0"><span className="text-slate-400">Support arrangement: </span>{l.supportModel || l.housingDetails?.rosterArrangement || "—"}</p>
                        <p className="m-0"><span className="text-slate-400">Suitable for: </span>{l.suitableFor?.join(", ") || "—"}</p>
                        <p className="m-0"><span className="text-slate-400">Funding routes: </span>{l.fundingRoutes?.join(", ") || "—"}</p>
                        {l.housingDetails?.compatibility && <p className="m-0"><span className="text-slate-400">Suitability and intake: </span>{l.housingDetails.compatibility}</p>}
                        <p className="m-0 text-xs text-slate-500">A promoted listing does not imply SDA enrolment, NDIS registration, funding eligibility or suitability. Exact address and resident details stay private.</p>
                      </div>
                    )}
                    {panel === "enquiries" && (
                      <div className="rounded-lg bg-slate-50 p-3"><ListingEnquiries inquiries={enq} /></div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
