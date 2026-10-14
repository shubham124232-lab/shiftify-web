"use client";

// Provider Documents and compliance (doc P72, approved demo): organisation and worker evidence with expiry,
// visibility and renewal history. A renewal adds a new record and keeps the old one as history.

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Plus, RotateCcw } from "lucide-react";
import { api, http } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { cn } from "@/lib/utils";

interface Doc {
  id: string; userId: string; docType: string; fileName: string; fileUrl?: string; status: string;
  referenceNumber: string | null; issueDate: string | null; expiryDate: string | null; uploadedAt: string;
  title: string | null; issuer: string | null; visibility: string | null; replacesId: string | null; supersededAt: string | null;
  ownerName: string; ownerKind: "ORGANISATION" | "WORKER";
}
interface Worker { id: string; name: string }

const TYPES = [
  { v: "NDIS_AUDIT", l: "Registration" }, { v: "PUBLIC_LIABILITY_INSURANCE", l: "Public liability insurance" },
  { v: "PROFESSIONAL_INDEMNITY", l: "Professional indemnity insurance" }, { v: "WORKERS_COMP", l: "Workers compensation insurance" },
  { v: "ABN_CONFIRMATION", l: "ABN / business evidence" }, { v: "NDIS_SCREENING", l: "Worker screening or competency" },
  { v: "QUALIFICATION_CERTIFICATE", l: "Qualification / certificate" }, { v: "POLICIES_PROCEDURES", l: "Quality evidence" },
  { v: "OTHER", l: "Service brochure or intake pack" },
];
const VISIBILITY = [
  { v: "VERIFICATION_TEAM", l: "Verification team" }, { v: "AUTHORISED_ADMINISTRATORS", l: "Authorised administrators" },
  { v: "AUTHORISED_WORKFORCE", l: "Authorised workforce users" }, { v: "AFTER_PERMITTED_ENQUIRY", l: "After permitted enquiry" },
];
const DAY = 86400000;
// Submission gate for Providers (not a verification gate): these must be on file and unexpired before posting.
const REQUIRED = ["PUBLIC_LIABILITY_INSURANCE", "PROFESSIONAL_INDEMNITY", "NDIS_AUDIT"];
const typeLabel = (v: string) => TYPES.find((t) => t.v === v)?.l
  ?? (/^[A-Z0-9_]+$/.test(v) ? v.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : v);
const visLabel = (v: string | null) => VISIBILITY.find((x) => x.v === v)?.l ?? "Verification team";
const short = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "No expiry");
const inp = "mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";
const lab = "text-sm font-semibold text-slate-900";

type State = "Current" | "Expiring" | "Expired" | "Action required";
function stateOf(d: Doc): State {
  if (d.status === "REJECTED") return "Action required";
  if (d.expiryDate) {
    const left = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / DAY);
    if (left < 0) return "Expired";
    if (left <= 30) return "Expiring";
  }
  return "Current";
}
const TONE: Record<State, string> = { Current: "bg-emerald-50 text-emerald-700", Expiring: "bg-amber-50 text-amber-700", Expired: "bg-red-50 text-red-700", "Action required": "bg-red-50 text-red-700" };
const nameOf = (d: Doc) => d.title || typeLabel(d.docType);

