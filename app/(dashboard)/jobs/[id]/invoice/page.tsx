"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  suburb: string;
  state: string;
  postcode: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string | null;
  totalHours: number | null;
  status: string;
  poster: { id: string; name: string };
  assignedWorker: { id: string; name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5,
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ width: 160, flexShrink: 0, fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1e293b", flex: 1 }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateInvoicePage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { user }  = useAuth();

  const [job,     setJob]     = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  // Form fields
  const [planManagerUserId,  setPlanManagerUserId]  = useState("");
  const [participantUserId,  setParticipantUserId]  = useState("");
  const [hours,              setHours]              = useState("");
  const [note,               setNote]               = useState("");
  const [saving,             setSaving]             = useState(false);

  useEffect(() => {
    api.get<{ job: JobDetail }>(`/jobs/${id}`)
      .then(r => {
        setJob(r.job);
        // Pre-fill hours from job if available
        if (r.job.totalHours) setHours(String(r.job.totalHours));
        // Pre-fill participant if poster is participant
        setParticipantUserId(r.job.poster.id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!planManagerUserId.trim()) { setError("Plan Manager user ID is required."); return; }
    if (!participantUserId.trim()) { setError("Participant user ID is required."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/jobs/${id}/invoice`, {
        planManagerUserId: planManagerUserId.trim(),
        participantUserId: participantUserId.trim(),
        hours: hours ? parseFloat(hours) : undefined,
        note: note.trim() || undefined,
      });
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to send invoice.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading job details...</div>;
  if (!job && error) return <div style={{ padding: 40, color: "#b91c1c" }}>{error}<br /><Link href={`/jobs/${id}`}><Button style={{ marginTop: 16 }}>Back to job</Button></Link></div>;
  if (!job) return null;

  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;

  // ── Success screen ──────────────────────────────────────────────────────────

  if (sent) {
    return (
      <>
        <PageHeader title="Invoice Sent" />
        <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
          <div style={{ background: "#fff", border: "1.5px solid #a7f3d0", borderRadius: 16, padding: 40, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              ✅
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Invoice sent successfully</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>
              The plan manager has been notified and will see the full job details, who performed the work, and the time taken.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Button onClick={() => router.push(`/jobs/${id}`)}>Back to job</Button>
              <Button variant="ghost" onClick={() => router.push("/jobs/my")}>My jobs</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Send Invoice"
        description="Submit this job's details to a plan manager for NDIS claim processing."
      />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Job summary — pre-filled, read-only ── */}
        <Card>
          <CardHeader><CardTitle>Job details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Job title"      value={<strong>{job.title}</strong>} />
            <DetailRow label="Description"    value={job.description ?? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No description</span>} />
            <DetailRow label="Service type"   value={catLabel} />
            <DetailRow label="Urgency"        value={job.urgency.replace("_", " ")} />
            <DetailRow label="Location"       value={`${job.suburb}, ${job.state}${job.postcode ? ` ${job.postcode}` : ""}`} />
            <DetailRow label="Scheduled start" value={new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })} />
            {job.scheduledEndAt && (
              <DetailRow label="Scheduled end" value={new Date(job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })} />
            )}
            <DetailRow label="Total hours"    value={job.totalHours ? `${job.totalHours} hours` : <span style={{ color: "#94a3b8" }}>Not specified</span>} />
            <DetailRow label="Posted by"      value={job.poster.name} />
            <DetailRow label="Performed by"   value={job.assignedWorker?.name ?? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Not yet assigned</span>} />
            <DetailRow label="Job status"     value={
              <span style={{
                padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: job.status === "COMPLETED" ? "#dcfce7" : "#fef9c3",
                color:      job.status === "COMPLETED" ? "#15803d" : "#854d0e",
              }}>
                {job.status.replace("_", " ")}
              </span>
            } />
          </CardContent>
        </Card>

        {/* ── Invoice form ── */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Invoice details</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#475569" }}>
                <strong>How this works:</strong> Enter the plan manager's user ID and confirm the participant. The plan manager will be notified immediately and can see every job detail above.
              </div>

              <div>
                <label style={lbl}>Plan Manager user ID <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  style={inp}
                  value={planManagerUserId}
                  onChange={e => setPlanManagerUserId(e.target.value)}
                  placeholder="e.g. cm123abc..."
                />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Ask the participant's plan manager for their Shiftify user ID.</p>
              </div>

              <div>
                <label style={lbl}>Participant user ID <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  style={inp}
                  value={participantUserId}
                  onChange={e => setParticipantUserId(e.target.value)}
                  placeholder="e.g. cm456def..."
                />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pre-filled from the job poster. Edit only if different.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lbl}>Actual hours worked</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    style={inp}
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    placeholder={job.totalHours ? String(job.totalHours) : "e.g. 3.5"}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#475569" }}>
                    <strong>Scheduled:</strong> {job.totalHours ? `${job.totalHours}h` : "Not set"}
                  </div>
                </div>
              </div>

              <div>
                <label style={lbl}>Notes (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  placeholder="Any additional context — travel, complexity, specific tasks completed..."
                  style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                <Button type="submit" loading={saving}>Send invoice to plan manager</Button>
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
