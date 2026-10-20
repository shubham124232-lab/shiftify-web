"use client";

import { useBranchWorkspace } from "@/lib/store/branchWorkspace";
import { VACANCY_LABEL } from "@/components/provider/housingOptions";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Plus, LayoutGrid } from "lucide-react";
import { ListingEnquiries, type ListingInquiry } from "@/components/provider/ListingEnquiries";
import { api } from "@/lib/api";
import { ModalShell } from "@/components/jobs/post/shared";

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
  ACTIVE: "pd-badge-green",
  PAUSED: "",
  FILLED: "pd-badge-blue",
  CLOSED: "",
  DRAFT: "pd-badge-orange",
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
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; label: string; run: () => void } | null>(null);
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
    const byStatus = filter === "ALL" ? inBranch : inBranch.filter((l) => l.status === filter);
    const needle = search.trim().toLowerCase();
    return needle ? byStatus.filter((l) => `${l.title} ${l.suburb} ${l.description}`.toLowerCase().includes(needle)) : byStatus;
  }, [listings, filter, workspaceBranch, search]);

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
    setConfirm({
      title: "Close filled vacancy", label: "Mark filled",
      body: `Close this genuine vacancy. Its paid position cannot be transferred to another property. "${l.title}" will no longer be shown to enquirers${l.isFeatured ? " and will leave the Featured queue" : ""}.`,
      run: () => changeStatus(l.id, "FILLED", "Vacancy marked as filled."),
    });
  }

  function renew(l: HousingListing) {
    const price = l.isFeatured ? FEATURED_PRICE : STANDARD_PRICE;
    const kind = l.isFeatured ? "Featured" : "Standard";
    setConfirm({
      title: `${kind} housing renewal`, label: "Renew listing",
      body: `Renew "${l.title}" for another 30 days (${kind} package). Price: $${price.toFixed(2)}.` +
        `${l.isFeatured ? " Your Featured queue position is kept." : ""} The new term starts when the current one ends. ` +
        `Platform products do not guarantee applicants or outcomes.`,
      run: () => run(l.id, () => api.post(`/provider/listings/${l.id}/renew`, {}), "Vacancy renewed for 30 days."),
    });
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
      {confirm && (
        <ModalShell title={confirm.title} onClose={() => setConfirm(null)}>
          <div className="px-6 py-5"><p className="m-0 text-sm text-slate-600">{confirm.body}</p></div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button type="button" className="pd-btn" onClick={() => setConfirm(null)}>Back</button>
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => { const go = confirm.run; setConfirm(null); go(); }}>{confirm.label}</button>
          </div>
        </ModalShell>
      )}
      <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Housing</div>
        <div className="pd-page-head">
          <div>
            <h1>Housing Vacancies</h1>
            <p>Manage SIL, SDA, respite and supported-housing enquiries.</p>
          </div>
          <div className="pd-buttons">
            <Link href="/provider/sil-vacancy" className="pd-btn pd-btn-primary"><Plus />List a vacancy</Link>
          </div>
        </div>
        <div className="pd-toolbar">
          <input placeholder="Search vacancies" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search vacancies" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as (typeof FILTERS)[number]["key"])} aria-label="Status">
            {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.key === "ALL" ? "All statuses" : f.label}</option>)}
          </select>
          <button type="button" className="pd-btn" onClick={() => { setSearch(""); setFilter("ALL"); }}><RefreshCw />Clear filters</button>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {notice && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

        {loading ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="pd-grid2">
            <div className="pd-empty">
              <LayoutGrid />
              <h3>No housing vacancies yet</h3>
              <p>List a SIL, SDA or respite vacancy to start receiving enquiries.</p>
            </div>
          </div>
        ) : (
          <div className="pd-grid2">
            {visible.map((l) => {
              const enq = inquiries.filter((q) => q.listingId === l.id);
              const busy = busyId === l.id;
              const panel = open?.id === l.id ? open.panel : null;
              const live = l.status === "ACTIVE" || l.status === "PAUSED";
              const features = l.housingDetails?.accessibilityFeatures ?? [];
              const expired = !!l.listingExpiresAt && new Date(l.listingExpiresAt) < new Date();
              return (
                <article key={l.id} className="pd-record-card">
                  <div className="pd-tags">
                    <span className="pd-badge pd-badge-purple">{(l.vacancyCategory && VACANCY_LABEL[l.vacancyCategory]) || "Housing"}</span>
                    <span className={`pd-badge ${STATUS_BADGE[l.status] ?? ""}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                    {l.isFeatured && <span className="pd-badge pd-badge-orange">Featured · position {l.featuredQueuePosition}</span>}
                    {expired && <span className="pd-badge pd-badge-red">Expired</span>}
                  </div>
                  <h2>{l.title}</h2>
                  <div className="pd-card-body">{l.suburb}{l.state ? `, ${l.state}` : ""}{l.propertyType ? ` · ${l.propertyType}` : ""}</div>
                  <div className="pd-card-body"><strong>{l.vacancyCount != null ? `${l.vacancyCount} vacanc${l.vacancyCount === 1 ? "y" : "ies"}` : "Vacancies not set"}</strong> · Expires {fmtDate(l.listingExpiresAt)}</div>
                  {features.length > 0 && (
                    <div className="pd-tags">
                      {features.slice(0, 4).map((f) => <span key={f} className="pd-pill">{f}</span>)}
                    </div>
                  )}
                  {l.description && <div className="pd-card-body line-clamp-2">{l.description}</div>}

                  <div className="pd-buttons">
                    <button type="button" className="pd-btn pd-btn-sm" onClick={() => toggle(l.id, "view")}>View vacancy</button>
                    {l.status !== "CLOSED" && l.status !== "FILLED" && <Link href={`/provider/sil-vacancy?edit=${l.id}`} className="pd-btn pd-btn-sm">Edit</Link>}
                    {live && <button type="button" className="pd-btn pd-btn-sm" disabled={busy} onClick={() => renew(l)}>Renew</button>}
                    {live && <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" disabled={busy} onClick={() => markFilled(l)}>Mark filled</button>}
                  </div>

                  {panel === "view" && (
                    <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="m-0">{l.description}</p>
                      <p className="m-0"><span className="text-slate-400">Availability: </span>{l.urgency ? URGENCY_LABEL[l.urgency] ?? l.urgency : "—"}{l.housingDetails?.vacancyDate ? ` · ${l.housingDetails.vacancyDate}` : ""}</p>
                      <p className="m-0"><span className="text-slate-400">Support arrangement: </span>{l.supportModel || l.housingDetails?.rosterArrangement || "—"}</p>
                      <p className="m-0"><span className="text-slate-400">Suitable for: </span>{l.suitableFor?.join(", ") || "—"}</p>
                      <p className="m-0"><span className="text-slate-400">Funding routes: </span>{l.fundingRoutes?.join(", ") || "—"}</p>
                      {l.housingDetails?.compatibility && <p className="m-0"><span className="text-slate-400">Suitability and intake: </span>{l.housingDetails.compatibility}</p>}
                      <p className="m-0 flex flex-wrap gap-4 pt-1">
                        <button type="button" className="pd-textbtn" onClick={() => toggle(l.id, "enquiries")}>View enquiries ({enq.length})</button>
                        {l.status === "DRAFT" && <button type="button" disabled={busy} className="pd-textbtn" onClick={() => changeStatus(l.id, "ACTIVE", "Draft published.")}>Publish draft</button>}
                        {l.status === "ACTIVE" && <button type="button" disabled={busy} className="pd-textbtn" onClick={() => changeStatus(l.id, "PAUSED")}>Pause</button>}
                        {l.status === "PAUSED" && <button type="button" disabled={busy} className="pd-textbtn" onClick={() => changeStatus(l.id, "ACTIVE")}>Resume</button>}
                        {l.status === "ACTIVE" && !l.isFeatured && <button type="button" disabled={busy} className="pd-textbtn" onClick={() => feature(l)}>Feature — ${FEATURED_PRICE}.00</button>}
                      </p>
                      <p className="m-0 text-xs text-slate-500">A promoted listing does not imply SDA enrolment, NDIS registration, funding eligibility or suitability. Exact address and resident details stay private.</p>
                    </div>
                  )}
                  {panel === "enquiries" && (
                    <div className="rounded-lg bg-slate-50 p-3"><ListingEnquiries inquiries={enq} /></div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
