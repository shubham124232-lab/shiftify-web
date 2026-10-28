"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSavedSearch, deleteSavedSearch, listSavedSearches, updateSavedSearch, type SavedSearch } from "@/lib/api/saved-searches";

const TIMING = [
  { value: "", label: "All" }, { value: "RAPID", label: "Rapid" }, { value: "URGENT", label: "Urgent" },
  { value: "LAST_MINUTE", label: "Last-Minute" }, { value: "ROUTINE", label: "Routine" },
];

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
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-page-head">
          <div>
            <h1>Saved searches &amp; alerts</h1>
            <p>Save the request types and areas relevant to your organisation.</p>
          </div>
          <div className="pd-buttons" />
        </div>
        <section className="pd-panel">
          <div className="pd-panel-head"><h2>New saved search</h2></div>
          <div className="pd-panel-body">
            <label className="pd-form-field">Search name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="pd-form-field">Suburb / area<input value={suburb} onChange={(e) => setSuburb(e.target.value)} /></label>
            <label className="pd-form-field">Timing
              <select value={timing} onChange={(e) => setTiming(e.target.value)}>
                {TIMING.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="pd-checkline"><input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />Enable matching alerts</label>
            {error && <p className="m-0 mb-4 text-sm text-red-600">{error}</p>}
            <button type="button" className="pd-btn pd-btn-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save search"}</button>
          </div>
        </section>

        <section className="pd-panel">
          <div className="pd-panel-head"><h2>Your searches</h2></div>
          <div className="pd-panel-body">
            {rows === null ? <div className="pd-quiet-empty">Loading…</div>
              : rows.length === 0 ? <div className="pd-notice" style={{ margin: 0 }}>No saved searches yet.</div>
              : rows.map((s) => (
                <div key={s.id} className="pd-ticket-row">
                  <div>
                    <strong>{s.label || "Saved search"}</strong>
                    <p>{[s.filters.suburb, TIMING.find((t) => t.value === s.filters.urgency)?.label].filter(Boolean).join(" · ") || "All requests"} · Alerts {s.isActive ? "on" : "off"}</p>
                  </div>
                  <div className="pd-buttons" style={{ flex: "none" }}>
                    <Link href={`/jobs?${new URLSearchParams({ ...(s.filters.suburb ? { q: String(s.filters.suburb) } : {}), ...(s.filters.urgency ? { urgency: String(s.filters.urgency) } : {}) }).toString()}`} className="pd-btn pd-btn-sm pd-btn-primary">Run</Link>
                    <button type="button" className="pd-btn pd-btn-sm" onClick={() => updateSavedSearch(s.id, { isActive: !s.isActive }).then(load)}>{s.isActive ? "Turn alerts off" : "Turn alerts on"}</button>
                    <button type="button" className="pd-btn pd-btn-sm" onClick={() => deleteSavedSearch(s.id).then(load)}>Delete</button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
