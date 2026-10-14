"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Report {
  from: string; to: string;
  staffingRequests: number;
  lanes: Record<"RAPID" | "URGENT" | "LAST_MINUTE" | "ROUTINE", number>;
  confirmedAssignments: number;
  convertedEnquiries: number;
  applicationsReceived: number;
  responsesSent: number;
  internalTeamMembers: number;
  openServiceSlots: number;
  liveHousingListings: number;
  spend: { platinumTile: number; featuredShift: number; directConnect: number; total: number };
}

const LANES: { key: keyof Report["lanes"]; label: string }[] = [
  { key: "RAPID", label: "Rapid" }, { key: "URGENT", label: "Urgent" }, { key: "LAST_MINUTE", label: "Last-Minute" }, { key: "ROUTINE", label: "Routine" },
];

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const money = (n: number) => `$${n.toFixed(2)}`;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="text-[15px] text-slate-500">{label}</div>
      <div className="mt-4 text-4xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export default function ProviderReportsPage() {
  const today = new Date();
  const [from, setFrom] = useState(isoDay(new Date(today.getTime() - 30 * 86400000)));
  const [to, setTo] = useState(isoDay(today));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    // The end date is inclusive of the whole day.
    const toEnd = new Date(`${to}T23:59:59`).toISOString();
    return api.get<{ report: Report }>(`/provider-workspace/reports?from=${encodeURIComponent(new Date(`${from}T00:00:00`).toISOString())}&to=${encodeURIComponent(toEnd)}`)
      .then((r) => setReport(r.report))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load the report"))
      .finally(() => setLoading(false));
  }, [from, to]);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function exportCsv() {
    if (!report) return;
    const rows: [string, string | number][] = [
      ["Period", `${from} to ${to}`],
      ["Staffing requests", report.staffingRequests],
      ...LANES.map((l): [string, number] => [`  ${l.label}`, report.lanes[l.key]]),
      ["Confirmed assignments", report.confirmedAssignments],
      ["Applications received", report.applicationsReceived],
      ["Responses sent", report.responsesSent],
      ["Converted enquiries", report.convertedEnquiries],
      ["Internal team members", report.internalTeamMembers],
      ["Open service slots", report.openServiceSlots],
      ["Live housing listings", report.liveHousingListings],
      ["Platinum Tile spend", money(report.spend.platinumTile)],
      ["Featured Shift spend", money(report.spend.featuredShift)],
      ["Direct Connect spend", money(report.spend.directConnect)],
      ["Total platform spend", money(report.spend.total)],
    ];
    const csv = rows.map(([k, v]) => `"${k.replace(/"/g, '""')}","${String(v).replace(/"/g, '""')}"`).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `shiftify-provider-report-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const maxLane = report ? Math.max(1, ...LANES.map((l) => report.lanes[l.key])) : 1;
  return (
    <>
      <div className="space-y-5 px-8 pt-6">
        <p className="m-0 text-xs text-slate-400">Provider / Reports</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Provider reports</h1>
            <p className="m-0 mt-1.5 text-[15px] text-slate-500">Outcomes and organisation activity.</p>
          </div>
          <Button variant="outline" disabled={!report} onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />Export report</Button>
        </div>
      </div>
      <div className="space-y-5 px-8 py-6">
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="text-sm font-semibold text-slate-900">From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 block h-11 w-[260px] rounded-lg border border-slate-200 px-3 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-900">To
            <input type="date" value={to} min={from} max={isoDay(today)} onChange={(e) => setTo(e.target.value)} className="mt-1 block h-11 w-[260px] rounded-lg border border-slate-200 px-3 text-sm font-normal" />
          </label>
          <Button className="ml-auto" disabled={loading || !from || !to} onClick={load}>Apply period</Button>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && !report && <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}
        {report && (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              <Stat label="Staffing requests" value={report.staffingRequests} />
              <Stat label="Confirmed assignments" value={report.confirmedAssignments} />
              <Stat label="Converted enquiries" value={report.convertedEnquiries} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white">
                <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Staffing by timing lane</h2>
                <div className="flex h-56 items-end justify-around px-6 pb-4 pt-6">
                  {LANES.map((l) => {
                    const n = report.lanes[l.key];
                    return (
                      <div key={l.key} className="flex flex-col items-center gap-1.5">
                        <span className="text-xs text-slate-500">{n}</span>
                        <div className="w-11 rounded-t-md bg-brand-600" style={{ height: `${Math.max(n ? 8 : 2, Math.round((n / maxLane) * 130))}px` }} />
                        <span className="text-xs text-slate-500">{l.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white">
                <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Operational summary</h2>
                <dl className="m-0 px-6 py-2 text-sm">
                  {([
                    ["Internal Team Members", report.internalTeamMembers],
                    ["Open service slots", report.openServiceSlots],
                    ["Live housing listings", report.liveHousingListings],
                    ["Applications received", report.applicationsReceived],
                    ["Responses sent", report.responsesSent],
                    ["Platform spend", money(report.spend.total)],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-8 border-b border-slate-100 py-3.5 last:border-0"><dt className="w-52 text-slate-500">{k}</dt><dd className="m-0 font-semibold text-slate-900">{v}</dd></div>
                  ))}
                </dl>
                {report.spend.total > 0 && (
                  <p className="m-0 px-6 pb-4 text-xs text-slate-500">
                    Platinum Tile {money(report.spend.platinumTile)} · Featured Shift {money(report.spend.featuredShift)} · Direct Connect {money(report.spend.directConnect)}. Shiftify takes 0% commission on support.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
