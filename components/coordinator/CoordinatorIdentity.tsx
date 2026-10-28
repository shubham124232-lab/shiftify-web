"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// The organisation line needs the coordinator profile; fetch it once per session, not on every page.
let organisationCache: string | null = null;

// Header: "Support Coordinator", the coordination organisation (or "Independent Support Coordinator"), then suburb · name.
export function CoordinatorIdentity() {
  const { user } = useAuth();
  const [organisation, setOrganisation] = useState<string | null>(organisationCache);
  const [suburb, setSuburb] = useState<string | null>((user as { defaultSuburb?: string | null } | null)?.defaultSuburb ?? null);

  useEffect(() => {
    if (organisationCache) return;
    api.get<{ user: { defaultSuburb?: string | null; coordinatorProfile?: { organisationName?: string | null; roleType?: string } | null } }>("/users/me")
      .then(({ user: u }) => {
        const p = u.coordinatorProfile;
        organisationCache = p?.organisationName || (p?.roleType === "INDEPENDENT" ? "Independent Support Coordinator" : "Support Coordination");
        setOrganisation(organisationCache);
        if (u.defaultSuburb) setSuburb(u.defaultSuburb);
      })
      .catch(() => {});
  }, []);

  const line = [suburb, user?.name].filter(Boolean).join(" · ");
  return (
    <span className="flex min-h-[42px] min-w-[180px] max-w-[300px] flex-col justify-center border-l border-[#e4e6ed] pl-6 leading-tight">
      <span className="text-xs font-bold uppercase tracking-wider text-[#69707e]">Support Coordinator</span>
      {organisation && <span className="truncate text-sm font-semibold text-slate-900">{organisation}</span>}
      {line && <span className="truncate text-[11px] text-slate-500">{line}</span>}
    </span>
  );
}
