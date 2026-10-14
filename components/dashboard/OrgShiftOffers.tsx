"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CONFIRMED";
  offeredRate: number | null;
  job: { id: string; title: string; suburb: string; scheduledStartAt: string; scheduledEndAt: string };
}

const STATUS_LABEL: Record<Row["status"], { text: string; cls: string }> = {
  ACCEPTED: { text: "You accepted", cls: "bg-emerald-100 text-emerald-700" },
  DECLINED: { text: "You declined", cls: "bg-red-100 text-red-700" },
  EXPIRED:  { text: "Expired",      cls: "bg-amber-100 text-amber-700" },
  PENDING:  { text: "Pending",      cls: "bg-slate-100 text-slate-600" },
  CONFIRMED: { text: "Confirmed by your organisation", cls: "bg-emerald-100 text-emerald-800" },
};

// A Provider-managed worker answers shift offers from their organisation. Accepting does not confirm the shift.
export function OrgShiftOffers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<{ offers: Row[] }>("/provider-workspace/my-internal-offers")
      .then((r) => setRows(r.offers ?? []))
      .catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function respond(id: string, status: "ACCEPTED" | "DECLINED") {
    setBusy(id); setError(null);
    try { await api.post(`/provider-workspace/my-internal-offers/${id}/respond`, { status }); load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send your reply"); }
    finally { setBusy(null); }
  }

  if (rows.length === 0) return null;
  const pending = rows.filter((r) => r.status === "PENDING");

  return (
    <Card>
      <CardHeader><CardTitle>Shift offers{pending.length ? ` (${pending.length})` : ""}</CardTitle></CardHeader>
      <CardContent className="py-2">
        {error && <p className="m-0 py-2 text-sm text-red-600">{error}</p>}
        <ul className="m-0 list-none divide-y divide-slate-100 p-0">
          {rows.slice(0, 6).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-slate-900">{r.job.title}</p>
                <p className="m-0 mt-0.5 text-xs text-slate-500">
                  {r.job.suburb} · {new Date(r.job.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  {r.offeredRate !== null ? ` · $${r.offeredRate.toFixed(2)}/hr` : ""} · Accepting does not confirm the shift.
                </p>
              </div>
              {r.status === "PENDING" ? (
                <span className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => respond(r.id, "ACCEPTED")}>Accept</Button>
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => respond(r.id, "DECLINED")}>Decline</Button>
                </span>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
