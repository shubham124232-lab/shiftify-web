"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LayoutGrid } from "lucide-react";
import { URGENCY_BADGE } from "@/components/provider/RequestCard";
import { ModalShell } from "@/components/jobs/post/shared";
import { RequestDetailDialog } from "@/components/provider/RequestDialogs";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

interface StartRow {
  id: string;
  title: string;
  categoryLabel: string;
  urgency: string;
  suburb: string;
  scheduledStartAt: string;
  posterKind: string;
  status: string;
  workerName?: string | null;
  applicationStatus?: string;
  intake?: StartIntake | null;
}
interface StartIntake { agreedStartAt: string | null; nominatedWorkerId: string | null; serviceAgreement: string; participantAgreement: string; notes: string | null; isDraft: boolean }
interface Member { key: string; name: string; kind: string }

interface Data { awaitingAcceptance: StartRow[]; awaitingIntake: StartRow[]; startConfirmed: StartRow[] }

function Section({ title, hint, rows, action }: { title: string; hint: string; rows: StartRow[]; action: (r: StartRow) => React.ReactNode }) {
  return (
    <section className="pd-panel">
      <div className="pd-panel-head">
        <h2>{title}</h2>
        <span className="pd-small pd-muted">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="pd-quiet-empty">{hint}</div>
      ) : (
        <div style={{ paddingTop: 16 }}>
          {rows.map((r) => {
            const u = URGENCY_BADGE[r.urgency] ?? URGENCY_BADGE.ROUTINE;
            return (
              <article key={r.id} className="pd-request-row">
                <div>
                  <div className="pd-row-title"><strong>{r.title}</strong><span className={u.cls}>{u.label}</span></div>
                  <div className="pd-small pd-muted">
                    {r.suburb} · {r.categoryLabel} · {r.posterKind} · {new Date(r.scheduledStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    {r.workerName ? ` · Worker: ${r.workerName}` : ""}
                  </div>
                  {r.intake && (
                    <div className="pd-small pd-muted">
                      {r.intake.isDraft ? "Intake draft" : "Intake recorded"}
                      {r.intake.agreedStartAt ? ` · Agreed start ${new Date(r.intake.agreedStartAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}
                      {` · Service agreement ${r.intake.serviceAgreement === "AGREED" ? "recorded" : "pending"} · Participant / SC agreement ${r.intake.participantAgreement === "CONFIRMED" ? "confirmed" : "pending"}`}
                    </div>
                  )}
                </div>
                <div className="pd-buttons">{action(r)}</div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Provider doc P66: record intake before a service starts. A record, not a confirmation: worker acceptance and the poster's agreement stay separate.
function ManageIntakeDialog({ row, members, onClose, onSaved }: { row: StartRow; members: Member[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const toLocal = (iso: string | null | undefined) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
  const [start, setStart] = useState(toLocal(row.intake?.agreedStartAt ?? row.scheduledStartAt));
  const [worker, setWorker] = useState(row.intake?.nominatedWorkerId ?? "");
  const [svc, setSvc] = useState(row.intake?.serviceAgreement ?? "PENDING");
  const [pax, setPax] = useState(row.intake?.participantAgreement ?? "PENDING");
  const [notes, setNotes] = useState(row.intake?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(isDraft: boolean) {
    if (!start) { setError("Agreed service start is required."); return; }
    setBusy(true); setError(null);
    try {
      await api.put(`/provider-workspace/confirmed-starts/${row.id}`, {
        agreedStartAt: new Date(start).toISOString(), nominatedWorkerId: worker || null, serviceAgreement: svc, participantAgreement: pax, notes, isDraft,
      });
      onSaved(isDraft ? "Intake draft saved." : "Service start recorded. Worker acceptance and the poster's agreement are still tracked separately.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the intake record"); }
    finally { setBusy(false); }
  }
  const field = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
  return (
    <ModalShell title="Confirm service start" subtitle={row.title} onClose={onClose}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <h3 className="m-0 text-base font-bold text-slate-900">Intake and service start</h3>
        <p className="m-0 text-sm text-slate-500">Confirm prerequisites and the delivery arrangement.</p>
        <label className="block text-sm font-semibold text-slate-700">Agreed service start *
          <input type="datetime-local" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-slate-700">Worker / team
          <select className={field} value={worker} onChange={(e) => setWorker(e.target.value)}>
            <option value="">Not yet nominated</option>
            {members.map((m) => <option key={m.key} value={m.key.slice(2)}>{m.name}</option>)}
          </select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700">Service agreement
            <select className={field} value={svc} onChange={(e) => setSvc(e.target.value)}><option value="AGREED">Agreed and recorded</option><option value="PENDING">Pending</option></select></label>
          <label className="block text-sm font-semibold text-slate-700">Participant / SC agreement
            <select className={field} value={pax} onChange={(e) => setPax(e.target.value)}><option value="CONFIRMED">Confirmed</option><option value="PENDING">Pending</option></select></label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Intake and induction notes
          <textarea className={`${field} min-h-[90px]`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} /></label>
        {error && <p className="m-0 text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <button type="button" className="pd-btn" disabled={busy} onClick={() => void save(true)}>Save draft</button>
        <div className="flex items-center gap-3"><span className="text-xs text-slate-500">1 of 1</span><button type="button" className="pd-btn pd-btn-primary" disabled={busy} onClick={() => void save(false)}>{busy ? "Saving…" : "Save and continue"}</button></div>
      </div>
    </ModalShell>
  );
}

export default function ProviderConfirmedStartsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manage, setManage] = useState<StartRow | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => api.get<Data>("/provider-workspace/confirmed-starts")
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : "Failed to load service starts"));
  useEffect(() => {
    void load();
    api.get<{ members: (Member & { status: string })[] }>("/provider-workspace/team-availability").then((r) => setMembers((r.members ?? []).filter((m) => m.status !== "INVITED"))).catch(() => undefined);
  }, []);

  // Provider doc P66 actions on a confirmed start: Update the intake record, Message, Calendar. (Cancel/Close needs a closing status the backend does not have yet.)
  const startActions = (r: StartRow) => (
    <>
      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setViewId(r.id)}>View</button>
      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setManage(r)}>Update</button>
      <Link href="/messages" className="pd-btn pd-btn-sm">Message</Link>
      <Link href="/provider/calendar" className="pd-btn pd-btn-sm">Calendar</Link>
    </>
  );
  const view = (label: string) => (r: StartRow) => <button type="button" className="pd-btn pd-btn-sm" onClick={() => setViewId(r.id)}>{label}</button>;
  const intakeActions = (r: StartRow) => (
    <>
      <button type="button" className="pd-btn pd-btn-sm" onClick={() => setViewId(r.id)}>View request</button>
      <button type="button" className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => setManage(r)}>Manage intake and start</button>
    </>
  );

  const total = data ? data.awaitingAcceptance.length + data.awaitingIntake.length + data.startConfirmed.length : 0;
  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Starts</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Confirmed service starts</h1>
            <p>Keep referral acceptance, onboarding and delivered support separate.</p>
          </div>
          <div className="pd-buttons" />
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {notice && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
        {viewId && <RequestDetailDialog jobId={viewId} own={false} onClose={() => setViewId(null)} />}
        {manage && <ManageIntakeDialog row={manage} members={members} onClose={() => setManage(null)} onSaved={(m) => { setManage(null); setNotice(m); void load(); }} />}
        {!data && !error && <div className="pd-quiet-empty">Loading…</div>}
        {data && total === 0 && (
          <div className="pd-grid2">
            <div className="pd-empty">
              <LayoutGrid />
              <h3>No accepted referrals yet</h3>
              <p>An accepted Provider proposal appears here for intake and worker allocation.</p>
            </div>
          </div>
        )}
        {data && total > 0 && (
          <>
            <Section title="Awaiting acceptance" hint="No proposals are waiting for a reply. Proposals you send on Matched Requests appear here until the poster decides." rows={data.awaitingAcceptance} action={view("View request")} />
            <Section title="Awaiting intake" hint="No accepted referrals yet. An accepted Provider proposal appears here for intake and worker allocation." rows={data.awaitingIntake} action={intakeActions} />
            <Section title="Start confirmed" hint="Confirmed starts will appear here once a worker is allocated and confirms." rows={data.startConfirmed} action={startActions} />
          </>
        )}
      </div>
    </div>
  );
}
