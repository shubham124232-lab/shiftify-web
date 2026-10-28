"use client";

// Provider doc P-Internal Team: the Team Member record as a three-step popup (identity, skills and coverage, personal access).
// Edit mode updates an existing roster member; mobile and email are fixed once the invitation is sent.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ModalShell, inp, lbl } from "@/components/jobs/post/shared";
import type { WorkforceBranch, WorkforceTeamMember } from "@/components/provider/TeamMembersTab";

const STEPS = ["1. Identity and organisational link", "2. Skills and coverage", "3. Personal access"];
const SERVICES = ["Personal Care", "Community Access", "Daily Living", "Overnight Support", "Complex Care", "Behaviour Support", "Transport", "Respite", "Psychosocial Support"];
const COMPETENCIES = ["First Aid", "CPR", "Manual Handling", "Hoist", "Medication competency", "NDIS screening", "WWCC", "Driver licence"];
const LANGUAGES = ["English", "Arabic", "Urdu", "Hindi", "Mandarin", "Auslan"];
const CREDENTIALS = [{ v: "CURRENT", l: "Current" }, { v: "NEEDS_REVIEW", l: "Needs review" }, { v: "NOT_PROVIDED", l: "Not provided" }] as const;

export function TeamMemberDialog({ memberId, onClose, onSaved }: { memberId?: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const editing = !!memberId;
  const [step, setStep] = useState(0);
  const [branches, setBranches] = useState<WorkforceBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [relationship, setRelationship] = useState<"EMPLOYEE" | "CONTRACTOR" | "OTHER">("EMPLOYEE");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [credential, setCredential] = useState<"CURRENT" | "NEEDS_REVIEW" | "NOT_PROVIDED">("NOT_PROVIDED");
  const [years, setYears] = useState("");
  const [locations, setLocations] = useState("");
  const [accessLevel, setAccessLevel] = useState<"STANDARD" | "LIMITED">("STANDARD");
  const [visibility, setVisibility] = useState<"ORGANISATION_ONLY" | "VISIBLE_TO_PARTICIPANTS">("ORGANISATION_ONLY");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ branches: WorkforceBranch[] }>("/provider-org/branches"),
      editing ? api.get<{ teamMembers: WorkforceTeamMember[] }>("/provider-org/team-members") : Promise.resolve(null),
    ]).then(([b, t]) => {
      setBranches(b.branches ?? []);
      if (!editing) setBranchId(b.branches?.[0]?.id ?? "");
      const m = t?.teamMembers.find((x) => x.id === memberId);
      if (m) {
        setName(m.name); setMobile(m.mobile); setEmail(m.email ?? ""); setBranchId(m.branch.id);
        setRelationship(m.relationshipType ?? "EMPLOYEE"); setSkills(m.skills ?? []); setLocations((m.locations ?? []).join(", "));
        setLanguages(m.languages ?? []); setCredential(m.credentialStatus ?? "NOT_PROVIDED"); setYears(m.experienceYears != null ? String(m.experienceYears) : "");
        setAccessLevel(m.accessLevel ?? "STANDARD"); setVisibility(m.profileVisibility ?? "ORGANISATION_ONLY");
      }
    }).catch((e) => setError(e instanceof Error ? e.message : "Could not load the team member"))
      .finally(() => setLoading(false));
  }, [editing, memberId]);

  const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const extraSkills = skills.filter((x) => !SERVICES.includes(x) && !COMPETENCIES.includes(x));
  const extra = { languages, credentialStatus: credential, experienceYears: years.trim() ? Math.max(0, Math.round(Number(years))) || 0 : null };
  const identityOk = !!name.trim() && !!branchId && (editing || (!!mobile.trim() && !!email.trim()));
  const field = `${inp} w-full`;

  async function save() {
    setBusy(true); setError(null);
    try {
      if (editing) {
        await api.patch(`/provider-org/team-members/${memberId}`, {
          name: name.trim(), branchId, skills, locations: list(locations), ...extra,
          relationshipType: relationship, accessLevel, profileVisibility: visibility,
        });
        onSaved("Team member updated.");
      } else {
        const res = await api.post<{ teamMember?: { inviteStatus?: string }; inviteStatus?: string }>("/provider-org/team-members", {
          name: name.trim(), mobile: mobile.trim(), email: email.trim(), branchId, skills, locations: list(locations), ...extra,
          relationshipType: relationship, accessLevel, profileVisibility: visibility, consentAcknowledged: true,
        });
        onSaved((res?.teamMember?.inviteStatus ?? res?.inviteStatus) === "VERIFIED" ? "Team Member added and auto-approved for testing. In live use they verify their own email before they are active." : "Invitation sent. The team member verifies their own email before they are active.");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the team member"); }
    finally { setBusy(false); }
  }

  return (
    <ModalShell title={editing ? "Edit internal Team Member" : "Add internal Team Member"} subtitle={editing ? "Edit existing record" : undefined} onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6">
        {STEPS.map((l, i) => (
          <button key={l} type="button" onClick={() => i <= step && setStep(i)}
            className={`border-b-2 py-3 text-left text-xs font-semibold ${i === step ? "border-brand-600 text-brand-700" : i < step ? "border-brand-200 text-slate-500" : "border-slate-200 text-slate-400"}`}>{l}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {loading ? <div className="h-32 animate-pulse rounded-xl bg-slate-100" /> : step === 0 ? (
          <>
            <h3 className="m-0 text-xl font-bold text-slate-900">Identity and organisational link</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Full name <span className="text-brand-600">*</span>
                <input className={`${field} mt-1`} value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="block text-sm font-semibold text-slate-700">Mobile number <span className="text-brand-600">*</span>
                <input className={`${field} mt-1`} value={mobile} disabled={editing} onChange={(e) => setMobile(e.target.value)} placeholder="04xx xxx xxx" /></label>
              <label className="block text-sm font-semibold text-slate-700">Email{editing ? "" : <span className="text-brand-600"> *</span>}
                <input className={`${field} mt-1`} value={email} disabled={editing} onChange={(e) => setEmail(e.target.value)} placeholder="worker@example.com" />
                {!editing && <span className="mt-1 block text-xs font-normal text-slate-500">The verification code is sent here.</span>}</label>
              <label className="block text-sm font-semibold text-slate-700">Primary Branch <span className="text-brand-600">*</span>
                <select className={`${field} mt-1`} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <label className="block text-sm font-semibold text-slate-700">Relationship <span className="text-brand-600">*</span>
                <select className={`${field} mt-1`} value={relationship} onChange={(e) => setRelationship(e.target.value as typeof relationship)}>
                  <option value="EMPLOYEE">Employee</option><option value="CONTRACTOR">Contractor</option><option value="OTHER">Other verified relationship</option></select></label>
            </div>
          </>
        ) : step === 1 ? (
          <>
            <h3 className="m-0 text-xl font-bold text-slate-900">Skills and coverage</h3>
            <p className="m-0 -mt-2 text-sm text-slate-500">Account access is separate from permission to deliver a shift.</p>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-700">Services and skills <span className="text-brand-600">*</span></p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {[...SERVICES, ...COMPETENCIES, ...extraSkills].map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={skills.includes(s)} onChange={() => setSkills(toggle(skills, s))} />{s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-700">Languages</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {[...LANGUAGES, ...languages.filter((x) => !LANGUAGES.includes(x))].map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={languages.includes(s)} onChange={() => setLanguages(toggle(languages, s))} />{s}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Credential review
                <select className={`${field} mt-1`} value={credential} onChange={(e) => setCredential(e.target.value as typeof credential)}>
                  {CREDENTIALS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</select></label>
              <label className="block text-sm font-semibold text-slate-700">Relevant experience (years)
                <input className={`${field} mt-1`} type="number" min={0} max={60} value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 4" /></label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">Locations they cover (optional, comma-separated)
              <input className={`${field} mt-1`} value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="e.g. Parramatta, Blacktown" /></label>
          </>
        ) : (
          <>
            <h3 className="m-0 text-xl font-bold text-slate-900">Personal access</h3>
            <p className="m-0 -mt-2 text-sm text-slate-500">Internal workers have no Provider-wide marketplace access.</p>
            <label className="block text-sm font-semibold text-slate-700">Portal access
              <select className={`${field} mt-1`} value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as typeof accessLevel)}>
                <option value="STANDARD">Own offers, assignments, calendar and messages</option><option value="LIMITED">Own assignments only</option></select></label>
            <label className="block text-sm font-semibold text-slate-700">Profile visibility
              <select className={`${field} mt-1`} value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
                <option value="ORGANISATION_ONLY">Organisation only</option><option value="VISIBLE_TO_PARTICIPANTS">Visible to Participants and Coordinators when nominated</option></select></label>
            {!editing && (
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span><strong>Organisational link / consent:</strong> this worker has agreed to be linked to our organisation on Shiftify. They verify their own email, see only their own offers and assignments, and their personal marketplace activity stays separate.</span>
              </label>
            )}
          </>
        )}
        {error && <p className="m-0 text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button variant="outline" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? "Cancel" : "Back"}</Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{step + 1} of 3</span>
          {step < 2
            ? <Button disabled={loading || (step === 0 && !identityOk) || (step === 1 && skills.length === 0)} onClick={() => setStep(step + 1)}>Continue</Button>
            : <Button disabled={busy || loading || !identityOk || (!editing && !consent)} onClick={() => void save()}>{busy ? "Saving…" : editing ? "Save changes" : "Invite team member"}</Button>}
        </div>
      </div>
    </ModalShell>
  );
}
