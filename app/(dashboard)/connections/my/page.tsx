"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

interface ConnectionJob {
  id: string; title: string; suburb: string; state: string; scheduledStartAt: string;
  budgetPerHour: number | string | null; postedBy: { name: string } | null;
}
interface Invite {
  id: string; createdAt: string; job: ConnectionJob;
}
interface AppRow {
  id: string; status: string; updatedAt: string; job: ConnectionJob;
}
interface ConnectionTabs {
  new: Invite[]; connected: AppRow[]; discussing: AppRow[]; awaitingDecision: AppRow[];
  confirmed: AppRow[]; notProceeding: AppRow[]; withdrawn: AppRow[]; requestFilled: AppRow[];
}

const TABS: { key: keyof ConnectionTabs; label: string }[] = [
  { key: "new", label: "New" },
  { key: "connected", label: "Connected" },
  { key: "discussing", label: "Discussing" },
  { key: "awaitingDecision", label: "Awaiting initiator decision" },
  { key: "confirmed", label: "Confirmed" },
  { key: "notProceeding", label: "Not proceeding" },
  { key: "withdrawn", label: "Withdrawn" },
  { key: "requestFilled", label: "Request filled" },
];

function jobOf(row: Invite | AppRow) {
  return row.job;
}

export default function MyConnectionsPage() {
  const [tabs, setTabs] = useState<ConnectionTabs | null>(null);
  const [active, setActive] = useState<keyof ConnectionTabs>("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const firstLoaded = useRef(false);

  function load() {
    setLoading(true);
    return api.get<ConnectionTabs>("/jobs/connections/mine")
      .then(t => {
        setTabs(t);
        // Open on the first tab that has something in it, rather than an empty "New".
        if (!firstLoaded.current) {
          firstLoaded.current = true;
          const first = TABS.find(x => (t[x.key] as unknown[]).length > 0);
          if (first) setActive(first.key);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function withdraw(jobId: string, applicationId: string) {
    setWithdrawing(applicationId);
    try {
      await api.patch(`/jobs/${jobId}/applications/${applicationId}/withdraw`, {});
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setWithdrawing(null); }
  }

  const rows: (Invite | AppRow)[] = tabs ? (tabs[active] as any) : [];

  return (
    <>
      <PageHeader title="My Connections" description="Requests you've connected with, from first contact through to confirmed support." />
      <div className="max-w-[900px] mx-auto px-5 py-6">
        <div className="flex gap-2 flex-wrap mb-5">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setActive(t.key)}
              className={`h-8 px-3.5 rounded-full border text-xs font-semibold transition-colors ${
                active === t.key ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {t.label}{tabs ? ` (${(tabs[t.key] as any[]).length})` : ""}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-[15px] font-semibold text-slate-700 m-0">Nothing here yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map(row => {
              const job = jobOf(row);
              const isApp = "status" in row;
              return (
                <div key={row.id} className="bg-white border border-slate-200 rounded-xl px-4.5 py-3.5 flex items-center gap-3.5">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${job.id}`} className="text-sm font-bold text-slate-800 no-underline hover:underline">
                      {job.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1">
                      {job.postedBy?.name ? `${job.postedBy.name} · ` : ""}
                      📍 {job.suburb}, {job.state} · {new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      {job.budgetPerHour != null && ` · $${Number(job.budgetPerHour).toFixed(0)}/hr`}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span className="mr-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{TABS.find(x => x.key === active)?.label}</span>
                      Last update {new Date(isApp ? (row as AppRow).updatedAt : (row as Invite).createdAt).toLocaleDateString("en-AU")}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/jobs/${job.id}`}><Button size="sm" variant="outline">View</Button></Link>
                    <Link href={`/jobs/${job.id}#job-messages`}><Button size="sm" variant="outline">Message</Button></Link>
                    {isApp && !["WITHDRAWN", "DECLINED", "REQUEST_FILLED"].includes((row as AppRow).status) && (
                      <Button size="sm" variant="outline" disabled={withdrawing === row.id}
                        onClick={() => withdraw(job.id, row.id)}
                        className="border-red-500 text-red-500 hover:bg-red-50">
                        {withdrawing === row.id ? "…" : "Withdraw"}
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
