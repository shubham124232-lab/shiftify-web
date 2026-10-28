"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Capacity {
  planLabel: string;
  teamMembers: { used: number; max: number | null };
  administrators: { used: number; max: number | null };
  branches: { used: number; max: number | null };
}

const LABEL = { branches: "Branches", administrators: "Administrators", teamMembers: "Team Members" } as const;

// Hidden: neither the Provider spec nor the Final handoff shows usage bars (the handoff only says a limit blocks the extra addition and links to upgrade).
// Limits are still enforced by the API. Flip to true if the client asks for the bars back.
const SHOW_PLAN_LIMIT_BARS = false;

// Plan-limit bar for one organisation resource (Pricing V2 §5: limits are organisation-wide).
export function OrgCapacityBar({ kind, refreshKey }: { kind: keyof typeof LABEL; refreshKey?: number }) {
  const [cap, setCap] = useState<Capacity | null>(null);
  useEffect(() => {
    api.get<{ capacity: Capacity | null }>("/provider-org/capacity").then((r) => setCap(r.capacity)).catch(() => setCap(null));
  }, [refreshKey]);
  if (!SHOW_PLAN_LIMIT_BARS || !cap) return null;
  const { used, max } = cap[kind];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{LABEL[kind]} · {cap.planLabel} plan</span>
        <span className="font-semibold text-slate-900">{used} of {max ?? "unlimited"}</span>
      </div>
      <p className="m-0 mt-2 text-xs text-slate-500">
        Limits apply across your whole organisation. Each person counts once, even on several Branches.
      </p>
    </div>
  );
}
