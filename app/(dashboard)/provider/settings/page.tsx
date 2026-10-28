"use client";

import Link from "next/link";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

// Provider "Account settings" (approved demo + doc P82): shortcuts into profile, billing, notifications, privacy and help.
const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "Profile & account", links: [
    { href: "/provider/organisation", label: "Organisation profile" },
    { href: "/documents", label: "Documents" },
    { href: "/subscription", label: "Membership & billing" },
  ] },
  { title: "Notifications & help", links: [
    { href: "/notifications", label: "Notifications" },
    { href: "/provider/saved-searches", label: "Saved searches & alerts" },
    { href: "/provider/help", label: "Help & Tickets" },
    { href: "/help-safety", label: "Safety concerns" },
  ] },
];

export default function ProviderSettingsPage() {
  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Account settings</h1>
            <p>Manage your account, preferences and support.</p>
          </div>
        </div>
        <div className="pd-grid2">
          {GROUPS.map((g) => (
            <section key={g.title} className="pd-panel">
              <div className="pd-panel-head"><h2>{g.title}</h2></div>
              <div className="pd-panel-body">
                <div className="pd-buttons">
                  {g.links.map((l) => <Link key={l.href} href={l.href} className="pd-btn">{l.label}</Link>)}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
