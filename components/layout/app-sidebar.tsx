"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus,
  Search,
  Briefcase,
  Users,
  MessageSquare,
  UserCheck,
  BarChart2,
  Shield,
  FileCheck,
  FileText,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils/cn";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types/user";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function navForRole(role: UserRole): NavItem[] {
  const dash: NavItem = {
    href: ROLE_DASHBOARD_PATHS[role],
    label: "Dashboard",
    icon: LayoutDashboard,
  };
  switch (role) {
    case "PARTICIPANT":
      return [
        dash,
        { href: "/jobs/my",   label: "My Requests",  icon: ClipboardList },
        { href: "/jobs/post", label: "Post Request",  icon: FilePlus },
        { href: "/messages",  label: "Messages",      icon: MessageSquare },
      ];
    case "SUPPORT_WORKER":
      return [
        dash,
        { href: "/jobs",     label: "Browse Jobs", icon: Search },
        { href: "/jobs/my",  label: "My Jobs",     icon: Briefcase },
        { href: "/messages", label: "Messages",    icon: MessageSquare },
      ];
    case "PROVIDER":
      return [
        dash,
        { href: "/jobs",     label: "Browse Jobs", icon: Search },
        { href: "/jobs/my",  label: "Team Jobs",   icon: Briefcase },
        { href: "/team",     label: "My Team",     icon: Users },
        { href: "/messages", label: "Messages",    icon: MessageSquare },
      ];
    case "COORDINATOR":
      return [
        dash,
        { href: "/participants", label: "My Participants", icon: UserCheck },
        { href: "/jobs/my",      label: "Posted Requests", icon: ClipboardList },
        { href: "/jobs/post",    label: "Post Request",    icon: FilePlus },
        { href: "/messages",     label: "Messages",        icon: MessageSquare },
      ];
    case "PLAN_MANAGER":
      return [
        dash,
        { href: "/jobs",     label: "Marketplace", icon: BarChart2 },
        { href: "/messages", label: "Messages",    icon: MessageSquare },
      ];
    case "ADMIN":
      return [
        { href: "/admin",              label: "Admin Home",          icon: Shield },
        { href: "/admin/verification", label: "Verification Queue",  icon: FileCheck },
        { href: "/admin/users",        label: "All Users",           icon: Users },
        { href: "/admin/audit",        label: "Audit Log",           icon: FileText },
      ];
  }
}

const COMMON_BOTTOM: NavItem[] = [
  { href: "/profile",       label: "My Profile",    icon: User },
  { href: "/documents",     label: "Documents",     icon: FileText },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const SIDEBAR_KEY = "shiftify_sidebar_collapsed";

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  if (!user) return null;

  const items = navForRole(user.activeRole);
  const bottom = user.activeRole === "ADMIN" ? [] : COMMON_BOTTOM;

  function NavLink({ item }: { item: NavItem }) {
    const Icon = item.icon;
    const isActive =
      pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
    return (
      <li>
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-brand-600 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive
                ? "text-white"
                : "text-slate-400 group-hover:text-slate-600",
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 overflow-hidden",
        collapsed ? "w-[60px]" : "w-60",
      )}
    >
      {/* Logo row */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            S
          </span>
          {!collapsed && (
            <span className="truncate text-base font-semibold tracking-tight text-slate-900">
              Shiftify
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col justify-between overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </ul>

        {bottom.length > 0 && (
          <ul className="space-y-0.5 border-t border-slate-100 pt-2">
            {bottom.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
