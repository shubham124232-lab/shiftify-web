"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  status: "PENDING" | "AVAILABLE" | "UNAVAILABLE";
  request: { id: string; title: string; startsAt: string | null; message: string | null };
}

// A Provider-managed worker answers "are you available?" requests from their organisation.
export function OrgAvailabilityRequests() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<{ requests: Row[] }>("/provider-workspace/my-availability-requests")
      .then((r) => setRows(r.requests ?? []))
      .catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function respond(id: string, status: "AVAILABLE" | "UNAVAILABLE") {
    setBusy(id); setError(null);
    try { await api.post(`/provider-workspace/my-availability-requests/${id}/respond`, { status }); load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send your reply"); }
    finally { setBusy(null); }
  }

  const pending = rows.filter((r) => r.status === "PENDING");
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Availability requests{pending.length ? ` (${pending.length})` : ""}</CardTitle></CardHeader>
      <CardContent className="py-2">
        {error && <p className="m-0 py-2 text-sm text-red-600">{error}</p>}
        <ul className="m-0 list-none divide-y divide-slate-100 p-0">
          {rows.slice(0, 6).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-slate-900">{r.request.title}</p>
                <p className="m-0 mt-0.5 text-xs text-slate-500">
                  {r.request.startsAt ? new Date(r.request.startsAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Time to be confirmed"}
                  {r.request.message ? ` · ${r.request.message}` : ""}
                </p>
              </div>
              {r.status === "PENDING" ? (
                <span className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => respond(r.id, "AVAILABLE")}>I&apos;m available</Button>
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => respond(r.id, "UNAVAILABLE")}>Not available</Button>
                </span>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  You replied: {r.status === "AVAILABLE" ? "Available" : "Not available"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
