"use client";

import Link from "next/link";

// Provider "Account settings" (approved demo + doc P82): shortcuts into profile, billing, notifications, privacy and help.
const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "Profile & account", links: [
    { href: "/provider/organisation", label: "Organisation profile" },
    { href: "/documents", label: "Documents" },
    { href: "/subscription", label: "Membership & billing" },
    { href: "/blocked-users", label: "Blocked users" },
  ] },
  { title: "Notifications & help", links: [
    { href: "/notifications", label: "Notifications" },
    { href: "/provider/saved-searches", label: "Saved searches & alerts" },
    { href: "/provider/help", label: "Help & Tickets" },
    { href: "/help-safety", label: "Safety concerns" },
  ] },
  { title: "Policies", links: [
    { href: "/terms", label: "Terms of use" },
    { href: "/privacy", label: "Privacy policy" },
  ] },
];

export default function ProviderSettingsPage() {
  return (
    <div className="space-y-5 px-8 py-6">
      <div>
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Account settings</h1>
        <p className="m-0 mt-1.5 text-[15px] text-slate-500">Manage your account, preferences and support.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} className="rounded-2xl border border-slate-200 bg-white">
            <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">{g.title}</h2>
            <div className="flex flex-wrap gap-3 px-6 py-5">
              {g.links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-50">{l.label}</Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
