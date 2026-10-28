"use client";

import { useBranchWorkspace } from "@/lib/store/branchWorkspace";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Plus, Check, LayoutGrid } from "lucide-react";
import { ListingEnquiries, type ListingInquiry } from "@/components/provider/ListingEnquiries";
import { api } from "@/lib/api";
import { ServiceOrCapacityDialog } from "@/components/provider/DashboardDialogs";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { ModalShell } from "@/components/jobs/post/shared";
import { ServiceListingWizard } from "@/components/provider/listing-wizard/ServiceListingWizard";

interface ServiceListing {
  branchId?: string | null;
  id: string;
  status: "ACTIVE" | "PAUSED" | "FILLED" | "CLOSED" | "DRAFT";
  title: string;
  description: string;
  suburb: string;
  state: string | null;
  serviceCategory: string | null;
  serviceCategories: string[] | null;
  daysAvailable: string[] | null;
  acceptingStatus: "YES" | "LIMITED" | "NO" | null;
  responseExpectation: string | null;
  fundingTypes: string[] | null;
  openSlots: number | null;
  serviceDetails?: Record<string, any> | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "pd-badge-green",
  PAUSED: "",
  FILLED: "pd-badge-blue",
  CLOSED: "",
  DRAFT: "pd-badge-orange",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Live", PAUSED: "Paused", FILLED: "Filled", CLOSED: "Closed", DRAFT: "Draft" };
const ACCEPTING_LABEL: Record<string, string> = { YES: "Accepting new participants", LIMITED: "Limited capacity", NO: "Not accepting right now" };
const RESPONSE_LABEL: Record<string, string> = { SAME_DAY: "Same day", WITHIN_48_HOURS: "Within 48 hours", WITHIN_A_WEEK: "Within a week" };
const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Live" },
  { key: "PAUSED", label: "Paused" },
  { key: "CLOSED", label: "Closed" },
] as const;

const catLabel = (v: string) => JOB_CATEGORIES.find((c) => c.value === v)?.label ?? v;
const isAutoText = (d: string) => d.startsWith("Current capacity for ");

