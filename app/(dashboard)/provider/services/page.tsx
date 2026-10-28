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
  const [open, setOpen] = useState<{ id: string; panel: "view" | "enquiries" | "capacity" } | null>(null);
  const [chooser, setChooser] = useState(false);
  const [pauseAtZero, setPauseAtZero] = useState(false);
  const [slots, setSlots] = useState("");
  const [accepting, setAccepting] = useState<"YES" | "LIMITED" | "NO">("YES");

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

  function toggle(id: string, panel: "view" | "enquiries" | "capacity", l?: ServiceListing) {
    if (open?.id === id && open.panel === panel) { setOpen(null); return; }
    if (panel === "capacity" && l) { setSlots(l.openSlots != null ? String(l.openSlots) : ""); setAccepting(l.acceptingStatus ?? "YES"); }
    setOpen({ id, panel });
  }

  async function saveCapacity(id: string) {
    const body: Record<string, unknown> = { acceptingStatus: accepting };
    if (slots.trim() !== "") body.openSlots = Math.max(0, Math.min(999, Math.floor(Number(slots)) || 0));
    if (pauseAtZero && body.openSlots === 0) body.status = "PAUSED";
    if (await patch(id, body)) setOpen(null);
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
        {chooser && <ServiceOrCapacityDialog onClose={() => setChooser(false)} />}
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
              const panel = open?.id === l.id ? open.panel : null;
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
                    <button type="button" className="pd-btn pd-btn-sm" onClick={() => toggle(l.id, "view")}>View listing</button>
                    {l.status !== "CLOSED" && <Link href={`/provider/post-service?edit=${l.id}`} className="pd-btn pd-btn-sm">Edit</Link>}
                    {l.status === "ACTIVE" && <button type="button" className="pd-btn pd-btn-sm" disabled={busy} onClick={() => patch(l.id, { status: "PAUSED" })}>Pause</button>}
                    {l.status === "PAUSED" && <button type="button" className="pd-btn pd-btn-sm" disabled={busy} onClick={() => patch(l.id, { status: "ACTIVE" })}>Resume</button>}
                    {(l.status === "ACTIVE" || l.status === "PAUSED") && <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => toggle(l.id, "capacity", l)}>Update capacity</button>}
                  </div>

                  {panel === "view" && (
                    <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="m-0"><span className="text-slate-400">Funding: </span>{l.fundingTypes?.join(", ") || "—"}</p>
                      <p className="m-0"><span className="text-slate-400">Responds: </span>{l.responseExpectation ? RESPONSE_LABEL[l.responseExpectation] : "—"}</p>
                      <p className="m-0"><span className="text-slate-400">Posted: </span>{new Date(l.createdAt).toLocaleDateString("en-AU")}</p>
                      <p className="m-0 flex flex-wrap gap-4 pt-1">
                        <button type="button" className="pd-textbtn" onClick={() => toggle(l.id, "enquiries")}>View enquiries ({enq.length})</button>
                        <Link href={`/provider/post-service?duplicate=${l.id}`} className="pd-textbtn">Duplicate listing</Link>
                      </p>
                    </div>
                  )}
                  {panel === "capacity" && (
                    <div className="space-y-3 rounded-lg bg-slate-50 p-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="text-xs font-semibold text-slate-700">Open places
                          <input type="number" min={0} max={999} value={slots} onChange={(e) => setSlots(e.target.value)}
                            className="mt-1 block h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm font-normal" />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">Accepting new participants
                          <select value={accepting} onChange={(e) => setAccepting(e.target.value as "YES" | "LIMITED" | "NO")}
                            className="mt-1 block h-9 rounded-lg border border-slate-200 px-2 text-sm font-normal">
                            <option value="YES">Yes</option><option value="LIMITED">Limited</option><option value="NO">No</option>
                          </select>
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={pauseAtZero} onChange={(e) => setPauseAtZero(e.target.checked)} />Pause listing when capacity reaches zero</label>
                      <p className="m-0 text-xs text-slate-500">Capacity updates are free and never use a Provider Action.</p>
                      <div className="pd-buttons">
                        <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" disabled={busy} onClick={() => saveCapacity(l.id)}>{busy ? "Saving…" : "Save capacity"}</button>
                        <button type="button" className="pd-btn pd-btn-sm" onClick={() => setOpen(null)}>Cancel</button>
                      </div>
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
        <div className="pd-info-banner">
          <Check width={18} height={18} className="shrink-0" />
          Ordinary service and capacity updates do not consume Provider actions. Housing vacancies use a separate 30-day listing package.
        </div>
      </div>
    </div>
  );
}
