"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
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

  return (
    <>
      <PageHeader
        title="Reports"
        description="Activity and staffing figures for your organisation."
        actions={<Button variant="outline" disabled={!report} onClick={exportCsv}>Export report</Button>}
      />
      <div className="container-page space-y-6 py-8">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 py-4">
            <label className="text-xs font-semibold text-slate-700">From
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 block h-9 rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold text-slate-700">To
              <input type="date" value={to} min={from} max={isoDay(today)} onChange={(e) => setTo(e.target.value)} className="mt-1 block h-9 rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <Button size="sm" disabled={loading || !from || !to} onClick={load}>Apply period</Button>
          </CardContent>
        </Card>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && !report && <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}
        {report && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Staffing requests" value={report.staffingRequests} />
              <Stat label="Confirmed assignments" value={report.confirmedAssignments} />
              <Stat label="Applications received" value={report.applicationsReceived} />
              <Stat label="Converted enquiries" value={report.convertedEnquiries} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Staffing by timing lane</CardTitle></CardHeader>
                <CardContent className="space-y-3 py-3">
                  {LANES.map((l) => {
                    const n = report.lanes[l.key];
                    const pct = report.staffingRequests ? Math.round((n / report.staffingRequests) * 100) : 0;
                    return (
                      <div key={l.key}>
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-600">{l.label}</span><span className="font-semibold text-slate-900">{n}</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Operational summary</CardTitle></CardHeader>
                <CardContent className="py-2">
                  <dl className="m-0 divide-y divide-slate-100 text-sm">
                    {([
                      ["Internal team members", report.internalTeamMembers],
                      ["Open service slots", report.openServiceSlots],
                      ["Live housing listings", report.liveHousingListings],
                      ["Responses sent", report.responsesSent],
                      ["Platform spend", money(report.spend.total)],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2.5"><dt className="text-slate-500">{k}</dt><dd className="m-0 font-semibold text-slate-900">{v}</dd></div>
                    ))}
                  </dl>
                  {report.spend.total > 0 && (
                    <p className="m-0 mt-2 text-xs text-slate-500">
                      Platinum Tile {money(report.spend.platinumTile)} · Featured Shift {money(report.spend.featuredShift)} · Direct Connect {money(report.spend.directConnect)}. Shiftify takes 0% commission on support.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
