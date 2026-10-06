"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inp, lbl } from "@/components/jobs/post/shared";

const PARTICIPANT_TYPES = [
  { value: "PARTICIPANT", label: "Participant (this account is for me)" },
  { value: "NOMINEE", label: "Nominee" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "AUTHORISED_REPRESENTATIVE", label: "Authorised representative" },
  { value: "PARENT_FAMILY_REPRESENTATIVE", label: "Parent / family representative" },
  { value: "OTHER", label: "Other" },
];

const AGE_GROUPS = [
  { value: "CHILD", label: "Child" },
  { value: "TEENAGER", label: "Teenager" },
  { value: "ADULT", label: "Adult" },
  { value: "OLDER_ADULT", label: "Older adult" },
];

export default function NewParticipantPage() {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [participantType, setParticipantType] = useState("");
  const [authorisingPersonName, setAuthorisingPersonName] = useState("");
  const [authorisingPersonRelationship, setAuthorisingPersonRelationship] = useState("");
  const [authorisingPersonNote, setAuthorisingPersonNote] = useState("");

  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [infoAccuracyConfirmed, setInfoAccuracyConfirmed] = useState(false);

  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [created,  setCreated]  = useState<{ id: string; name: string } | null>(null);

  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const needsAuthorisingPerson = participantType !== "" && participantType !== "PARTICIPANT";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!preferredName.trim()) { setError("Preferred name is required."); return; }
    if (!ageGroup) { setError("Select an age group."); return; }
    if (!suburb.trim() || !postcode.trim()) { setError("Suburb and postcode are required."); return; }
    if (!participantType) { setError("Select your relationship to this participant."); return; }
    if (needsAuthorisingPerson && (!authorisingPersonName.trim() || !authorisingPersonRelationship.trim())) {
      setError("Enter the authorising person's name and relationship.");
      return;
    }
    if (!authorityConfirmed) { setError("You must confirm you are authorised to source support for this participant."); return; }
    if (!infoAccuracyConfirmed) { setError("You must confirm you understand access may be reviewed and managed."); return; }
    setSaving(true); setError(null);
    try {
      const res = await api.post("/linking/participants", {
        name: preferredName.trim(),
        preferredName: preferredName.trim(), ageGroup,
        suburb: suburb.trim(), postcode: postcode.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        participantType,
        authorisingPersonName: needsAuthorisingPerson ? authorisingPersonName.trim() : undefined,
        authorisingPersonRelationship: needsAuthorisingPerson ? authorisingPersonRelationship.trim() : undefined,
        authorisingPersonNote: needsAuthorisingPerson ? (authorisingPersonNote.trim() || undefined) : undefined,
        authorityConfirmed: true,
        infoAccuracyConfirmed: true,
      });
      const user = (res as any).user;
      setCreated({ id: user.id, name: preferredName.trim() });
    } catch (err: any) {
      setError(err?.message ?? "Failed to create participant.");
    } finally {
      setSaving(false);
    }
  }

  async function sendInvitation(method: "EMAIL" | "SMS") {
    if (!created) return;
    setInviteSending(true); setInviteError(null); setInviteResult(null);
    try {
      const res = await api.post(`/linking/participants/${created.id}/invite`, { method });
      const sentTo = (res as any).sentTo;
      setInviteResult(`Invitation sent to ${sentTo}.`);
    } catch (err: any) {
      setInviteError(err?.message ?? "Failed to send invitation.");
    } finally {
      setInviteSending(false);
    }
  }

  if (created) {
    return (
      <>
        <PageHeader title="Participant Added" description="Would you like to invite the participant now?" />
        <div className="mx-auto max-w-lg px-5 py-6">
          <div className="bg-white border-2 border-emerald-200 rounded-xl p-6">
            <div className="text-sm font-bold text-emerald-700 mb-4">
              ✓ {created.name} has been added
            </div>
            <p className="text-sm text-slate-700 mb-4 leading-relaxed">
              The participant or their authorised representative may be invited to review and manage access.
            </p>

            <div className="border-t border-slate-200 pt-4 mb-5">
              <div className="text-sm font-bold text-slate-800 mb-2">
                Send invitation now
              </div>
              <p className="text-xs text-slate-500 mb-3">
                We'll notify the participant using the contact details you entered.
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => sendInvitation("EMAIL")} disabled={inviteSending}>
                  {inviteSending ? "Sending..." : "Send by email"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => sendInvitation("SMS")} disabled={inviteSending}>
                  {inviteSending ? "Sending..." : "Send by SMS"}
                </Button>
              </div>
              {inviteResult && <p className="text-xs text-emerald-700 mt-2.5">{inviteResult}</p>}
              {inviteError && <p className="text-xs text-red-700 mt-2.5">{inviteError}</p>}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => router.push("/jobs/post")}>Continue to post a request →</Button>
              <Button variant="outline" onClick={() => router.push("/participants")}>Invite later</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add Participant"
        description="Tell us who needs support."
        actions={<Link href="/participants"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div className="mx-auto max-w-lg px-5 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card>
            <CardHeader><CardTitle>Participant details</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div>
                <label className={lbl}>Preferred name *</label>
                <input className={inp} value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder="What they like to be called" autoFocus />
              </div>
              <div>
                <label className={lbl}>Age group *</label>
                <select className={inp} value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                  <option value="">Select...</option>
                  {AGE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-[2]">
                  <label className={lbl}>Suburb *</label>
                  <input className={inp} value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="Parramatta" />
                </div>
                <div className="flex-1">
                  <label className={lbl}>Postcode *</label>
                  <input className={inp} value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="2150" />
                </div>
              </div>
              <div>
                <label className={lbl}>Email, if available</label>
                <input className={inp} type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="participant@example.com" />
              </div>
              <div>
                <label className={lbl}>Mobile, if available</label>
                <input className={inp} value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="04xx xxx xxx" />
                <p className="text-[11px] text-slate-400 mt-1">Needed to send an invitation by email or SMS.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Authority</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div>
                <label className={lbl}>Who has authorised you to act? *</label>
                <select
                  className={inp} value={participantType}
                  onChange={e => setParticipantType(e.target.value)}
                >
                  <option value="">Select...</option>
                  {PARTICIPANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {needsAuthorisingPerson && (
                <>
                  <div>
                    <label className={lbl}>Authorising person's name *</label>
                    <input className={inp} value={authorisingPersonName} onChange={e => setAuthorisingPersonName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={lbl}>Relationship to participant *</label>
                    <input className={inp} value={authorisingPersonRelationship} onChange={e => setAuthorisingPersonRelationship(e.target.value)} placeholder="e.g. Mother, Legal guardian" />
                  </div>
                  <div>
                    <label className={lbl}>Note (optional)</label>
                    <input className={inp} value={authorisingPersonNote} onChange={e => setAuthorisingPersonNote(e.target.value)} placeholder="Any additional context" />
                  </div>
                </>
              )}

              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox" checked={authorityConfirmed}
                  onChange={e => setAuthorityConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                I confirm that I am authorised to source support for this participant.
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox" checked={infoAccuracyConfirmed}
                  onChange={e => setInfoAccuracyConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                I understand the participant or authorised representative may be invited to review and manage access.
              </label>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Save participant</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/participants")}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
