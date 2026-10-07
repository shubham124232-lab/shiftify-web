"use client";

// Provider PR-V01–V04: minimum business verification checklist and the verification status
// (Draft · Pending · Business Verified · NDIS Registration Verified · Action Required · Restricted/Suspended)
// with what that status allows. Document verification stays an auto-approve submission gate (see project policy);
// "Action Required" is raised only for expired or rejected documents.

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Me {
  user: {
    status: string; emailVerified?: boolean;
    providerProfile?: {
      businessName?: string | null; abn?: string | null; ndisRegistered?: boolean; ndisProviderNumber?: string | null;
      businessAddress?: string | null; primaryContactPhone?: string | null; primaryContactEmail?: string | null;
      termsAccepted?: boolean; privacyPolicyAccepted?: boolean; platformRulesAccepted?: boolean;
    } | null;
  };
  phoneVerified?: boolean;
  marketplace: { missing: string[] } | null;
}
interface Doc { docType: string; status: string; expiryDate: string | null }

type Status = "DRAFT" | "PENDING" | "BUSINESS_VERIFIED" | "NDIS_VERIFIED" | "ACTION_REQUIRED" | "RESTRICTED";
const STATUS_INFO: Record<Status, { label: string; tone: string; allowed: string }> = {
  DRAFT: { label: "Draft", tone: "bg-slate-100 text-slate-700", allowed: "Build your profile, draft a request and preview opportunities." },
  PENDING: { label: "Pending", tone: "bg-amber-100 text-amber-800", allowed: "Your work is saved. Finish the remaining step to go live." },
  BUSINESS_VERIFIED: { label: "Business Verified", tone: "bg-emerald-100 text-emerald-800", allowed: "You can use eligible Provider Actions." },
  NDIS_VERIFIED: { label: "NDIS Registration Verified", tone: "bg-emerald-100 text-emerald-800", allowed: "You can access registration-eligible opportunities." },
  ACTION_REQUIRED: { label: "Action Required", tone: "bg-red-100 text-red-800", allowed: "A document needs correcting or renewing — correct it and resubmit." },
  RESTRICTED: { label: "Restricted / Suspended", tone: "bg-red-100 text-red-800", allowed: "You can manage existing obligations only. Contact Shiftify support to review." },
};

export function ProviderVerificationCard() {
  const [me, setMe] = useState<Me | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    api.get<Me>("/users/me").then(setMe).catch(() => setMe(null));
    api.get<{ documents: Doc[] }>("/documents").then((r) => setDocs(r.documents ?? [])).catch(() => setDocs([]));
  }, []);

  if (!me) return null;
  const p = me.user.providerProfile;
  const missing = me.marketplace?.missing ?? [];
  const now = Date.now();
  const badDocs = docs.filter((d) => d.status === "REJECTED" || d.status === "EXPIRED" || (d.expiryDate && new Date(d.expiryDate).getTime() < now));
  const insuranceDoc = docs.some((d) => d.docType === "PUBLIC_LIABILITY_INSURANCE");

  let status: Status = "DRAFT";
  const onlyPlanLeft = missing.length > 0 && missing.every((m) => /subscription|plan/i.test(m));
  if (me.user.status === "SUSPENDED") status = "RESTRICTED";
  else if (badDocs.length > 0) status = "ACTION_REQUIRED";
  else if (missing.length === 0) status = p?.ndisRegistered && p.ndisProviderNumber ? "NDIS_VERIFIED" : "BUSINESS_VERIFIED";
  else if (onlyPlanLeft) status = "PENDING";
  const info = STATUS_INFO[status];

  const checks: { label: string; ok: boolean }[] = [
    { label: "Administrator identity and authority (signup acknowledgement)", ok: !!p },
    { label: "Verified mobile", ok: !!me.phoneVerified },
    { label: "Verified email", ok: !!me.user.emailVerified },
    { label: "ABN and trading name", ok: !!p?.abn && !!p?.businessName },
    { label: "Business address and operating contact", ok: !!p?.businessAddress && !!(p?.primaryContactPhone || p?.primaryContactEmail) },
    { label: "Insurance for the intended activity", ok: insuranceDoc },
    { label: "Safety, privacy and platform conduct accepted", ok: !!(p?.termsAccepted && p?.privacyPolicyAccepted && p?.platformRulesAccepted) },
  ];
  if (p?.ndisRegistered) checks.push({ label: "NDIS registration number", ok: !!p.ndisProviderNumber });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Verification</CardTitle>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${info.tone}`}>{info.label}</span>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="m-0 text-slate-600">{info.allowed}</p>
        <ul className="m-0 list-none space-y-1 p-0">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-2"><span className={c.ok ? "text-emerald-600" : "text-slate-400"} aria-hidden>{c.ok ? "✓" : "○"}</span><span className={c.ok ? "text-slate-700" : "text-slate-500"}>{c.label}</span></li>
          ))}
        </ul>
        {missing.length > 0 && <p className="m-0 text-xs text-slate-500">Still needed to publish: {missing.join("; ")}.</p>}
        {!p?.ndisRegistered && <p className="m-0 text-xs text-slate-500">Unregistered Providers are Business Verified: plan-managed and self-managed work only. This is a normal, legitimate status.</p>}
        <div className="flex gap-3 pt-1 text-xs font-semibold">
          <Link href="/profile" className="underline">Complete business profile</Link>
          <Link href="/documents" className="underline">Documents</Link>
        </div>
      </CardContent>
    </Card>
  );
}
