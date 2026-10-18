"use client";

// Provider Organisation profile (doc P10/P11, approved demo): public marketing fields separate from private
// verification records, a 3-step editor, the verification centre and a public-profile preview.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { upsertProfile } from "@/lib/api/profile";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { FileUploadField } from "@/components/registration/fields/FileUploadField";
import { cn } from "@/lib/utils";

interface Profile {
  businessName?: string | null; legalEntityName?: string | null; abn?: string | null; logoUrl?: string | null;
  businessDescription?: string | null; primaryContactEmail?: string | null; primaryContactPhone?: string | null;
  coreServices?: string[] | null; serviceAreas?: string[] | null; languages?: string[] | null; fundingAccepted?: string[] | null;
  continuityModel?: string | null; websiteUrl?: string | null; intakeProcess?: string | null; directEnquiryAudience?: string | null;
  displayPublicPhone?: boolean | null; ndisRegistered?: boolean | null; ndisProviderNumber?: string | null; businessAddress?: string | null;
  accessibilityCapabilities?: string[] | null; serviceMode?: string | null; socialLinks?: { facebook?: string; instagram?: string; linkedin?: string } | null;
  termsAccepted?: boolean | null; privacyPolicyAccepted?: boolean | null; platformRulesAccepted?: boolean | null;
}
interface Me { user: { status: string; emailVerified?: boolean; providerProfile?: Profile | null }; phoneVerified?: boolean; marketplace: { missing: string[] } | null }
interface Doc { docType: string; status: string; expiryDate: string | null }

const SERVICES = ["Personal Care", "Community Access", "Daily Living", "Overnight Support", "Complex Care", "Behaviour Support", "Transport", "Respite", "Psychosocial Support"];
const LANGUAGES = ["English", "Arabic", "Urdu", "Hindi", "Mandarin", "Auslan"];
const ACCESS = ["Wheelchair accessible premises", "Easy Read materials", "Interpreter access", "Culturally safe support", "Communication aids"];
const DELIVERY = [{ v: "IN_PERSON", l: "In person" }, { v: "REMOTE", l: "Remote" }, { v: "BOTH", l: "In person and remote" }];
const FUNDING = ["Self-managed", "Plan-managed", "NDIA-managed", "Private"];
const CONTINUITY = ["Small consistent team", "Dedicated worker where possible", "Pooled roster"];
const INTAKE = ["Intake call first", "Online form first", "Meet and greet first"];
const ENQUIRERS = ["Participants and Coordinators", "Coordinators only", "Participants only", "Closed to direct enquiries"];
// Registration stores service categories as codes (PERSONAL_CARE); the profile shows and edits them as readable labels.
const svcLabel = (v: string) => (/^[A-Z0-9_]+$/.test(v) ? v.toLowerCase().split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : v);
const inp = "mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";
const lab = "text-sm font-semibold text-slate-900";
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

type Check = "RECORDED" | "PENDING" | "ACTION";

