"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { activeProviderTab, providerAreaFor } from "@/lib/constants/provider-areas";
import { cn } from "@/lib/utils";

// Segmented tabs for the current Provider area (e.g. Staffing → My requests · Post a Shift · Offers & assignments).
// Placed inside `.pd-page-head`; CSS puts it on its own row under the title, description and actions.
// Renders nothing for other roles, or for areas with a single screen.
export function ProviderAreaTabs() {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  if (user?.activeRole !== "PROVIDER") return null;
  const area = providerAreaFor(pathname);
  if (!area || area.tabs.length < 2) return null;
  const active = activeProviderTab(area, pathname);
  return (
    <nav className="pd-area-tabs" aria-label={`${area.label} sections`}>
      {area.tabs.map((t) => (
        <Link key={t.href} href={t.href} className={cn(t.href === active && "active")} aria-current={t.href === active ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
