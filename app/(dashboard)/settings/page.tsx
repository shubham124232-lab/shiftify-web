"use client";

// Support Coordinator "Settings": alert preferences saved through /notifications/preferences.
// The display time zone has no account field yet, so it is remembered in this browser.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  WorkspacePage, Panel, PrimaryButton, OutlineButton, ErrorNote, Empty, fieldClass,
} from "@/components/coordinator/workspace-ui";

interface Prefs { emailEnabled: boolean; pushEnabled: boolean; marketingTips: boolean }

const FIELDS: { key: keyof Prefs; label: string }[] = [
  { key: "emailEnabled",  label: "Email alerts for request and response activity" },
  { key: "pushEnabled",   label: "In-app notifications" },
  { key: "marketingTips", label: "Product news and updates" },
];
const ZONES = ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Darwin", "Australia/Perth", "Australia/Hobart"];
const TZ_KEY = "shiftify_sc_timezone";

export default function CoordinatorSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [zone, setZone] = useState("Australia/Sydney");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ preference: Prefs }>("/notifications/preferences")
      .then((r) => setPrefs({ emailEnabled: r.preference.emailEnabled, pushEnabled: r.preference.pushEnabled, marketingTips: r.preference.marketingTips }))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load preferences"); setPrefs({ emailEnabled: true, pushEnabled: true, marketingTips: false }); });
    try { const z = localStorage.getItem(TZ_KEY); if (z) setZone(z); } catch { /* ignore */ }
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      await api.patch("/notifications/preferences", prefs);
      try { localStorage.setItem(TZ_KEY, zone); } catch { /* ignore */ }
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save preferences"); }
    finally { setSaving(false); }
  }

  return (
    <WorkspacePage title="Settings" description="Manage your account preferences.">
      {error && <ErrorNote>{error}</ErrorNote>}
      <Panel title="Account preferences">
        {!prefs ? <Empty>Loading…</Empty> : (
          <form onSubmit={save} className="space-y-4 text-[13px]">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-4 w-4 accent-[#c91355]" checked={prefs[f.key]} onChange={() => { setPrefs({ ...prefs, [f.key]: !prefs[f.key] }); setSaved(false); }} />
                {f.label}
              </label>
            ))}
            <label className="block space-y-1.5">
              <span className="text-xs text-[#69707e]">Display time zone</span>
              <select className={`${fieldClass} w-full`} value={zone} onChange={(e) => { setZone(e.target.value); setSaved(false); }}>
                {ZONES.map((z) => <option key={z}>{z}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving…" : "Save preferences"}</PrimaryButton>
              {saved && <span className="text-xs text-emerald-700">Preferences saved.</span>}
            </div>
          </form>
        )}
      </Panel>

      <Panel title="Account">
        <div className="flex flex-wrap gap-2">
          <OutlineButton href="/profile">My profile</OutlineButton>
          <OutlineButton href="/subscription">Subscription and billing</OutlineButton>
          <OutlineButton href="/jobs/alerts">Saved searches and alerts</OutlineButton>
          <OutlineButton href="/help-safety">Help and Tickets</OutlineButton>
        </div>
      </Panel>
    </WorkspacePage>
  );
}
