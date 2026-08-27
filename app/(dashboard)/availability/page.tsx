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
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  DATE_RANGE: "Specific date range", FORTNIGHTLY: "Fortnightly pattern",
  ONGOING: "Ongoing", BACKUP: "Backup / on-call",
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
  const [togglingNow, setTogglingNow] = useState(false);
  const [nowError, setNowError] = useState<string | null>(null);

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
  async function toggleAvailableNow() {
    setTogglingNow(true);
    setNowError(null);
    try {
      const next = !availableNow;
      const until = next && untilInput ? new Date(untilInput).toISOString() : null;
      await api.patch("/users/me/profile/worker", { isAvailableNow: next, availableNowUntil: until });
      setAvailableNow(next);
      setAvailableNowSetAt(next ? new Date().toISOString() : null);
      setAvailableNowUntil(next ? until : null);
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
          <p style={{ color: "#64748b", fontSize: 14 }}>Availability management is only available for Support Workers and Providers.</p>
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    height: 36, padding: "0 10px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 13, outline: "none", background: "#fff",
  };

  return (
    <>
      <PageHeader title="My Availability" description="Set the days and hours you're available for work." />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Available Now Power Up — SW doc §12, windows 22-23 */}
        {isWorker && (
          <Card>
            <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {availableNow ? "🟢 Available Now" : "Available Now"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {availableNow
                    ? availableNowUntil
                      ? `Visible to requesters right now — clears at ${new Date(availableNowUntil).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}.`
                      : `Visible to requesters right now — clears automatically 24h after you turned it on${availableNowSetAt ? ` (${new Date(availableNowSetAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })})` : ""}.`
                    : "Signal that you're free to start right now, on top of your normal weekly schedule below."}
                </p>
                {!availableNow && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Available until (optional)</label>
                    <input type="datetime-local" value={untilInput} onChange={e => setUntilInput(e.target.value)}
                      className="h-8 px-2 border border-slate-200 rounded-md text-xs" />
                  </div>
                )}
                {nowError && <p className="text-xs text-red-600 mt-1">{nowError}</p>}
              </div>
              <Button variant={availableNow ? "outline" : "primary"} disabled={togglingNow} onClick={toggleAvailableNow}>
                {togglingNow ? "Updating…" : availableNow ? "Turn off" : "Turn on Available Now"}
              </Button>
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
                <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
                  {listingsError}
                </div>
              )}

              {listingsLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : listings.length === 0 ? (
                <p className="text-sm text-slate-400">No availability listings posted yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {listings.map(l => (
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
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
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
                        border: `1.5px solid ${enabled ? "#c2185b" : "#e2e8f0"}`,
                        background: enabled ? "rgba(194,24,91,0.03)" : "#fafafa",
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Toggle */}
                      <div
                        onClick={() => toggleDay(day)}
                        style={{
                          width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                          background: enabled ? "#c2185b" : "#e2e8f0",
                          position: "relative", transition: "background 0.2s", flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", background: "#fff",
                          position: "absolute", top: 2,
                          left: enabled ? 20 : 2,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }} />
                      </div>

                      {/* Day label */}
                      <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: enabled ? "#1e293b" : "#94a3b8" }}>
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
                          <span style={{ fontSize: 13, color: "#94a3b8" }}>to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={e => updateSlot(day, "endTime", e.target.value)}
                            style={inp}
                          />
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>
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
                        <span style={{ fontSize: 13, color: "#cbd5e1", fontStyle: "italic" }}>Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828", marginTop: 16 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#2E7D32", marginTop: 16 }}>
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ ...inp, width: 150 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Reason (optional)</label>
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
              <p style={{ fontSize: 13, color: "#94a3b8" }}>No blocked dates. Add dates you're unavailable above.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {unavail
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid #fee2e2", borderRadius: 10, background: "#fff5f5" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          {new Date(u.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        {u.note && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{u.note}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(u.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 4 }}
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
