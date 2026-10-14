"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-5 px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Help &amp; Tickets</h1>
          <p className="m-0 mt-1.5 text-[15px] text-slate-500">Get help with your Shiftify account, billing or platform use.</p>
        </div>
        <Link href="/provider/help/new"><Button>Raise a ticket</Button></Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${filter === f.key ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}>{f.label}</button>
        ))}
      </div>
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">My tickets</h2>
        {tickets === null ? <div className="m-6 h-16 animate-pulse rounded-xl bg-slate-100" />
          : tickets.length === 0 ? <p className="m-0 px-6 py-10 text-sm text-slate-500">No tickets in this view. Raise a ticket if you need help.</p>
          : (
            <ul className="m-0 list-none divide-y divide-slate-100 p-0">
              {tickets.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-bold text-slate-900">{t.subject}</p>
                    <p className="m-0 mt-0.5 text-xs text-slate-500">{t.reference} · {t.category} · {t.impact} · {new Date(t.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{STATUS_LABEL[t.status] ?? t.status}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Other support</h2>
        <div className="space-y-3 px-6 py-5">
          <div className="flex flex-wrap gap-3">
            <Link href="/provider/settings" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-50">Account settings</Link>
            <Link href="/help-safety" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-50">Safety concerns</Link>
          </div>
          <p className="m-0 text-xs text-slate-500">Platform-support tickets are separate from support-delivery incident reports.</p>
        </div>
      </section>
    </div>
  );
}
