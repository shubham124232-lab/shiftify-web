"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

interface Invoice {
  id: string;
  sentAt: string;
  hours: number | null;
  note: string | null;
  job: { id: string; title: string; status: string };
  sender: { id: string; name: string };
  planManager: { id: string; name: string };
  participant: { id: string; name: string };
}

const JOB_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  IN_PROGRESS:  { bg: "var(--td-dark-text)", color: "var(--td-white)" },
  CONFIRMED:    { bg: "var(--td-border)", color: "var(--td-dark-text)" },
  COMPLETED:    { bg: "var(--td-grey-tint)", color: "var(--td-muted-dark)" },
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    api.get<{ invoices: Invoice[] }>("/invoices")
      .then(r => setInvoices(r.invoices ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Invoices" description="All invoices sent or received through Shiftify." />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

        {error && (
          <div style={{ background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-pink-hover)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--td-muted)", fontSize: 14 }}>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 20px" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🧾</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--td-dark-text-soft)" }}>No invoices yet</p>
            <p style={{ fontSize: 13, color: "var(--td-muted)", marginTop: 6, maxWidth: 360, margin: "6px auto 0" }}>
              Invoices appear here once a job is completed and submitted to a plan manager.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {invoices.map(inv => {
              const jobSta = JOB_STATUS_STYLE[inv.job.status] ?? { bg: "var(--td-grey)", color: "var(--td-dark-text-soft)" };
              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  style={{
                    background: "var(--td-white)", border: "1.5px solid var(--td-border)", borderRadius: 12,
                    padding: "16px 20px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--td-pink)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(183,37,88,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--td-border)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Job title */}
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--td-ink-800)", marginBottom: 6 }}>
                        {inv.job.title}
                      </div>
                      {/* Key details row */}
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--td-muted-dark)" }}>
                        <span>👷 <strong style={{ color: "var(--td-dark-text-soft)" }}>{inv.sender.name}</strong></span>
                        <span>👤 Participant: <strong style={{ color: "var(--td-dark-text-soft)" }}>{inv.participant.name}</strong></span>
                        <span>📋 PM: <strong style={{ color: "var(--td-dark-text-soft)" }}>{inv.planManager.name}</strong></span>
                        {inv.hours && <span>⏱ <strong style={{ color: "var(--td-dark-text-soft)" }}>{inv.hours}h</strong></span>}
                      </div>
                      {inv.note && (
                        <div style={{ fontSize: 12, color: "var(--td-muted)", marginTop: 6, fontStyle: "italic" }}>
                          "{inv.note.length > 120 ? inv.note.slice(0, 120) + "..." : inv.note}"
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: jobSta.bg, color: jobSta.color }}>
                        {inv.job.status.replace("_", " ")}
                      </span>
                      <div style={{ fontSize: 11, color: "var(--td-muted)", marginTop: 8 }}>
                        {new Date(inv.sentAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
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
