"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";

interface Job {
  id: string; title: string; category: string; urgency: string;
  suburb: string; state: string; scheduledStartAt: string;
  totalHours: number | null; postedAt: string; status: string;
  ownApplication?: { status: string } | null;
}

const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  EMERGENCY: { bg: "#fee2e2", color: "#b91c1c" },
  SAME_DAY:  { bg: "#ffedd5", color: "#c2410c" },
  SCHEDULED: { bg: "#f1f5f9", color: "#475569" },
};

export default function JobsBrowsePage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [suburb,  setSuburb]  = useState("");
  const [category, setCategory] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams({ status: "OPEN" });
    if (suburb)   params.set("suburb", suburb);
    if (category) params.set("category", category);
    api.get<{ jobs: Job[] }>(`/jobs?${params}`)
      .then(r => setJobs(r.jobs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApply(id: string) {
    setApplying(id);
    try {
      await api.post(`/jobs/${id}/apply`, {});
      load();
    } catch (e: any) { setError(e.message); }
    finally { setApplying(null); }
  }

  const canPost = ["PARTICIPANT", "COORDINATOR", "PROVIDER"].includes(activeRole ?? "");
  const canApply = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");

  return (
    <>
      <PageHeader
        title="Browse Jobs"
        description="Open support requests near you."
        actions={canPost ? <Link href="/jobs/post"><Button>+ Post a job</Button></Link> : undefined}
      />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <input
            placeholder="Filter by suburb..."
            value={suburb} onChange={e => setSuburb(e.target.value)}
            style={{ height: 38, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: 180 }}
          />
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            style={{ height: 38, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}
          >
            <option value="">All categories</option>
            {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <Button type="button" variant="outline" onClick={load}>Search</Button>
        </div>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No open jobs found</p>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {jobs.map(job => {
              const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.SCHEDULED;
              const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
              const applied = !!job.ownApplication;
              return (
                <div key={job.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: urg.bg, color: urg.color }}>
                        {job.urgency.replace("_", " ")}
                      </span>
                      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>
                        {catLabel}
                      </span>
                    </div>
                    <Link href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4, cursor: "pointer" }}>{job.title}</div>
                    </Link>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      📍 {job.suburb}, {job.state}
                      {job.totalHours && <span> · {job.totalHours}h</span>}
                      {" · "}{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/jobs/${job.id}`)}>View</Button>
                    {canApply && (
                      <Button
                        size="sm"
                        variant={applied ? "ghost" : "outline"}
                        disabled={applied || applying === job.id}
                        onClick={() => !applied && handleApply(job.id)}
                      >
                        {applied ? `Applied (${job.ownApplication!.status})` : applying === job.id ? "Applying..." : "Apply"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
