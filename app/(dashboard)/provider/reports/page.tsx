"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Download } from "lucide-react";

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
    <div className="pd-stat">
      <span className="pd-small pd-muted">{label}</span>
      <div className="pd-stat-num">{value}</div>
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
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Reports</div>
        <div className="pd-page-head">
          <div>
            <h1>Provider reports</h1>
            <p>Outcomes and organisation activity.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn" disabled={!report} onClick={exportCsv}><Download />Export report</button>
          </div>
        </div>
        <div className="pd-toolbar">
          <label className="pd-field">From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="pd-field">To
            <input type="date" value={to} min={from} max={isoDay(today)} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button type="button" className="pd-btn pd-btn-primary" disabled={loading || !from || !to} onClick={load}>Apply period</button>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading && !report && <div className="pd-quiet-empty">Loading…</div>}
        {report && (
          <>
            <div className="pd-report-metrics">
              <Stat label="Staffing requests" value={report.staffingRequests} />
              <Stat label="Confirmed assignments" value={report.confirmedAssignments} />
              <Stat label="Converted enquiries" value={report.convertedEnquiries} />
            </div>

            <div className="pd-grid2">
              <section className="pd-panel">
                <div className="pd-panel-head"><h2>Staffing by timing lane</h2></div>
                <div className="pd-panel-pad">
                  <div className="pd-chart-bars">
                    {LANES.map((l) => {
                      const n = report.lanes[l.key];
                      return (
                        <div key={l.key} className="pd-chart-bar">
                          <span>{n}</span>
                          <i style={{ height: `${Math.max(n ? 8 : 2, Math.round((n / maxLane) * 90))}px` }} />
                          <span>{l.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="pd-panel">
                <div className="pd-panel-head"><h2>Operational summary</h2></div>
                <div className="pd-panel-pad">
                  {([
                    ["Internal Team Members", report.internalTeamMembers],
                    ["Open service slots", report.openServiceSlots],
                    ["Live housing listings", report.liveHousingListings],
                    ["Platform spend", money(report.spend.total)],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="pd-review-row"><span>{k}</span><strong>{v}</strong></div>
                  ))}
                  {report.spend.total > 0 && (
                    <p className="pd-small pd-muted" style={{ margin: "12px 0 0" }}>
                      Platinum Tile {money(report.spend.platinumTile)} · Featured Shift {money(report.spend.featuredShift)} · Direct Connect {money(report.spend.directConnect)}. Shiftify takes 0% commission on support.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
