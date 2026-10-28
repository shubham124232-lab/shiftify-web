"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bell, ChevronDown, LogOut, User, MessageSquare, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import { getNotifications } from "@/lib/api/dashboard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { UserRole } from "@/lib/types";
import { BranchWorkspaceSelect } from "@/components/provider/BranchWorkspaceSelect";
import { ProviderIdentity } from "@/components/provider/ProviderIdentity";
import { CoordinatorIdentity } from "@/components/coordinator/CoordinatorIdentity";

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-800",
  ACTIVE:    "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-red-100 text-red-800",
  INACTIVE:  "bg-slate-100 text-slate-700",
};

// Provider profile menu (approved demo): organisation profile, documents, billing, settings and tickets.
const PROVIDER_MENU = [
  { href: "/provider/organisation", label: "My profile" },
  { href: "/documents", label: "Documents" },
  { href: "/subscription", label: "Membership & billing" },
  { href: "/provider/settings", label: "Settings" },
  { href: "/provider/help", label: "Help & Tickets" },
];

const COORDINATOR_MENU = [
  { href: "/profile", label: "My profile" },
  { href: "/documents", label: "Documents" },
  { href: "/subscription", label: "Membership and billing" },
  { href: "/settings", label: "Settings" },
  { href: "/help-safety", label: "Help and Tickets" },
];

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// Workspace profile menu: avatar opens a plain card of links, as in the SC and Provider workspaces.
function WorkspaceProfileMenu({ name, title, subtitle, items, onSignOut }: {
  name: string; title: string; subtitle: string; items: { href: string; label: string }[]; onSignOut: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false; };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <details ref={ref} className="sc-profile">
      <summary aria-label="Open profile menu">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fde8f0] text-sm font-bold text-[#c91355]">{initials(name)}</span>
        <span className="text-base leading-none text-slate-700">⌄</span>
      </summary>
      <div className="sc-profile-menu">
        <strong>{title}</strong>
        <small>{subtitle}</small>
        {items.map((m) => <Link key={m.href} href={m.href}>{m.label}</Link>)}
        <button type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </details>
  );
}

const ROLE_COLORS: Record<string, string> = {
  PARTICIPANT:    "bg-sky-100 text-sky-800",
  SUPPORT_WORKER: "bg-violet-100 text-violet-800",
  PROVIDER:       "bg-orange-100 text-orange-800",
  COORDINATOR:    "bg-teal-100 text-teal-800",
  PLAN_MANAGER:   "bg-indigo-100 text-indigo-800",
  ADMIN:          "bg-rose-100 text-rose-800",
};

export function AppTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;
    getNotifications()
      .then(r => setHasUnread((r.notifications ?? []).some(n => !n.read)))
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const displayName = user.name || (user as any).email || (user as any).username || "User";

  function handleLogout() {
    // logout() clears state synchronously before the first await,
    // so the store and cookie are already clean by the time we navigate.
    logout();
    // window.location bypasses Next.js's prefetch cache — avoids the stale
    // middleware redirect (cookie=true → /dashboard) firing after sign-out.
    window.location.replace('/login');
  }

  const identityLine = (role: UserRole) =>
    role === UserRole.PROVIDER ? "Acting as your Provider organisation — requests and responses show your organisation."
    : `Acting as ${ROLE_LABELS[role]}.`;

  const isProviderUser = user.activeRole === UserRole.PROVIDER;
  const isCoordinatorUser = user.activeRole === UserRole.COORDINATOR;
  // Provider / Coordinator workspace header: full-width, 88px, logo + identity on the left, bell / messages / profile on the right.
  if (isProviderUser || isCoordinatorUser) {
    return (
      <header className="z-20 flex h-[88px] shrink-0 items-center gap-2 border-b border-[#e4e6ed] bg-white px-3 py-3 sm:gap-6 sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Shiftify" className="h-16 w-24 shrink-0 object-contain sm:w-32" />
        <span className="hidden sm:contents">{isCoordinatorUser ? <CoordinatorIdentity /> : <ProviderIdentity />}</span>
        <div className="flex-1" />
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isProviderUser && <BranchWorkspaceSelect />}
          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className="relative grid h-11 w-8 place-items-center rounded-lg border border-[#e4e6ed] bg-white text-[#525766] hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {hasUnread && <span className="absolute right-[7px] top-[5px] h-1.5 w-1.5 rounded-full bg-[#c91355]" />}
          </button>
          <Link
            href="/messages"
            className="grid h-11 w-8 place-items-center rounded-lg border border-[#e4e6ed] bg-white text-[#525766] hover:bg-slate-50"
            aria-label="Messages"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </Link>
          {isCoordinatorUser ? (
            <WorkspaceProfileMenu name={displayName} title={displayName} subtitle="Support Coordinator" items={COORDINATOR_MENU} onSignOut={handleLogout} />
          ) : (
            <WorkspaceProfileMenu name={displayName} title={displayName} subtitle="Provider account" items={PROVIDER_MENU} onSignOut={handleLogout} />
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left: active role + status */}
      <div className="flex items-center gap-2">
        {isProviderUser ? <ProviderIdentity /> : (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLE_COLORS[user.activeRole])}>
            {ROLE_LABELS[user.activeRole]}
          </span>
        )}
        {user.status && user.status !== "ACTIVE" && (
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE[user.status] ?? "bg-slate-100 text-slate-700")}>
            {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
          </span>
        )}
      </div>

      {/* Right: bell + messages + account menu */}
      <div className="flex items-center gap-2">
        {isProviderUser && <BranchWorkspaceSelect />}
        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />
          )}
        </button>

        <Link
          href="/messages"
          className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:flex"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
          {isProviderUser ? <span className="sr-only">Messages</span> : "Messages"}
        </Link>

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initials(displayName)}
            </span>
            <span className={cn("max-w-[120px] truncate font-medium", isProviderUser && "hidden")}>{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </MenuButton>

            <MenuItems
            transition
            className="absolute right-0 mt-1 w-72 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none transition ease-out duration-100 data-[closed]:scale-95 data-[closed]:opacity-0 data-[closed]:transform"
          >
              {/* Identity block */}
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {initials(displayName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email ?? user.username ?? user.phone ?? "—"}
                    </p>
                  </div>
                  <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_BADGE[user.status ?? ""] ?? "bg-slate-100 text-slate-700")}>
                    {user.status ? user.status.charAt(0) + user.status.slice(1).toLowerCase() : "—"}
                  </span>
                </div>
              </div>

              {/* One account = one role: no switcher; the menu just states who the session acts as. */}
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="m-0 text-[11px] text-slate-500">{identityLine(user.activeRole)}</p>
              </div>

              <MenuItem>
                {({ focus }: { focus: boolean }) => (
                  <Link href="/profile" className={cn("flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700", focus && "bg-slate-50")}>
                    <User className="h-4 w-4 text-slate-400" />
                    My Profile
                  </Link>
                )}
              </MenuItem>


              <MenuItem>
                {({ focus }: { focus: boolean }) => (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className={cn("flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700", focus && "bg-slate-50")}
                  >
                    <LogOut className="h-4 w-4 text-slate-400" />
                    Sign out
                  </button>
                )}
              </MenuItem>
            </MenuItems>
        </Menu>
      </div>
    </header>
    );
}
