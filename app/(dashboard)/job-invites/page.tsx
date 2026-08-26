"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface JobInvite {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  message: string | null;
  amountAud: number | string | null;
  createdAt: string;
  invitedBy: { id: string; name: string };
  job: { id: string; title: string; status: string };
}

function InviteCard({
  invite,
  acting,
  onRespond,
}: {
  invite: JobInvite;
  acting: boolean;
  onRespond: (id: string, action: "ACCEPT" | "DECLINE") => void;
}) {
  const paid = invite.amountAud != null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <Link href={`/jobs/${invite.job.id}`} className="text-base font-semibold text-slate-900 hover:underline">
          {invite.job.title}
        </Link>
        <span className="text-xs text-slate-400">{new Date(invite.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-slate-600 mb-3">
        {invite.invitedBy.name} invited you to this request.
        {paid && <span className="font-semibold text-slate-800"> Accepting charges ${Number(invite.amountAud).toFixed(2)} — Direct Connect not included.</span>}
      </p>
      {invite.message && (
        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-3">
          &ldquo;{invite.message}&rdquo;
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" disabled={acting} onClick={() => onRespond(invite.id, "ACCEPT")}>
          {paid ? `Accept — $${Number(invite.amountAud).toFixed(2)}` : "Accept"}
        </Button>
        <Button size="sm" variant="ghost" disabled={acting} onClick={() => onRespond(invite.id, "DECLINE")}>
          Decline
        </Button>
      </div>
    </div>
  );
}

export default function JobInvitesPage() {
  const { activeRole } = useAuth();
  const [invites, setInvites] = useState<JobInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const canView = activeRole === UserRole.SUPPORT_WORKER || activeRole === UserRole.PROVIDER;

  function load() {
    setLoading(true);
    api.get<{ invites: JobInvite[] }>("/job-invites")
      .then(r => setInvites(r.invites ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "Could not load invitations"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (canView) load(); }, [canView]); // eslint-disable-line react-hooks/exhaustive-deps

  async function respond(id: string, action: "ACCEPT" | "DECLINE") {
    setActing(id);
    setError(null);
    try {
      await api.patch(`/job-invites/${id}/respond`, { action });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not respond to this invitation");
    } finally {
      setActing(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Job Invitations" />
        <div className="mx-auto max-w-3xl px-5 py-6">
          <p className="text-sm text-slate-500">This page is only available to Support Workers and Providers.</p>
        </div>
      </>
    );
  }

  const pending = invites.filter(i => i.status === "PENDING");
  const decided = invites.filter(i => i.status !== "PENDING");

  return (
    <>
      <PageHeader
        title="Job Invitations"
        description="Coordinators and providers who want you specifically for a request send invites here."
      />
      <div className="mx-auto max-w-3xl px-5 py-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No invitations yet</p>
            <p className="text-sm text-slate-400 mt-1">When someone invites you to a specific request, it&apos;ll show up here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Pending ({pending.length})</h2>
                <div className="space-y-3">
                  {pending.map(i => (
                    <InviteCard key={i.id} invite={i} acting={acting === i.id} onRespond={respond} />
                  ))}
                </div>
              </div>
            )}

            {decided.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Past invitations</h2>
                <Card>
                  <CardContent className="py-2 px-4 divide-y divide-slate-100">
                    {decided.map(i => (
                      <div key={i.id} className="flex items-center justify-between py-3">
                        <span className="text-sm text-slate-700">{i.job.title}</span>
                        <span className={`text-xs font-semibold ${i.status === "ACCEPTED" ? "text-emerald-600" : "text-slate-400"}`}>
                          {i.status === "ACCEPTED" ? "Accepted" : i.status === "WITHDRAWN" ? "Withdrawn" : "Declined"}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
