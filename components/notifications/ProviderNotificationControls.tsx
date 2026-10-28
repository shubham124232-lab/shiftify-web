"use client";

// Provider PR-N02 notification controls: channels by urgency, quiet hours with Rapid/Urgent exception,
// location and service filters, assigned and backup administrator. Saved per change.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

type Channel = "PUSH" | "SMS" | "EMAIL";
type Urgency = "RAPID" | "URGENT" | "LAST_MINUTE" | "ROUTINE";
interface ProviderPrefs {
  quietHoursEnabled?: boolean; quietStart?: string; quietEnd?: string; urgentExceptions?: boolean;
  locationFilter?: string[]; serviceFilter?: string[]; assignedAdminId?: string | null; backupAdminId?: string | null;
  channelByUrgency?: Partial<Record<Urgency, Channel[]>>;
}
interface Admin { id: string; user: { id: string; name: string } }

const URGENCIES: { v: Urgency; l: string; d: Channel[] }[] = [
  { v: "RAPID", l: "Rapid", d: ["PUSH", "SMS", "EMAIL"] },
  { v: "URGENT", l: "Urgent", d: ["PUSH", "SMS", "EMAIL"] },
  { v: "LAST_MINUTE", l: "Last-Minute", d: ["PUSH", "EMAIL"] },
  { v: "ROUTINE", l: "Routine", d: ["PUSH"] },
];
const CHANNELS: { v: Channel; l: string }[] = [{ v: "PUSH", l: "Push" }, { v: "SMS", l: "SMS" }, { v: "EMAIL", l: "Email" }];

export function ProviderNotificationControls({ initial }: { initial: ProviderPrefs | null }) {
  const [prefs, setPrefs] = useState<ProviderPrefs>(initial ?? {});
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [locations, setLocations] = useState((initial?.locationFilter ?? []).join(", "));
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ administrators: Admin[] }>("/provider-org/administrators").then((r) => setAdmins(r.administrators ?? [])).catch(() => setAdmins([]));
  }, []);

  async function save(patch: ProviderPrefs) {
    const next = { ...prefs, ...patch };
    setPrefs(next); setSaved(null);
    try { await api.patch("/notifications/preferences", { providerPrefs: patch }); setSaved("Saved"); }
    catch (e) { setSaved(e instanceof Error ? e.message : "Could not save"); }
  }

  const channels = (u: Urgency, d: Channel[]) => prefs.channelByUrgency?.[u] ?? d;
  const toggleChannel = (u: Urgency, d: Channel[], c: Channel) => {
    const cur = channels(u, d);
    save({ channelByUrgency: { ...(prefs.channelByUrgency ?? {}), [u]: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] } });
  };
  const services = prefs.serviceFilter ?? [];

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] font-bold text-slate-700">Organisation alert controls</p>
        {saved && <span className="text-xs text-slate-500">{saved}</span>}
      </div>

      <div>
        <p className="mb-1 mt-0 text-xs font-semibold text-slate-500">Channels by urgency</p>
        <div className="space-y-1">
          {URGENCIES.map((u) => (
            <div key={u.v} className="flex flex-wrap items-center gap-3">
              <span className="w-24 font-semibold text-slate-700">{u.l}</span>
              {CHANNELS.map((c) => (
                <label key={c.v} className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={channels(u.v, u.d).includes(c.v)} onChange={() => toggleChannel(u.v, u.d, c.v)} />{c.l}
                </label>
              ))}
            </div>
          ))}
        </div>
        <p className="mb-0 mt-1 text-[11px] text-slate-400">Push is delivered in the app. SMS and email delivery depends on the messaging services being connected for your environment.</p>
      </div>

      <div>
        <label className="flex items-center gap-2 font-semibold text-slate-700">
          <input type="checkbox" checked={!!prefs.quietHoursEnabled} onChange={(e) => save({ quietHoursEnabled: e.target.checked, quietStart: prefs.quietStart ?? "21:00", quietEnd: prefs.quietEnd ?? "07:00" })} />
          Quiet hours
        </label>
        {prefs.quietHoursEnabled && (
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
            <label>From <input type="time" className="rounded border border-slate-200 px-1" value={prefs.quietStart ?? "21:00"} onChange={(e) => save({ quietStart: e.target.value })} /></label>
            <label>To <input type="time" className="rounded border border-slate-200 px-1" value={prefs.quietEnd ?? "07:00"} onChange={(e) => save({ quietEnd: e.target.value })} /></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={prefs.urgentExceptions !== false} onChange={(e) => save({ urgentExceptions: e.target.checked })} />Still alert me for Rapid and Urgent</label>
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 mt-0 text-xs font-semibold text-slate-500">Only alert me about opportunities in these locations (blank = all)</p>
        <input className="w-full rounded border border-slate-200 px-2 py-1" placeholder="e.g. Parramatta, Liverpool" value={locations}
          onChange={(e) => setLocations(e.target.value)}
          onBlur={() => save({ locationFilter: locations.split(",").map((s) => s.trim()).filter(Boolean) })} />
      </div>

      <div>
        <p className="mb-1 mt-0 text-xs font-semibold text-slate-500">Only these services (none selected = all)</p>
        <div className="flex flex-wrap gap-1.5">
          {JOB_CATEGORIES.map((c) => {
            const on = services.includes(c.value);
            return (
              <button key={c.value} type="button" onClick={() => save({ serviceFilter: on ? services.filter((s) => s !== c.value) : [...services, c.value] })}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600"}`}>{c.label}</button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-500">Assigned administrator (also receives alerts)
          <select className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-normal" value={prefs.assignedAdminId ?? ""} onChange={(e) => save({ assignedAdminId: e.target.value || null })}>
            <option value="">Organisation owner only</option>
            {admins.map((a) => <option key={a.id} value={a.user.id}>{a.user.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">Backup administrator (escalation if a fast request is unconfirmed)
          <select className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-normal" value={prefs.backupAdminId ?? ""} onChange={(e) => save({ backupAdminId: e.target.value || null })}>
            <option value="">None</option>
            {admins.map((a) => <option key={a.id} value={a.user.id}>{a.user.name}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
