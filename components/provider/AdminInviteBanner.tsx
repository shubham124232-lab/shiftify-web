"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import { UserRole } from "@/lib/types";

interface Invitation { id: string; businessName: string; rolePreset: string; expiresAt: string | null }

// Provider doc P16: a person invited to administer a Provider organisation sees the invitation here, in any role,
// and chooses to accept or decline. Accepting makes them an Administrator and opens the organisation's workspace.
export function AdminInviteBanner() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ invitations: Invitation[] }>("/provider-org/my-invitations")
      .then((r) => setInvites(r.invitations ?? []))
      .catch(() => { /* the banner is optional; stay silent if it cannot load */ });
  }, [user?.id]);

  if (invites.length === 0) return null;

  async function accept(i: Invitation) {
    setBusy(i.id); setError(null);
    try {
      await api.post(`/provider-org/my-invitations/${i.id}/accept`, {});
      // Their login is already a Provider account, so a fresh load of the dashboard opens the organisation workspace.
      window.location.assign(ROLE_DASHBOARD_PATHS[UserRole.PROVIDER]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not accept the invitation");
      setBusy(null);
    }
  }

  async function decline(i: Invitation) {
    setBusy(i.id); setError(null);
    try {
      await api.post(`/provider-org/my-invitations/${i.id}/decline`, {});
      setInvites((list) => list.filter((x) => x.id !== i.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not decline the invitation");
    } finally { setBusy(null); }
  }

  return (
    <div className="border-b border-brand-100 bg-brand-50/70 px-6 py-3">
      {invites.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-slate-700">
            <strong className="text-slate-900">{i.businessName}</strong> invited you to help manage their Provider organisation.
            {i.expiresAt && <span className="text-slate-500"> Expires {new Date(i.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}.</span>}
          </p>
          <span className="flex gap-2">
            <Button size="sm" disabled={busy === i.id} onClick={() => accept(i)}>Accept</Button>
            <Button size="sm" variant="outline" disabled={busy === i.id} onClick={() => decline(i)}>Decline</Button>
          </span>
        </div>
      ))}
      {error && <p className="m-0 mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