export function ProviderDocuments() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState<{ renew: Doc | null } | null>(null);
  const [view, setView] = useState<Doc | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ documents: Doc[]; workers: Worker[] }>("/users/me/documents/organisation");
      setDocs(r.documents ?? []); setWorkers(r.workers ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load documents"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const current = useMemo(() => docs.filter((d) => !d.supersededAt), [docs]);
  const rows = current.filter((d) => {
    if (filter !== "ALL" && stateOf(d) !== filter) return false;
    const t = q.trim().toLowerCase();
    return !t || nameOf(d).toLowerCase().includes(t) || d.ownerName.toLowerCase().includes(t);
  });
  const missingRequired = REQUIRED.filter((t) => !current.some((d) => d.ownerKind === "ORGANISATION" && d.docType === t && stateOf(d) !== "Expired" && stateOf(d) !== "Action required"));
  const clear = () => { setQ(""); setFilter("ALL"); };

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs text-slate-500">Provider / Documents</p>
          <h1 className="m-0 mt-2 text-3xl font-bold text-slate-900">Documents and compliance</h1>
          <p className="m-0 mt-1 text-sm text-slate-500">Track evidence, expiry and the users permitted to see it.</p>
        </div>
        <Button onClick={() => setForm({ renew: null })}><Plus className="mr-1.5 h-4 w-4" />Add document</Button>
      </div>
      {error && <p className="m-0 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {notice && <p className="m-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</p>}

      {!loading && missingRequired.length > 0 && (
        <p className="m-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Needed before you can publish: {missingRequired.map(typeLabel).join(", ")}. Add or renew them with Add document.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search evidence or worker" className="h-11 w-full max-w-sm rounded-lg border border-slate-200 px-3 text-sm" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-11 w-full max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm">
          <option value="ALL">All</option><option value="Current">Current</option><option value="Expiring">Expiring</option><option value="Expired">Expired</option><option value="Action required">Action required</option>
        </select>
        <Button variant="outline" className="ml-auto" onClick={clear}><RotateCcw className="mr-1.5 h-4 w-4" />Clear filters</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-600">
            {["Document", "Owner", "Status", "Expiry", "Visibility", "Action"].map((h) => <th key={h} className="px-5 py-4">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-5 py-8 text-slate-500">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center font-semibold text-slate-900">{current.length === 0 ? "No documents yet. Add your registration, insurance and worker evidence." : "No documents match these filters"}</td></tr>
              : rows.map((d) => {
                const st = stateOf(d);
                return (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-4"><span className="flex items-center gap-2 text-slate-900"><FileText className="h-4 w-4 text-slate-500" />{nameOf(d)}</span></td>
                    <td className="px-5 py-4 text-slate-700">{d.ownerName}</td>
                    <td className="px-5 py-4"><span className={cn("rounded px-2 py-0.5 text-xs font-semibold", TONE[st])}>{st}</span></td>
                    <td className="px-5 py-4 text-slate-700">{short(d.expiryDate)}</td>
                    <td className="px-5 py-4 text-slate-700">{visLabel(d.visibility)}</td>
                    <td className="px-5 py-4"><span className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setView(d)}>View</Button>
                      <Button variant="outline" size="sm" onClick={() => setForm({ renew: d })}>Renew</Button>
                    </span></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs text-slate-500">Sensitive evidence is only visible to the users shown under Visibility. Public profile badges never show the documents themselves.</p>

      {form && <DocumentForm renew={form.renew} workers={workers} onClose={() => setForm(null)}
        onSaved={async (msg) => { setForm(null); setView(null); setNotice(msg); await load(); }} />}
      {view && <DocumentView doc={view} history={docs.filter((d) => d.userId === view.userId && d.docType === view.docType && d.id !== view.id && (d.supersededAt || false) && chain(docs, view).includes(d.id))}
        onClose={() => setView(null)} onRenew={() => { setForm({ renew: view }); setView(null); }} />}
    </div>
  );
}

// ids of the earlier records a renewal replaced, newest first
function chain(docs: Doc[], from: Doc): string[] {
  const out: string[] = []; let cur: Doc | undefined = from;
  while (cur?.replacesId) { out.push(cur.replacesId); cur = docs.find((d) => d.id === cur!.replacesId); }
  return out;
}

function DocumentForm({ renew, workers, onClose, onSaved }: { renew: Doc | null; workers: Worker[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const [title, setTitle] = useState(renew ? nameOf(renew) : "");
  const [docType, setDocType] = useState(renew?.docType ?? TYPES[0].v);
  const [owner, setOwner] = useState(renew ? (renew.ownerKind === "WORKER" ? renew.userId : "ORG") : "ORG");
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState("");
  const [visibility, setVisibility] = useState(renew?.visibility ?? VISIBILITY[0].v);
  const [issuer, setIssuer] = useState(renew?.issuer ?? renew?.referenceNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ok = !!title.trim() && !!expiry && !!file;

  async function save() {
    if (!file) return;
    setBusy(true); setErr(null);
    const f = new FormData();
    f.append("file", file); f.append("docType", docType); f.append("title", title.trim()); f.append("expiryDate", expiry);
    f.append("visibility", visibility);
    if (issuer.trim()) { f.append("issuer", issuer.trim()); f.append("referenceNumber", issuer.trim()); }
    if (renew) f.append("replacesId", renew.id);
    try {
      const url = owner === "ORG" ? "/users/me/documents" : `/linking/workers/${owner}/documents`;
      await http.post(url, f, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved(renew ? "Evidence renewed. The earlier record is kept as history." : "Document added.");
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); setBusy(false); }
  }

  return (
    <ModalShell title="Document evidence" subtitle={renew ? "Renew existing record" : undefined} onClose={onClose}>
      <div className="grid gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
        <div><label className={lab}>Document title *</label><input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className={lab}>Document type *</label>
          <select className={inp} value={docType} disabled={!!renew} onChange={(e) => setDocType(e.target.value)}>{TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
        <div><label className={lab}>Owner *</label>
          <select className={inp} value={owner} disabled={!!renew} onChange={(e) => setOwner(e.target.value)}>
            <option value="ORG">Organisation</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
        <div className="hidden sm:block" />
        <div className="sm:col-span-2"><label className={lab}>File *</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className={cn(inp, "py-2.5")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="m-0 mt-1 text-xs text-slate-500">PDF, JPG or PNG, up to 10 MB.</p></div>
        <div><label className={lab}>Expiry date *</label><input type="date" className={inp} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
        <div><label className={lab}>Visibility</label>
          <select className={inp} value={visibility} onChange={(e) => setVisibility(e.target.value)}>{VISIBILITY.map((v) => <option key={v.v} value={v.v}>{v.l}</option>)}</select></div>
        <div><label className={lab}>Issuer / reference</label><input className={inp} value={issuer} onChange={(e) => setIssuer(e.target.value)} /></div>
        <div><label className={lab}>Review state</label><p className="m-0 mt-3 text-sm text-slate-600">Set by Shiftify after upload. It never changes access to the marketplace.</p></div>
        {err && <p className="m-0 text-sm text-red-600 sm:col-span-2">{err}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <div className="flex items-center gap-3"><span className="text-xs text-slate-500">1 of 1</span>
          <Button disabled={!ok || busy} onClick={save}>{busy ? "Saving…" : renew ? "Save renewal" : "Save and continue"}</Button></div>
      </div>
    </ModalShell>
  );
}

function DocumentView({ doc, history, onClose, onRenew }: { doc: Doc; history: Doc[]; onClose: () => void; onRenew: () => void }) {
  const st = stateOf(doc);
  const row = (k: string, v: React.ReactNode) => <div key={k} className="flex gap-6 border-b border-slate-100 py-3 text-sm"><dt className="w-40 shrink-0 text-slate-500">{k}</dt><dd className="m-0 text-slate-900">{v}</dd></div>;
  return (
    <ModalShell title="Document evidence" onClose={onClose}>
      <div className="overflow-y-auto px-6 py-5">
        <h3 className="m-0 mb-2 text-xl font-bold text-slate-900">{nameOf(doc)}</h3>
        <dl className="m-0">
          {row("Owner", <b>{doc.ownerName}</b>)}
          {row("Review status", <span className={cn("block rounded px-3 py-1 text-xs font-semibold", TONE[st])}>{st}</span>)}
          {row("Expiry", short(doc.expiryDate))}
          {row("Visibility", visLabel(doc.visibility))}
          {row("Type", typeLabel(doc.docType))}
          {row("Issuer / reference", doc.issuer || doc.referenceNumber || "Not recorded")}
          {row("Uploaded", new Date(doc.uploadedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }))}
          {doc.fileUrl && row("File", <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline">Open file</a>)}
        </dl>
        {history.length > 0 && (
          <div className="mt-4"><p className="m-0 mb-1 text-sm font-bold text-slate-900">Earlier versions</p>
            {history.map((h) => <p key={h.id} className="m-0 py-1 text-sm text-slate-600">Uploaded {new Date(h.uploadedAt).toLocaleDateString("en-AU")} · expiry {short(h.expiryDate)}</p>)}</div>
        )}
      </div>
      <div className="flex justify-between border-t border-slate-100 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={onRenew}>Renew evidence</Button>
      </div>
    </ModalShell>
  );
}
