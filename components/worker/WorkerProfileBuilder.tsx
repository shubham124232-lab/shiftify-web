"use client";

// Support Worker journey — progressive profile, Windows 5-14. Each window saves on its own so the worker can stop
// and come back ("Save and finish later"); nothing here blocks the dashboard or browsing. Answers are stored once on
// the profile and compared with each request later, instead of being asked again.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store/auth.store";
import { api } from "@/lib/api";
import { presignUpload, putFileToR2, upsertProfile } from "@/lib/api/profile";
import DocumentUploadField, { type ExistingDoc } from "@/components/profile/DocumentUploadField";
import { UserRole } from "@/lib/types";
import * as W from "@/lib/worker/profileWindows";

type P = Record<string, unknown>;
const str = (p: P, k: string): string => (typeof p[k] === "string" ? (p[k] as string) : "");
const num = (p: P, k: string): string => (typeof p[k] === "number" || (typeof p[k] === "string" && p[k] !== "") ? String(p[k]) : "");
const arr = (p: P, k: string): string[] => (Array.isArray(p[k]) ? (p[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);
const bool = (p: P, k: string): boolean => p[k] === true;
const obj = (p: P, k: string): P => (p[k] && typeof p[k] === "object" && !Array.isArray(p[k]) ? (p[k] as P) : {});
const dateOnly = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

interface Form {
  dobDay: string; dobMonth: string; dobYear: string; workSetup: string;
  suburb: string; state: string; postcode: string;
  rightToWork: string; visaType: string; visaExpiry: string;
  nameDisplayMode: string; introSummary: string; experienceYearsBucket: string;
  approachTags: string[]; approachOther: string; interests: string[]; interestsOther: string;
  services: string[]; tasks: string[]; highIntensitySkills: string[]; sleepover: boolean; activeOvernight: boolean;
  disabilityExperience: string[]; experienceOther: string; ageGroups: string[]; settings: string[]; languages: string[]; languageOther: string;
  abn: string; gstRegistered: string; plPolicy: string; plExpiry: string; paPolicy: string; paExpiry: string; orgName: string; inviteCode: string;
  radius: string; travelMode: string; transportParticipants: string; licenceType: string;
  vehicleMake: string; vehicleModel: string; vehicleRego: string; childRestraint: boolean; wheelchairVehicle: boolean;
  rateMode: string; hourlyRate: string; rangeMin: string; rangeMax: string;
  weekdayRate: string; eveningRate: string; saturdayRate: string; sundayRate: string; holidayRate: string; sleepoverRate: string; activeOvernightRate: string;
  minimumShift: string; travelCharges: string; meetModes: string[];
  envExclusions: string[]; shiftBoundaries: string[]; maxShiftHours: string; taskExclusions: string[]; taskOther: string; comfort: string[]; boundaryNotes: string;
  visibleTo: string; locationDisplay: string; rateDisplayMode: string; contactPreference: string; isPubliclyListed: boolean; docsVisible: boolean;
}

function toForm(u: P, wp: P): Form {
  const dob = dateOnly(wp.dob);
  const prefs = obj(wp, "workPreferences");
  const emp = obj(wp, "employmentDetails");
  const rates = obj(wp, "detailedRates");
  const wn = obj(wp, "weekendNightRates");
  const bounds = obj(wp, "supportBoundaries");
  const vehicle = obj(wp, "vehicleDetails");
  const subs = arr(wp, "subServices");
  const offered = arr(wp, "servicesOffered");
  // A service is shown as chosen when its category is stored; tasks are "Service › Task".
  const serviceLabels = W.SERVICES.filter((s) => offered.includes(s.category)).map((s) => s.label);
  const radius = wp.travelRadiusKm != null ? String(wp.travelRadiusKm) : "";
  const known = new Set<string>(W.EXPERIENCE_AREAS);
  const exp = arr(wp, "disabilityExperience");
  const taskEx = arr(bounds, "taskExclusions");
  const taskKnown = new Set<string>(W.TASK_BOUNDARIES);
  const comm = arr(wp, "communicationSupportSkills");
  const langs = arr(wp, "languagesSpoken");
  const langKnown = new Set<string>(W.LANGUAGES);
  return {
    dobDay: dob ? String(Number(dob.slice(8, 10))) : "", dobMonth: dob ? String(Number(dob.slice(5, 7))) : "", dobYear: dob ? dob.slice(0, 4) : "",
    workSetup: str(wp, "workType"),
    suburb: str(wp, "suburb") || str(u, "defaultSuburb"), state: str(wp, "state") || str(u, "defaultState"), postcode: str(wp, "postcode") || str(u, "defaultPostcode"),
    rightToWork: str(wp, "rightToWork") === "PR" ? "CITIZEN" : str(wp, "rightToWork"), visaType: str(wp, "visaType"), visaExpiry: dateOnly(wp.visaExpiry),
    nameDisplayMode: str(wp, "nameDisplayMode") || "FULL_NAME", introSummary: str(wp, "introSummary") || str(wp, "bio"),
    experienceYearsBucket: str(wp, "experienceYearsBucket") === "10+" ? "5-10" : str(wp, "experienceYearsBucket"),
    approachTags: arr(wp, "approachTags").filter((t) => W.APPROACH.includes(t)), approachOther: arr(wp, "approachTags").filter((t) => !W.APPROACH.includes(t)).join(", "),
    interests: arr(wp, "interests").filter((t) => W.INTERESTS.includes(t)), interestsOther: arr(wp, "interests").filter((t) => !W.INTERESTS.includes(t)).join(", "),
    services: serviceLabels, tasks: subs.filter((t) => t.includes(" › ")), highIntensitySkills: arr(wp, "highIntensitySkills"),
    sleepover: bool(wp, "acceptsSleepoverShifts"), activeOvernight: bool(wp, "acceptsActiveOvernightShifts"),
    disabilityExperience: exp.filter((t) => known.has(t)), experienceOther: exp.filter((t) => !known.has(t)).join(", "),
    ageGroups: arr(wp, "ageGroupsSupported"), settings: arr(wp, "settingsExperience"),
    languages: [...langs.filter((t) => langKnown.has(t)), ...(comm.includes("Auslan") && !langs.includes("Auslan") ? ["Auslan"] : [])],
    languageOther: langs.filter((t) => !langKnown.has(t)).join(", "),
    abn: str(wp, "abn"), gstRegistered: wp.gstRegistered === true ? "YES" : wp.gstRegistered === false && str(wp, "workType") ? "NO" : "",
    plPolicy: str(wp, "publicLiabilityPolicyNumber"), plExpiry: dateOnly(wp.publicLiabilityExpiry), paPolicy: str(wp, "personalAccidentPolicyNumber"), paExpiry: dateOnly(wp.personalAccidentExpiry),
    orgName: str(emp, "organisationName"), inviteCode: str(emp, "inviteCode"),
    radius: radius === "" ? "" : W.RADIUS.some((r) => r.value === radius) ? radius : Number(radius) > 50 ? "150" : radius,
    travelMode: str(wp, "travelMode") === "WALKING" || str(wp, "travelMode") === "NONE" ? "OTHER" : str(wp, "travelMode"),
    transportParticipants: str(prefs, "transportParticipants") || (wp.canTransportParticipants === true ? "YES" : ""),
    licenceType: str(wp, "driversLicenceType"), vehicleMake: str(vehicle, "make"), vehicleModel: str(vehicle, "model"), vehicleRego: str(vehicle, "rego"),
    childRestraint: bool(wp, "childRestraintAvailable"), wheelchairVehicle: bool(wp, "wheelchairAccessibleVehicle"),
    rateMode: str(wp, "hourlyRateType"), hourlyRate: num(wp, "hourlyRate"), rangeMin: num(rates, "rangeMin"), rangeMax: num(rates, "rangeMax"),
    weekdayRate: num(rates, "weekdayRate"), eveningRate: num(rates, "eveningRate"), saturdayRate: num(rates, "saturdayRate"), sundayRate: num(rates, "sundayRate"),
    holidayRate: num(wn, "publicHolidayRate"), sleepoverRate: num(rates, "sleepoverRate"), activeOvernightRate: num(rates, "activeOvernightRate"),
    minimumShift: str(prefs, "minimumShift"), travelCharges: str(wp, "travelCharges"), meetModes: arr(prefs, "meetAndGreetModes"),
    envExclusions: arr(bounds, "environmentExclusions"), shiftBoundaries: arr(prefs, "shiftBoundaries"),
    maxShiftHours: num(prefs, "maxShiftHours"), taskExclusions: taskEx.filter((t) => taskKnown.has(t)), taskOther: taskEx.filter((t) => !taskKnown.has(t)).join(", "),
    comfort: arr(prefs, "supportComfort"), boundaryNotes: str(bounds, "notes"),
    visibleTo: str(wp, "visibleTo") || "ALL", locationDisplay: str(wp, "locationDisplay") || "SUBURB", rateDisplayMode: str(wp, "rateDisplayMode") || "PUBLIC",
    contactPreference: str(wp, "contactPreference") || "ALLOW_MESSAGES", isPubliclyListed: bool(wp, "isPubliclyListed"), docsVisible: bool(wp, "documentsVisibleToParticipants"),
  };
}

const splitList = (v: string): string[] => v.split(",").map((s) => s.trim()).filter(Boolean);
const numOrUndef = (v: string): number | undefined => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
const toggle = (list: string[], v: string): string[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

// ─── small form pieces ────────────────────────────────────────────────────────

const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
function Chips({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value.includes(o)} onClick={() => onChange(toggle(value, o))}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${value.includes(o) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
function Choice({ options, value, onChange, name }: { options: readonly { value: string; label: string }[]; value: string; onChange: (v: string) => void; name: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={o.value || "later"} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-2 text-sm ${value === o.value ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-slate-200 bg-white text-slate-700"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

export function WorkerProfileBuilder() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, activeRole } = useAuth();
  const [f, setF] = useState<Form | null>(null);
  const [docs, setDocs] = useState<ExistingDoc[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  const requested = Number(params.get("step"));
  const [win, setWin] = useState<number>(W.WINDOWS.some((w) => w.n === requested) ? requested : 5);
  const idx = W.WINDOWS.findIndex((w) => w.n === win);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((cur) => (cur ? { ...cur, [k]: v } : cur));

  const load = useCallback(async () => {
    const res = await api.get<{ user: P; marketplaceMissing?: string[] }>("/users/me");
    const wp = obj(res.user, "workerProfile");
    setF(toForm(res.user, wp));
    setAvatar(typeof res.user.avatarUrl === "string" ? res.user.avatarUrl : null);
    setName(str(res.user, "name"));
    setMissing(res.marketplaceMissing ?? []);
    // First visit with no ?step= resumes at the next window after the last one saved.
    if (!W.WINDOWS.some((w) => w.n === requested)) {
      const step = typeof wp.profileStep === "number" ? wp.profileStep : 0;
      setWin(Math.min(14, Math.max(5, step + 5)));
    }
    api.get<{ documents: ExistingDoc[] }>("/upload/document").then((r) => setDocs(r.documents ?? [])).catch(() => {});
  }, [requested]);

  useEffect(() => { if (user && activeRole === UserRole.SUPPORT_WORKER) load().catch(() => setError("We could not load your profile. Please refresh.")); }, [user, activeRole, load]);

  if (!user) return null;
  if (activeRole !== UserRole.SUPPORT_WORKER || user.accountType === "MANAGED") {
    return <div className="container-page py-8 text-sm text-slate-600">This page is for independent Support Worker accounts. <Link className="underline" href="/dashboard">Back to dashboard</Link></div>;
  }
  if (!f) return <div className="container-page py-8 text-sm text-slate-500">{error ?? "Loading…"}</div>;

  function docFor(type: string): ExistingDoc | undefined { return docs.find((d) => d.docType === type); }
  function onDocSaved(d: ExistingDoc) {
    setDocs((prev) => (prev.some((x) => x.id === d.id) ? prev.map((x) => (x.id === d.id ? d : x)) : [...prev, d]));
    useAuthStore.getState().refreshGateStatus();
    api.get<{ marketplaceMissing?: string[] }>("/users/me").then((r) => setMissing(r.marketplaceMissing ?? [])).catch(() => {});
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const presign = await presignUpload("avatars", file.name, file.type);
      await putFileToR2(presign.uploadUrl, file);
      await api.patch("/users/me", { avatarUrl: presign.publicUrl });
      setAvatar(presign.publicUrl);
      useAuthStore.getState().refreshGateStatus();
    } catch { setError("Photo upload failed. Please try again."); }
    finally { setUploading(false); }
  }

  // The payload for one window. Returns an error string instead when the window cannot be saved yet.
  function build(n: number, form: Form): { payload: P; base?: P; problem?: string } {
    const payload: P = { profileStep: n - 4 };
    switch (n) {
      case 5: {
        const day = Number(form.dobDay), month = Number(form.dobMonth), year = Number(form.dobYear);
        if (!day || !month || !year) return { payload, problem: "Enter your date of birth." };
        const dob = new Date(Date.UTC(year, month - 1, day));
        if (dob.getUTCDate() !== day || dob.getUTCMonth() !== month - 1) return { payload, problem: "That date of birth is not a real date." };
        const eighteen = new Date(Date.UTC(year + 18, month - 1, day));
        if (eighteen.getTime() > Date.now()) return { payload, problem: "You must be 18 or over to work as a Support Worker." };
        if (!form.workSetup) return { payload, problem: "Choose how you work." };
        if (!form.suburb.trim() || !form.state || !/^\d{4}$/.test(form.postcode.trim())) return { payload, problem: "Enter your suburb, state and 4-digit postcode." };
        if (form.rightToWork === "VISA_HOLDER" && (!form.visaType.trim() || !form.visaExpiry)) return { payload, problem: "Enter your visa type and expiry date." };
        payload.dob = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        payload.workType = form.workSetup;
        payload.suburb = form.suburb.trim(); payload.state = form.state; payload.postcode = form.postcode.trim();
        if (form.rightToWork) payload.rightToWork = form.rightToWork;
        if (form.rightToWork === "VISA_HOLDER") { payload.visaType = form.visaType.trim(); payload.visaExpiry = form.visaExpiry; }
        return { payload, base: { defaultSuburb: form.suburb.trim(), defaultState: form.state, defaultPostcode: form.postcode.trim() } };
      }
      case 6:
        payload.nameDisplayMode = form.nameDisplayMode;
        payload.introSummary = form.introSummary.trim() || undefined;
        payload.bio = form.introSummary.trim() || undefined;
        if (form.experienceYearsBucket) payload.experienceYearsBucket = form.experienceYearsBucket;
        payload.approachTags = [...form.approachTags, ...splitList(form.approachOther)];
        payload.interests = [...form.interests, ...splitList(form.interestsOther)];
        return { payload };
      case 7: {
        const chosen = W.SERVICES.filter((s) => form.services.includes(s.label));
        payload.servicesOffered = Array.from(new Set(chosen.map((s) => s.category)));
        // Services that share a category (e.g. Psychosocial and Social support) keep their own label in the task list.
        payload.subServices = [...form.tasks.filter((t) => form.services.includes(t.split(" › ")[0])), ...chosen.filter((s) => s.tasks.length === 0 || s.category === "OTHER").map((s) => `${s.label} › All`)];
        payload.highIntensitySkills = form.services.includes("High-intensity support") ? form.highIntensitySkills : [];
        if (form.services.includes("Overnight support")) { payload.acceptsSleepoverShifts = form.sleepover; payload.acceptsActiveOvernightShifts = form.activeOvernight; }
        return { payload };
      }
      case 8:
        payload.disabilityExperience = [...form.disabilityExperience, ...splitList(form.experienceOther)];
        payload.ageGroupsSupported = form.ageGroups;
        payload.settingsExperience = form.settings;
        payload.languagesSpoken = [...form.languages, ...splitList(form.languageOther)];
        payload.communicationSupportSkills = form.languages.includes("Auslan") ? ["Auslan"] : [];
        return { payload };
      case 10: {
        const independent = form.workSetup === "CONTRACTOR" || form.workSetup === "BOTH";
        const employed = form.workSetup === "AGENCY" || form.workSetup === "BOTH";
        if (independent) {
          if (!/^\d{11}$/.test(form.abn.replace(/\s/g, ""))) return { payload, problem: "Enter your 11-digit ABN." };
          payload.abn = form.abn.replace(/\s/g, "");
          payload.gstRegistered = form.gstRegistered === "YES";
          payload.publicLiabilityPolicyNumber = form.plPolicy.trim() || undefined;
          payload.publicLiabilityExpiry = form.plExpiry || undefined;
          payload.publicLiabilityInsurance = !!(form.plPolicy.trim() || docFor("PUBLIC_LIABILITY_INSURANCE"));
          payload.personalAccidentPolicyNumber = form.paPolicy.trim() || undefined;
          payload.personalAccidentExpiry = form.paExpiry || undefined;
          payload.personalAccidentInsurance = !!(form.paPolicy.trim() || docFor("PERSONAL_ACCIDENT_INSURANCE"));
        }
        if (employed) payload.employmentDetails = { organisationName: form.orgName.trim() || undefined, inviteCode: form.inviteCode.trim() || undefined };
        return { payload };
      }
      case 11: {
        const radius = numOrUndef(form.radius);
        if (radius !== undefined) payload.travelRadiusKm = radius;
        if (form.travelMode) payload.travelMode = form.travelMode;
        payload.canTransportParticipants = form.transportParticipants === "YES";
        payload.hasVehicle = form.travelMode === "OWN_VEHICLE" || form.travelMode === "BOTH";
        if (form.licenceType) payload.driversLicenceType = form.licenceType;
        if (form.vehicleMake || form.vehicleModel || form.vehicleRego) payload.vehicleDetails = { make: form.vehicleMake || undefined, model: form.vehicleModel || undefined, rego: form.vehicleRego || undefined };
        payload.childRestraintAvailable = form.childRestraint;
        payload.wheelchairAccessibleVehicle = form.wheelchairVehicle;
        payload.workPreferences = { transportParticipants: form.transportParticipants || undefined };
        return { payload };
      }
      case 12: {
        if (form.rateMode === "RANGE") {
          const lo = numOrUndef(form.rangeMin), hi = numOrUndef(form.rangeMax);
          if (lo === undefined || hi === undefined || lo > hi) return { payload, problem: "Enter a rate range where the lowest rate is not above the highest." };
        }
        if (form.rateMode) payload.hourlyRateType = form.rateMode;
        if (form.rateMode === "FIXED") { const h = numOrUndef(form.hourlyRate); if (h !== undefined) payload.hourlyRate = h; }
        payload.detailedRates = {
          weekdayRate: numOrUndef(form.weekdayRate), eveningRate: numOrUndef(form.eveningRate), saturdayRate: numOrUndef(form.saturdayRate),
          sundayRate: numOrUndef(form.sundayRate), sleepoverRate: numOrUndef(form.sleepoverRate), activeOvernightRate: numOrUndef(form.activeOvernightRate),
          rangeMin: form.rateMode === "RANGE" ? numOrUndef(form.rangeMin) : undefined, rangeMax: form.rateMode === "RANGE" ? numOrUndef(form.rangeMax) : undefined,
        };
        if (numOrUndef(form.holidayRate) !== undefined) payload.weekendNightRates = { publicHolidayRate: numOrUndef(form.holidayRate) };
        if (form.travelCharges) payload.travelCharges = form.travelCharges;
        const min = form.minimumShift;
        if (min === "NONE") payload.minimumShiftHours = 0; else if (min === "2" || min === "3" || min === "4") payload.minimumShiftHours = Number(min);
        payload.workPreferences = { minimumShift: min || undefined, meetAndGreetModes: form.meetModes };
        payload.meetAndGreetPreference = form.meetModes.length === 0 ? "NOT_NEEDED" : "OPTIONAL";
        return { payload };
      }
      case 13:
        payload.supportBoundaries = { environmentExclusions: form.envExclusions, taskExclusions: [...form.taskExclusions, ...splitList(form.taskOther)], notes: form.boundaryNotes.trim() || undefined };
        payload.workPreferences = { shiftBoundaries: form.shiftBoundaries, maxShiftHours: numOrUndef(form.maxShiftHours), supportComfort: form.comfort };
        return { payload };
      case 14:
        payload.visibleTo = form.visibleTo; payload.nameDisplayMode = form.nameDisplayMode; payload.locationDisplay = form.locationDisplay;
        payload.rateDisplayMode = form.rateDisplayMode; payload.contactPreference = form.contactPreference;
        payload.documentsVisibleToParticipants = form.docsVisible;
        return { payload };
      default:
        payload.documentsVisibleToParticipants = form.docsVisible;
        return { payload };
    }
  }

  // Saves the current window. Workpreferences is one JSON column shared by windows 11-13, so the saved copy is merged first.
  async function save(n: number, extra?: P): Promise<boolean> {
    if (!f) return false;
    setError(null); setNotice(null);
    const { payload, base, problem } = build(n, f);
    if (problem) { setError(problem); return false; }
    setSaving(true);
    try {
      if (payload.workPreferences) {
        const res = await api.get<{ user: P }>("/users/me");
        const current = obj(obj(res.user, "workerProfile"), "workPreferences");
        const merged: P = { ...current };
        for (const [k, v] of Object.entries(payload.workPreferences as P)) if (v !== undefined) merged[k] = v;
        payload.workPreferences = merged;
      }
      if (base) await api.patch("/users/me", base);
      await upsertProfile("SUPPORT_WORKER", { ...payload, ...(extra ?? {}) });
      await useAuthStore.getState().refreshGateStatus();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
      return false;
    } finally { setSaving(false); }
  }

  async function next() { if (await save(win)) { if (idx < W.WINDOWS.length - 1) setWin(W.WINDOWS[idx + 1].n); } }
  async function later() { if (await save(win)) router.push("/dashboard/worker"); }
  async function publish(listed: boolean) {
    if (listed && f && f.services.length === 0) { setError("Choose at least one service in window 7 before publishing your profile."); return; }
    if (await save(14, { isPubliclyListed: listed })) {
      set("isPubliclyListed", listed);
      setNotice(listed ? "Your profile is published. People you allow can now find and invite you." : "Saved as a draft. Your profile is not visible in searches yet.");
    }
  }

  const independent = f.workSetup === "CONTRACTOR" || f.workSetup === "BOTH";
  const employed = f.workSetup === "AGENCY" || f.workSetup === "BOTH";
  const transportRelevant = f.travelMode === "OWN_VEHICLE" || f.travelMode === "BOTH" || f.transportParticipants === "YES" || f.services.includes("Transport");
  const cur = W.WINDOWS[idx];
  const goal = (() => { try { const r = localStorage.getItem("shiftify_worker_goal"); return r ? (JSON.parse(r) as { title: string; href: string }) : null; } catch { return null; } })();

  return (
    <div className="container-page max-w-3xl space-y-5 py-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Build your Support Worker profile</h1>
        <p className="mt-1 text-sm text-slate-600">Answer once and Shiftify compares your profile with each request, so you are not asked again. You can stop at any point and come back.</p>
      </div>

      <ol className="flex flex-wrap gap-1.5" aria-label="Profile windows">
        {W.WINDOWS.map((w, i) => (
          <li key={w.n}>
            <button type="button" onClick={() => setWin(w.n)} aria-current={w.n === win ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${w.n === win ? "bg-brand-600 text-white" : i < idx ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {i + 1}. {w.title}
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {idx + 1} of {W.WINDOWS.length}</p>
          <h2 className="text-lg font-bold text-slate-900">{cur.title}</h2>
        </div>

        {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}

        {win === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Just enough to enter the dashboard. You can add the rest later.</p>
            <Field label="Date of birth">
              <div className="grid grid-cols-3 gap-2">
                <input className={input} inputMode="numeric" placeholder="Day" aria-label="Day" value={f.dobDay} onChange={(e) => set("dobDay", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                <select className={input} aria-label="Month" value={f.dobMonth} onChange={(e) => set("dobMonth", e.target.value)}>
                  <option value="">Month</option>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
                <input className={input} inputMode="numeric" placeholder="Year" aria-label="Year" value={f.dobYear} onChange={(e) => set("dobYear", e.target.value.replace(/\D/g, "").slice(0, 4))} />
              </div>
            </Field>
            <Field label="Work setup"><Choice name="Work setup" options={W.WORK_SETUP} value={f.workSetup} onChange={(v) => set("workSetup", v)} /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Suburb"><input className={input} value={f.suburb} onChange={(e) => set("suburb", e.target.value)} /></Field>
              <Field label="State">
                <select className={input} value={f.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select…</option>{["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Postcode"><input className={input} inputMode="numeric" value={f.postcode} onChange={(e) => set("postcode", e.target.value.replace(/\D/g, "").slice(0, 4))} /></Field>
            </div>
            <Field label="Right to work" hint="Choose “Provide later” if you are not ready — you will need it before you can browse requests.">
              <Choice name="Right to work" options={W.RIGHT_TO_WORK} value={f.rightToWork} onChange={(v) => set("rightToWork", v)} />
            </Field>
            {f.rightToWork === "VISA_HOLDER" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Visa type"><input className={input} value={f.visaType} onChange={(e) => set("visaType", e.target.value)} /></Field>
                <Field label="Visa expiry date"><input className={input} type="date" value={f.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} /></Field>
              </div>
            )}
          </div>
        )}

        {win === 6 && (
          <div className="space-y-4">
            <Field label="Photo" hint="A clear photo helps people recognise you. JPG or PNG, up to 5 MB. You can add it later.">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-500">
                  {avatar ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={avatar} alt="" className="h-full w-full object-cover" /> : (name || "?").slice(0, 1)}
                </div>
                <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                  {uploading ? "Uploading…" : avatar ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
                </label>
              </div>
            </Field>
            <Field label="Display name"><Choice name="Display name" options={W.NAME_DISPLAY} value={f.nameDisplayMode} onChange={(v) => set("nameDisplayMode", v)} /></Field>
            <Field label="About me" hint={`${f.introSummary.length}/500`}>
              <textarea className={`${input} h-28 py-2`} maxLength={500} value={f.introSummary} onChange={(e) => set("introSummary", e.target.value)} placeholder="A short introduction" />
            </Field>
            <Field label="Experience"><Choice name="Experience" options={W.EXPERIENCE_BUCKETS} value={f.experienceYearsBucket} onChange={(v) => set("experienceYearsBucket", v)} /></Field>
            <Field label="Approach"><Chips options={W.APPROACH} value={f.approachTags} onChange={(v) => set("approachTags", v)} /></Field>
            <Field label="Approach — other"><input className={input} value={f.approachOther} onChange={(e) => set("approachOther", e.target.value)} placeholder="Add your own, separated by commas" /></Field>
            <Field label="Interests"><Chips options={W.INTERESTS} value={f.interests} onChange={(v) => set("interests", v)} /></Field>
            <Field label="Interests — other"><input className={input} value={f.interestsOther} onChange={(e) => set("interestsOther", e.target.value)} placeholder="Add your own, separated by commas" /></Field>
          </div>
        )}

        {win === 7 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Choose only what you genuinely offer. Then pick the tasks you do under each service.</p>
            <div className="space-y-3">
              {W.SERVICES.map((s) => {
                const on = f.services.includes(s.label);
                return (
                  <div key={s.label} className={`rounded-lg border p-3 ${on ? "border-brand-300 bg-brand-50/40" : "border-slate-200"}`}>
                    <Check label={s.label} checked={on} onChange={() => set("services", toggle(f.services, s.label))} />
                    {on && s.tasks.length > 0 && (
                      <div className="mt-2">
                        <Chips options={s.tasks.map((t) => `${s.label} › ${t}`)} value={f.tasks} onChange={(v) => set("tasks", v)} />
                      </div>
                    )}
                    {on && s.label === "Overnight support" && (
                      <div className="mt-2 flex gap-4"><Check label="Sleepover" checked={f.sleepover} onChange={(v) => set("sleepover", v)} /><Check label="Active overnight" checked={f.activeOvernight} onChange={(v) => set("activeOvernight", v)} /></div>
                    )}
                    {on && s.label === "High-intensity support" && (
                      <div className="mt-2"><p className="mb-1 text-xs font-semibold text-slate-600">Competencies you hold</p><Chips options={W.HIGH_INTENSITY_SKILLS} value={f.highIntensitySkills} onChange={(v) => set("highIntensitySkills", v)} /></div>
                    )}
                    {on && s.label === "Transport" && <p className="mt-2 text-xs text-slate-500">Add your licence and vehicle details under “Transport and travel”.</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {win === 8 && (
          <div className="space-y-4">
            <Field label="Experience areas"><Chips options={W.EXPERIENCE_AREAS} value={f.disabilityExperience} onChange={(v) => set("disabilityExperience", v)} /></Field>
            <Field label="Other experience"><input className={input} value={f.experienceOther} onChange={(e) => set("experienceOther", e.target.value)} placeholder="Separate with commas" /></Field>
            <Field label="Age groups"><Chips options={W.AGE_GROUPS} value={f.ageGroups} onChange={(v) => set("ageGroups", v)} /></Field>
            <Field label="Settings"><Chips options={W.SETTINGS} value={f.settings} onChange={(v) => set("settings", v)} /></Field>
            <Field label="Languages"><Chips options={W.LANGUAGES} value={f.languages} onChange={(v) => set("languages", v)} /></Field>
            <Field label="Add another language"><input className={input} value={f.languageOther} onChange={(e) => set("languageOther", e.target.value)} placeholder="Separate with commas" /></Field>
          </div>
        )}

        {win === 9 && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">Add what is relevant to the services you offer. Status shows what you have added — Shiftify does not say a document is verified unless that check has actually happened.</p>
            {missing.some((m) => /Upload|Renew/.test(m)) && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Required before you can Connect: {missing.filter((m) => /Upload|Renew/.test(m)).map((m) => m.replace(/ \(Documents page\)/, "")).join("; ")}.
              </div>
            )}
            {W.DOC_GROUPS.map((g) => (
              <div key={g.title} className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">{g.title}</h3>
                {g.rows.map((r) => {
                  const mine = docs.filter((d) => d.docType === r.docType);
                  return (
                    <div key={r.docType} className="space-y-1">
                      {(r.multiple ? [...mine, undefined] : [mine[0]]).map((d, i) => (
                        <div key={d?.id ?? `new-${i}`}>
                          <DocumentUploadField docType={r.docType} label={r.multiple && i === mine.length && mine.length > 0 ? `Add another — ${r.label}` : r.label}
                            metadataFields={r.fields} uploadRequired existingDoc={d ?? null} onSaved={onDocSaved} optional={!W.REQUIRED_TO_CONNECT.includes(r.docType)} requiredNote={W.REQUIRED_TO_CONNECT.includes(r.docType) ? "Needed to Connect" : undefined} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            <Check label="Show my document status to people before they Connect" checked={f.docsVisible} onChange={(v) => set("docsVisible", v)} />
            <p className="text-xs text-slate-500">Insurance and driver licence evidence are added under Work and business details and Transport and travel.</p>
          </div>
        )}

        {win === 10 && (
          <div className="space-y-5">
            {independent && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Independent</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="ABN"><input className={input} inputMode="numeric" value={f.abn} onChange={(e) => set("abn", e.target.value.replace(/[^\d ]/g, ""))} placeholder="11 digits" /></Field>
                  <Field label="GST status"><Choice name="GST status" options={[{ value: "YES", label: "Registered for GST" }, { value: "NO", label: "Not registered" }]} value={f.gstRegistered} onChange={(v) => set("gstRegistered", v)} /></Field>
                  <Field label="Public liability policy number"><input className={input} value={f.plPolicy} onChange={(e) => set("plPolicy", e.target.value)} /></Field>
                  <Field label="Public liability expiry"><input className={input} type="date" value={f.plExpiry} onChange={(e) => set("plExpiry", e.target.value)} /></Field>
                  <Field label="Personal accident policy number"><input className={input} value={f.paPolicy} onChange={(e) => set("paPolicy", e.target.value)} /></Field>
                  <Field label="Personal accident expiry"><input className={input} type="date" value={f.paExpiry} onChange={(e) => set("paExpiry", e.target.value)} /></Field>
                </div>
              </div>
            )}
            {employed && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Employed by a provider or agency</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Organisation name"><input className={input} value={f.orgName} onChange={(e) => set("orgName", e.target.value)} /></Field>
                  <Field label="Invite or connection code" hint="Only if your organisation gave you one."><input className={input} value={f.inviteCode} onChange={(e) => set("inviteCode", e.target.value)} /></Field>
                </div>
              </div>
            )}
            {!independent && !employed && <p className="text-sm text-slate-600">Choose your work setup in Basic worker setup to see these fields.</p>}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">Insurance evidence</h3>
              {W.INSURANCE_ROWS.map((r) => (
                <div key={r.docType}>
                  <DocumentUploadField docType={r.docType} label={r.label} metadataFields={r.fields} uploadRequired existingDoc={docFor(r.docType) ?? null} onSaved={onDocSaved} optional={!W.REQUIRED_TO_CONNECT.includes(r.docType)} requiredNote={W.REQUIRED_TO_CONNECT.includes(r.docType) ? "Needed to Connect" : undefined} />
                </div>
              ))}
            </div>
          </div>
        )}

        {win === 11 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Base area: <strong>{[f.suburb, f.postcode].filter(Boolean).join(" ") || "not set"}</strong> (change it in Basic worker setup).</p>
            <Field label="Travel radius"><Choice name="Travel radius" options={W.RADIUS} value={f.radius} onChange={(v) => set("radius", v)} /></Field>
            <Field label="Travel mode"><Choice name="Travel mode" options={W.TRAVEL_MODES} value={f.travelMode} onChange={(v) => set("travelMode", v)} /></Field>
            <Field label="Transport participants"><Choice name="Transport participants" options={W.TRANSPORT_PARTICIPANTS} value={f.transportParticipants} onChange={(v) => set("transportParticipants", v)} /></Field>
            {transportRelevant && (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Licence class">
                    <select className={input} value={f.licenceType} onChange={(e) => set("licenceType", e.target.value)}>
                      <option value="">Select…</option>{["C", "R", "HR", "HC", "MR"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Vehicle make"><input className={input} value={f.vehicleMake} onChange={(e) => set("vehicleMake", e.target.value)} /></Field>
                  <Field label="Vehicle model"><input className={input} value={f.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} /></Field>
                </div>
                <Field label="Registration"><input className={input} value={f.vehicleRego} onChange={(e) => set("vehicleRego", e.target.value)} /></Field>
                <div className="flex flex-wrap gap-4"><Check label="Wheelchair-accessible vehicle" checked={f.wheelchairVehicle} onChange={(v) => set("wheelchairVehicle", v)} /><Check label="Child restraint available" checked={f.childRestraint} onChange={(v) => set("childRestraint", v)} /></div>
              </div>
            )}
            <div>
              <DocumentUploadField docType={W.LICENCE_ROW.docType} label={W.LICENCE_ROW.label} metadataFields={W.LICENCE_ROW.fields} uploadRequired existingDoc={docFor("DRIVERS_LICENCE") ?? null} onSaved={onDocSaved} optional={!W.REQUIRED_TO_CONNECT.includes("DRIVERS_LICENCE")} requiredNote={W.REQUIRED_TO_CONNECT.includes("DRIVERS_LICENCE") ? "Needed to Connect" : undefined} />
            </div>
          </div>
        )}

        {win === 12 && (
          <div className="space-y-4">
            <Field label="Rate display"><Choice name="Rate display" options={W.RATE_MODES} value={f.rateMode} onChange={(v) => set("rateMode", v)} /></Field>
            {f.rateMode === "FIXED" && <Field label="Hourly rate ($/hr)"><input className={input} inputMode="decimal" value={f.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} /></Field>}
            {f.rateMode === "RANGE" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="From ($/hr)"><input className={input} inputMode="decimal" value={f.rangeMin} onChange={(e) => set("rangeMin", e.target.value)} /></Field>
                <Field label="To ($/hr)"><input className={input} inputMode="decimal" value={f.rangeMax} onChange={(e) => set("rangeMax", e.target.value)} /></Field>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Weekday ($/hr)"><input className={input} inputMode="decimal" value={f.weekdayRate} onChange={(e) => set("weekdayRate", e.target.value)} /></Field>
              <Field label="Evening ($/hr)"><input className={input} inputMode="decimal" value={f.eveningRate} onChange={(e) => set("eveningRate", e.target.value)} /></Field>
              <Field label="Saturday ($/hr)"><input className={input} inputMode="decimal" value={f.saturdayRate} onChange={(e) => set("saturdayRate", e.target.value)} /></Field>
              <Field label="Sunday ($/hr)"><input className={input} inputMode="decimal" value={f.sundayRate} onChange={(e) => set("sundayRate", e.target.value)} /></Field>
              <Field label="Public holiday ($/hr)"><input className={input} inputMode="decimal" value={f.holidayRate} onChange={(e) => set("holidayRate", e.target.value)} /></Field>
              <Field label="Sleepover ($/shift)"><input className={input} inputMode="decimal" value={f.sleepoverRate} onChange={(e) => set("sleepoverRate", e.target.value)} /></Field>
              <Field label="Active overnight ($/shift)"><input className={input} inputMode="decimal" value={f.activeOvernightRate} onChange={(e) => set("activeOvernightRate", e.target.value)} /></Field>
            </div>
            <Field label="Minimum shift"><Choice name="Minimum shift" options={W.MIN_SHIFT} value={f.minimumShift} onChange={(v) => set("minimumShift", v)} /></Field>
            <Field label="Travel"><Choice name="Travel charges" options={W.TRAVEL_CHARGES} value={f.travelCharges} onChange={(v) => set("travelCharges", v)} /></Field>
            <Field label="Meet-and-greet" hint="Choose none if you do not offer one."><Chips options={W.MEET_MODES.map((m) => m.label)} value={f.meetModes.map((m) => W.MEET_MODES.find((x) => x.value === m)?.label ?? m)}
              onChange={(labels) => set("meetModes", labels.map((l) => W.MEET_MODES.find((x) => x.label === l)?.value ?? l))} /></Field>
          </div>
        )}

        {win === 13 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Rule out work that is not suitable so there are no surprises after you Connect.</p>
            <Field label="Environment"><Chips options={W.ENVIRONMENTS} value={f.envExclusions} onChange={(v) => set("envExclusions", v)} /></Field>
            <Field label="Shift boundaries"><Chips options={W.SHIFT_BOUNDARIES} value={f.shiftBoundaries} onChange={(v) => set("shiftBoundaries", v)} /></Field>
            <Field label="Maximum shift length (hours)"><input className={`${input} max-w-[10rem]`} inputMode="decimal" value={f.maxShiftHours} onChange={(e) => set("maxShiftHours", e.target.value)} /></Field>
            <Field label="Task boundaries"><Chips options={W.TASK_BOUNDARIES} value={f.taskExclusions} onChange={(v) => set("taskExclusions", v)} /></Field>
            <Field label="Other task boundaries"><input className={input} value={f.taskOther} onChange={(e) => set("taskOther", e.target.value)} placeholder="Separate with commas" /></Field>
            <Field label="Support comfort"><Chips options={W.COMFORT} value={f.comfort} onChange={(v) => set("comfort", v)} /></Field>
            <Field label="Other notes"><textarea className={`${input} h-20 py-2`} value={f.boundaryNotes} onChange={(e) => set("boundaryNotes", e.target.value)} /></Field>
          </div>
        )}

        {win === 14 && (
          <div className="space-y-4">
            <Field label="Visible to"><Choice name="Visible to" options={W.VISIBLE_TO} value={f.visibleTo} onChange={(v) => set("visibleTo", v)} /></Field>
            <Field label="Name display"><Choice name="Name display" options={W.NAME_DISPLAY} value={f.nameDisplayMode} onChange={(v) => set("nameDisplayMode", v)} /></Field>
            <Field label="Location display"><Choice name="Location display" options={W.LOCATION_DISPLAY} value={f.locationDisplay} onChange={(v) => set("locationDisplay", v)} /></Field>
            <Field label="Rate display"><Choice name="Rate display" options={W.RATE_DISPLAY} value={f.rateDisplayMode} onChange={(v) => set("rateDisplayMode", v)} /></Field>
            <Field label="Contact"><Choice name="Contact" options={W.CONTACT} value={f.contactPreference} onChange={(v) => set("contactPreference", v)} /></Field>
            {showPreview && (() => {
              const shownName = f.nameDisplayMode === "FIRST_NAME_INITIAL" ? name.trim().replace(/^(\S+)\s+.*?(\S)\S*$/, "$1 $2.") : name;
              const where = f.locationDisplay === "GENERAL_AREA" ? [f.state, f.postcode ? `${f.postcode.slice(0, 2)}xx` : ""].filter(Boolean).join(" ") : [f.suburb, f.state].filter(Boolean).join(", ");
              const rate = f.rateDisplayMode === "HIDDEN" ? "Not shown" : f.rateDisplayMode === "AFTER_CONNECT" ? "Shown after Connect" : f.rateMode === "RANGE" ? `$${f.rangeMin}–$${f.rangeMax}/hr` : f.rateMode === "FIXED" && f.hourlyRate ? `$${f.hourlyRate}/hr` : f.rateMode === "NEGOTIABLE" ? "Discuss per request" : f.rateMode === "NDIS_PRICE_GUIDE" ? "Aligned to the agreed rate" : "Not set";
              return (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" aria-label="Profile preview">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How others see you before you Connect</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{shownName}</p>
                  <p className="text-slate-600">{where || "Location not set"} · {rate}</p>
                  <p className="mt-1 text-slate-600">{f.services.length ? f.services.join(", ") : "No services chosen yet"}</p>
                  <p className="mt-1 text-slate-600">{f.introSummary || "No introduction yet"}</p>
                  <p className="mt-1 text-xs text-slate-500">{f.visibleTo === "PAUSED" ? "Paused — hidden from searches." : f.isPubliclyListed ? "Published." : "Draft — not published yet."}</p>
                </div>
              );
            })()}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          {idx > 0 && <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setWin(W.WINDOWS[idx - 1].n)}>Back</button>}
          {win === 14 ? (
            <>
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setShowPreview((v) => !v)}>{showPreview ? "Hide preview" : "Preview profile"}</button>
              <button type="button" disabled={saving} className="btn-shiftify" onClick={() => publish(true)}>{saving ? "Saving…" : f.isPubliclyListed ? "Update published profile" : "Publish profile"}</button>
              <button type="button" disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => publish(false)}>Save draft</button>
            </>
          ) : (
            <button type="button" disabled={saving} className="btn-shiftify" onClick={next}>
              {saving ? "Saving…" : win === 5 ? "Continue" : win === 13 ? "Save preferences" : "Save and continue"}
            </button>
          )}
          {win === 5 && <button type="button" disabled={saving} className="text-sm font-semibold text-slate-600 underline" onClick={later}>Save and finish later</button>}
          {[6, 9, 10, 12].includes(win) && <button type="button" disabled={saving} className="text-sm font-semibold text-slate-600 underline" onClick={later}>Complete later</button>}
        </div>
      </div>

      {win === 14 && f.isPubliclyListed && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Your profile is set up.{" "}
          <Link className="font-semibold underline" href={goal?.href ?? "/dashboard/worker"}>{goal ? `Continue: ${goal.title}` : "Go to your dashboard"}</Link>
        </div>
      )}
    </div>
  );
}
