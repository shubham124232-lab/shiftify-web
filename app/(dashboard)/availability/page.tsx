"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
  day: string;      // MON | TUE | WED | THU | FRI | SAT | SUN
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
}

interface UnavailDate {
  id: string;
  date: string;     // ISO date "2025-06-15"
  note: string | null;
}

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

  useEffect(() => {
    if (activeRole !== UserRole.SUPPORT_WORKER) return;
    setLoading(true);
    api.get<{ availability: TimeSlot[]; unavailability: UnavailDate[] }>("/users/me/availability")
      .then(r => {
        setSlots(r.availability ?? []);
        setUnavail(r.unavailability ?? []);
      })
      .catch(() => {}) // no profile yet — leave empty
      .finally(() => setLoading(false));
  }, [activeRole]);

  // ── Slot helpers ────────────────────────────────────────────────────────────

  function isEnabled(day: string) {
    return slots.some(s => s.day === day);
  }

  function getSlot(day: string): TimeSlot {
    return slots.find(s => s.day === day) ?? { day, startTime: DEFAULT_START, endTime: DEFAULT_END };
  }

  function toggleDay(day: string) {
    if (isEnabled(day)) {
      setSlots(prev => prev.filter(s => s.day !== day));
    } else {
      setSlots(prev => [...prev, { day, startTime: DEFAULT_START, endTime: DEFAULT_END }]);
    }
  }

  function updateSlot(day: string, field: "startTime" | "endTime", value: string) {
    setSlots(prev => {
      const existing = prev.find(s => s.day === day);
      if (existing) return prev.map(s => s.day === day ? { ...s, [field]: value } : s);
      return [...prev, { day, startTime: DEFAULT_START, endTime: DEFAULT_END, [field]: value }];
    });
  }

  // ── Save slots ───────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false);
    try {
      await api.put("/users/me/availability", { slots });
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

  // ── Non-worker guard ─────────────────────────────────────────────────────────

  if (activeRole !== UserRole.SUPPORT_WORKER) {
    return (
      <>
        <PageHeader title="Availability" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>Availability management is only available for Support Workers.</p>
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
