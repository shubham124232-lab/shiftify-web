"use client";

// SW doc Window 46 — alert types with on/off and frequency (Instant / Daily / Weekly), saved with "Save settings".
// Time-sensitive alerts (Rapid, Urgent, Last-Minute, Confirmations) always stay Instant.

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Frequency = "INSTANT" | "DAILY" | "WEEKLY";
type AlertKey = "RAPID" | "URGENT" | "LAST_MINUTE" | "ROUTINE" | "INVITATIONS" | "CONNECTIONS" | "CONFIRMATIONS";
type Alerts = Partial<Record<AlertKey, { on: boolean; frequency: Frequency }>>;

const ALERTS: { key: AlertKey; label: string; timeSensitive: boolean }[] = [
  { key: "RAPID", label: "Rapid requests", timeSensitive: true },
  { key: "URGENT", label: "Urgent requests", timeSensitive: true },
  { key: "LAST_MINUTE", label: "Last-Minute requests", timeSensitive: true },
  { key: "ROUTINE", label: "Routine requests", timeSensitive: false },
  { key: "INVITATIONS", label: "Invitations", timeSensitive: false },
  { key: "CONNECTIONS", label: "Connections", timeSensitive: false },
  { key: "CONFIRMATIONS", label: "Confirmations", timeSensitive: true },
];

export function WorkerAlertControls({ initial }: { initial: Alerts | null }) {
  const [alerts, setAlerts] = useState<Alerts>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const get = (k: AlertKey) => alerts[k] ?? { on: true, frequency: "INSTANT" as Frequency };
  const set = (k: AlertKey, patch: Partial<{ on: boolean; frequency: Frequency }>) => {
    setAlerts(a => ({ ...a, [k]: { ...get(k), ...patch } }));
    setMsg(null);
  };

  async function save() {
    setSaving(true); setMsg(null);
    const full = Object.fromEntries(ALERTS.map(a => [a.key, { on: get(a.key).on, frequency: a.timeSensitive ? "INSTANT" : get(a.key).frequency }]));
    try { await api.patch("/notifications/preferences", { providerPrefs: { workerAlerts: full } }); setMsg("Settings saved."); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Could not save settings."); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--td-dark-text-soft)", marginBottom: 8 }}>Alert types and frequency</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ALERTS.map(a => {
          const v = get(a.key);
          return (
            <div key={a.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={v.on} onChange={() => set(a.key, { on: !v.on })} />
                {a.label}
              </label>
              {a.timeSensitive ? (
                <span style={{ fontSize: 12, color: "var(--td-muted)" }}>Instant (time-sensitive)</span>
              ) : (
                <select value={v.frequency} onChange={e => set(a.key, { frequency: e.target.value as Frequency })}
                  style={{ height: 30, padding: "0 8px", border: "1px solid var(--td-border)", borderRadius: 6, fontSize: 12 }}>
                  <option value="INSTANT">Instant</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        {msg && <span style={{ fontSize: 12, color: "var(--td-muted)" }}>{msg}</span>}
      </div>
    </div>
  );
}
