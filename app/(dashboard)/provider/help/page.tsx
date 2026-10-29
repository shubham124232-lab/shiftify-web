"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

interface Ticket { id: string; reference: string; subject: string; category: string; impact: string; status: string; createdAt: string }

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" }, { key: "OPEN", label: "Open" }, { key: "AWAITING_SUPPORT", label: "Awaiting support" },
  { key: "RESOLVED", label: "Resolved" }, { key: "CLOSED", label: "Closed" },
];
const STATUS_LABEL: Record<string, string> = { OPEN: "Open", AWAITING_SUPPORT: "Awaiting support", RESOLVED: "Resolved", CLOSED: "Closed" };

// Provider "Help & Tickets" (approved demo, doc P82): platform-support cases with a record reference.
export default function ProviderHelpPage() {
  const [filter, setFilter] = useState("");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTickets(null);
    api.get<{ tickets: Ticket[] }>(`/support-tickets${filter ? `?status=${filter}` : ""}`)
      .then((r) => setTickets(r.tickets ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load your tickets"); setTickets([]); });
  }, [filter]);

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Help &amp; Tickets</h1>
            <p>Get help with your Shiftify account, billing or platform use.</p>
          </div>
          <div className="pd-buttons">
            <Link href="/provider/help/new" className="pd-btn pd-btn-primary">Raise a ticket</Link>
          </div>
        </div>
        <div className="pd-tabs">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`pd-btn pd-btn-sm${filter === f.key ? " pd-btn-primary" : ""}`}>{f.label}</button>
          ))}
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <section className="pd-panel">
          <div className="pd-panel-head"><h2>My tickets</h2></div>
          <div className="pd-panel-body">
            {tickets === null ? <div className="pd-quiet-empty">Loading…</div>
              : tickets.length === 0 ? <div className="pd-quiet-empty">No tickets in this view. Raise a ticket if you need help.</div>
              : tickets.map((t) => (
                <div key={t.id} className="pd-ticket-row">
                  <div>
                    <strong>{t.subject}</strong>
                    <p>{t.reference} · {t.category} · {t.impact} · {new Date(t.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className="pd-badge">{STATUS_LABEL[t.status] ?? t.status}</span>
                  <Link href={`/provider/help/${t.id}`} className="pd-btn pd-btn-sm">Open</Link>
                </div>
              ))}
          </div>
        </section>
        <section className="pd-panel">
          <div className="pd-panel-head"><h2>Other support</h2></div>
          <div className="pd-panel-body">
            <div className="pd-buttons">
              <Link href="/provider/settings" className="pd-btn">Account settings</Link>
              <Link href="/help-safety" className="pd-btn">Safety concerns</Link>
            </div>
            <p className="pd-note">Platform-support tickets are separate from support-delivery incident reports.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
