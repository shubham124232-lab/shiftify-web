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

// Plan-limit bar for one organisation resource (Pricing V2 §5: limits are organisation-wide).
export function OrgCapacityBar({ kind, refreshKey }: { kind: keyof typeof LABEL; refreshKey?: number }) {
  const [cap, setCap] = useState<Capacity | null>(null);
  useEffect(() => {
    api.get<{ capacity: Capacity | null }>("/provider-org/capacity").then((r) => setCap(r.capacity)).catch(() => setCap(null));
  }, [refreshKey]);
  if (!cap) return null;
  const { used, max } = cap[kind];
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{LABEL[kind]} · {cap.planLabel} plan</span>
        <span className="font-semibold text-slate-900">{used} of {max ?? "unlimited"}</span>
      </div>
      {max != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-amber-500" : "bg-brand-600"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="m-0 mt-2 text-xs text-slate-500">
        Limits apply across your whole organisation. Each person counts once, even on several Branches.
      </p>
    </div>
  );
}
