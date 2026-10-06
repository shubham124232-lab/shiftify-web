"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inp, lbl } from "@/components/jobs/post/shared";

export interface WorkforceBranch { id: string; name: string }

export interface WorkforceTeamMember {
  id: string;
  name: string;
  mobile: string;
  skills: string[];
  email?: string | null;
  relationshipType?: "EMPLOYEE" | "CONTRACTOR" | "OTHER" | null;
  locations?: string[];
  accessLevel?: "STANDARD" | "LIMITED" | null;
  profileVisibility?: "ORGANISATION_ONLY" | "VISIBLE_TO_PARTICIPANTS" | null;
  inviteStatus: "PENDING" | "VERIFIED";
  mobileVerifiedAt: string | null;
  claimedByUserId: string | null;
  branch: { id: string; name: string };
  createdAt: string;
}

export function TeamMembersTab({
  teamMembers, branches, onCreated, onError, clearMessages,
}: {
  teamMembers: WorkforceTeamMember[];
  branches: WorkforceBranch[];
  onCreated: () => void;
  onError: (e: unknown) => void;
  clearMessages: () => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [skills, setSkills] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<"EMPLOYEE" | "CONTRACTOR" | "OTHER">("EMPLOYEE");
  const [locations, setLocations] = useState("");
  const [consent, setConsent] = useState(false);
  const [accessLevel, setAccessLevel] = useState<"STANDARD" | "LIMITED">("STANDARD");
  const [visibility, setVisibility] = useState<"ORGANISATION_ONLY" | "VISIBLE_TO_PARTICIPANTS">("ORGANISATION_ONLY");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [devCode, setDevCode] = useState<{ id: string; code: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState<string | null>(null);

  async function create() {
    if (!name.trim() || !mobile.trim() || !branchId || !consent) return;
    clearMessages();
    setSaving(true);
    try {
      const res = await api.post<{ teamMember: WorkforceTeamMember & { _dev_code?: string } }>("/provider-org/team-members", {
        name: name.trim(), mobile: mobile.trim(), branchId,
        skills: skills.split(",").map(x => x.trim()).filter(Boolean),
        locations: locations.split(",").map(x => x.trim()).filter(Boolean),
        ...(email.trim() ? { email: email.trim() } : {}),
        relationshipType: relationship,
        accessLevel, profileVisibility: visibility,
        consentAcknowledged: true,
      });
      setName("");
      setMobile("");
      setSkills("");
      setEmail("");
      setLocations("");
      setConsent(false);
      if (res.teamMember._dev_code) setDevCode({ id: res.teamMember.id, code: res.teamMember._dev_code });
      onCreated();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  }

  async function confirm(id: string) {
    const code = verifyCode[id];
    if (!code) return;
    clearMessages();
    setVerifying(id);
    try {
      await api.post(`/provider-org/team-members/${id}/verify/confirm`, { code });
      onCreated();
    } catch (e) {
      onError(e);
    } finally {
      setVerifying(null);
    }
  }

  async function resend(id: string) {
    clearMessages();
    try {
      const res = await api.post<{ _dev_code?: string }>(`/provider-org/team-members/${id}/verify/resend`, {});
      if (res._dev_code) setDevCode({ id, code: res._dev_code });
    } catch (e) {
      onError(e);
    }
  }

  async function remove(id: string) {
    clearMessages();
    try {
      await api.delete(`/provider-org/team-members/${id}`);
      onCreated();
    } catch (e) {
      onError(e);
    }
  }

  if (branches.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">Add a Branch first before inviting Team Members.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4 px-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Name</label>
              <input className={inp} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Mobile</label>
              <input className={inp} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="04xx xxx xxx" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Email (optional)</label>
              <input className={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="worker@example.com" />
            </div>
            <div>
              <label className={lbl}>Relationship to your organisation</label>
              <select className={inp} value={relationship} onChange={e => setRelationship(e.target.value as typeof relationship)}>
                <option value="EMPLOYEE">Employee</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="OTHER">Other verified relationship</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Locations they cover (optional, comma-separated)</label>
            <input className={inp} value={locations} onChange={e => setLocations(e.target.value)} placeholder="e.g. Parramatta, Blacktown" />
          </div>
          <div>
            <label className={lbl}>Skills and services (optional, comma-separated)</label>
            <input className={inp} value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Personal care, Manual handling, Driving" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Access level</label>
              <select className={inp} value={accessLevel} onChange={e => setAccessLevel(e.target.value as typeof accessLevel)}>
                <option value="STANDARD">Standard — sees offers, assignments and messages</option>
                <option value="LIMITED">Limited — assignments only</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Profile visibility</label>
              <select className={inp} value={visibility} onChange={e => setVisibility(e.target.value as typeof visibility)}>
                <option value="ORGANISATION_ONLY">Organisation only</option>
                <option value="VISIBLE_TO_PARTICIPANTS">Visible to Participants and Coordinators when nominated</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Branch</label>
            <select className={inp} value={branchId} onChange={e => setBranchId(e.target.value)}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} />
            <span>This worker has agreed to be linked to our organisation on Shiftify. They verify their own mobile, see only their own offers and assignments, and their personal marketplace activity stays separate.</span>
          </label>
          <Button size="sm" disabled={saving || !name.trim() || !mobile.trim() || !consent} onClick={create}>
            {saving ? "..." : "Invite team member"}
          </Button>
        </CardContent>
      </Card>

      {teamMembers.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No Team Members yet.</p>
      ) : (
        <div className="space-y-2">
          {teamMembers.map(m => (
            <Card key={m.id}>
              <CardContent className="py-3 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-400">
                      {m.mobile} · {m.branch.name}
                      {m.relationshipType ? ` · ${m.relationshipType === "EMPLOYEE" ? "Employee" : m.relationshipType === "CONTRACTOR" ? "Contractor" : "Other"}` : ""}
                      {m.locations?.length ? ` · ${m.locations.join(", ")}` : ""}
                      {m.accessLevel ? ` · ${m.accessLevel === "LIMITED" ? "Limited access" : "Standard access"}` : ""}
                      {m.profileVisibility === "VISIBLE_TO_PARTICIPANTS" ? " · Visible when nominated" : ""}
                      {m.skills?.length ? ` · ${m.skills.join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      m.inviteStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {m.inviteStatus === "VERIFIED" ? "Verified" : "Pending verification"}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Remove</Button>
                  </div>
                </div>
                {m.inviteStatus === "PENDING" && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      className={`${inp} w-32`}
                      placeholder="Verification code"
                      value={verifyCode[m.id] ?? ""}
                      onChange={e => setVerifyCode(s => ({ ...s, [m.id]: e.target.value }))}
                    />
                    <Button size="sm" variant="outline" disabled={verifying === m.id} onClick={() => confirm(m.id)}>
                      {verifying === m.id ? "..." : "Confirm"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resend(m.id)}>Resend code</Button>
                    {devCode?.id === m.id && (
                      <span className="text-xs text-slate-400">Dev code: {devCode.code}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
