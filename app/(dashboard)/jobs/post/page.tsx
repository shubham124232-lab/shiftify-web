"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { URGENCY_TIERS } from "@/lib/constants/urgency";
import { UserRole } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4,
};

const STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];

export default function PostJobPage() {
  const router = useRouter();
  const { activeRole } = useAuth();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState<string>(JOB_CATEGORIES[0].value);
  const [urgency,     setUrgency]     = useState("SCHEDULED");
  const [suburb,      setSuburb]      = useState("");
  const [state,       setState]       = useState("NSW");
  const [postcode,    setPostcode]    = useState("");
  const [startAt,     setStartAt]     = useState("");
  const [endAt,       setEndAt]       = useState("");
  const [totalHours,  setTotalHours]  = useState("");
  const [participantId, setParticipantId] = useState("");
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);
  const [showNewP,    setShowNewP]    = useState(false);
  const [newPName,    setNewPName]    = useState("");
  const [newPUser,    setNewPUser]    = useState("");
  const [newPPass,    setNewPPass]    = useState("");
  const [creatingP,   setCreatingP]   = useState(false);
  const [asDraft,     setAsDraft]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (activeRole === UserRole.COORDINATOR) {
      api.get<{ users: { id: string; name: string }[] }>("/linking/participants")
        .then(r => setParticipants(r.users ?? []))
        .catch(() => {});
    }
  }, [activeRole]);

  async function handleCreateParticipant() {
    if (!newPName.trim() || !newPUser.trim() || newPPass.length < 8) return;
    setCreatingP(true);
    try {
      const res = await api.post<{ user: { id: string; name: string } }>("/linking/participants", {
        name: newPName.trim(), username: newPUser.trim().toLowerCase(), password: newPPass,
      });
      const created = { id: res.user.id, name: res.user.name };
      setParticipants(prev => [...prev, created]);
      setParticipantId(created.id);
      setShowNewP(false); setNewPName(""); setNewPUser(""); setNewPPass("");
    } catch (err: any) { setError(err?.message ?? "Failed to create participant."); }
    finally { setCreatingP(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    if (!suburb.trim()) { setError("Suburb is required."); return; }
    if (!startAt) { setError("Start date/time is required."); return; }
    if (!endAt) { setError("End date/time is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        urgency,
        suburb: suburb.trim(),
        state,
        postcode: postcode.trim() || undefined,
        scheduledStartAt: new Date(startAt).toISOString(),
        scheduledEndAt: new Date(endAt).toISOString(),
        totalHours: totalHours ? parseFloat(totalHours) : undefined,
        asDraft,
      };
      if (activeRole === UserRole.COORDINATOR && participantId.trim()) {
        body.forParticipantUserId = participantId.trim();
      }
      const res = await api.post<{ job: { id: string } }>("/jobs", body);
      router.push(`/jobs/${res.job.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to post job.");
    } finally {
      setSaving(false);
    }
  }

  if (activeRole && !["PARTICIPANT", "COORDINATOR"].includes(activeRole)) {
    return (
      <>
        <PageHeader title="Post a Support Request" />
        <div style={{ padding: "32px 20px", color: "#64748b", fontSize: 14 }}>
          Only participants and support coordinators can post support requests.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Post a Support Request" description="Fill in the details and publish to the marketplace." />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <Card>
            <CardHeader><CardTitle>Job details</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Personal care support – morning routine" />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} placeholder="Describe what support is needed..."
                  style={{ ...inp, height: "auto", padding: "8px 10px", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp }}>
                    {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Urgency</label>
                  <select value={urgency} onChange={e => setUrgency(e.target.value)} style={{ ...inp }}>
                    {URGENCY_TIERS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Suburb *</label>
                  <input style={inp} value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="Parramatta" />
                </div>
                <div>
                  <label style={lbl}>State</label>
                  <select value={state} onChange={e => setState(e.target.value)} style={{ ...inp }}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Postcode</label>
                  <input style={inp} value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="2150" maxLength={4} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Start date & time *</label>
                  <input type="datetime-local" style={inp} value={startAt} onChange={e => setStartAt(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>End date & time *</label>
                  <input type="datetime-local" style={inp} value={endAt} onChange={e => setEndAt(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Total hours (optional)</label>
                <input type="number" step="0.5" min="0.5" style={{ ...inp, width: 140 }} value={totalHours} onChange={e => setTotalHours(e.target.value)} placeholder="2.5" />
              </div>
            </CardContent>
          </Card>

          {activeRole === UserRole.COORDINATOR && (
            <Card>
              <CardHeader><CardTitle>Posting for participant</CardTitle></CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={lbl}>Select participant (optional — leave blank to post as yourself)</label>
                  <select style={inp} value={participantId} onChange={e => setParticipantId(e.target.value)}>
                    <option value="">— post as myself —</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Inline create */}
                {!showNewP ? (
                  <button
                    type="button"
                    onClick={() => setShowNewP(true)}
                    style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#c2185b", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    + Create new participant
                  </button>
                ) : (
                  <div style={{ background: "#fdf2f8", border: "1.5px solid #f9a8d4", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#c2185b", marginBottom: 2 }}>New participant</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={lbl}>Full name *</label>
                        <input style={inp} value={newPName} onChange={e => setNewPName(e.target.value)} placeholder="Jane Smith" />
                      </div>
                      <div>
                        <label style={lbl}>Username *</label>
                        <input style={inp} value={newPUser} onChange={e => setNewPUser(e.target.value.toLowerCase())} placeholder="jane.smith" autoComplete="off" />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Temporary password * (min 8 chars)</label>
                      <input style={inp} type="password" value={newPPass} onChange={e => setNewPPass(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleCreateParticipant}
                        disabled={creatingP || !newPName.trim() || !newPUser.trim() || newPPass.length < 8}
                        style={{ height: 36, padding: "0 16px", background: "#c2185b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (creatingP || !newPName.trim() || !newPUser.trim() || newPPass.length < 8) ? 0.6 : 1 }}
                      >
                        {creatingP ? "Creating..." : "Create & select"}
                      </button>
                      <button type="button" onClick={() => setShowNewP(false)} style={{ height: 36, padding: "0 14px", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#64748b" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="submit"
              disabled={saving}
              style={{ height: 44, padding: "0 28px", background: "#c2185b", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Posting..." : asDraft ? "Save as draft" : "Publish job"}
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
              <input type="checkbox" checked={asDraft} onChange={e => setAsDraft(e.target.checked)} />
              Save as draft
            </label>
          </div>
        </form>
      </div>
    </>
  );
}
