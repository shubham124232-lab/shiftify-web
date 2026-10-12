"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Member {
  key: string;
  name: string;
  kind: "MANAGED" | "ROSTER";
  branch: string | null;
  status: "AVAILABLE" | "ON_SHIFT" | "INVITED" | "NOT_SET" | "VERIFIED";
  upcomingAssignments: number;
}
interface Reply { id: string; memberType: "MANAGED" | "ROSTER"; memberName: string; status: "PENDING" | "AVAILABLE" | "UNAVAILABLE" }
interface AvailabilityRequest { id: string; title: string; startsAt: string | null; message: string | null; createdAt: string; replies: Reply[] }
interface ShiftOption { id: string; title: string; status: string; scheduledStartAt: string }

const STATUS: Record<Member["status"], { label: string; cls: string }> = {
  AVAILABLE: { label: "Available", cls: "bg-emerald-100 text-emerald-700" },
  ON_SHIFT:  { label: "On shift",  cls: "bg-sky-100 text-sky-700" },
  INVITED:   { label: "Invited",   cls: "bg-amber-100 text-amber-700" },
  NOT_SET:   { label: "No availability set", cls: "bg-slate-100 text-slate-500" },
  VERIFIED:  { label: "Verified",  cls: "bg-slate-100 text-slate-600" },
};
const REPLY: Record<Reply["status"], { label: string; cls: string }> = {
  PENDING:     { label: "Waiting", cls: "bg-slate-100 text-slate-500" },
  AVAILABLE:   { label: "Available", cls: "bg-emerald-100 text-emerald-700" },
  UNAVAILABLE: { label: "Unavailable", cls: "bg-red-100 text-red-700" },
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function ProviderTeamAvailabilityPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      api.get<{ members: Member[]; requests: AvailabilityRequest[] }>("/provider-workspace/team-availability"),
      api.get<{ jobs: ShiftOption[] }>("/jobs/my").catch(() => ({ jobs: [] as ShiftOption[] })),
    ])
      .then(([t, j]) => {
        setMembers(t.members); setRequests(t.requests);
        setShifts((j.jobs ?? []).filter((x) => (x.status === "OPEN" || x.status === "ASSIGNED") && new Date(x.scheduledStartAt) > new Date()));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load team availability"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => setSelected((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const ask = (key: string) => { setSelected(new Set([key])); setComposing(true); setNotice(null); };
  const selectedCount = selected.size;
  const canSend = useMemo(() => !!jobId && selectedCount > 0, [jobId, selectedCount]);

  async function send() {
    setSending(true); setError(null); setNotice(null);
    try {
      await api.post("/provider-workspace/team-availability/requests", { jobId, message: message.trim() || undefined, memberKeys: [...selected] });
      setNotice("Availability request sent.");
      setComposing(false); setSelected(new Set()); setJobId(""); setMessage("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the request"); }
    finally { setSending(false); }
  }

  async function record(reply: Reply, status: "AVAILABLE" | "UNAVAILABLE") {
    setError(null);
    try { await api.patch(`/provider-workspace/team-availability/replies/${reply.id}`, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not record the reply"); }
  }

  return (
    <>
      <PageHeader
        title="Team Availability"
        description="Check eligible team members before filling or broadcasting a gap."
        actions={<Button onClick={() => { setComposing(true); setNotice(null); }}>Request availability</Button>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

        {composing && (
          <Card>
            <CardContent className="space-y-3 px-5 py-4">
              <p className="m-0 text-sm font-semibold text-slate-900">Request availability</p>
              <label className="block text-xs font-semibold text-slate-700">Shift
                <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-1 block h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal">
                  <option value="">{shifts.length ? "Choose a shift" : "No upcoming shifts — post one first"}</option>
                  {shifts.map((s) => <option key={s.id} value={s.id}>{s.title} · {fmt(s.scheduledStartAt)}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">Message (optional)
                <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Anything they should know"
                  className="mt-1 block h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
              </label>
              <p className="m-0 text-xs text-slate-500">
                {selectedCount === 0 ? "Tick the team members to ask below." : `${selectedCount} team member${selectedCount === 1 ? "" : "s"} selected.`}
                {" "}Availability checks never use a Provider Action.
              </p>
              <div className="flex gap-2">
                <Button size="sm" disabled={!canSend || sending} onClick={send}>{sending ? "Sending…" : "Send request"}</Button>
                <Button size="sm" variant="outline" onClick={() => { setComposing(false); setSelected(new Set()); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ) : members.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">
            No team members yet. <Link href="/provider/workforce" className="font-semibold text-brand-600 hover:underline">Add people to your Internal Team</Link> to check their availability.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const st = STATUS[m.status];
              return (
                <Card key={m.key}>
                  <CardContent className="space-y-3 py-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                          {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                        <div>
                          <p className="m-0 text-sm font-semibold text-slate-900">{m.name}</p>
                          <p className="m-0 text-xs text-slate-500">{m.branch ?? "Worker with login"}{m.upcomingAssignments ? ` · ${m.upcomingAssignments} upcoming` : ""}</p>
                        </div>
                      </div>
                      {composing && (
                        <input type="checkbox" checked={selected.has(m.key)} onChange={() => toggle(m.key)} className="mt-1 h-4 w-4" aria-label={`Ask ${m.name}`} />
                      )}
                    </div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    {m.status === "INVITED" && <p className="m-0 text-xs text-slate-500">Complete credentials before confirmation.</p>}
                    <div className="flex flex-wrap gap-2">
                      <Link href={m.kind === "MANAGED" ? `/team/${m.key.slice(2)}/edit` : "/provider/workforce"}><Button size="sm" variant="outline">View worker</Button></Link>
                      <Button size="sm" variant="outline" onClick={() => ask(m.key)}>Send availability request</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Availability requests</CardTitle></CardHeader>
          <CardContent className="py-2">
            {requests.length === 0 ? (
              <div className="py-4 text-sm text-slate-500">
                <p className="m-0 font-semibold text-slate-700">No internal requests sent</p>
                <p className="m-0 mt-1">Choose a shift and ask your team about availability.</p>
              </div>
            ) : (
              <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                {requests.map((r) => (
                  <li key={r.id} className="space-y-2 py-3">
                    <div>
                      <p className="m-0 text-sm font-semibold text-slate-900">{r.title}</p>
                      <p className="m-0 text-xs text-slate-500">{r.startsAt ? `${fmt(r.startsAt)} · ` : ""}Sent {fmt(r.createdAt)}{r.message ? ` · ${r.message}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.replies.map((rep) => (
                        <span key={rep.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-xs">
                          <span className="font-medium text-slate-800">{rep.memberName}</span>
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${REPLY[rep.status].cls}`}>{REPLY[rep.status].label}</span>
                          {rep.memberType === "ROSTER" && rep.status === "PENDING" && (
                            <>
                              <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => record(rep, "AVAILABLE")}>Mark available</button>
                              <button type="button" className="font-semibold text-red-600 hover:underline" onClick={() => record(rep, "UNAVAILABLE")}>Mark unavailable</button>
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
