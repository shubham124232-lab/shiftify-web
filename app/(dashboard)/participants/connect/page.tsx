"use client";

// SC-C01–C05 — connect a participant who already uses Shiftify. The participant
// approves the request and controls which permissions are granted.

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inp, lbl } from "@/components/jobs/post/shared";

const PERMISSIONS = [
  { key: "canViewInfo",           label: "View participant-approved profile information" },
  { key: "canPostRequests",       label: "Post support requests" },
  { key: "canShortlist",          label: "Review and shortlist responses" },
  { key: "canMessage",            label: "Message workers/providers about requests" },
  { key: "canConfirmBookings",    label: "Confirm support" },
  { key: "canManageReplacements", label: "Manage upcoming and replacement support" },
] as const;

type PermKey = typeof PERMISSIONS[number]["key"];

export default function ConnectExistingParticipantPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [perms, setPerms] = useState<Record<PermKey, boolean>>({
    canViewInfo: true, canPostRequests: false, canShortlist: false,
    canMessage: false, canConfirmBookings: false, canManageReplacements: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ id: string; name: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() && !mobile.trim()) { setError("Enter the participant's email address or mobile number."); return; }
    if (!Object.values(perms).some(Boolean)) { setError("Select at least one permission to request."); return; }
    setSaving(true); setError(null);
    try {
      const res = await api.post<{ connection: { id: string; participant: { name: string } } }>("/coordinator-connections", {
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        message: message.trim() || undefined,
        permissions: perms,
      });
      setSent({ id: res.connection.id, name: res.connection.participant.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the connection request.");
    } finally {
      setSaving(false);
    }
  }

  async function resend() {
    if (!sent) return;
    setNotice(null);
    try { await api.post(`/coordinator-connections/${sent.id}/resend`, {}); setNotice("Invitation resent."); }
    catch (err) { setNotice(err instanceof Error ? err.message : "Could not resend."); }
  }

  async function cancel() {
    if (!sent) return;
    try { await api.patch(`/coordinator-connections/${sent.id}/cancel`, {}); router.push("/participants"); }
    catch (err) { setNotice(err instanceof Error ? err.message : "Could not cancel."); }
  }

  if (sent) {
    return (
      <>
        <PageHeader title="Connection request sent" description="Awaiting participant approval." />
        <div className="mx-auto max-w-lg px-5 py-6">
          <div className="bg-white border-2 border-emerald-200 rounded-xl p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-700 m-0">
              Your request was sent to <strong>{sent.name}</strong>. They choose which permissions to approve, and you can act on their behalf only once they accept.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <Button variant="outline" size="sm" onClick={resend}>Resend invitation</Button>
              <Button variant="outline" size="sm" onClick={cancel}>Cancel invitation</Button>
            </div>
            {notice && <p className="text-xs text-slate-500 m-0">{notice}</p>}
            <Button onClick={() => router.push("/participants")}>Return to participants</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Connect existing participant"
        description="Connect someone who already uses Shiftify."
        actions={<Link href="/participants"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div className="mx-auto max-w-lg px-5 py-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Card>
            <CardHeader><CardTitle>Enter the participant&apos;s contact details</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div>
                <label className={lbl}>Participant email address</label>
                <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="participant@example.com" autoFocus />
              </div>
              <div>
                <label className={lbl}>Participant mobile number</label>
                <input className={inp} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="04xx xxx xxx" />
                <p className="text-[11px] text-slate-400 mt-1">Email or mobile is required.</p>
              </div>
              <div>
                <label className={lbl}>Invitation message (optional)</label>
                <textarea className={inp} rows={2} value={message} onChange={e => setMessage(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>What would you like permission to do?</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <p className="text-xs text-slate-500 m-0">Select only the permissions you need.</p>
              {PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
                    checked={perms[p.key]} onChange={e => setPerms(prev => ({ ...prev, [p.key]: e.target.checked }))} />
                  {p.label}
                </label>
              ))}
            </CardContent>
          </Card>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Send permission request</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/participants")}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
