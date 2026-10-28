"use client";

// Support Coordinator "Organisation & Team". The organisation and account owner come from /users/me.
// There is no team-member API yet, so invited coordinators are a front-end preview kept in this
// browser only — nothing is sent and nobody gains access.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  WorkspacePage, Panel, DataTable, InfoRow, Note, Chip, PrimaryButton, OutlineButton, fieldClass, BORDER,
  useCoordinatorParticipants, shortName,
} from "@/components/coordinator/workspace-ui";

interface Member { name: string; email: string; role: "Administrator" | "Coordinator"; access: string[] }

const STORE_KEY = "shiftify_sc_team_preview";

export default function OrganisationTeamPage() {
  const { user } = useAuth();
  const participants = useCoordinatorParticipants();
  const [organisation, setOrganisation] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [inviting, setInviting] = useState(false);
  const [draft, setDraft] = useState<Member>({ name: "", email: "", role: "Coordinator", access: [] });

  useEffect(() => {
    api.get<{ user: { coordinatorProfile?: { organisationName?: string | null; roleType?: string } | null } }>("/users/me")
      .then(({ user: u }) => {
        const p = u.coordinatorProfile;
        setOrganisation(p?.organisationName || (p?.roleType === "INDEPENDENT" ? "Independent Support Coordinator" : "Support Coordination"));
      })
      .catch(() => {});
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) setMembers(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  function save(next: Member[]) {
    setMembers(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) return;
    save([...members, { ...draft, name: draft.name.trim(), email: draft.email.trim() }]);
    setDraft({ name: "", email: "", role: "Coordinator", access: [] });
    setInviting(false);
  }

  const toggleAccess = (id: string) =>
    setDraft((d) => ({ ...d, access: d.access.includes(id) ? d.access.filter((a) => a !== id) : [...d.access, id] }));
  const nameOf = (id: string) => shortName(participants.find((p) => p.id === id)?.name ?? "Participant");
  const ownerName = user?.name ?? "You";
  const ownerEmail = (user as { email?: string | null } | null)?.email ?? "";

  return (
    <WorkspacePage
      title="Organisation & Team"
      description="Coordinate access by named person and assigned participant cases."
      actions={<PrimaryButton onClick={() => setInviting((v) => !v)}>{inviting ? "Close" : "Invite coordinator"}</PrimaryButton>}
    >
      {inviting && (
        <Panel title="Invite coordinator">
          <form onSubmit={invite} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1.5 text-xs text-[#69707e]">Full name
                <input className={`${fieldClass} w-full`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
              </label>
              <label className="space-y-1.5 text-xs text-[#69707e]">Email
                <input type="email" className={`${fieldClass} w-full`} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required />
              </label>
              <label className="space-y-1.5 text-xs text-[#69707e]">Role
                <select className={`${fieldClass} w-full`} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Member["role"] })}>
                  <option>Coordinator</option>
                  <option>Administrator</option>
                </select>
              </label>
            </div>
            <div>
              <p className="mb-2 text-xs text-[#69707e]">Participant access</p>
              {participants.length ? (
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border ${BORDER} px-3 py-2 text-[13px]`}>
                      <input type="checkbox" checked={draft.access.includes(p.id)} onChange={() => toggleAccess(p.id)} />
                      {shortName(p.name)}
                    </label>
                  ))}
                </div>
              ) : <p className="text-[13px] text-[#69707e]">Add or connect participants first.</p>}
            </div>
            <Note>Team invitations are not connected yet. This preview is saved in this browser only. No email is sent and no access is granted.</Note>
            <div className="flex gap-2">
              <PrimaryButton type="submit">Add to team (preview)</PrimaryButton>
              <OutlineButton onClick={() => setInviting(false)}>Cancel</OutlineButton>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Your organisation">
        <InfoRow label="Organisation">{organisation || "…"}</InfoRow>
        <InfoRow label="Account owner">{ownerName}</InfoRow>
        <div className="mt-4">
          <Note>Each person uses an individual login. Participant authority still applies to every team member. Organisation membership alone does not grant access to participant records.</Note>
        </div>
      </Panel>

      <Panel title="Team access">
        <DataTable
          head={["Person", "Role", "Participant access", "Status", "Action"]}
          rows={[
            [
              <span key="p"><strong className="block font-semibold">{ownerName}</strong><span className="text-[#69707e]">{ownerEmail}</span></span>,
              "Administrator",
              participants.length ? participants.map((p) => shortName(p.name)).join(", ") : "All participants",
              <Chip key="s" tone="green">Active</Chip>,
              "Account owner",
            ],
            ...members.map((m, i) => [
              <span key="p"><strong className="block font-semibold">{m.name}</strong><span className="text-[#69707e]">{m.email}</span></span>,
              m.role,
              m.access.length ? m.access.map(nameOf).join(", ") : "None yet",
              <Chip key="s" tone="slate">Invited</Chip>,
              <OutlineButton key="a" onClick={() => save(members.filter((_, j) => j !== i))} className="!min-h-[32px] !py-1.5">Remove</OutlineButton>,
            ]),
          ]}
        />
      </Panel>
    </WorkspacePage>
  );
}
