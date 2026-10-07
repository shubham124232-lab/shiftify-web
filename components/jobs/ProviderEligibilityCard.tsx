"use client";

// Provider PR-OA03 "Eligibility check" — shown on an opportunity before the Provider responds.
// Business verification, registration scope, plan entitlement, internal capability, consent/data.

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Check { label: string; ok: boolean; detail: React.ReactNode }

export function ProviderEligibilityCard({ fundingType, onEligibility }: { fundingType?: string | null; onEligibility?: (eligible: boolean) => void }) {
  const [checks, setChecks] = useState<Check[] | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ user: { providerProfile?: { ndisRegistered?: boolean } | null }; marketplace: { missing: string[] } | null }>("/users/me"),
      api.get<{ allowance: { applies: boolean; remaining: number; limit: number } }>("/subscriptions/me/allowance").catch(() => null),
      api.get<{ capacity: { planLabel: string } | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
      api.get<{ users: { status?: string }[] }>("/linking/workers").catch(() => ({ users: [] })),
    ]).then(([me, allowance, cap, workers]) => {
      const missing = me.marketplace?.missing ?? [];
      const registered = !!me.user?.providerProfile?.ndisRegistered;
      const ndiaOutOfScope = fundingType === "NDIA_MANAGED" && !registered;
      const internal = (workers.users ?? []).filter((u) => !u.status || u.status === "ACTIVE").length;
      const list: Check[] = [
        {
          label: "Business verification", ok: missing.length === 0,
          detail: missing.length === 0 ? "Minimum business checks complete." : (
            <>Complete before responding: {missing.join("; ")}. <Link href="/documents" className="underline">Open Documents</Link></>
          ),
        },
        {
          label: "Registration scope", ok: !ndiaOutOfScope,
          detail: ndiaOutOfScope
            ? "This request is NDIA-managed. Unregistered Providers are limited to plan-managed and self-managed work."
            : registered ? "NDIS Registered Provider — responses are limited to your verified registration scope." : "Business Verified (unregistered) — plan-managed and self-managed work only.",
        },
        {
          label: "Plan entitlement", ok: true,
          detail: cap.capacity ? `Included in your Provider ${cap.capacity.planLabel} plan.`
            : allowance?.allowance?.applies
              ? (allowance.allowance.remaining > 0
                ? `Responding uses one of your once-only Provider Actions (${allowance.allowance.remaining} of ${allowance.allowance.limit} remaining).`
                : "Your once-only Provider Actions are used up — choose a subscription or a Shift Pass to respond.")
              : "No Provider Action needed for this response.",
        },
        {
          label: "Internal capability", ok: true,
          detail: internal > 0 ? `${internal} internal worker${internal === 1 ? "" : "s"} available to nominate.` : "No internal workers yet — you can respond as the organisation and nominate later.",
        },
        { label: "Consent and data", ok: true, detail: "The participant's address and private contact details are released only after the permitted connection stage." },
      ];
      setChecks(list);
      onEligibility?.(list.every((c) => c.ok));
    }).catch(() => setChecks(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundingType]);

  if (!checks) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Eligibility check</CardTitle></CardHeader>
      <CardContent>
        <ul className="m-0 p-0 list-none space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-3 text-sm">
              <span className={c.ok ? "text-emerald-600" : "text-red-600"} aria-hidden>{c.ok ? "✓" : "✕"}</span>
              <span><span className="font-semibold text-slate-800">{c.label}.</span> <span className="text-slate-600">{c.detail}</span></span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
