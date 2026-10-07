"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bell, ChevronDown, LogOut, User, CheckCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import { getNotifications } from "@/lib/api/dashboard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { UserRole } from "@/lib/types";

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-800",
  ACTIVE:    "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-red-100 text-red-800",
  INACTIVE:  "bg-slate-100 text-slate-700",
};

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
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
  const { user, switchRole, logout } = useAuth();
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

  async function handleSwitch(role: UserRole) {
    await switchRole(role);
    router.replace(ROLE_DASHBOARD_PATHS[role]);
  }

  const hasMultipleRoles = user.roles.length > 1;
  // PR-MR01 — a Provider owner who also works personally can hold a Support Worker role on the same login.
  const canAddWorker = user.roles.includes(UserRole.PROVIDER) && !user.roles.includes(UserRole.SUPPORT_WORKER);
  async function addWorkerRole() {
    try {
      const res = await api.post<{ roles: UserRole[] }>("/auth/roles", { role: UserRole.SUPPORT_WORKER });
      useAuthStore.setState({ user: { ...user!, roles: res.roles } });
    } catch { /* already held or not allowed — the switcher simply stays as is */ }
  }
  const removableRole = user.activeRole === UserRole.PROVIDER && user.roles.includes(UserRole.SUPPORT_WORKER);
  async function removeWorkerRole() {
    if (!window.confirm("Remove the Support Worker role from this login? Your Provider access is not affected.")) return;
    try {
      const res = await api.del<{ roles: UserRole[] }>(`/auth/roles/${UserRole.SUPPORT_WORKER}`);
      useAuthStore.setState({ user: { ...user!, roles: res.roles } });
    } catch { /* not allowed right now */ }
  }
  const identityLine = (role: UserRole) =>
    role === UserRole.PROVIDER ? "Acting as your Provider organisation — requests and responses show your organisation."
    : role === UserRole.SUPPORT_WORKER ? "Acting as an individual Support Worker — Provider workforce tools are not available."
    : `Acting as ${ROLE_LABELS[role]}.`;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left: active role + status */}
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLE_COLORS[user.activeRole])}>
          {ROLE_LABELS[user.activeRole]}
        </span>
        {user.status && user.status !== "ACTIVE" && (
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE[user.status] ?? "bg-slate-100 text-slate-700")}>
            {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
          </span>
        )}
      </div>

      {/* Right: bell + messages + account menu */}
      <div className="flex items-center gap-2">
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
          Messages
        </Link>

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initials(displayName)}
            </span>
            <span className="max-w-[120px] truncate font-medium">{displayName}</span>
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

              {/* Role switcher */}
              {hasMultipleRoles && (
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Switch role</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => void handleSwitch(role)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          role === user.activeRole
                            ? cn(ROLE_COLORS[role], "ring-1 ring-current ring-offset-1")
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        )}
                      >
                        {role === user.activeRole && <CheckCircle className="h-3 w-3" />}
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">{identityLine(user.activeRole)}</p>
                </div>
              )}
              {removableRole && (
                <div className="border-b border-slate-100 px-4 py-3">
                  <button type="button" onClick={() => void removeWorkerRole()} className="text-xs font-medium text-slate-500 hover:underline">
                    Remove my Support Worker role
                  </button>
                </div>
              )}
              {canAddWorker && (
                <div className="border-b border-slate-100 px-4 py-3">
                  <button type="button" onClick={() => void addWorkerRole()} className="text-xs font-medium text-brand-700 hover:underline">
                    I also work personally — add a Support Worker role
                  </button>
                </div>
              )}

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
