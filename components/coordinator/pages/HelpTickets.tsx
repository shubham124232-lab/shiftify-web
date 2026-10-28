"use client";

// Support Coordinator "Help & Tickets": raise and track platform-support tickets (/support-tickets),
// plus the emergency, concern-reporting and blocking guidance from Help & Safety.

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  WorkspacePage, Panel, Chip, Empty, ErrorNote, OutlineButton, PrimaryButton, HeaderLink, fieldClass,
} from "@/components/coordinator/workspace-ui";

interface Ticket { id: string; reference: string; subject: string; category: string; impact: string; status: string; createdAt: string }

const CATEGORIES = ["Account access", "Billing and plan", "Participants and authority", "Support requests", "Documents and compliance", "Something else"];
const IMPACTS = ["General question", "Minor problem", "Blocking my work", "Urgent"];
const STATUS: Record<string, { label: string; tone: "amber" | "blue" | "green" | "slate" }> = {
  OPEN: { label: "Open", tone: "blue" },
  AWAITING_SUPPORT: { label: "Awaiting support", tone: "amber" },
  RESOLVED: { label: "Resolved", tone: "green" },
  CLOSED: { label: "Closed", tone: "slate" },
};

export function CoordinatorHelpTickets() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [raising, setRaising] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [relatedRef, setRelatedRef] = useState("");
  const [impact, setImpact] = useState(IMPACTS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function load() {
    api.get<{ tickets: Ticket[] }>("/support-tickets")
      .then((r) => setTickets(r.tickets ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load your tickets"); setTickets([]); });
  }
  useEffect(load, []);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ ticket: { reference: string } }>("/support-tickets", {
        subject: subject.trim(), category, impact, relatedRef: relatedRef.trim() || null, description: description.trim(),
      });
      setDone(r.ticket.reference);
      setSubject(""); setRelatedRef(""); setDescription("");
      load();
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not submit your ticket"); }
    finally { setBusy(false); }
  }

  return (
    <WorkspacePage
      title="Help & Tickets"
      description="Get help with Shiftify and track your support requests."
      actions={<PrimaryButton onClick={() => { setRaising((r) => !r); setDone(null); }}>{raising ? "Close form" : "Raise a ticket"}</PrimaryButton>}
    >
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>In an emergency, call 000 immediately.</strong> Shiftify is not an emergency service and cannot dispatch help.
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      {raising && (
        <Panel title="Raise a ticket">
          {done ? (
            <div>
              <p className="text-sm font-bold text-slate-900">Ticket {done} submitted</p>
              <p className="mt-1 text-sm text-slate-600">Quote this reference if you contact support. You can follow its status under My tickets.</p>
              <OutlineButton onClick={() => { setDone(null); setRaising(false); }} className="mt-3">Done</OutlineButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Subject *
                  <input className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} /></label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Category
                  <select className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Related request / reference (optional)
                  <input className={fieldClass} value={relatedRef} onChange={(e) => setRelatedRef(e.target.value)} maxLength={100} /></label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Impact
                  <select className={fieldClass} value={impact} onChange={(e) => setImpact(e.target.value)}>{IMPACTS.map((c) => <option key={c}>{c}</option>)}</select></label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">What happened? *
                <textarea className={`${fieldClass} h-32 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000}
                  placeholder="Include the page, action and error message. Avoid unnecessary participant or health details." /></label>
              <PrimaryButton onClick={() => void submit()} disabled={busy || subject.trim().length < 3 || description.trim().length < 10}>{busy ? "Submitting…" : "Submit ticket"}</PrimaryButton>
            </div>
          )}
        </Panel>
      )}

      <Panel title="My tickets" bodyClassName="px-5">
        {tickets === null ? <Empty>Loading…</Empty> : !tickets.length ? <Empty>You have no support tickets.</Empty> : (
          <div className="divide-y divide-[#e4e6ed]">
            {tickets.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{t.reference} · {t.subject}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip tone="slate">{t.category}</Chip>
                    <Chip tone={STATUS[t.status]?.tone ?? "slate"}>{STATUS[t.status]?.label ?? t.status}</Chip>
                  </div>
                </div>
                <OutlineButton href={`/provider/help/${t.id}`}>Open ticket</OutlineButton>
              </div>
            ))}
          </div>
        )}
        <p className="border-t border-[#e4e6ed] py-4 text-xs text-slate-500">
          Platform support tickets are for Shiftify account or technical issues. They do not replace urgent health, safety or incident reporting channels.
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
        <Panel title="Report a concern or incident" action={<HeaderLink href="/jobs/my">My requests</HeaderLink>}>
          <p className="text-sm leading-relaxed text-slate-600">
            If something went wrong — a no-show, unsafe conditions or inappropriate behaviour — open the request, go to
            <strong> Report an issue</strong> and select <strong>Flag an incident</strong>. An admin is notified right away.
          </p>
        </Panel>
        <Panel title="Block or limit contact" action={<HeaderLink href="/blocked-users">Blocked users</HeaderLink>}>
          <p className="text-sm leading-relaxed text-slate-600">
            Blocking stops someone messaging you and hides your profile from them. It does not cancel confirmed support —
            cancel or close the request separately if needed.
          </p>
        </Panel>
      </div>
    </WorkspacePage>
  );
}
