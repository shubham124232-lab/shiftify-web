"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
  dayOfWeek: string;  // MON | TUE | WED | THU | FRI | SAT | SUN
  startTime: string;  // "08:00"
  endTime: string;    // "17:00"
}

interface UnavailDate {
  id: string;
  date: string;     // ISO date "2025-06-15"
  note: string | null;
}

// SW doc Windows 24-26 — a worker's posted general-availability listing,
// distinct from the fixed weekly schedule below.
interface AvailabilityListing {
  id: string;
  listingType: "DATE_RANGE" | "FORTNIGHTLY" | "ONGOING" | "BACKUP";
  startDate: string;
  endDate: string | null;
  services: string[];
  suburb: string | null;
  state: string | null;
  travelRadiusKm: number | null;
  rate: number | string | null;
  visibility: "ALL" | "CONNECTIONS_ONLY";
  expiresAt: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  DATE_RANGE: "Specific date range", FORTNIGHTLY: "Fortnightly pattern",
  ONGOING: "Ongoing", BACKUP: "Backup / on-call",
};

interface AvailableNowSettings {
  requestTypes?: ("RAPID" | "URGENT" | "LAST_MINUTE" | "REPLACEMENT")[];
  areaMode?: "SAVED" | "TODAY";
  suburb?: string;
  servicesMode?: "SAVED" | "SELECT";
  services?: string[];
  overnight?: boolean;
  transportParticipants?: boolean;
  maxDistanceKm?: number;
  alertsOn?: boolean;
  paused?: boolean;
  startsAt?: string | null;
  scheduledPending?: boolean;
}

const AN_REQUEST_TYPES: { value: "RAPID" | "URGENT" | "LAST_MINUTE" | "REPLACEMENT"; label: string }[] = [
  { value: "RAPID", label: "Rapid" }, { value: "URGENT", label: "Urgent" },
  { value: "LAST_MINUTE", label: "Last-Minute" }, { value: "REPLACEMENT", label: "Replacement" },
];
const VISIBLE_TO_LABEL: Record<string, string> = {
  ALL: "All eligible users", PARTICIPANTS: "Participants", COORDINATORS: "Support Coordinators", PROVIDERS: "Providers", PAUSED: "Nobody (paused)",
};

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LABELS: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday",
  FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};

