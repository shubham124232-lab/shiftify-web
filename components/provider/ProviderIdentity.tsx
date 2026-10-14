"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Header: the organisation this Provider session acts for, and whether the person is its Owner or an Administrator.
export function ProviderIdentity() {
  const [id, setId] = useState<{ organisation: string | null; capacity: "OWNER" | "ADMINISTRATOR" } | null>(null);
  useEffect(() => {
    api.get<{ organisation: string | null; capacity: "OWNER" | "ADMINISTRATOR" }>("/provider-org/identity")
      .then(setId).catch(() => setId(null));
  }, []);
  if (!id?.organisation) return null;
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Provider workspace</span>
      <span className="text-sm font-semibold text-slate-900">
        {id.organisation}
        {id.capacity === "ADMINISTRATOR" && <span className="ml-1.5 text-xs font-normal text-slate-400">· Administrator</span>}
      </span>
    </span>
  );
}
