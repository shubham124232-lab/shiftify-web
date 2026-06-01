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
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  OPEN:      { bg: "#dbeafe", color: "#1d4ed8" },
  ASSIGNED:  { bg: "#dcfce7", color: "#15803d" },
  IN_PROGRESS: { bg: "#fef9c3", color: "#854d0e" },
  COMPLETED: { bg: "#f1f5f9", color: "#475569" },
  CONFIRMED: { bg: "#dcfce7", color: "#15803d" },
  CANCELLED: { bg: "#fee2e2", color: "#b91c1c" },
};

export default function MyJobsPage() {
  const { activeRole } = useAuth();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState("");

  useEffect(() => {
    setLoading(true);
    api.get<{ jobs: Job[] }>("/jobs/my")
      .then(r => setJobs(r.jobs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canPost = ["PARTICIPANT", "COORDINATOR"].includes(activeRole ?? "");
  const shown = filter ? jobs.filter(j => j.status === filter) : jobs;

  return (
    <>
      <PageHeader
        title="My Jobs"
        description="Jobs you've posted or been assigned to."
        actions={canPost ? <Link href="/jobs/post"><Button>+ Post a job</Button></Link> : undefined}
      />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {["", "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: filter === s ? "2px solid #c2185b" : "1.5px solid #e2e8f0",
                background: filter === s ? "rgba(194,24,91,0.08)" : "#fff",
                color: filter === s ? "#c2185b" : "#64748b",
              }}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No jobs yet</p>
            {canPost && <Link href="/jobs/post"><Button style={{ marginTop: 16 }}>Post your first job</Button></Link>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map(job => {
              const s = STATUS_STYLE[job.status] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        📍 {job.suburb}, {job.state}
                        {job.totalHours && <span> · {job.totalHours}h</span>}
                        {" · "}{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0 }}>
                      {job.status.replace("_", " ")}
                    </span>
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
