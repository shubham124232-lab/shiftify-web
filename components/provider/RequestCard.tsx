"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ProviderRequestRow {
  id: string;
  title: string;
  categoryLabel: string;
  urgency: string;
  suburb: string;
  state: string | null;
  scheduledStartAt: string;
  totalHours: number | null;
  status: string;
  fundingType: string | null;
  budgetPerHour: number | null;
  posterKind: string;
  reasons?: string[];
  saved?: boolean;
  open?: boolean;
  responseStatus: string | null;
}

export const URGENCY_BADGE: Record<string, { label: string; cls: string }> = {
  RAPID:       { label: "Rapid",       cls: "bg-red-100 text-red-700" },
  URGENT:      { label: "Urgent",      cls: "bg-amber-100 text-amber-700" },
  LAST_MINUTE: { label: "Last-Minute", cls: "bg-orange-100 text-orange-700" },
  ROUTINE:     { label: "Routine",     cls: "bg-slate-100 text-slate-600" },
};

const FUNDING: Record<string, string> = { SELF_MANAGED: "Self-managed", PLAN_MANAGED: "Plan-managed", NDIA_MANAGED: "NDIA-managed", PRIVATE: "Private" };
const RESPONSE: Record<string, string> = { INTERESTED: "Responded", SHORTLISTED: "Shortlisted", SELECTED: "Accepted", DECLINED: "Unsuccessful", WITHDRAWN: "Withdrawn", REQUEST_FILLED: "Closed" };

// Opportunity card used by Matched Requests and Saved Requests.
export function ProviderRequestCard({ r, onToggleSave, busy }: { r: ProviderRequestRow; onToggleSave: (r: ProviderRequestRow) => void; busy?: boolean }) {
  const u = URGENCY_BADGE[r.urgency] ?? URGENCY_BADGE.ROUTINE;
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.label}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{r.posterKind}</span>
          {r.open === false && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">No longer open</span>}
          {r.responseStatus && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{RESPONSE[r.responseStatus] ?? r.responseStatus}</span>}
        </div>
        <div>
          <p className="m-0 text-base font-semibold text-slate-900">{r.title}</p>
          <p className="m-0 mt-0.5 text-sm text-slate-500">{r.suburb}{r.state ? `, ${r.state}` : ""} · {r.categoryLabel}</p>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-400">Starts</dt>
          <dd className="m-0 text-slate-700">{new Date(r.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}{r.totalHours ? ` · ${r.totalHours} h` : ""}</dd>
          {r.fundingType && (<><dt className="text-slate-400">Funding</dt><dd className="m-0 text-slate-700">{FUNDING[r.fundingType] ?? r.fundingType}</dd></>)}
          {r.budgetPerHour != null && (<><dt className="text-slate-400">Rate</dt><dd className="m-0 text-slate-700">${r.budgetPerHour.toFixed(2)}/hr</dd></>)}
        </dl>
        {r.reasons && r.reasons.length > 0 && (
          <ul className="m-0 list-none space-y-0.5 p-0 text-xs text-emerald-700">
            {r.reasons.map((x) => <li key={x}>✓ {x}</li>)}
          </ul>
        )}
        <p className="m-0 text-xs text-slate-400">Participant identifiers and exact addresses are protected. Payment cannot unlock private information.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/jobs/${r.id}`}><Button size="sm" variant="outline">View request</Button></Link>
          {r.open !== false && !r.responseStatus && <Link href={`/jobs/${r.id}`}><Button size="sm">Respond as Provider</Button></Link>}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onToggleSave(r)}>{r.saved === false ? "Save" : "Unsave"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
