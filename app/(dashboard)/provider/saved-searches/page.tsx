"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSavedSearch, deleteSavedSearch, listSavedSearches, updateSavedSearch, type SavedSearch } from "@/lib/api/saved-searches";
import { cn } from "@/lib/utils";

const TIMING = [
  { value: "", label: "All" }, { value: "RAPID", label: "Rapid" }, { value: "URGENT", label: "Urgent" },
  { value: "LAST_MINUTE", label: "Last-Minute" }, { value: "ROUTINE", label: "Routine" },
];
const input = "h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none";

// Provider "Saved searches & alerts" (approved demo): save request types and areas; alerts can be switched on per search.
export default function ProviderSavedSearchesPage() {
  const [rows, setRows] = useState<SavedSearch[] | null>(null);
  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [timing, setTiming] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => { listSavedSearches().then(setRows).catch(() => setRows([])); }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!name.trim()) { setError("Give the search a name."); return; }
    setBusy(true); setError(null);
    try {
      const s = await createSavedSearch(name.trim(), { ...(suburb.trim() ? { suburb: suburb.trim() } : {}), ...(timing ? { urgency: timing } : {}) });
      if (!alerts) await updateSavedSearch(s.id, { isActive: false });
      setName(""); setSuburb(""); setTiming(""); setAlerts(true); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the search"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Saved searches & alerts" description="Save the request types and areas relevant to your organisation." />
      <div className="container-page space-y-5 py-8">
        <Card>
          <CardHeader><CardTitle>New saved search</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Search name<input value={name} onChange={(e) => setName(e.target.value)} className={cn(input, "mt-1")} /></label>
              <label className="block text-sm font-medium text-slate-700">Suburb / area<input value={suburb} onChange={(e) => setSuburb(e.target.value)} className={cn(input, "mt-1")} /></label>
            </div>
            <div>
              <p className="m-0 mb-1.5 text-sm font-medium text-slate-700">Timing</p>
              <div className="flex flex-wrap gap-2">
                {TIMING.map((t) => (
                  <button key={t.value} type="button" onClick={() => setTiming(t.value)}
                    className={cn("rounded-lg border px-3.5 py-2 text-sm font-medium", timing === t.value ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>{t.label}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} className="h-4 w-4" />Enable matching alerts</label>
            {error && <p className="m-0 text-sm text-red-600">{error}</p>}
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save search"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your searches</CardTitle></CardHeader>
          <CardContent className="py-2">
            {rows === null ? <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              : rows.length === 0 ? <p className="m-0 py-4 text-sm text-slate-500">No saved searches yet.</p>
              : <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                  {rows.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="m-0 text-sm font-semibold text-slate-900">{s.label || "Saved search"}</p>
                        <p className="m-0 mt-0.5 text-xs text-slate-500">{[s.filters.suburb, TIMING.find((t) => t.value === s.filters.urgency)?.label].filter(Boolean).join(" · ") || "All requests"} · Alerts {s.isActive ? "on" : "off"}</p>
                      </div>
                      <span className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateSavedSearch(s.id, { isActive: !s.isActive }).then(load)}>{s.isActive ? "Turn alerts off" : "Turn alerts on"}</Button>
                        <Button size="sm" variant="outline" onClick={() => deleteSavedSearch(s.id).then(load)}>Delete</Button>
                      </span>
                    </li>
                  ))}
                </ul>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