const DEFAULT_START = "08:00";
const DEFAULT_END   = "17:00";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const { activeRole } = useAuth();

  const [slots,       setSlots]       = useState<TimeSlot[]>([]);
  const [unavail,     setUnavail]     = useState<UnavailDate[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [newDate,     setNewDate]     = useState("");
  const [newNote,     setNewNote]     = useState("");
  const [addingDate,  setAddingDate]  = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [availableNowSetAt, setAvailableNowSetAt] = useState<string | null>(null);
  const [availableNowUntil, setAvailableNowUntil] = useState<string | null>(null);
  const [untilInput, setUntilInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [togglingNow, setTogglingNow] = useState(false);
  const [nowError, setNowError] = useState<string | null>(null);
  const [anSettings, setAnSettings] = useState<AvailableNowSettings>({ requestTypes: ["RAPID", "URGENT", "LAST_MINUTE"], areaMode: "SAVED", servicesMode: "SAVED" });
  const [anEditing, setAnEditing] = useState(false);
  const [anVisibleTo, setAnVisibleTo] = useState("All eligible users");
  const anPaused = !availableNow && !!anSettings.paused;

  // Availability listings (Windows 24-26)
  const [listings, setListings] = useState<AvailabilityListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [showListingForm, setShowListingForm] = useState(false);
  const [creatingListing, setCreatingListing] = useState(false);
  const [listingType, setListingType] = useState<AvailabilityListing["listingType"]>("ONGOING");
  const [listingStart, setListingStart] = useState("");
  const [listingEnd, setListingEnd] = useState("");
  const [listingServices, setListingServices] = useState<string[]>([]);
  const [listingSuburb, setListingSuburb] = useState("");
  const [listingState, setListingState] = useState("");
  const [listingRadius, setListingRadius] = useState("");
  const [listingRate, setListingRate] = useState("");
  const [listingVisibility, setListingVisibility] = useState<AvailabilityListing["visibility"]>("ALL");
  const [listingExpiresAt, setListingExpiresAt] = useState("");
  const [listTab, setListTab] = useState<"ALL" | "ACTIVE" | "RECURRING" | "DRAFT" | "PAUSED" | "EXPIRED" | "ARCHIVED">("ALL");

  const isWorker   = activeRole === UserRole.SUPPORT_WORKER;
  const isProvider = activeRole === UserRole.PROVIDER;

  useEffect(() => {
    if (!isWorker && !isProvider) return;
    setLoading(true);
    const endpoint = isProvider
      ? "/users/me/availability/provider-availability"
      : "/users/me/availability";
    api.get<{ availability: TimeSlot[]; unavailability?: UnavailDate[] }>(endpoint)
      .then(r => {
        setSlots(r.availability ?? []);
        setUnavail(r.unavailability ?? []);
      })
      .catch(() => {}) // no profile yet — leave empty
      .finally(() => setLoading(false));
  }, [activeRole, isWorker, isProvider]);

  useEffect(() => {
    if (!isWorker) return;
    api.get<{ user: any }>("/users/me")
      .then(r => {
        setAvailableNow(!!r.user?.workerProfile?.isAvailableNow);
        setAvailableNowSetAt(r.user?.workerProfile?.availableNowSetAt ?? null);
        setAvailableNowUntil(r.user?.workerProfile?.availableNowUntil ?? null);
        if (r.user?.workerProfile?.availableNowSettings) setAnSettings(cur => ({ ...cur, ...r.user.workerProfile.availableNowSettings }));
        setAnVisibleTo(VISIBLE_TO_LABEL[r.user?.workerProfile?.visibleTo ?? "ALL"] ?? "All eligible users");
      })
      .catch(() => {});
  }, [isWorker]);

  function loadListings() {
    setListingsLoading(true);
    api.get<{ listings: AvailabilityListing[] }>("/availability-listings/mine")
      .then(r => setListings(r.listings ?? []))
      .catch(() => {})
      .finally(() => setListingsLoading(false));
  }

  useEffect(() => { if (isWorker) loadListings(); }, [isWorker]);

  function toggleListingService(cat: string) {
    setListingServices(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function handleCreateListing() {
    if (!listingStart || listingServices.length === 0) return;
    setCreatingListing(true);
    setListingsError(null);
    try {
      await api.post("/availability-listings", {
        listingType: listingType,
        startDate: new Date(listingStart).toISOString(),
        endDate: listingEnd ? new Date(listingEnd).toISOString() : undefined,
        services: listingServices,
        suburb: listingSuburb || undefined,
        state: listingState || undefined,
        travelRadiusKm: listingRadius ? Number(listingRadius) : undefined,
        rate: listingRate ? Number(listingRate) : undefined,
        visibility: listingVisibility,
        expiresAt: listingExpiresAt ? new Date(listingExpiresAt).toISOString() : undefined,
      });
      setListingStart(""); setListingEnd(""); setListingServices([]); setListingSuburb("");
      setListingState(""); setListingRadius(""); setListingRate(""); setListingExpiresAt("");
      setShowListingForm(false);
      loadListings();
    } catch (err: any) {
      setListingsError(err?.message ?? "Failed to create availability listing.");
    } finally {
      setCreatingListing(false);
    }
  }

  async function setListingStatus(id: string, status: AvailabilityListing["status"]) {
    try {
      await api.patch(`/availability-listings/${id}`, { status });
      loadListings();
    } catch (err: any) {
      setListingsError(err?.message ?? "Failed to update listing.");
    }
  }

  // Window 26 — Extend pushes the expiry a week further out; Duplicate pre-fills the form from an existing post.
  async function extendListing(l: AvailabilityListing) {
    const base = l.expiresAt && new Date(l.expiresAt) > new Date() ? new Date(l.expiresAt) : new Date();
    base.setDate(base.getDate() + 7);
    try {
      await api.patch(`/availability-listings/${l.id}`, { expiresAt: base.toISOString(), ...(l.status === "EXPIRED" ? { status: "ACTIVE" } : {}) });
      loadListings();
    } catch (err: any) {
      setListingsError(err?.message ?? "Failed to extend listing.");
    }
  }

  function duplicateListing(l: AvailabilityListing) {
    setListingType(l.listingType);
    setListingStart(l.startDate.slice(0, 10));
    setListingEnd(l.endDate ? l.endDate.slice(0, 10) : "");
    setListingServices(l.services ?? []);
    setListingSuburb(l.suburb ?? "");
    setListingState(l.state ?? "");
    setListingRadius(l.travelRadiusKm != null ? String(l.travelRadiusKm) : "");
    setListingRate(l.rate != null ? String(l.rate) : "");
    setListingVisibility(l.visibility);
    setListingExpiresAt("");
    setShowListingForm(true);
  }

  async function deleteListing(id: string) {
    try {
      await api.del(`/availability-listings/${id}`);
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      setListingsError(err?.message ?? "Failed to delete listing.");
    }
  }

  // SW journey doc §12 — Available Now Power Up: manual ON with a 24h auto-clear
  // (WorkerProfile.introductoryActionsUsed's sibling gate — see profile.service.ts).
  // Save the Available Now options without changing whether it is on.
  async function saveAnSettings(next: AvailableNowSettings) {
    setTogglingNow(true);
    setNowError(null);
    try {
      await api.patch("/users/me/profile/worker", { availableNowSettings: next });
      setAnSettings(next);
    } catch (err: any) {
      setNowError(err?.message ?? "Failed to save Available Now settings.");
    } finally {
      setTogglingNow(false);
    }
  }

  // Window 22 — "Turn on Available Now" (also used by Edit → Save changes and by Resume).
  async function turnOnAvailableNow() {
    setTogglingNow(true);
    setNowError(null);
    try {
      const until = untilInput ? new Date(untilInput).toISOString() : (availableNow ? availableNowUntil : null);
      const startsAt = fromInput ? new Date(fromInput).toISOString() : null;
      const scheduled = !!startsAt && new Date(startsAt).getTime() > Date.now();
      const settings = { ...anSettings, paused: false, startsAt, scheduledPending: scheduled };
      await api.patch("/users/me/profile/worker", { isAvailableNow: true, availableNowUntil: until, availableNowSettings: settings });
      setAnSettings(settings);
      setAvailableNow(!scheduled);
      setAvailableNowSetAt(scheduled ? null : new Date().toISOString());
      setAvailableNowUntil(until);
      setAnEditing(false);
    } catch (err: any) {
      setNowError(err?.message ?? "Failed to update Available Now.");
    } finally {
      setTogglingNow(false);
    }
  }

  // Window 23 — Pause hides it from searches but keeps the options for a one-tap resume.
  async function pauseAvailableNow() {
    setTogglingNow(true);
    setNowError(null);
    try {
      const settings = { ...anSettings, paused: true };
      await api.patch("/users/me/profile/worker", { isAvailableNow: false, availableNowSettings: settings });
      setAnSettings(settings);
      setAvailableNow(false);
      setAvailableNowSetAt(null);
      setAvailableNowUntil(null);
    } catch (err: any) {
      setNowError(err?.message ?? "Failed to pause Available Now.");
    } finally {
      setTogglingNow(false);
    }
  }

  // Window 23 — Turn off clears the expiry and the paused state.
  async function toggleAvailableNow() {
    setTogglingNow(true);
    setNowError(null);
    try {
      const settings = { ...anSettings, paused: false };
      await api.patch("/users/me/profile/worker", { isAvailableNow: false, availableNowSettings: settings });
      setAnSettings(settings);
      setAvailableNow(false);
      setAvailableNowSetAt(null);
      setAvailableNowUntil(null);
    } catch (err: any) {
      setNowError(err?.message ?? "Failed to update Available Now.");
    } finally {
      setTogglingNow(false);
    }
  }

  // ── Slot helpers ────────────────────────────────────────────────────────────

  function isEnabled(day: string) {
    return slots.some(s => s.dayOfWeek === day);
  }

  function getSlot(day: string): TimeSlot {
    return slots.find(s => s.dayOfWeek === day) ?? { dayOfWeek: day, startTime: DEFAULT_START, endTime: DEFAULT_END };
  }

  function toggleDay(day: string) {
    if (isEnabled(day)) {
      setSlots(prev => prev.filter(s => s.dayOfWeek !== day));
    } else {
      setSlots(prev => [...prev, { dayOfWeek: day, startTime: DEFAULT_START, endTime: DEFAULT_END }]);
    }
  }

  function updateSlot(day: string, field: "startTime" | "endTime", value: string) {
    setSlots(prev => {
      const existing = prev.find(s => s.dayOfWeek === day);
      if (existing) return prev.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s);
      return [...prev, { dayOfWeek: day, startTime: DEFAULT_START, endTime: DEFAULT_END, [field]: value }];
    });
  }

  // ── Save slots ───────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const endpoint = isProvider
        ? "/users/me/availability/provider-availability"
        : "/users/me/availability";
      await api.put(endpoint, { slots });
      setSuccess(true);
    } catch (err: any) { setError(err?.message ?? "Save failed."); }
    finally { setSaving(false); }
  }

  // ── Add blocked date ────────────────────────────────────────────────────────

  async function handleAddDate() {
    if (!newDate) return;
    setAddingDate(true); setError(null);
    try {
      const res = await api.post<{ unavailability: UnavailDate }>(
        "/users/me/availability/unavailability",
        { date: newDate, note: newNote || undefined }
      );
      setUnavail(prev => [...prev, res.unavailability]);
      setNewDate(""); setNewNote("");
    } catch (err: any) { setError(err?.message ?? "Failed to add date."); }
    finally { setAddingDate(false); }
  }

  async function handleRemoveDate(id: string) {
    try {
      await api.del(`/users/me/availability/unavailability/${id}`);
      setUnavail(prev => prev.filter(u => u.id !== id));
    } catch (err: any) { setError(err?.message); }
  }

  // ── Guard: only workers and providers have availability pages ───────────────

  if (!isWorker && !isProvider) {
    return (
      <>
        <PageHeader title="Availability" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "var(--td-muted-dark)", fontSize: 14 }}>Availability management is only available for Support Workers and Providers.</p>
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    height: 36, padding: "0 10px", border: "1.5px solid var(--td-border)",
    borderRadius: 8, fontSize: 13, outline: "none", background: "var(--td-white)",
  };

  return (
    <>
      <PageHeader title="My Availability" description="Set the days and hours you're available for work." />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Available Now Power Up — SW doc Windows 22-23 */}
        {isWorker && (
          <Card>
            <CardHeader><CardTitle>{availableNow ? "🟢 Available Now is ON" : anPaused ? "Available Now is paused" : "Available Now"}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {availableNow && !anEditing ? (
                <>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="m-0">Last updated {availableNowSetAt ? new Date(availableNowSetAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "just now"}.</p>
                    <p className="m-0">Expires: {availableNowUntil ? new Date(availableNowUntil).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "automatically 24 hours after you turned it on"}.</p>
                    <p className="m-0">Area: {anSettings.areaMode === "TODAY" && anSettings.suburb ? anSettings.suburb : "your saved travel area"}{anSettings.maxDistanceKm ? ` · up to ${anSettings.maxDistanceKm} km` : ""}</p>
                    <p className="m-0">Services: {anSettings.servicesMode === "SELECT" && anSettings.services?.length ? anSettings.services.map(s => JOB_CATEGORIES.find(c => c.value === s)?.label ?? s).join(", ") : "your saved services"}</p>
                    <p className="m-0">Request types: {(anSettings.requestTypes ?? []).length ? (anSettings.requestTypes ?? []).map(t => AN_REQUEST_TYPES.find(x => x.value === t)?.label ?? t).join(", ") : "all"}</p>
                    <p className="m-0">Visible to: {anVisibleTo} (from your profile visibility settings).</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!anSettings.alertsOn} disabled={togglingNow}
                      onChange={e => saveAnSettings({ ...anSettings, alertsOn: e.target.checked })} />
                    Instant matching alerts
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setAnEditing(true)}>Edit</Button>
                    <Button variant="outline" disabled={togglingNow} onClick={pauseAvailableNow}>Pause</Button>
                    <Button variant="outline" disabled={togglingNow} onClick={toggleAvailableNow}>{togglingNow ? "Updating…" : "Turn off"}</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500 m-0">Publish immediate, time-limited availability. It expires automatically so requesters never rely on stale information. Available Now is a Power Up ($24.99) that needs Shiftify Basic.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Available from (optional)</label>
                      <input type="datetime-local" value={fromInput} onChange={e => setFromInput(e.target.value)} className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" />
                      <p className="m-0 mt-1 text-[11px] text-slate-400">Leave blank to start now. A later time schedules it to switch on by itself.</p>
                      {anSettings.scheduledPending && anSettings.startsAt && <p className="m-0 mt-1 text-[11px] font-semibold text-emerald-700">Scheduled to start {new Date(anSettings.startsAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}.</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Available until</label>
                      <input type="datetime-local" value={untilInput} onChange={e => setUntilInput(e.target.value)} className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" />
                      <p className="m-0 mt-1 text-[11px] text-slate-400">Leave blank to keep it on for 24 hours, or turn it off yourself.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Area</label>
                      <select className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={anSettings.areaMode ?? "SAVED"} onChange={e => setAnSettings(s => ({ ...s, areaMode: e.target.value as "SAVED" | "TODAY" }))}>
                        <option value="SAVED">Use my saved travel area</option>
                        <option value="TODAY">Change for today</option>
                      </select>
                      {anSettings.areaMode === "TODAY" && <input className="mt-1.5 w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" placeholder="Suburb for today" value={anSettings.suburb ?? ""} onChange={e => setAnSettings(s => ({ ...s, suburb: e.target.value }))} />}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Maximum distance (km)</label>
                      <input type="number" min={1} className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={anSettings.maxDistanceKm ?? ""} onChange={e => setAnSettings(s => ({ ...s, maxDistanceKm: e.target.value ? Number(e.target.value) : undefined }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Services today</label>
                    <select className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={anSettings.servicesMode ?? "SAVED"} onChange={e => setAnSettings(s => ({ ...s, servicesMode: e.target.value as "SAVED" | "SELECT" }))}>
                      <option value="SAVED">Use my saved services</option>
                      <option value="SELECT">Select services</option>
                    </select>
                    {anSettings.servicesMode === "SELECT" && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {JOB_CATEGORIES.map(c => {
                          const on = (anSettings.services ?? []).includes(c.value);
                          return (
                            <button key={c.value} type="button" onClick={() => setAnSettings(s => ({ ...s, services: on ? (s.services ?? []).filter(x => x !== c.value) : [...(s.services ?? []), c.value] }))}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600"}`}>{c.label}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Request types</label>
                    <div className="flex flex-wrap gap-3">
                      {AN_REQUEST_TYPES.map(t => (
                        <label key={t.value} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={(anSettings.requestTypes ?? []).includes(t.value)}
                            onChange={e => setAnSettings(s => ({ ...s, requestTypes: e.target.checked ? [...(s.requestTypes ?? []), t.value] : (s.requestTypes ?? []).filter(x => x !== t.value) }))} />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!anSettings.overnight} onChange={e => setAnSettings(s => ({ ...s, overnight: e.target.checked }))} />Overnight</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!anSettings.transportParticipants} onChange={e => setAnSettings(s => ({ ...s, transportParticipants: e.target.checked }))} />Participant transport</label>
                  </div>
                  {nowError && (
                    <p className="text-xs text-red-600 m-0">
                      {nowError}{" "}
                      {/required|subscription/i.test(nowError) && <a href="/subscription" className="underline font-semibold">See Membership</a>}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button disabled={togglingNow} onClick={turnOnAvailableNow}>{togglingNow ? "Updating…" : availableNow ? "Save changes" : anPaused ? "Resume Available Now" : "Turn on Available Now"}</Button>
                    {anEditing && <Button variant="ghost" onClick={() => setAnEditing(false)}>Cancel</Button>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Availability listings — SW doc Windows 24-26 */}
        {isWorker && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Availability listings</CardTitle>
                <Button variant={showListingForm ? "outline" : "primary"} onClick={() => setShowListingForm(v => !v)}>
                  {showListingForm ? "Cancel" : "+ Post availability"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs text-slate-500 -mt-2">
                Post a general window of availability (e.g. ongoing, fortnightly, or backup/on-call) separate from your fixed weekly schedule below — requesters can browse these.
              </p>

              {showListingForm && (
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                      <select className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm"
                        value={listingType} onChange={e => setListingType(e.target.value as AvailabilityListing["listingType"])}>
                        {Object.entries(LISTING_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Visible to</label>
                      <select className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm"
                        value={listingVisibility} onChange={e => setListingVisibility(e.target.value as AvailabilityListing["visibility"])}>
                        <option value="ALL">Everyone browsing</option>
                        <option value="CONNECTIONS_ONLY">My connections only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Start date</label>
                      <input type="date" className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingStart} onChange={e => setListingStart(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">End date (optional)</label>
                      <input type="date" className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingEnd} onChange={e => setListingEnd(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Suburb</label>
                      <input className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingSuburb} onChange={e => setListingSuburb(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                      <input className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingState} onChange={e => setListingState(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Travel radius (km)</label>
                      <input type="number" min={0} className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingRadius} onChange={e => setListingRadius(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Rate ($/hr, optional)</label>
                      <input type="number" min={0} className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingRate} onChange={e => setListingRate(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Expires on (optional — otherwise stays active until you pause it)</label>
                      <input type="date" className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm" value={listingExpiresAt} onChange={e => setListingExpiresAt(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Services covered</label>
                    <div className="flex flex-wrap gap-1.5">
                      {JOB_CATEGORIES.map(c => {
                        const selected = listingServices.includes(c.value);
                        return (
                          <button key={c.value} type="button" onClick={() => toggleListingService(c.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              selected ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600"
                            }`}>
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button onClick={handleCreateListing} disabled={creatingListing || !listingStart || listingServices.length === 0}>
                    {creatingListing ? "Posting…" : "Post availability"}
                  </Button>
                </div>
              )}

              {listingsError && (
                <div style={{ background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-pink-hover)" }}>
                  {listingsError}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {([["ALL", "All"], ["ACTIVE", "Active"], ["RECURRING", "Recurring"], ["DRAFT", "Draft"], ["PAUSED", "Paused"], ["EXPIRED", "Expired"], ["ARCHIVED", "Archived"]] as const).map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setListTab(k)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${listTab === k ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{label}</button>
                ))}
              </div>

              {listingsLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : listings.length === 0 ? (
                <p className="text-sm text-slate-400">No availability listings posted yet.</p>
              ) : listings.filter(l => (listTab === "ALL" ? l.status !== "ARCHIVED" : false) || (listTab === "RECURRING" ? ["ONGOING", "FORTNIGHTLY"].includes(l.listingType) : l.status === listTab)).length === 0 ? (
                <p className="text-sm text-slate-400">Nothing in this tab.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {listings.filter(l => (listTab === "ALL" ? l.status !== "ARCHIVED" : false) || (listTab === "RECURRING" ? ["ONGOING", "FORTNIGHTLY"].includes(l.listingType) : l.status === listTab)).map(l => (
                    <div key={l.id} className="border border-slate-200 rounded-lg px-3.5 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {LISTING_TYPE_LABELS[l.listingType]}
                          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            l.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
                            : l.status === "PAUSED" ? "bg-amber-100 text-amber-700"
                            : l.status === "EXPIRED" ? "bg-slate-100 text-slate-500"
                            : "bg-slate-100 text-slate-500"
                          }`}>{l.status}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(l.startDate).toLocaleDateString("en-AU")}
                          {l.endDate && ` – ${new Date(l.endDate).toLocaleDateString("en-AU")}`}
                          {l.suburb && ` · ${l.suburb}${l.state ? `, ${l.state}` : ""}`}
                          {l.rate && ` · $${l.rate}/hr`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {l.status === "ACTIVE" && (
                          <Button size="sm" variant="outline" onClick={() => setListingStatus(l.id, "PAUSED")}>Pause</Button>
                        )}
                        {l.status === "PAUSED" && (
                          <Button size="sm" variant="outline" onClick={() => setListingStatus(l.id, "ACTIVE")}>Resume</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => extendListing(l)}>Extend</Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateListing(l)}>Duplicate</Button>
                        {l.status !== "ARCHIVED"
                          ? <Button size="sm" variant="outline" onClick={() => setListingStatus(l.id, "ARCHIVED")}>Archive</Button>
                          : <Button size="sm" variant="outline" onClick={() => setListingStatus(l.id, "ACTIVE")}>Restore</Button>}
                        <Button size="sm" variant="ghost" onClick={() => deleteListing(l.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weekly schedule */}
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle>Weekly schedule</CardTitle>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save schedule"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p style={{ color: "var(--td-muted)", fontSize: 14 }}>Loading...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DAYS.map(day => {
                  const enabled = isEnabled(day);
                  const slot    = getSlot(day);
                  return (
                    <div
                      key={day}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 16px", borderRadius: 10,
                        border: `1.5px solid ${enabled ? "var(--td-pink)" : "var(--td-border)"}`,
                        background: enabled ? "rgba(183,37,88,0.03)" : "var(--td-grey-tint)",
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Toggle */}
                      <div
                        onClick={() => toggleDay(day)}
                        style={{
                          width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                          background: enabled ? "var(--td-pink)" : "var(--td-border)",
                          position: "relative", transition: "background 0.2s", flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", background: "var(--td-white)",
                          position: "absolute", top: 2,
                          left: enabled ? 20 : 2,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(10,10,10,0.2)",
                        }} />
                      </div>

                      {/* Day label */}
                      <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: enabled ? "var(--td-ink-800)" : "var(--td-muted)" }}>
                        {DAY_LABELS[day]}
                      </div>

                      {/* Time range */}
                      {enabled ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={e => updateSlot(day, "startTime", e.target.value)}
                            style={inp}
                          />
                          <span style={{ fontSize: 13, color: "var(--td-muted)" }}>to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={e => updateSlot(day, "endTime", e.target.value)}
                            style={inp}
                          />
                          <span style={{ fontSize: 12, color: "var(--td-muted)" }}>
                            {/* hours diff */}
                            {(() => {
                              const [sh, sm] = slot.startTime.split(":").map(Number);
                              const [eh, em] = slot.endTime.split(":").map(Number);
                              const diff = (eh * 60 + em) - (sh * 60 + sm);
                              return diff > 0 ? `${(diff / 60).toFixed(1)}h` : "";
                            })()}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--td-border-hard)", fontStyle: "italic" }}>Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <div style={{ background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-pink-hover)", marginTop: 16 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: "var(--td-grey)", border: "1px solid var(--td-border-hard)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-ink-700)", marginTop: 16 }}>
                Schedule saved.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocked / unavailable dates */}
        <Card>
          <CardHeader><CardTitle>Blocked dates</CardTitle></CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Add form */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--td-dark-text-soft)", marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ ...inp, width: 150 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--td-dark-text-soft)", marginBottom: 4 }}>Reason (optional)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="e.g. Annual leave"
                  style={{ ...inp, width: "100%" }}
                />
              </div>
              <Button onClick={handleAddDate} disabled={!newDate || addingDate}>
                {addingDate ? "Adding..." : "Block date"}
              </Button>
            </div>

            {/* List */}
            {unavail.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--td-muted)" }}>No blocked dates. Add dates you're unavailable above.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {unavail
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid var(--td-pink-tint)", borderRadius: 10, background: "var(--td-pink-soft)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--td-ink-800)" }}>
                          {new Date(u.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        {u.note && <div style={{ fontSize: 12, color: "var(--td-muted-dark)", marginTop: 2 }}>{u.note}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(u.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--td-muted)", fontSize: 16, padding: 4 }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