export default function ProviderServicesPage() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [inquiries, setInquiries] = useState<ListingInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<ServiceListing | null>(null);
  const [capFor, setCapFor] = useState<ServiceListing | null>(null);
  const [chooser, setChooser] = useState(false);
  const [wizard, setWizard] = useState<{ kind: "service" | "capacity"; listing?: ServiceListing | null; duplicate?: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pauseAtZero, setPauseAtZero] = useState(false);
  const [slots, setSlots] = useState("");

  function load() {
    return Promise.all([
      api.get<{ listings: ServiceListing[] }>("/provider/listings?category=SERVICE"),
      api.get<{ inquiries: ListingInquiry[] }>("/direct-inquiries/received").catch(() => ({ inquiries: [] })),
    ])
      .then(([l, q]) => { setListings(l.listings); setInquiries(q.inquiries ?? []); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load services"))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  // Deep links from other screens: ?wizard=service|capacity opens the form; ?edit= / ?duplicate= reopen an existing listing.
  const [launched, setLaunched] = useState(false);
  useEffect(() => {
    if (launched) return;
    const sp = new URLSearchParams(window.location.search);
    const want = sp.get("wizard"); const editId = sp.get("edit"); const dupId = sp.get("duplicate");
    if (!want && !editId && !dupId) { setLaunched(true); return; }
    if ((editId || dupId) && loading) return;
    setLaunched(true);
    const existing = listings.find((l) => l.id === (editId ?? dupId)) ?? null;
    if ((editId || dupId) && !existing) { setError("That listing could not be found."); return; }
    setWizard({ kind: want === "capacity" ? "capacity" : "service", listing: existing, duplicate: !!dupId });
  }, [launched, loading, listings]);

  const workspaceBranch = useBranchWorkspace((s) => s.branchId);
  const visible = useMemo(() => {
    const inBranch = workspaceBranch ? listings.filter((l) => l.branchId === workspaceBranch) : listings;
    const byStatus = filter === "ALL" ? inBranch : inBranch.filter((l) => l.status === filter);
    const needle = search.trim().toLowerCase();
    return needle ? byStatus.filter((l) => `${l.title} ${l.suburb} ${(l.serviceCategories ?? []).map(catLabel).join(" ")} ${l.description}`.toLowerCase().includes(needle)) : byStatus;
  }, [listings, filter, workspaceBranch, search]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/provider/listings/${id}`, body);
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update listing");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function saveCapacity() {
    if (!capFor) return;
    const body: Record<string, unknown> = {};
    if (slots.trim() !== "") body.openSlots = Math.max(0, Math.min(999, Math.floor(Number(slots)) || 0));
    if (body.openSlots === 0) body.acceptingStatus = "NO";
    else if (capFor.acceptingStatus === "NO") body.acceptingStatus = "YES";
    if (pauseAtZero && body.openSlots === 0) body.status = "PAUSED";
    if (await patch(capFor.id, body)) setCapFor(null);
  }

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Services</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Services and capacity</h1>
            <p>Advertise what you can deliver and the exact capacity available.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => setChooser(true)}><Plus />Post service or capacity</button>
          </div>
        </div>
        {chooser && <ServiceOrCapacityDialog onClose={() => setChooser(false)} onPick={(kind) => { setChooser(false); setWizard({ kind }); }} />}
        {wizard && <ServiceListingWizard kind={wizard.kind} listing={wizard.listing} duplicate={wizard.duplicate} onClose={() => setWizard(null)} onDone={(m) => { setWizard(null); setNotice(m); void load(); }} />}
        {notice && <div className="pd-notice mb-4">{notice}</div>}
        {view && <ServiceListingView l={view} onClose={() => setView(null)}
          onEdit={() => { setWizard({ kind: "service", listing: view }); setView(null); }}
          onDuplicate={() => { setWizard({ kind: "service", listing: view, duplicate: true }); setView(null); }} />}
        {capFor && (
          <ModalShell title="Update available capacity" onClose={() => setCapFor(null)}>
            <div className="pd-modal-body">
              <p className="m-0 mb-4 font-semibold">{capFor.title}</p>
              <label className="block">Remaining slots
                <input type="number" min={0} max={999} value={slots} onChange={(e) => setSlots(e.target.value)} /></label>
              <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={pauseAtZero} onChange={(e) => setPauseAtZero(e.target.checked)} />Pause listing when capacity reaches zero</label>
              <p className="pd-note">Capacity updates are free and never use a Provider Action.</p>
            </div>
            <div className="pd-modal-foot">
              <button type="button" className="pd-btn" onClick={() => setCapFor(null)}>Back</button>
              <button type="button" className="pd-btn pd-btn-primary" disabled={busyId === capFor.id} onClick={() => void saveCapacity()}>{busyId === capFor.id ? "Saving…" : "Save capacity"}</button>
            </div>
          </ModalShell>
        )}
        <div className="pd-toolbar">
          <input placeholder="Search services or areas" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search services" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as (typeof FILTERS)[number]["key"])} aria-label="Status">
            {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.key === "ALL" ? "All" : f.label}</option>)}
          </select>
          <button type="button" className="pd-btn" onClick={() => { setSearch(""); setFilter("ALL"); }}><RefreshCw />Clear filters</button>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="pd-grid2">
            <div className="pd-empty">
              <LayoutGrid />
              <h3>No service listings yet</h3>
              <p>Post your service capacity so participants, coordinators and plan managers can find you.</p>
            </div>
          </div>
        ) : (
          <div className="pd-grid2">
            {visible.map((l) => {
              const cats = (l.serviceCategories?.length ? l.serviceCategories : l.serviceCategory ? [l.serviceCategory] : []).map(catLabel);
              const days = DAY_ORDER.filter((d) => l.daysAvailable?.includes(d));
              const enq = inquiries.filter((q) => q.listingId === l.id);
              const busy = busyId === l.id;
              return (
                <article key={l.id} className="pd-record-card">
                  <div className="pd-tags">
                    <span className={`pd-badge ${STATUS_BADGE[l.status] ?? ""}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                    {(cats.length ? cats : ["Service"]).map((c) => <span key={c} className="pd-badge pd-badge-pink">{c}</span>)}
                  </div>
                  <h2>{l.title}</h2>
                  <div className="pd-card-body">
                    <div>{l.suburb}{l.state ? `, ${l.state}` : ""}</div>
                    <div>{days.length ? days.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ") : "Days not set"}</div>
                  </div>
                  <div className="pd-tags">
                    <span className="pd-pill">{l.openSlots != null ? `${l.openSlots} open slot${l.openSlots === 1 ? "" : "s"}` : "Slots not set"}</span>
                    {l.acceptingStatus && <span className="pd-pill">{ACCEPTING_LABEL[l.acceptingStatus]}</span>}
                    {l.responseExpectation && <span className="pd-pill">Responds {RESPONSE_LABEL[l.responseExpectation]?.toLowerCase()}</span>}
                  </div>
                  {!isAutoText(l.description) && <div className="pd-card-body">{l.description}</div>}

                  <div className="pd-buttons">
                    <button type="button" className="pd-btn pd-btn-sm" onClick={() => setView(l)}>View listing</button>
                    {l.status !== "CLOSED" && <button type="button" className="pd-btn pd-btn-sm" onClick={() => setWizard({ kind: "service", listing: l })}>Edit</button>}
                    {l.status === "ACTIVE" && <button type="button" className="pd-btn pd-btn-sm" disabled={busy} onClick={() => patch(l.id, { status: "PAUSED" })}>Pause</button>}
                    {l.status === "PAUSED" && <button type="button" className="pd-btn pd-btn-sm" disabled={busy} onClick={() => patch(l.id, { status: "ACTIVE" })}>Resume</button>}
                    {(l.status === "ACTIVE" || l.status === "PAUSED") && <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => { setSlots(l.openSlots != null ? String(l.openSlots) : ""); setPauseAtZero(false); setCapFor(l); }}>Update capacity</button>}
                  </div>

                </article>
              );
            })}
          </div>
        )}
        <div className="pd-info-banner">
          <Check width={18} height={18} className="shrink-0" />
          Ordinary service and capacity updates do not consume Provider actions. Housing vacancies use a separate 30-day listing package.
        </div>
      </div>
    </div>
  );
}