export function OrganisationProfile() {
  const [me, setMe] = useState<Me | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [dialog, setDialog] = useState<"edit" | "verify" | "public" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    // One retry: a slow or cold API call must not leave the page on its placeholder for good.
    const fetchMe = () => api.get<Me>("/users/me").catch(() => api.get<Me>("/users/me").catch(() => null));
    const [m, d] = await Promise.all([
      fetchMe(),
      api.get<{ documents: Doc[] }>("/users/me/documents").catch(() => ({ documents: [] as Doc[] })),
    ]);
    if (!m) setFailed(true);
    setMe(m); setDocs(d.documents ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (!me && failed) return (
    <div className="mx-auto max-w-[1200px] px-5 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="m-0 text-base font-semibold text-slate-900">Could not load your Organisation profile.</p>
        <Button className="mt-4" onClick={() => void load()}>Try again</Button>
      </div>
    </div>
  );
  if (!me) return <div className="mx-auto max-w-[1200px] px-5 py-6"><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></div>;
  const p = me.user.providerProfile ?? {};
  const name = p.businessName || "Your organisation";
  const now = Date.now();
  const badDocs = docs.some((d) => d.status === "REJECTED" || d.status === "EXPIRED" || (d.expiryDate && new Date(d.expiryDate).getTime() < now));
  const insurance = docs.some((d) => d.docType === "PUBLIC_LIABILITY_INSURANCE");
  const missing = me.marketplace?.missing ?? [];
  const verified = missing.length === 0 && !badDocs;
  const registered = !!(p.ndisRegistered && p.ndisProviderNumber);
  const onlyPlanLeft = missing.length > 0 && missing.every((m) => /subscription|plan/i.test(m));
  // Doc P11 statuses: Draft, Pending, Business Verified, NDIS Registration Verified, Action Required, Restricted/Suspended.
  const statusLabel = me.user.status === "SUSPENDED" ? "Restricted / Suspended" : badDocs ? "Action Required"
    : verified ? (registered ? "NDIS Registration Verified" : "Business Verified") : onlyPlanLeft ? "Pending" : "Draft";
  const badge = registered && verified ? "NDIS Registration Verified" : verified ? "Business Verified" : null;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-3xl font-bold text-slate-900">Organisation profile</h1>
          <p className="m-0 mt-1 text-sm text-slate-500">Control your public profile, services and private verification evidence.</p>
        </div>
        <Button onClick={() => setDialog("edit")}>Edit profile</Button>
      </div>
      {notice && <p className="m-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            {p.logoUrl
              ? <img src={p.logoUrl} alt="" className="h-14 max-w-[140px] rounded-lg object-contain" />
              : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-600">{initials(name)}</span>}
            <div>
              <h2 className="m-0 text-xl font-bold text-slate-900">{name}</h2>
              {badge && <span className="mt-1 inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{badge}</span>}
            </div>
          </div>
          <p className="m-0 mt-4 text-sm text-slate-600">{p.businessDescription || "Add a short public introduction in Edit profile."}</p>
          <Block title="Services">
            <div className="flex flex-wrap gap-2">{(p.coreServices ?? []).length ? p.coreServices!.map((s) => <span key={s} className="rounded bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{svcLabel(s)}</span>) : <span className="text-sm text-slate-400">None selected</span>}</div>
          </Block>
          <Block title="Coverage"><p className="m-0 text-sm text-slate-600">{(p.serviceAreas ?? []).join(" · ") || "Not set"}</p></Block>
          <Block title="Languages and communication"><p className="m-0 text-sm text-slate-600">{(p.languages ?? []).join(", ") || "Not set"}</p></Block>
          <Block title="Funding accepted" last><p className="m-0 text-sm text-slate-600">{(p.fundingAccepted ?? []).join(", ") || "Not set"}</p></Block>
          <Button className="mt-4" onClick={() => setDialog("public")}>Preview public profile</Button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="m-0 text-xl font-bold text-slate-900">Private organisation details</h2>
          <dl className="m-0 mt-3 text-sm">
            {[["Legal name", p.legalEntityName || "Not set"], ["ABN", p.abn || "Not set"], ["Business contact", p.primaryContactEmail || "Not set"]].map(([k, v]) => (
              <div key={k} className="flex gap-6 border-b border-slate-100 py-3"><dt className="w-36 shrink-0 text-slate-500">{k}</dt><dd className="m-0 font-semibold text-slate-900">{v}</dd></div>
            ))}
            <div className="flex gap-6 border-b border-slate-100 py-3"><dt className="w-36 shrink-0 text-slate-500">Verification</dt>
              <dd className="m-0 flex-1"><span className={cn("block rounded px-3 py-1 text-xs font-semibold", /Verified/.test(statusLabel) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>{statusLabel}</span></dd></div>
          </dl>
          <p className="m-0 mt-4 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Subscription access and business verification are separate. Badges only describe the checks completed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialog("verify")}><ShieldCheck className="mr-1.5 h-4 w-4" />Open verification centre</Button>
            <Link href="/documents"><Button variant="outline">Manage documents</Button></Link>
          </div>
        </section>
      </div>

      {dialog === "edit" && <EditProfile p={p} onClose={() => setDialog(null)} onSaved={async (msg) => { setDialog(null); setNotice(msg); await load(); }} />}
      {dialog === "verify" && <VerificationCentre status={statusLabel} onEdit={() => setDialog("edit")} me={me} p={p} insurance={insurance} badDocs={badDocs} verified={verified} onClose={() => setDialog(null)} />}
      {dialog === "public" && <PublicPreview p={p} name={name} badge={badge} onClose={() => setDialog(null)} />}
    </div>
  );
}

function Block({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return <div className={cn("mt-4 pt-4", !last && "border-b border-slate-100 pb-4")} style={{ borderTop: "1px solid rgb(241 245 249)" }}><h3 className="m-0 mb-2 text-base font-bold text-slate-900">{title}</h3>{children}</div>;
}

// ── 3-step editor ────────────────────────────────────────────────────────────────────────────────
function EditProfile({ p, onClose, onSaved }: { p: Profile; onClose: () => void; onSaved: (msg: string) => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    businessName: p.businessName ?? "", legalEntityName: p.legalEntityName ?? "", abn: p.abn ?? "", logoUrl: p.logoUrl ?? "",
    businessDescription: p.businessDescription ?? "", primaryContactEmail: p.primaryContactEmail ?? "", primaryContactPhone: p.primaryContactPhone ?? "",
    coreServices: (p.coreServices ?? []).map(svcLabel), languages: p.languages ?? [], fundingAccepted: p.fundingAccepted ?? [],
    serviceAreas: (p.serviceAreas ?? []).join(", "), continuityModel: p.continuityModel ?? CONTINUITY[0], websiteUrl: p.websiteUrl ?? "",
    accessibilityCapabilities: p.accessibilityCapabilities ?? [], serviceMode: p.serviceMode ?? "IN_PERSON",
    facebook: p.socialLinks?.facebook ?? "", instagram: p.socialLinks?.instagram ?? "", linkedin: p.socialLinks?.linkedin ?? "",
    intakeProcess: p.intakeProcess ?? INTAKE[0], directEnquiryAudience: p.directEnquiryAudience ?? ENQUIRERS[0], displayPublicPhone: !!p.displayPublicPhone,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const up = (x: Partial<typeof d>) => setD((s) => ({ ...s, ...x }));
  const toggle = (k: "coreServices" | "languages" | "fundingAccepted" | "accessibilityCapabilities", v: string) => up({ [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] });

  const ok = step === 0 ? !!d.businessName.trim() && !!d.legalEntityName.trim() && !!d.abn.trim() && !!d.businessDescription.trim() && !!d.primaryContactEmail.trim()
    : step === 1 ? d.coreServices.length > 0 && d.fundingAccepted.length > 0 : true;

  async function save(final: boolean) {
    setBusy(true); setErr(null);
    const body: Record<string, unknown> = {
      businessName: d.businessName.trim() || undefined, legalEntityName: d.legalEntityName.trim() || undefined, abn: d.abn.trim() || undefined,
      businessDescription: d.businessDescription.trim() || undefined, primaryContactEmail: d.primaryContactEmail.trim() || undefined,
      primaryContactPhone: d.primaryContactPhone.trim() || undefined, logoUrl: d.logoUrl || undefined,
      coreServices: d.coreServices, languages: d.languages, fundingAccepted: d.fundingAccepted,
      serviceAreas: d.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean), continuityModel: d.continuityModel,
      websiteUrl: d.websiteUrl.trim(), accessibilityCapabilities: d.accessibilityCapabilities, serviceMode: d.serviceMode,
      socialLinks: { facebook: d.facebook.trim(), instagram: d.instagram.trim(), linkedin: d.linkedin.trim() }, intakeProcess: d.intakeProcess, directEnquiryAudience: d.directEnquiryAudience, displayPublicPhone: d.displayPublicPhone,
    };
    try { await upsertProfile("PROVIDER", body); onSaved(final ? "Organisation profile saved." : "Draft saved."); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not save the profile."); setBusy(false); }
  }

  const titles = ["Organisation identity", "Services and coverage", "Enquiries and public preview"];
  const subtitle = ["Public marketing fields are separate from private verification.", "Capability claims require current evidence and scope.", "Only permitted marketing fields appear publicly."];
  const Chips = ({ k, options }: { k: "coreServices" | "languages" | "fundingAccepted" | "accessibilityCapabilities"; options: string[] }) => (
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
      {options.map((o) => <label key={o} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={d[k].includes(o)} onChange={() => toggle(k, o)} />{o}</label>)}
    </div>
  );

  return (
    <ModalShell title="Organisation profile" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 pt-3">
        {titles.map((t, i) => <p key={t} className={cn("m-0 border-b-2 pb-2 text-xs", i < step ? "border-brand-300 text-slate-500" : i === step ? "border-brand-600 font-semibold text-brand-700" : "border-slate-100 text-slate-400")}>{i + 1}. {t.split(" ").slice(0, 2).join(" ")}</p>)}
      </div>
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <div><h3 className="m-0 text-xl font-bold text-slate-900">{titles[step]}</h3><p className="m-0 mt-1 text-sm text-slate-500">{subtitle[step]}</p></div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lab}>Public trading name *</label><input className={inp} value={d.businessName} onChange={(e) => up({ businessName: e.target.value })} /></div>
            <div><label className={lab}>Private legal name *</label><input className={inp} value={d.legalEntityName} onChange={(e) => up({ legalEntityName: e.target.value })} /></div>
            <div><label className={lab}>Private ABN *</label><input className={inp} value={d.abn} onChange={(e) => up({ abn: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <FileUploadField label="Logo (rectangular or square)" accept=".jpg,.jpeg,.png,.heic,.webp" maxSizeMb={5} uploadOptions={{ category: "avatars" }} currentValue={d.logoUrl || null} optional onUploaded={(url) => up({ logoUrl: url })} />
            </div>
            <div className="sm:col-span-2"><label className={lab}>Public introduction *</label><textarea rows={4} className={cn(inp, "h-auto py-2")} value={d.businessDescription} onChange={(e) => up({ businessDescription: e.target.value })} /></div>
            <div><label className={lab}>Enquiry email *</label><input type="email" className={inp} value={d.primaryContactEmail} onChange={(e) => up({ primaryContactEmail: e.target.value })} /></div>
            <div><label className={lab}>Operating mobile</label><input className={inp} value={d.primaryContactPhone} onChange={(e) => up({ primaryContactPhone: e.target.value })} /></div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div><label className={lab}>Service categories *</label><Chips k="coreServices" options={SERVICES} /></div>
            <div><label className={lab}>Languages / communication</label><Chips k="languages" options={LANGUAGES} /></div>
            <div><label className={lab}>Funding accepted *</label><Chips k="fundingAccepted" options={FUNDING} /></div>
            <div><label className={lab}>Accessibility capabilities</label><Chips k="accessibilityCapabilities" options={ACCESS} /></div>
            <div><label className={lab}>Service areas</label><input className={inp} value={d.serviceAreas} onChange={(e) => up({ serviceAreas: e.target.value })} placeholder="e.g. Western Sydney, South West Sydney" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={lab}>Continuity model</label><select className={inp} value={d.continuityModel} onChange={(e) => up({ continuityModel: e.target.value })}>{CONTINUITY.map((o) => <option key={o}>{o}</option>)}</select></div>
              <div><label className={lab}>Delivery model</label><select className={inp} value={d.serviceMode} onChange={(e) => up({ serviceMode: e.target.value })}>{DELIVERY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
              <div><label className={lab}>Website</label><input className={inp} value={d.websiteUrl} onChange={(e) => up({ websiteUrl: e.target.value })} placeholder="https://" /></div>
              <div><label className={lab}>Facebook</label><input className={inp} value={d.facebook} onChange={(e) => up({ facebook: e.target.value })} /></div>
              <div><label className={lab}>Instagram</label><input className={inp} value={d.instagram} onChange={(e) => up({ instagram: e.target.value })} /></div>
              <div><label className={lab}>LinkedIn</label><input className={inp} value={d.linkedin} onChange={(e) => up({ linkedin: e.target.value })} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={lab}>Intake process</label><select className={inp} value={d.intakeProcess} onChange={(e) => up({ intakeProcess: e.target.value })}>{INTAKE.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div><label className={lab}>Direct enquiries</label><select className={inp} value={d.directEnquiryAudience} onChange={(e) => up({ directEnquiryAudience: e.target.value })}>{ENQUIRERS.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div><label className={lab}>Display public phone</label><select className={inp} value={d.displayPublicPhone ? "Yes" : "No"} onChange={(e) => up({ displayPublicPhone: e.target.value === "Yes" })}><option>No</option><option>Yes</option></select></div>
          </div>
        )}
        {err && <p className="m-0 text-sm text-red-600">{err}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => save(false)}>Save draft</Button>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{step + 1} of 3</span>
          {step < 2 ? <Button disabled={!ok} onClick={() => setStep(step + 1)}>Continue</Button> : <Button disabled={busy} onClick={() => save(true)}>{busy ? "Saving…" : "Save and continue"}</Button>}
        </div>
      </div>
    </ModalShell>
  );
}

// ── Verification centre ──────────────────────────────────────────────────────────────────────────
function VerificationCentre({ status, onEdit, me, p, insurance, badDocs, verified, onClose }: { status: string; onEdit: () => void; me: Me; p: Profile; insurance: boolean; badDocs: boolean; verified: boolean; onClose: () => void }) {
  type Preview = "pending" | "correction" | "approval" | null;
  const [preview, setPreview] = useState<Preview>(null);
  const registered = !!(p.ndisRegistered && p.ndisProviderNumber);
  // [label, done, correction action] - doc P11: every missing item has a clear correction action.
  const real: [string, boolean, { text: string; href?: string; edit?: boolean }][] = [
    ["Contact verified", !!me.phoneVerified && !!me.user.emailVerified, { text: "Verify email and mobile in My Profile", href: "/profile" }],
    ["Administrator authority", !!(p.termsAccepted && p.privacyPolicyAccepted && p.platformRulesAccepted), { text: "Accept the safety, privacy and platform declarations", href: "/profile" }],
    ["ABN and legal entity", !!p.abn && !!p.legalEntityName, { text: "Add ABN and legal name", edit: true }],
    ["Business insurance evidence", insurance, { text: "Upload insurance evidence", href: "/documents" }],
    ["Registration and service scope", p.ndisRegistered ? registered : verified, { text: p.ndisRegistered ? "Add your NDIS registration number" : "Complete the remaining checks", href: "/profile" }],
  ];
  const state = (i: number, ok: boolean): Check => {
    if (preview === "approval") return "RECORDED";
    if (preview === "pending") return i < 2 ? "RECORDED" : "PENDING";
    if (preview === "correction") return i === 3 ? "ACTION" : i < 2 ? "RECORDED" : "PENDING";
    return ok ? "RECORDED" : badDocs && i === 3 ? "ACTION" : "PENDING";
  };
  const LABEL: Record<Check, string> = { RECORDED: "Recorded", PENDING: "Pending", ACTION: "Action required" };
  const TONE: Record<Check, string> = { RECORDED: "bg-emerald-50 text-emerald-700", PENDING: "bg-amber-50 text-amber-700", ACTION: "bg-red-50 text-red-700" };
  const toast = preview === "pending" ? "Pending" : preview === "correction" ? "Action Required" : preview === "approval" ? "Verified" : null;

  return (
    <ModalShell title="Verification centre" onClose={onClose}>
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <p className="m-0 text-sm text-slate-600">Current status: <b className="text-slate-900">{preview === "approval" ? "Business Verified" : preview === "correction" ? "Action Required" : preview === "pending" ? "Pending" : status}</b></p>
        <p className="m-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">A successful payment never approves business or service credentials. Status below reflects the records on file.</p>
        <ul className="m-0 list-none p-0">
          {real.map(([label, ok, fix], i) => {
            const s = state(i, ok);
            return (
              <li key={label} className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
                <span className="flex items-center gap-3 text-slate-900">{s === "RECORDED" ? <Check className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-slate-400" />}{label}</span>
                <span className="flex items-center gap-3">
                  {s !== "RECORDED" && (fix.edit
                    ? <button type="button" onClick={() => { onClose(); onEdit(); }} className="text-xs font-semibold text-brand-600 underline">{fix.text}</button>
                    : <Link href={fix.href ?? "/profile"} className="text-xs font-semibold text-brand-600 underline">{fix.text}</Link>)}
                  <span className={cn("rounded px-2.5 py-0.5 text-xs font-semibold", TONE[s])}>{LABEL[s]}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreview("pending")}>Preview pending review</Button>
          <Button variant="outline" onClick={() => setPreview("correction")}>Preview correction required</Button>
          <Button onClick={() => setPreview("approval")}>Preview business approval</Button>
        </div>
        {toast && <p className="m-0 rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm text-white">Preview only: status shown as {toast}. Nothing is changed on your account.</p>}
      </div>
      <div className="flex justify-between border-t border-slate-100 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Link href="/documents"><Button variant="outline">Evidence documents</Button></Link>
      </div>
    </ModalShell>
  );
}

// ── Public profile preview ───────────────────────────────────────────────────────────────────────
function PublicPreview({ p, name, badge, onClose }: { p: Profile; name: string; badge: string | null; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <ModalShell title="Public Provider profile" onClose={onClose}>
      <div className="space-y-3 overflow-y-auto px-6 py-5">
        <div className="flex items-center gap-4">
          {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-12 max-w-[140px] rounded-lg object-contain" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">{initials(name)}</span>}
          <div><p className="m-0 text-xl font-bold text-slate-900">{name}</p>{badge && <p className="m-0 text-sm text-slate-500">{badge}</p>}</div>
        </div>
        <p className="m-0 text-sm text-slate-600">{p.businessDescription}</p>
        <p className="m-0 font-bold text-slate-900">Services and areas</p>
        <p className="m-0 text-sm text-slate-600">{(p.coreServices ?? []).map(svcLabel).join(", ")}<br />{(p.serviceAreas ?? []).join(" · ")}</p>
        {(p.languages ?? []).length > 0 && <p className="m-0 text-sm text-slate-600"><b className="text-slate-900">Languages:</b> {p.languages!.join(", ")}</p>}
        {(p.accessibilityCapabilities ?? []).length > 0 && <p className="m-0 text-sm text-slate-600"><b className="text-slate-900">Accessibility:</b> {p.accessibilityCapabilities!.join(", ")}</p>}
        {(p.fundingAccepted ?? []).length > 0 && <p className="m-0 text-sm text-slate-600"><b className="text-slate-900">Funding accepted:</b> {p.fundingAccepted!.join(", ")}</p>}
        {p.continuityModel && <p className="m-0 text-sm text-slate-600"><b className="text-slate-900">Continuity:</b> {p.continuityModel}</p>}
        {p.intakeProcess && <p className="m-0 text-sm text-slate-600"><b className="text-slate-900">Intake:</b> {p.intakeProcess}</p>}
        {p.websiteUrl && <p className="m-0 text-sm text-slate-600"><b className="text-slate-900">Website:</b> {p.websiteUrl}</p>}
        {p.displayPublicPhone && p.primaryContactPhone && <p className="m-0 text-sm text-slate-600">Phone: {p.primaryContactPhone}</p>}
        <p className="m-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No private ABN evidence, staff files, Participant information or exact assignment addresses are included in this public preview.</p>
        <div><p className="m-0 mb-1 text-sm font-bold text-slate-900">Preview enquiry</p>
          <textarea rows={4} value={msg} onChange={(e) => { setMsg(e.target.value); setSent(false); }} placeholder="Ask about service availability…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          {sent && <p className="m-0 mt-2 text-sm text-slate-500">Preview only. Real enquiries arrive under Enquiries and Applications.</p>}</div>
      </div>
      <div className="flex justify-between border-t border-slate-100 px-6 py-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button disabled={!msg.trim()} onClick={() => setSent(true)}>Submit enquiry</Button>
      </div>
    </ModalShell>
  );
}
