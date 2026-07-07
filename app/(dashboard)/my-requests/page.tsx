"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

interface Request {
  id: string;
  title: string;
  category: string;
  urgency: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  status: string;
  postedAt: string;
  _count?: { applications: number };
}

const STATUS_TABS = [
  { key: "",           label: "All" },
  { key: "DRAFT",      label: "Draft" },
  { key: "OPEN",       label: "Open" },
  { key: "ASSIGNED",   label: "Assigned" },
  { key: "IN_PROGRESS",label: "In Progress" },
  { key: "COMPLETED",  label: "Completed" },
  { key: "CONFIRMED",  label: "Confirmed" },
  { key: "CANCELLED",  label: "Cancelled" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT:       { bg: "#f1f5f9", color: "#64748b" },
  OPEN:        { bg: "#dbeafe", color: "#1d4ed8" },
  ASSIGNED:    { bg: "#dcfce7", color: "#15803d" },
  IN_PROGRESS: { bg: "#fef9c3", color: "#854d0e" },
  COMPLETED:   { bg: "#f1f5f9", color: "#475569" },
  CONFIRMED:   { bg: "#dcfce7", color: "#15803d" },
  CANCELLED:   { bg: "#fee2e2", color: "#b91c1c" },
};

const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  EMERGENCY: { bg: "#fee2e2", color: "#b91c1c" },
  SAME_DAY:  { bg: "#ffedd5", color: "#c2410c" },
  SCHEDULED: { bg: "#f1f5f9", color: "#475569" },
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState("");

  useEffect(() => {
    setLoading(true);
    api.get<{ jobs: Request[] }>("/jobs/my")
      .then(r => setRequests(r.jobs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = tab ? requests.filter(r => r.status === tab) : requests;

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = t.key ? requests.filter(r => r.status === t.key).length : requests.length;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="My Requests"
        description="All support requests you've posted"
        actions={<Link href="/jobs/post"><Button>+ New Request</Button></Link>}
      />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: tab === t.key ? "2px solid #c2185b" : "1.5px solid #e2e8f0",
                background: tab === t.key ? "rgba(194,24,91,0.08)" : "#fff",
                color: tab === t.key ? "#c2185b" : "#64748b",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span style={{ marginLeft: 5, background: tab === t.key ? "rgba(194,24,91,0.15)" : "#f1f5f9", borderRadius: 10, padding: "1px 6px", fontSize: 11 }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {tab ? `No ${tab.replace("_", " ").toLowerCase()} requests` : "No requests yet"}
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
              Post a support request to find workers and providers.
            </p>
            <Link href="/jobs/post"><Button>Post a Request</Button></Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.map(req => {
              const s = STATUS_STYLE[req.status] ?? { bg: "#f1f5f9", color: "#475569" };
              const u = URGENCY_STYLE[req.urgency] ?? URGENCY_STYLE.SCHEDULED;
              const catLabel = JOB_CATEGORIES.find(c => c.value === req.category)?.label ?? req.category;
              const appCount = req._count?.applications ?? 0;

              return (
                <Card key={req.id}>
                  <CardContent style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                            {req.status.replace("_", " ")}
                          </span>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.bg, color: u.color }}>
                            {req.urgency.replace("_", " ")}
                          </span>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, background: "#f1f5f9", color: "#64748b" }}>
                            {catLabel}
                          </span>
                        </div>

                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{req.title}</div>

                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                          <span>📍 {req.suburb}, {req.state}</span>
                          {req.totalHours && <span>⏱ {req.totalHours}h</span>}
                          <span>📅 {new Date(req.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span>Posted {new Date(req.postedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                        {appCount > 0 && (
                          <div style={{ textAlign: "center", background: "rgba(194,24,91,0.07)", borderRadius: 10, padding: "6px 12px" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#c2185b" }}>{appCount}</div>
                            <div style={{ fontSize: 10, color: "#c2185b", fontWeight: 600 }}>applicant{appCount !== 1 ? "s" : ""}</div>
                          </div>
                        )}
                        <Link href={`/jobs/${req.id}`}>
                          <Button size="sm" variant={appCount > 0 ? undefined : "outline"}>
                            {appCount > 0 ? "Review Applicants" : "View"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
