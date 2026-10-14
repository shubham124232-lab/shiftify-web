"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Clock, CalendarDays, ShieldCheck, X, Check, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import type { JobSummary } from "@/lib/api/dashboard";
import { FeaturedShiftFlow } from "@/components/provider/PromotionFlows";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import type { PostingTier } from "@/lib/types/posting";

// Applicant as returned by GET /jobs/:id/applications (poster view).
interface Applicant {
  id: string; applicantUserId: string; status: string; createdAt: string;
  proposedRate?: number | string | null; availabilityType?: string | null; note?: string | null;
  applicant: {
    id: string; name: string; phoneVerified?: boolean;
    documents?: { docType: string; expiryDate: string | null; status: string }[];
    workerProfile?: { hourlyRate: number | string | null; servicesOffered: string[] | null; experienceLevel: string | null; suburb?: string | null; state?: string | null; travelRadiusKm?: number | null } | null;
    providerProfile?: { businessName?: string | null; coreServices: string[] | null } | null;
  };
}

export type ApplicationsScreen = "manage" | "sent" | "replacement" | "applications" | "compare" | "offer" | "profile" | "team" | "offers" | "activity" | "direct";

interface TeamMember { key: string; name: string; branch: string | null; status: string; skills?: string[] }

const MEMBER_STATUS: Record<string, string> = { AVAILABLE: "Available", ON_SHIFT: "On shift", INVITED: "Invited", NOT_SET: "Not set", VERIFIED: "Verified" };

const URGENCY: Record<string, { label: string; cls: string; icon: ReactNode }> = {
  RAPID:       { label: "Rapid",       cls: "bg-red-50 text-red-700",       icon: <Zap className="h-3 w-3" /> },
  URGENT:      { label: "Urgent",      cls: "bg-amber-50 text-amber-700",   icon: <Clock className="h-3 w-3" /> },
  LAST_MINUTE: { label: "Last-Minute", cls: "bg-orange-50 text-orange-700", icon: <Clock className="h-3 w-3" /> },
  ROUTINE:     { label: "Routine",     cls: "bg-blue-50 text-blue-700",     icon: <CalendarDays className="h-3 w-3" /> },
};
const STATUS_LABEL: Record<string, string> = { OPEN: "Live", CONFIRMED: "Confirmed", COMPLETED: "Completed", DRAFT: "Draft", CANCELLED: "Cancelled", EXPIRED: "Expired", PAUSED: "Paused" };

