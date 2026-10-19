"use client";

import { useBranchWorkspace } from "@/lib/store/branchWorkspace";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { ListingEnquiries, type ListingInquiry } from "@/components/provider/ListingEnquiries";
import { api } from "@/lib/api";
import { ServiceOrCapacityDialog } from "@/components/provider/DashboardDialogs";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

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
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-slate-100 text-slate-500",
  FILLED: "bg-sky-100 text-sky-700",
  CLOSED: "bg-slate-100 text-slate-400",
  DRAFT: "bg-amber-100 text-amber-700",
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
    <>
      <PageHeader
        crumb="Provider / Services & Capacity"
        title="Services & Capacity"
        description="Advertise what you can deliver and the exact capacity available."
        actions={<Button onClick={() => setChooser(true)}>Post service or capacity</Button>}
      />
      {chooser && <ServiceOrCapacityDialog onClose={() => setChooser(false)} />}
      <div className="container-page space-y-6 py-8">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm" placeholder="Search services" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as (typeof FILTERS)[number]["key"])} aria-label="Status">
            {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.key === "ALL" ? "All statuses" : f.label}</option>)}
          </select>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setSearch(""); setFilter("ALL"); }}><RefreshCw className="mr-1.5 h-4 w-4" />Clear filters</Button>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : visible.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">
            No service listings yet. Post your service capacity so participants, coordinators and plan managers can find you.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((l) => {
              const cats = (l.serviceCategories?.length ? l.serviceCategories : l.serviceCategory ? [l.serviceCategory] : []).map(catLabel);
              const days = DAY_ORDER.filter((d) => l.daysAvailable?.includes(d));
              const enq = inquiries.filter((q) => q.listingId === l.id);
              const busy = busyId === l.id;
              const panel = open?.id === l.id ? open.panel : null;
              return (
                <Card key={l.id}>
                  <CardContent className="space-y-3 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {(cats.length ? cats : ["Service"]).map((c) => <span key={c} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{c}</span>)}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[l.status] ?? ""}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                    </div>
                    <div>
                      <p className="m-0 text-base font-semibold text-slate-900">{l.suburb}{l.state ? `, ${l.state}` : ""}</p>
                      <p className="m-0 mt-0.5 text-sm text-slate-500">{days.length ? days.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ") : "Days not set"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{l.openSlots != null ? `${l.openSlots} open place${l.openSlots === 1 ? "" : "s"}` : "Places not set"}</span>
                      {l.acceptingStatus && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{ACCEPTING_LABEL[l.acceptingStatus]}</span>}
                      {l.responseExpectation && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Responds {RESPONSE_LABEL[l.responseExpectation]?.toLowerCase()}</span>}
                    </div>
                    {!isAutoText(l.description) && <p className="m-0 text-sm text-slate-600">{l.description}</p>}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => toggle(l.id, "view")}>View listing</Button>
                      {l.status !== "CLOSED" && <Link href={`/provider/post-service?edit=${l.id}`}><Button size="sm" variant="outline">Edit</Button></Link>}
                      {l.status === "ACTIVE" && <Button size="sm" variant="outline" disabled={busy} onClick={() => patch(l.id, { status: "PAUSED" })}>Pause</Button>}
                      {l.status === "PAUSED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => patch(l.id, { status: "ACTIVE" })}>Resume</Button>}
                      {(l.status === "ACTIVE" || l.status === "PAUSED") && <Button size="sm" className="ml-auto" onClick={() => toggle(l.id, "capacity", l)}>Update capacity</Button>}
                    </div>

                    {panel === "view" && (
                      <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <p className="m-0"><span className="text-slate-400">Funding: </span>{l.fundingTypes?.join(", ") || "—"}</p>
                        <p className="m-0"><span className="text-slate-400">Responds: </span>{l.responseExpectation ? RESPONSE_LABEL[l.responseExpectation] : "—"}</p>
                        <p className="m-0"><span className="text-slate-400">Posted: </span>{new Date(l.createdAt).toLocaleDateString("en-AU")}</p>
                        <p className="m-0 flex flex-wrap gap-4 pt-1">
                          <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => toggle(l.id, "enquiries")}>View enquiries ({enq.length})</button>
                          <Link href={`/provider/post-service?duplicate=${l.id}`} className="font-semibold text-brand-700 hover:underline">Duplicate listing</Link>
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
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy} onClick={() => saveCapacity(l.id)}>{busy ? "Saving…" : "Save capacity"}</Button>
                          <Button size="sm" variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                        </div>
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
        <p className="m-0 text-sm text-slate-500">Capacity updates are free and never use an action.</p>
      </div>
    </>
  );
}
