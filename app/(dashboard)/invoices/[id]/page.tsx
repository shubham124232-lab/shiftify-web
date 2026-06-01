"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import Link from "next/link";

interface InvoiceDetail {
  id: string;
  sentAt: string;
  hours: number | null;
  note: string | null;
  job: {
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
  };
  sender: { id: string; name: string };
  planManager: { id: string; name: string };
  participant: { id: string; name: string };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 0",
      borderBottom: "1px solid #f1f5f9", alignItems: "flex-start",
    }}>
      <span style={{ width: 180, flexShrink: 0, fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1e293b", flex: 1, lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>
      {text}
    </span>
  );
}

export default function InvoiceDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    // Invoices are fetched from the list and matched — no single GET endpoint
    // so we fetch the list and find by id
    api.get<{ invoices: InvoiceDetail[] }>("/invoices")
      .then(r => {
        const found = (r.invoices ?? []).find(inv => inv.id === id);
        if (found) setInvoice(found);
        else setError("Invoice not found.");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading invoice...</div>;

  if (error || !invoice) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: "#b91c1c", marginBottom: 16 }}>{error ?? "Invoice not found."}</p>
        <Button onClick={() => router.push("/invoices")}>Back to invoices</Button>
      </div>
    );
  }

  const catLabel = JOB_CATEGORIES.find(c => c.value === invoice.job.category)?.label ?? invoice.job.category;
  const urgencyColors: Record<string, { bg: string; color: string }> = {
    EMERGENCY: { bg: "#fee2e2", color: "#b91c1c" },
    SAME_DAY:  { bg: "#ffedd5", color: "#c2410c" },
    SCHEDULED: { bg: "#f1f5f9", color: "#475569" },
  };
  const urg = urgencyColors[invoice.job.urgency] ?? urgencyColors.SCHEDULED;

  const scheduledDuration = (() => {
    if (!invoice.job.scheduledEndAt) return null;
    const ms = new Date(invoice.job.scheduledEndAt).getTime() - new Date(invoice.job.scheduledStartAt).getTime();
    const hrs = ms / 3_600_000;
    return hrs > 0 ? `${hrs.toFixed(1)}h` : null;
  })();

  return (
    <>
      <PageHeader
        title="Invoice detail"
        description={`Sent ${new Date(invoice.sentAt).toLocaleDateString("en-AU", { dateStyle: "long" })}`}
      />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── People involved ── */}
        <Card>
          <CardHeader><CardTitle>People</CardTitle></CardHeader>
          <CardContent>
            <Row label="Work performed by"  value={<strong>{invoice.sender.name}</strong>} />
            <Row label="For participant"     value={invoice.participant.name} />
            <Row label="Plan manager"        value={invoice.planManager.name} />
            <Row label="Invoice sent"        value={new Date(invoice.sentAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })} />
          </CardContent>
        </Card>

        {/* ── Job details ── */}
        <Card>
          <CardHeader><CardTitle>Job details</CardTitle></CardHeader>
          <CardContent>
            <Row label="Job title"         value={<strong>{invoice.job.title}</strong>} />
            <Row label="Description"       value={invoice.job.description ?? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No description provided</span>} />
            <Row label="Service type"      value={catLabel} />
            <Row label="Urgency"           value={<Badge text={invoice.job.urgency.replace("_", " ")} bg={urg.bg} color={urg.color} />} />
            <Row label="Location"          value={`${invoice.job.suburb}, ${invoice.job.state}${invoice.job.postcode ? ` ${invoice.job.postcode}` : ""}`} />
            <Row label="Scheduled start"   value={new Date(invoice.job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })} />
            {invoice.job.scheduledEndAt && (
              <Row label="Scheduled end"   value={new Date(invoice.job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })} />
            )}
            {scheduledDuration && (
              <Row label="Scheduled duration" value={scheduledDuration} />
            )}
            <Row label="Job status"        value={
              <Badge
                text={invoice.job.status.replace("_", " ")}
                bg={invoice.job.status === "COMPLETED" ? "#dcfce7" : "#fef9c3"}
                color={invoice.job.status === "COMPLETED" ? "#15803d" : "#854d0e"}
              />
            } />
          </CardContent>
        </Card>

        {/* ── Invoice amounts / notes ── */}
        <Card>
          <CardHeader><CardTitle>Invoice summary</CardTitle></CardHeader>
          <CardContent>
            <Row
              label="Scheduled hours"
              value={invoice.job.totalHours ? `${invoice.job.totalHours}h` : <span style={{ color: "#94a3b8" }}>Not recorded on job</span>}
            />
            <Row
              label="Actual hours worked"
              value={
                invoice.hours
                  ? <strong style={{ fontSize: 15 }}>{invoice.hours}h</strong>
                  : <span style={{ color: "#94a3b8" }}>Not specified</span>
              }
            />
            {invoice.hours && invoice.job.totalHours && invoice.hours !== invoice.job.totalHours && (
              <Row
                label="Variance"
                value={
                  <span style={{ color: invoice.hours > invoice.job.totalHours ? "#b91c1c" : "#15803d", fontWeight: 600 }}>
                    {invoice.hours > invoice.job.totalHours ? "+" : ""}{(invoice.hours - invoice.job.totalHours).toFixed(2)}h vs scheduled
                  </span>
                }
              />
            )}
            <Row
              label="Notes"
              value={invoice.note ?? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No notes added</span>}
            />
          </CardContent>
        </Card>

        {/* ── View full job ── */}
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/jobs/${invoice.job.id}`}>
            <Button variant="outline">View full job →</Button>
          </Link>
          <Button variant="ghost" onClick={() => router.push("/invoices")}>Back to all invoices</Button>
        </div>
      </div>
    </>
  );
}