const categoryLabel = (v: string) => JOB_CATEGORIES.find((c) => c.value === v)?.label ?? v;
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
const money = (v: number | string | null | undefined) => (v === null || v === undefined || v === "" || isNaN(Number(v))) ? null : `$${Number(v).toFixed(2)}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();

function rateOf(a: Applicant) { return money(a.proposedRate) ?? money(a.applicant.workerProfile?.hourlyRate); }
function servicesOf(a: Applicant): string[] { return a.applicant.workerProfile?.servicesOffered ?? a.applicant.providerProfile?.coreServices ?? []; }
function complianceOf(a: Applicant): string {
  const docs = a.applicant.documents ?? [];
  if (docs.length === 0) return "Not provided";
  const now = Date.now();
  if (docs.some((d) => d.expiryDate && new Date(d.expiryDate).getTime() < now)) return "Expired item";
  if (docs.some((d) => d.expiryDate && new Date(d.expiryDate).getTime() < now + 30 * 86400000)) return "Expiring soon";
  return "Current";
}

const pill = "rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600";

function Modal({ title, subtitle, onClose, footer, children, wide }: { title: string; subtitle?: string; onClose: () => void; footer: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-w-[80vw]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="m-0 text-xl font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="m-0 mt-1 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</div>
      </div>
    </div>
    </Portal>
  );
}

function Avatar({ name, large }: { name: string; large?: boolean }) {
  return <span className={`flex ${large ? "h-14 w-14 text-base" : "h-11 w-11 text-sm"} shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600`}>{initials(name)}</span>;
}

// Provider dashboard: Worker applications → Compare / Profile / Review offer, plus Manage staffing request.
export function ApplicationsFlow({ job, start = "applications", onClose, onViewDetails }: { job: JobSummary; start?: ApplicationsScreen; onClose: () => void; onViewDetails?: () => void }) {
  const router = useRouter();
  const [screen, setScreen] = useState<ApplicationsScreen>(start);
  const [featuring, setFeaturing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [apps, setApps] = useState<Applicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [active, setActive] = useState<Applicant | null>(null);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState("Overview");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ applications: Applicant[] }>(`/jobs/${job.id}/applications`);
      setApps(r.applications ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load applications"); setApps([]); }
  }, [job.id]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (screen !== "team" || team !== null) return;
    api.get<{ members: TeamMember[] }>("/provider-workspace/team-availability")
      .then((r) => setTeam(r.members ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load your team"); setTeam([]); });
  }, [screen, team]);

  async function askAvailability(keys: string[]) {
    if (keys.length === 0) return;
    setBusy("ask"); setError(null);
    try {
      await api.post("/provider-workspace/team-availability/requests", { jobId: job.id, memberKeys: keys });
      setPicked(new Set());
      setScreen("sent");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the request"); }
    finally { setBusy(null); }
  }

  const live = (apps ?? []).filter((a) => !["DECLINED", "WITHDRAWN"].includes(a.status));
  const start0 = new Date(job.scheduledStartAt);
  const end0 = job.totalHours ? new Date(start0.getTime() + job.totalHours * 3600000) : null;
  const u = URGENCY[job.urgency] ?? URGENCY.ROUTINE;

  async function act(appId: string, action: "shortlist" | "decline" | "select") {
    setBusy(`${action}:${appId}`); setError(null);
    try {
      await api.patch(`/jobs/${job.id}/applications/${appId}/${action}`, {});
      await load();
      if (action === "select") { setNotice("Offer sent. The worker must accept before the shift is confirmed."); setScreen("applications"); setConsent(false); }
    } catch (e) { setError(e instanceof Error ? e.message : "That action failed"); }
    finally { setBusy(null); }
  }

  async function jobAction(kind: "duplicate" | "pause" | "cancel") {
    setBusy(kind); setError(null);
    try {
      if (kind === "duplicate") {
        const r = await api.post<{ job: { id: string } }>(`/jobs/${job.id}/duplicate`, {});
        router.push(`/jobs/${r.job.id}`); return;
      }
      await api.patch(`/jobs/${job.id}/${kind}`, {});
      setNotice(kind === "pause" ? "Applications paused." : "Request cancelled.");
      setConfirmCancel(false);
    } catch (e) { setError(e instanceof Error ? e.message : "That action failed"); }
    finally { setBusy(null); }
  }

  async function saveWorker(a: Applicant) {
    setBusy("save"); setError(null);
    try { await api.post("/saved-professionals", { professionalUserId: a.applicant.id }); setNotice(`${a.applicant.name} saved to Saved Workers.`); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save worker"); }
    finally { setBusy(null); }
  }

  const Err = error ? <p className="m-0 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null;
  const Ok = notice ? <p className="m-0 mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null;
  const openOffer = (a: Applicant) => { setActive(a); setConsent(false); setError(null); setNotice(null); setScreen("offer"); };

  // ── Manage staffing request ───────────────────────────────────────────────
  if (editing) {
    return <ProviderStaffingWizard tier={job.urgency as PostingTier} editJobId={job.id} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice("Request updated."); }} />;
  }
  if (screen === "manage") {
    const tabs = ["Overview", `Applications (${live.length})`, "Internal team", "Offers & confirmed", "Messages", "Activity"];
    return (<>
      {featuring && <FeaturedShiftFlow initialId={job.id}
        shifts={[{ id: job.id, title: job.title, urgency: job.urgency, suburb: job.suburb, scheduledStartAt: job.scheduledStartAt, featuredUntil: (job as { featuredUntil?: string | null }).featuredUntil ?? null }]}
        onClose={() => setFeaturing(false)} onDone={(m) => { setFeaturing(false); setNotice(m); }} />}
      <Modal title="Manage staffing request" onClose={onClose}
        footer={<>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <div className="flex gap-2">
            {onViewDetails ? <Button variant="outline" onClick={onViewDetails}>View full details</Button> : <Link href={`/jobs/${job.id}`}><Button variant="outline">View full details</Button></Link>}
            <Button onClick={() => { setNotice(null); setScreen("applications"); }}>Review applications</Button>
          </div>
        </>}>
        {Err}{Ok}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${u.cls}`}>{u.icon}{u.label}</span>
          <span className={pill}>{STATUS_LABEL[job.status] ?? job.status}</span>
        </div>
        <h3 className="m-0 mt-3 text-2xl font-bold text-slate-900">{job.title}</h3>
        <p className="m-0 mt-2 text-sm text-slate-500">{job.suburb} · {fmtDate(job.scheduledStartAt)} · {fmtTime(start0)} · {["CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(job.status) ? 1 : 0}/1 slots filled</p>

        <div className="mt-4 flex gap-6 overflow-x-auto border-b border-slate-200">
          {tabs.map((t) => {
            const key = t.startsWith("Applications") ? "Applications" : t;
            const go = () => {
              setNotice(null); setError(null);
              if (key === "Overview") setTab("Overview");
              else if (key === "Applications") setScreen("applications");
              else if (key === "Internal team") setScreen("team");
              else if (key === "Offers & confirmed") setScreen("offers");
              else if (key === "Messages") { onClose(); router.push("/messages"); }
              else if (key === "Activity") setScreen("activity");
            };
            return <button key={t} type="button" onClick={go} className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium ${tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{t}</button>;
          })}
        </div>

        {tab === "Overview" ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="m-0 text-base font-bold text-slate-900">Core matching</p>
                <p className="m-0 mt-1 text-sm text-slate-600">Eligible worker suggestions and ordinary notifications are included. Review all required checks before confirmation.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setScreen("team")}>Check internal availability</Button>
                  <Link href="/workers/available"><Button variant="outline" size="sm">Find external workers</Button></Link>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="m-0 text-base font-bold text-slate-900">Optional promotion</p>
                <p className="m-0 mt-1 text-sm text-slate-600">Promote this request or invite a chosen eligible external worker. Neither guarantees shift fulfilment.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { if (job.status !== "OPEN") { setError("Feature a valid live external request."); return; } setError(null); setFeaturing(true); }}>Feature this Shift</Button>
                  <Button variant="outline" size="sm" onClick={() => { if (job.status !== "OPEN") { setError("Direct Connect needs a live external shift and an eligible external worker."); return; } setError(null); setScreen("direct"); }}>Direct Connect</Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => jobAction("duplicate")}>{busy === "duplicate" ? "Creating…" : "Duplicate as new"}</Button>
              <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => { if (job.status !== "OPEN") { setError("Only unfilled live applications can be paused."); return; } void jobAction("pause"); }}>Pause applications</Button>
              {confirmCancel ? (
                <>
                  <Button variant="danger" size="sm" disabled={busy !== null} onClick={() => jobAction("cancel")}>Yes, cancel request</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>Keep request</Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => setConfirmCancel(true)}>Cancel request</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setError(null); setScreen("replacement"); }}>Replacement workflow</Button>
            </div>
          </div>
        ) : tab === "Applications" ? (
          <div className="mt-5 text-sm text-slate-600">
            <p className="m-0">{live.length === 0 ? "No applications yet." : `${live.length} application${live.length === 1 ? "" : "s"} to review.`}</p>
            <Button className="mt-3" size="sm" onClick={() => setScreen("applications")}>Review applications</Button>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-500">{tab} will be available here soon. For now, open the {onViewDetails ? <button type="button" onClick={onViewDetails} className="font-semibold text-brand-600 hover:underline">full request</button> : <Link href={`/jobs/${job.id}`} className="font-semibold text-brand-600 hover:underline">full request</Link>}.</p>
        )}
      </Modal>
    </>);
  }

  // ── Replacement workflow ──────────────────────────────────────────────────
  if (screen === "replacement") {
    return (
      <Modal title="Replacement workflow" onClose={onClose}
        footer={<>
          <Button variant="outline" onClick={() => setScreen("team")}>Check internal backups</Button>
          <Button disabled={busy !== null} onClick={() => jobAction("duplicate")}>{busy === "duplicate" ? "Creating…" : "Draft a new replacement"}</Button>
        </>}>
        {Err}
        <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
      </Modal>
    );
  }

  // ── Availability request sent ─────────────────────────────────────────────
  if (screen === "sent") {
    return (
      <Modal title="Availability request sent" onClose={onClose}
        footer={<>
          <Button variant="outline" onClick={onClose}>Done</Button>
          <Button onClick={() => { onClose(); router.push("/provider/worker-portal"); }}>Open worker portal</Button>
        </>}>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-7 w-7" /></span>
          <p className="m-0 mt-4 text-xl font-bold text-slate-900">Availability request sent</p>
          <p className="m-0 mt-2 text-base text-slate-500">No Provider action was consumed. Preview the worker response in their personal portal.</p>
        </div>
      </Modal>
    );
  }

  // ── Select internal team ──────────────────────────────────────────────────
  if (screen === "team") {
    return (
      <Modal title="Select internal team" onClose={onClose}
        footer={<>
          <Button variant="outline" onClick={() => setScreen("manage")}>Back to request</Button>
          <Button disabled={busy !== null || !team || team.length === 0} onClick={() => askAvailability((team ?? []).filter((m) => m.status !== "INVITED").map((m) => m.key))}>Ask all eligible internal workers</Button>
        </>}>
        {Err}{Ok}
        <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
        <p className="m-0 mt-1 text-sm text-slate-500">Availability responses do not confirm an assignment.</p>
        <div className="mt-4 space-y-3">
          {team === null ? <div className="h-20 animate-pulse rounded-xl bg-slate-100" /> : team.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="m-0 text-base font-bold text-slate-900">No internal availability check</p>
              <p className="m-0 mt-1 text-sm text-slate-500">Add internal Team Members, then check who is available for this request.</p>
              <Link href="/provider/workforce"><Button className="mt-3" size="sm">Add internal team member</Button></Link>
            </div>
          ) : team.map((m) => (
            <div key={m.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="m-0 text-base font-bold text-slate-900">{m.name}</p>
                <p className="m-0 text-sm text-slate-500">{[(m.skills ?? []).join(", "), m.status === "INVITED" ? "Verification pending" : "Current"].filter(Boolean).join(" · ")}</p>
              </div>
              <Button size="sm" disabled={busy !== null || m.status === "INVITED"} onClick={() => askAvailability([m.key])}>Ask availability</Button>
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  // ── Offers and confirmed workers ──────────────────────────────────────────
  if (screen === "offers") {
    const offered = (apps ?? []).filter((a) => a.status === "SELECTED");
    return (
      <Modal title="Offers and confirmed workers" onClose={onClose} footer={<Button variant="outline" onClick={() => setScreen("manage")}>Back</Button>}>
        <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
        {offered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 p-6 text-center">
            <p className="m-0 text-base font-bold text-slate-900">No offers</p>
            <p className="m-0 mt-1 text-sm text-slate-500">Review applications or your internal team to send an offer.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {offered.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <Avatar name={a.applicant.name} />
                <div className="flex-1"><p className="m-0 text-base font-semibold text-slate-900">{a.applicant.name}</p><p className="m-0 text-sm text-slate-500">{rateOf(a) ? `${rateOf(a)} / hr` : "Rate to be agreed"}</p></div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Offer sent</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  // ── Request activity ──────────────────────────────────────────────────────
  if (screen === "activity") {
    const events = [...(apps ?? [])]
      .map((a) => ({ id: a.id, at: new Date(a.createdAt), text: `${a.applicant.name} applied to ${job.title}` }))
      .sort((x, y) => y.at.getTime() - x.at.getTime());
    return (
      <Modal title="Request activity" onClose={onClose} footer={<Button variant="outline" onClick={() => setScreen("manage")}>Back</Button>}>
        <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
        <p className="m-0 mt-1 text-sm text-slate-500">Activity is scoped to this request and the people authorised to see it.</p>
        {events.length === 0 ? <p className="mt-4 text-sm text-slate-500">No activity yet.</p> : (
          <ul className="m-0 mt-4 list-none divide-y divide-slate-100 p-0">
            {events.map((e) => (
              <li key={e.id} className="py-3"><p className="m-0 text-sm text-slate-800">{e.text}</p><p className="m-0 mt-0.5 text-xs text-slate-400">{e.at.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p></li>
            ))}
          </ul>
        )}
      </Modal>
    );
  }

  // ── Direct Connect: pick an applicant to invite ───────────────────────────
  if (screen === "direct") {
    return (
      <Modal title="Select external worker" onClose={onClose} footer={<Button variant="outline" onClick={() => setScreen("manage")}>Back to request</Button>}>
        <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
        <p className="m-0 mt-1 text-sm text-slate-500">One-worker shift: up to three invitations; only the first accepted opens and is charged.</p>
        <div className="mt-4 rounded-xl border border-slate-200 p-5 text-center">
          <p className="m-0 text-sm text-slate-600">Find an eligible external worker, then invite them with Direct Connect.</p>
          <Link href="/workers/available"><Button className="mt-3" size="sm">Find external workers</Button></Link>
        </div>
      </Modal>
    );
  }

  // ── Worker profile ────────────────────────────────────────────────────────
  if (screen === "profile" && active) {
    const w = active.applicant.workerProfile;
    const comp = complianceOf(active);
    return (
      <Modal title="Worker profile" subtitle={`Application · ${active.id.slice(0, 8)}`} onClose={() => setScreen("applications")}
        footer={<>
          <Button variant="outline" onClick={() => setScreen("applications")}>Close</Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy !== null} onClick={() => saveWorker(active)}>Save worker</Button>
            <Link href="/workers/available"><Button>Direct Connect</Button></Link>
          </div>
        </>}>
        {Err}{Ok}
        <div className="flex items-center gap-4">
          <Avatar name={active.applicant.name} large />
          <div>
            <p className="m-0 text-2xl font-bold text-slate-900">{active.applicant.name}</p>
            <p className="m-0 mt-1 text-sm text-slate-500">{active.applicant.providerProfile ? "Provider" : "External worker"}{w?.experienceLevel ? ` · ${w.experienceLevel.toLowerCase()} experience` : ""}</p>
            <div className="mt-2 flex gap-2">
              {active.availabilityType ? <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Available</span> : null}
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Credential summary {comp.toLowerCase()}</span>
            </div>
          </div>
        </div>
        <p className="m-0 mt-6 text-lg font-bold text-slate-900">Capabilities</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {servicesOf(active).length ? servicesOf(active).map((s) => <span key={s} className={pill}>{s.replace(/_/g, " ")}</span>) : <span className="text-sm text-slate-500">Not provided</span>}
        </div>
        <dl className="m-0 mt-5 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-slate-100 pt-5 text-sm">
          <div><dt className="text-xs text-slate-500">Area</dt><dd className="m-0 mt-1 font-semibold text-slate-900">{w?.suburb ? `${w.suburb}${w.state ? `, ${w.state}` : ""}` : "Not provided"}</dd></div>
          <div><dt className="text-xs text-slate-500">Travel radius</dt><dd className="m-0 mt-1 font-semibold text-slate-900">{w?.travelRadiusKm ? `${w.travelRadiusKm} km` : "Not provided"}</dd></div>
          <div><dt className="text-xs text-slate-500">Rate</dt><dd className="m-0 mt-1 font-semibold text-slate-900">{rateOf(active) ? `${rateOf(active)} / hr` : "Not provided"}</dd></div>
          <div><dt className="text-xs text-slate-500">Relationship</dt><dd className="m-0 mt-1 font-semibold text-slate-900">{active.applicant.providerProfile ? "Provider" : "Independent worker"}</dd></div>
        </dl>
        <p className="m-0 mt-5 flex gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          Only authorised credential summaries are visible. Raw personal evidence and private contact information follow consent and access rules.
        </p>
      </Modal>
    );
  }

  // ── Review shift offer ────────────────────────────────────────────────────
  if (screen === "offer" && active) {
    const rate = rateOf(active);
    return (
      <Modal title="Review shift offer" onClose={() => setScreen("applications")}
        footer={<>
          <Button variant="outline" onClick={() => setScreen("applications")}>Back</Button>
          <Button disabled={!consent || busy !== null} onClick={() => act(active.id, "select")}>{busy?.startsWith("select") ? "Sending…" : "Send offer"}</Button>
        </>}>
        {Err}
        <div className="flex items-center gap-4">
          <Avatar name={active.applicant.name} />
          <div>
            <p className="m-0 text-xl font-bold text-slate-900">{active.applicant.name}</p>
            <p className="m-0 mt-1 text-sm text-slate-500">{active.applicant.providerProfile ? "Provider" : "External worker"} · {job.title}</p>
          </div>
        </div>
        <dl className="m-0 mt-5 divide-y divide-slate-100 text-sm">
          <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Schedule</dt><dd className="m-0 text-right font-semibold text-slate-900">{fmtDate(job.scheduledStartAt)} · {fmtTime(start0)}{end0 ? `–${fmtTime(end0)}` : ""}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Offered rate</dt><dd className="m-0 text-right font-semibold text-slate-900">{rate ? `${rate} / hr` : "To be agreed"}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Support requirements</dt><dd className="m-0 text-right text-slate-900">{categoryLabel(job.category)}</dd></div>
        </dl>
        <p className="m-0 mt-3 text-sm text-slate-500">Essential care instructions are released to the confirmed worker.</p>
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" />
          I have reviewed credentials, suitability, shift terms and the permitted safety information. Worker acceptance is required before final confirmation.
        </label>
      </Modal>
    );
  }

  // ── Compare applicants ────────────────────────────────────────────────────
  if (screen === "compare") {
    return (
      <Modal title="Compare applicants" wide onClose={() => setScreen("applications")}
        footer={<Button variant="outline" onClick={() => setScreen("applications")}>Back to applications</Button>}>
        {Err}
        <p className="m-0 mb-4 text-lg font-bold text-slate-900">{job.title}</p>
        {live.length === 0 ? <p className="text-sm text-slate-500">No applicants to compare.</p> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {live.slice(0, 4).map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 p-5">
                <p className="m-0 text-lg font-bold text-slate-900">{a.applicant.name}</p>
                <dl className="m-0 mt-3 divide-y divide-slate-100 text-sm">
                  {[
                    ["Availability", a.availabilityType ? a.availabilityType.replace(/_/g, " ").toLowerCase() : "Not provided"],
                    ["Rate", rateOf(a) ?? "Not provided"],
                    ["Compliance", complianceOf(a)],
                    ["Services", servicesOf(a).map((s) => s.replace(/_/g, " ")).join(", ") || "Not provided"],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-2 gap-3 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="m-0 font-semibold text-slate-900">{v}</dd></div>
                  ))}
                </dl>
                <Button size="sm" className="mt-3" onClick={() => openOffer(a)}>Send offer</Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  // ── Worker applications (default) ─────────────────────────────────────────
  return (
    <Modal title="Worker applications" onClose={onClose}
      footer={<>
        <Button variant="outline" onClick={() => { setNotice(null); setError(null); setScreen("manage"); }}>Back to request</Button>
        <Button variant="outline" disabled={live.length < 2} onClick={() => setScreen("compare")}>Compare applicants</Button>
      </>}>
      {Err}{Ok}
      <p className="m-0 text-lg font-bold text-slate-900">{job.title}</p>
      <p className="m-0 mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">An application expresses interest. Review credentials, agree terms and record acceptance before confirming.</p>
      <div className="mt-4 space-y-4">
        {apps === null ? <div className="h-24 animate-pulse rounded-2xl bg-slate-100" /> : live.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <LayoutGrid className="h-9 w-9 text-slate-300" />
            <p className="m-0 mt-3 text-lg font-bold text-slate-900">No external applications yet</p>
            <p className="m-0 mt-1 max-w-md text-base text-slate-500">Check internal availability, invite an eligible worker or leave ordinary matching active.</p>
            <Button className="mt-4" onClick={() => setScreen("team")}>Check internal team</Button>
          </div>
        ) : live.map((a) => {
          const w = a.applicant.workerProfile;
          const shortlisted = a.status === "SHORTLISTED";
          const sel = a.status === "SELECTED";
          return (
            <div key={a.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={a.applicant.name} />
                  <div>
                    <p className="m-0 text-lg font-bold text-slate-900">{a.applicant.name}</p>
                    <p className="m-0 mt-0.5 text-sm text-slate-500">{[rateOf(a) ? `${rateOf(a)} / hr` : null, w?.experienceLevel ? w.experienceLevel.toLowerCase() : null, w?.suburb].filter(Boolean).join(" · ") || "Details not provided"}</p>
                  </div>
                </div>
                {shortlisted ? <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Shortlisted</span> : null}
                {sel ? <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Offer sent</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{servicesOf(a).slice(0, 4).map((s) => <span key={s} className={pill}>{s.replace(/_/g, " ")}</span>)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setActive(a); setNotice(null); setError(null); setScreen("profile"); }}>Profile</Button>
                <Button variant="outline" size="sm" disabled={busy !== null || shortlisted || sel} onClick={() => act(a.id, "shortlist")}>{busy === `shortlist:${a.id}` ? "Saving…" : "Shortlist"}</Button>
                <Link href="/messages"><Button variant="outline" size="sm">Message</Button></Link>
                <Button size="sm" disabled={busy !== null || sel} onClick={() => openOffer(a)}>Send offer</Button>
                <Button variant="outline" size="sm" disabled={busy !== null || sel} onClick={() => act(a.id, "decline")}>Decline</Button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
