"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface DirectConnectInvite {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  message: string | null;
  createdAt: string;
  provider: { id: string; name: string };
}

function InviteCard({
  invite,
  acting,
  onRespond,
}: {
  invite: DirectConnectInvite;
  acting: boolean;
  onRespond: (id: string, action: "ACCEPT" | "DECLINE") => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-semibold text-slate-900">{invite.provider.name}</span>
        <span className="text-xs text-slate-400">{new Date(invite.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-slate-600 mb-3">
        {invite.provider.name} wants to connect with you directly for shift work.
      </p>
      {invite.message && (
        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-3">
          &ldquo;{invite.message}&rdquo;
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" disabled={acting} onClick={() => onRespond(invite.id, "ACCEPT")}>
          Accept
        </Button>
        <Button size="sm" variant="ghost" disabled={acting} onClick={() => onRespond(invite.id, "DECLINE")}>
          Decline
        </Button>
      </div>
    </div>
  );
}

export default function ConnectInvitesPage() {
  const { activeRole } = useAuth();
  const [invites, setInvites] = useState<DirectConnectInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.get<{ requests: DirectConnectInvite[] }>("/direct-connect")
      .then(r => setInvites(r.requests ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "Could not load invites"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (activeRole === UserRole.SUPPORT_WORKER) load(); }, [activeRole]);

  async function respond(id: string, action: "ACCEPT" | "DECLINE") {
    setActing(id);
    setError(null);
    try {
      await api.patch(`/direct-connect/${id}/respond`, { action });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not respond to this invite");
    } finally {
      setActing(null);
    }
  }

  if (activeRole !== UserRole.SUPPORT_WORKER) {
    return (
      <>
        <PageHeader title="Direct Connect" />
        <div className="mx-auto max-w-3xl px-5 py-6">
          <p className="text-sm text-slate-500">This page is only available to Support Workers.</p>
        </div>
      </>
    );
  }

  const pending  = invites.filter(i => i.status === "PENDING");
  const decided  = invites.filter(i => i.status !== "PENDING");

  return (
    <>
      <PageHeader
        title="Direct Connect"
        description="Providers who want to work with you directly send invites here. Accepting is always free for you."
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
            <p className="text-base font-semibold text-slate-700">No invites yet</p>
            <p className="text-sm text-slate-400 mt-1">When a provider wants to connect with you directly, it&apos;ll show up here.</p>
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
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Past invites</h2>
                <Card>
                  <CardContent className="py-2 px-4 divide-y divide-slate-100">
                    {decided.map(i => (
                      <div key={i.id} className="flex items-center justify-between py-3">
                        <span className="text-sm text-slate-700">{i.provider.name}</span>
                        <span className={`text-xs font-semibold ${i.status === "ACCEPTED" ? "text-emerald-600" : "text-slate-400"}`}>
                          {i.status === "ACCEPTED" ? "Connected" : "Declined"}
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
