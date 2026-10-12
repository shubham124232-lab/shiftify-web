"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, LifeBuoy, ShieldAlert, FileText, Ban, Bell, CreditCard, UserCog } from "lucide-react";

interface Row { href: string; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; external?: boolean }

const ACCOUNT: Row[] = [
  { href: "/profile", label: "Provider profile", hint: "Business details, services and the information participants see", icon: UserCog },
  { href: "/notifications", label: "Notification preferences", hint: "Channels by urgency, quiet hours, location and service filters", icon: Bell },
  { href: "/subscription", label: "Subscription & Billing", hint: "Your plan, limits and billing", icon: CreditCard },
  { href: "/blocked-users", label: "Blocked users", hint: "People you have blocked from contacting you", icon: Ban },
];

const HELP: Row[] = [
  { href: "/help-safety", label: "Help & Safety", hint: "Emergency guidance, reporting a concern and safety tips", icon: ShieldAlert },
  { href: "mailto:support@shiftify.com.au", label: "Contact support", hint: "support@shiftify.com.au", icon: LifeBuoy, external: true },
  { href: "/terms", label: "Terms of use", hint: "How Shiftify works and what we do not do", icon: FileText },
  { href: "/privacy", label: "Privacy policy", hint: "How your information is handled", icon: FileText },
];

function List({ rows }: { rows: Row[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-slate-100 p-0">
      {rows.map((r) => {
        const Icon = r.icon;
        const body = (
          <div className="flex items-center gap-3 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-semibold text-slate-900">{r.label}</p>
              <p className="m-0 mt-0.5 text-xs text-slate-500">{r.hint}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </div>
        );
        return (
          <li key={r.href}>
            {r.external
              ? <a href={r.href} className="block no-underline hover:bg-slate-50/60">{body}</a>
              : <Link href={r.href} className="block no-underline hover:bg-slate-50/60">{body}</Link>}
          </li>
        );
      })}
    </ul>
  );
}

export default function ProviderSettingsPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Settings & Help" description="Manage your account and preferences, and get help." />
      <div className="container-page max-w-3xl space-y-6 py-8">
        <Card>
          <CardHeader><CardTitle>Your account</CardTitle></CardHeader>
          <CardContent className="py-3">
            <p className="m-0 text-sm font-semibold text-slate-900">{user?.name ?? "—"}</p>
            <p className="m-0 mt-0.5 text-sm text-slate-500">{user?.email ?? ""}</p>
            <p className="m-0 mt-0.5 text-xs text-slate-400">Provider Owner</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="py-0"><List rows={ACCOUNT} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Support and safety</CardTitle></CardHeader>
          <CardContent className="py-0"><List rows={HELP} /></CardContent>
        </Card>
      </div>
    </>
  );
}
