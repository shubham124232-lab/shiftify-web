"use client";

import { useState } from "react";
import { ModalShell } from "@/components/jobs/post/shared";
import { cn } from "@/lib/utils";

// Generic multi-step popup used by the Provider listing wizards (services/capacity, housing vacancy, service capability).
// Mirrors the approved demo: step tabs, a titled form per step, and a "Save draft · n of N · Continue" footer.

export type Opt = { v: string; l: string };
export type FieldType = "text" | "number" | "date" | "select" | "checks" | "textarea" | "photos";
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: Opt[];
  required?: boolean;
  full?: boolean;
  placeholder?: string;
  hint?: string;
  /** Hide the field unless this returns true (receives all values). */
  when?: (v: Values) => boolean;
}
export interface StepDef { title: string; intro: string; fields: FieldDef[]; review?: boolean }
export type Values = Record<string, any>;

export const opts = (list: readonly string[]): Opt[] => list.map((x) => ({ v: x, l: x }));

export function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** First required, visible field that is still empty on a step (or null). */
export function firstMissing(step: StepDef, values: Values): FieldDef | null {
  return step.fields.find((f) => f.required && (!f.when || f.when(values)) && isEmpty(values[f.key])) ?? null;
}

export function WizardForm({
  title, subtitle, steps, values, setValues, onClose, submitLabel, onSubmit, onSaveDraft, busy, error, notice, renderReview, canSubmit = true, extra, onUploadPhoto, uploading,
}: {
  title: string;
  subtitle?: string;
  steps: StepDef[];
  values: Values;
  setValues: (fn: (cur: Values) => Values) => void;
  onClose: () => void;
  submitLabel: string;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  busy?: boolean;
  error?: string | null;
  notice?: string | null;
  renderReview?: () => React.ReactNode;
  canSubmit?: boolean;
  /** Extra content above the step form (e.g. warnings). */
  extra?: React.ReactNode;
  onUploadPhoto?: (file: File | undefined) => Promise<void>;
  uploading?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const cur = steps[step];
  const last = step === steps.length - 1;
  const set = (key: string, v: unknown) => setValues((c) => ({ ...c, [key]: v }));

  function next() {
    const missing = firstMissing(cur, values);
    if (missing) { setLocalError(`${missing.label} is required.`); return; }
    setLocalError(null);
    setStep((s) => s + 1);
  }

  function field(f: FieldDef) {
    if (f.when && !f.when(values)) return null;
    const v = values[f.key];
    const label = <>{f.label}{f.required && <span className="text-[#c91355]"> *</span>}</>;
    const wrap = (node: React.ReactNode) => (
      <div key={f.key} className={cn(f.full || f.type === "textarea" || f.type === "checks" || f.type === "photos" ? "sm:col-span-2" : "")}>{node}</div>
    );
    if (f.type === "checks") {
      const list: string[] = Array.isArray(v) ? v : [];
      return wrap(
        <div>
          <p className="m-0 mb-2 text-sm font-semibold">{label}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {(f.options ?? []).map((o) => (
              <label key={o.v} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={list.includes(o.v)} onChange={() => set(f.key, list.includes(o.v) ? list.filter((x) => x !== o.v) : [...list, o.v])} />
                {o.l}
              </label>
            ))}
          </div>
          {f.hint && <p className="pd-note">{f.hint}</p>}
        </div>,
      );
    }
    if (f.type === "photos") {
      const urls: string[] = Array.isArray(v) ? v : [];
      return wrap(
        <div>
          <p className="m-0 mb-2 text-sm font-semibold">{label}</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {urls.map((u) => (
              <div key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="Listing" className="h-[84px] w-[84px] rounded-lg border border-[#e4e6ed] object-cover" />
                <button type="button" aria-label="Remove photo" onClick={() => set(f.key, urls.filter((x) => x !== u))}
                  className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full border-0 bg-[#be123c] text-xs text-white">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || urls.length >= 6 || !onUploadPhoto}
            onChange={(e) => { void onUploadPhoto?.(e.target.files?.[0]); e.target.value = ""; }} />
          {uploading && <p className="pd-note">Uploading…</p>}
          {f.hint && <p className="pd-note">{f.hint}</p>}
        </div>,
      );
    }
    return wrap(
      <label className="block">{label}
        {f.type === "select" ? (
          <select value={v ?? ""} onChange={(e) => set(f.key, e.target.value)}>
            <option value="">Select…</option>
            {(f.options ?? []).map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ) : f.type === "textarea" ? (
          <textarea rows={3} maxLength={1500} value={v ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
        ) : (
          <input type={f.type} value={v ?? ""} placeholder={f.placeholder} min={f.type === "number" ? 0 : undefined}
            onChange={(e) => set(f.key, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />
        )}
        {f.hint && <span className="pd-note block">{f.hint}</span>}
      </label>,
    );
  }

  return (
    <ModalShell title={title} subtitle={subtitle} onClose={onClose}>
      <ol className="pd-steps">
        {steps.map((s, i) => <li key={s.title} className={cn("pd-step", step === i && "active", step > i && "done")}>{i + 1}. {s.title}</li>)}
      </ol>
      <div className="pd-modal-body">
        {extra}
        {(error || localError) && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? localError}</div>}
        {notice && !error && !localError && <div className="pd-notice mb-4">{notice}</div>}
        <div className="pd-form-title"><h3>{cur.title}</h3><p className="pd-muted m-0 mt-1 text-sm">{cur.intro}</p></div>
        {cur.review ? renderReview?.() : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{cur.fields.map(field)}</div>
        )}
      </div>
      <div className="pd-modal-foot">
        {step > 0
          ? <button type="button" className="pd-btn" onClick={() => { setLocalError(null); setStep((s) => s - 1); }}>Back</button>
          : <span />}
        <div className="pd-buttons">
          {onSaveDraft && <button type="button" className="pd-btn" disabled={busy} onClick={onSaveDraft}>Save draft</button>}
          <span className="pd-muted text-xs">{step + 1} of {steps.length}</span>
          {last
            ? <button type="button" className="pd-btn pd-btn-primary" disabled={busy || !canSubmit} onClick={onSubmit}>{busy ? "Working…" : submitLabel}</button>
            : <button type="button" className="pd-btn pd-btn-primary" onClick={next}>Continue</button>}
        </div>
      </div>
    </ModalShell>
  );
}
