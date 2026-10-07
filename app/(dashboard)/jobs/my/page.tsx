"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Job {
  id: string; title: string; category: string; urgency: string;
  suburb: string; state: string; scheduledStartAt: string;
  totalHours: number | null; status: string; postedAt: string;
  _count?: { applications: number };
}

const TIER_LABELS: Record<string, string> = {
  RAPID: "Rapid", URGENT: "Urgent", LAST_MINUTE: "Last-Minute", ROUTINE: "Routine",
};

// ── Publish draft (owner only) ──────────────────────────────────────────────
// PATCH /jobs/:id/publish flips DRAFT → OPEN. Backend endpoint already existed;
// there was previously no button anywhere in the UI that called it.
function PublishButton({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [publishing, setPublishing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function publish(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setPublishing(true);
    setErr(null);
    try {
      await api.patch(`/jobs/${jobId}/publish`, {});
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {err && <span style={{ fontSize: 11, color: "var(--td-pink-hover)" }}>{err}</span>}
      <Button size="sm" disabled={publishing} onClick={publish}>
        {publishing ? "Publishing..." : "Publish"}
      </Button>
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  OPEN:         { bg: "var(--td-pink-tint)", color: "var(--td-pink-hover)" },
  ASSIGNED:     { bg: "var(--td-grey)", color: "var(--td-ink-700)" },
  IN_PROGRESS:  { bg: "var(--td-dark-text)", color: "var(--td-white)" },
  CONFIRMED:    { bg: "var(--td-border)", color: "var(--td-dark-text)" },
  COMPLETED:    { bg: "var(--td-grey-tint)", color: "var(--td-muted-dark)" },
  CANCELLED:    { bg: "var(--td-pink)", color: "var(--td-white)" },
};

export default function MyJobsPage() {
  const { activeRole } = useAuth();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [responseFilter, setResponseFilter] = useState<"" | "NEW_RESPONSES" | "UNFILLED">("");
  // SC-M01 — one "Which requests would you like to see?" row for Coordinators.
  const [scView, setScView] = useState("ALL");

  function load() {
    setLoading(true);
    return api.get<{ jobs: Job[] }>("/jobs/my")
      .then(r => setJobs(r.jobs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canPost = ["PARTICIPANT", "COORDINATOR", "PROVIDER"].includes(activeRole ?? "");
  const isProvider = activeRole === "PROVIDER";
  const isWorker   = activeRole === "SUPPORT_WORKER";
  const scMatch = (j: Job): boolean => {
    switch (scView) {
      case "RAPID": case "URGENT": case "LAST_MINUTE": case "ROUTINE": return j.urgency === scView;
      case "NEW_RESPONSES": return j.status === "OPEN" && (j._count?.applications ?? 0) > 0;
      case "SHORTLISTED": return (j as Job & { shortlistedCount?: number }).shortlistedCount ? (j as Job & { shortlistedCount?: number }).shortlistedCount! > 0 : false;
      case "CONFIRMED": return j.status === "CONFIRMED" || j.status === "ASSIGNED" || j.status === "IN_PROGRESS";
      case "UNFILLED": return j.status === "OPEN" && (j._count?.applications ?? 0) === 0;
      case "COMPLETED": return j.status === "COMPLETED";
      case "CANCELLED": return j.status === "CANCELLED";
      default: return true;
    }
  };
  const shown = jobs
    .filter(j => (activeRole === "COORDINATOR" ? scMatch(j) : true))
    .filter(j => activeRole === "COORDINATOR" || !filter || j.status === filter)
    .filter(j => activeRole === "COORDINATOR" || !tierFilter || j.urgency === tierFilter)
    .filter(j => {
      if (activeRole === "COORDINATOR") return true;
      if (responseFilter === "NEW_RESPONSES") return j.status === "OPEN" && (j._count?.applications ?? 0) > 0;
      if (responseFilter === "UNFILLED") return j.status === "OPEN" && (j._count?.applications ?? 0) === 0;
      return true;
    });

  const isCoordinator = activeRole === "COORDINATOR";
  const pageTitle = isCoordinator ? "Requests & Responses" : isWorker ? "My Jobs" : "My Requests";
  const pageDesc  = isCoordinator
    ? "Support requests you've posted and the responses they've received."
    : isProvider
      ? "Staffing requests you've posted and the responses they've received."
      : isWorker
        ? "Requests you've connected with or been assigned to."
        : "Support requests you've posted, and the responses they've received.";
  const postLabel = isProvider ? "Post a staffing request" : "Post a support request";

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={pageDesc}
        actions={canPost ? <Link href="/jobs/post"><Button>+ {postLabel}</Button></Link> : undefined}
      />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

        {activeRole === "COORDINATOR" && (
          <div className="flex gap-2 flex-wrap mb-5" aria-label="Which requests would you like to see?">
            {([
              ["ALL", "All"], ["RAPID", "Rapid"], ["URGENT", "Urgent"], ["LAST_MINUTE", "Last-Minute"], ["ROUTINE", "Routine"],
              ["NEW_RESPONSES", "New responses"], ["SHORTLISTED", "Shortlisted"], ["CONFIRMED", "Confirmed"],
              ["UNFILLED", "Unfilled"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"],
            ] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setScView(v)}
                className={`h-8 px-3 rounded-full border text-xs font-semibold transition-colors ${scView === v ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Status filter pills */}
        <div style={{ display: activeRole === "COORDINATOR" ? "none" : "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {(canPost
            ? ["", "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED", "DRAFT"]
            : ["", "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED"]
          ).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: filter === s ? "2px solid var(--td-pink)" : "1.5px solid var(--td-border)",
                background: filter === s ? "rgba(183,37,88,0.08)" : "var(--td-white)",
                color: filter === s ? "var(--td-pink)" : "var(--td-muted-dark)",
              }}
            >
              {s ? s.replace("_", " ") : "All"}
            </button>
          ))}
        </div>

        {/* Tier filter pills */}
        <div className={`${activeRole === "COORDINATOR" ? "hidden" : "flex"} gap-2 flex-wrap mb-3`}>
          {(["", "RAPID", "URGENT", "LAST_MINUTE", "ROUTINE"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTierFilter(t)}
              className={`h-7 px-3 rounded-full border text-xs font-medium transition-colors ${tierFilter === t ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {t ? TIER_LABELS[t] ?? t : "All tiers"}
            </button>
          ))}
        </div>

        {/* Response-based filter pills */}
        <div className={`${activeRole === "COORDINATOR" ? "hidden" : "flex"} gap-2 flex-wrap mb-5`}>
          {([
            { v: "", l: "Any response status" },
            { v: "NEW_RESPONSES", l: "New responses" },
            { v: "UNFILLED", l: "Unfilled" },
          ] as const).map((opt) => (
            <button key={opt.v} type="button" onClick={() => setResponseFilter(opt.v)}
              className={`h-7 px-3 rounded-full border text-xs font-medium transition-colors ${responseFilter === opt.v ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {opt.l}
            </button>
          ))}
        </div>

        {error && <div style={{ background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-pink-hover)", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <p style={{ color: "var(--td-muted)", fontSize: 14 }}>Loading...</p>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--td-dark-text-soft)" }}>
              {isWorker ? "No jobs yet" : "No requests yet"}
            </p>
            {canPost && <Link href="/jobs/post"><Button style={{ marginTop: 16 }}>{isProvider ? "Post your first staffing request" : "Post your first request"}</Button></Link>}
            {(isProvider || isWorker) && (
              <Link href="/jobs"><Button variant="outline" style={{ marginTop: 16, marginLeft: canPost ? 8 : 0 }}>{isProvider ? "Find support opportunities" : "Find shifts"}</Button></Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map(job => {
              const s = STATUS_STYLE[job.status] ?? { bg: "var(--td-grey)", color: "var(--td-dark-text-soft)" };
              return (
                <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--td-white)", border: "1.5px solid var(--td-border)", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--td-ink-800)", marginBottom: 4 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: "var(--td-muted-dark)" }}>
                        📍 {job.suburb}, {job.state}
                        {job.totalHours && <span> · {job.totalHours}h</span>}
                        {" · "}{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0 }}>
                      {job.status.replace("_", " ")}
                    </span>
                    {canPost && job.status === "DRAFT" && (
                      <PublishButton jobId={job.id} onDone={load} />
                    )}
                  </div>
                </Link>
              );
            })}
           </div>
        )}
      </div>
    </>
  );
}
