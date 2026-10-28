"use client";

// "Edit essential details" (Participant R-11 / U-11 / L-12 / O-14, SC & Provider live screens).
// Available to the poster while the request is a draft, or open with nobody selected yet.

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface EditableJob {
  id: string;
  description: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string | null;
  totalHours: number | null;
  suburb: string;
  state: string;
  postcode?: string | null;
  addressLine?: string | null;
  locationNotes?: string | null;
  budgetPerHour?: number | string | null;
}

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const field = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function EditDetailsCard({ job, onSaved }: { job: EditableJob; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(job.description ?? "");
  const [start, setStart] = useState(toLocalInput(job.scheduledStartAt));
  const [hours, setHours] = useState(job.totalHours != null ? String(job.totalHours) : "");
  const [suburb, setSuburb] = useState(job.suburb);
  const [state, setState] = useState(job.state);
  const [postcode, setPostcode] = useState(job.postcode ?? "");
  const [addressLine, setAddressLine] = useState(job.addressLine ?? "");
  const [locationNotes, setLocationNotes] = useState(job.locationNotes ?? "");
  const [rate, setRate] = useState(job.budgetPerHour != null ? String(job.budgetPerHour) : "");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (description !== (job.description ?? "")) body.description = description;
      const startIso = new Date(start).toISOString();
      const hoursNum = hours.trim() ? Number(hours) : undefined;
      if (startIso !== new Date(job.scheduledStartAt).toISOString() || (hoursNum !== undefined && hoursNum !== job.totalHours)) {
        body.scheduledStartAt = startIso;
        if (hoursNum !== undefined) {
          body.totalHours = hoursNum;
          body.scheduledEndAt = new Date(new Date(start).getTime() + hoursNum * 3_600_000).toISOString();
        }
      }
      if (suburb.trim() !== job.suburb) body.suburb = suburb.trim();
      if (state !== job.state) body.state = state;
      if (postcode !== (job.postcode ?? "") && postcode) body.postcode = postcode;
      if (addressLine !== (job.addressLine ?? "") && addressLine) body.addressLine = addressLine;
      if (locationNotes !== (job.locationNotes ?? "") && locationNotes) body.locationNotes = locationNotes;
      if (rate.trim() && Number(rate) !== Number(job.budgetPerHour)) body.budgetPerHour = Number(rate);
      if (Object.keys(body).length === 0) { setOpen(false); return; }
      await api.patch(`/jobs/${job.id}`, body);
      setOpen(false);
      onSaved();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Could not save the changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Card>
        <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-500 m-0">Need to correct something? You can change the essential details until a worker or provider is selected.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Edit essential details</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Edit essential details</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
        <label className="text-xs font-semibold text-slate-700">Description
          <textarea className={`${field} h-auto py-2 mt-1`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">Start
            <input type="datetime-local" className={`${field} mt-1`} value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Duration (hours)
            <input type="number" min="0" step="0.5" className={`${field} mt-1`} value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-2 text-xs font-semibold text-slate-700">Suburb
            <input className={`${field} mt-1`} value={suburb} onChange={(e) => setSuburb(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-700">State
            <select className={`${field} mt-1`} value={state} onChange={(e) => setState(e.target.value)}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">Postcode
            <input className={`${field} mt-1`} maxLength={4} value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Offered hourly rate ($)
            <input type="number" min="0" className={`${field} mt-1`} value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
        </div>
        <label className="text-xs font-semibold text-slate-700">Exact private address
          <input className={`${field} mt-1`} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Meeting point or destination details
          <input className={`${field} mt-1`} value={locationNotes} onChange={(e) => setLocationNotes(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