// "Service availability" record popup (approved demo): the listing's public details, with Duplicate / View enquiries / Edit.
function ServiceListingView({ l, onClose, onEdit, onDuplicate }: { l: ServiceListing & { serviceDetails?: Record<string, any> | null }; onClose: () => void; onEdit: () => void; onDuplicate: () => void }) {
  const d = (l.serviceDetails ?? {}) as Record<string, any>;
  const cats = (l.serviceCategories?.length ? l.serviceCategories : l.serviceCategory ? [l.serviceCategory] : []).map(catLabel);
  const days = DAY_ORDER.filter((x) => l.daysAvailable?.includes(x)).map((x) => x.charAt(0) + x.slice(1).toLowerCase()).join(", ");
  const rows: [string, string][] = [
    ["Coverage", `${l.suburb}${l.state ? `, ${l.state}` : ""}`],
    ["Schedule", d.schedule ?? (days || "—")],
    ["Available capacity", l.openSlots != null ? `${l.openSlots} place${l.openSlots === 1 ? "" : "s"}` : "—"],
    ["Continuity", d.workforceModel ?? "—"],
    ["Fit", d.fit ?? "—"],
    ["Funding accepted", l.fundingTypes?.join(", ") || "—"],
    ["Responds", l.responseExpectation ? RESPONSE_LABEL[l.responseExpectation] : "—"],
    ["Posted", new Date(l.createdAt).toLocaleDateString("en-AU")],
  ];
  return (
    <ModalShell title="Service availability" onClose={onClose}>
      <div className="pd-modal-body">
        <div className="pd-tags" style={{ marginBottom: 8 }}>
          {cats.map((c) => <span key={c} className="pd-badge pd-badge-pink">{c}</span>)}
          <span className={`pd-badge ${STATUS_BADGE[l.status] ?? ""}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
        </div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{l.title}</h3>
        {!isAutoText(l.description) && <p className="pd-muted" style={{ margin: "8px 0 16px" }}>{l.description}</p>}
        {rows.map(([k, v]) => <div key={k} className="pd-review-row"><span>{k}</span><strong style={{ fontWeight: 600 }}>{v}</strong></div>)}
      </div>
      <div className="pd-modal-foot">
        <button type="button" className="pd-btn" onClick={onDuplicate}>Duplicate listing</button>
        <div className="pd-buttons">
          <Link href="/provider/enquiries" className="pd-btn">View enquiries</Link>
          {l.status !== "CLOSED" && <button type="button" className="pd-btn pd-btn-primary" onClick={onEdit}>Edit listing</button>}
        </div>
      </div>
    </ModalShell>
  );
}
