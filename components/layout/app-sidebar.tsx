"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ClipboardList, FilePlus, Search, Briefcase,
  Users, MessageSquare, UserCheck, BarChart2, Bell, User,
  ChevronLeft, ChevronRight, FileText, Calendar, Link2, Receipt, Menu, X,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

interface NavItem { href: string; label: string; icon: LucideIcon; }

function navForRole(role: UserRole): NavItem[] {
  const dash: NavItem = { href: ROLE_DASHBOARD_PATHS[role], label: "Dashboard", icon: LayoutDashboard };
  switch (role) {
    case "PARTICIPANT":
      return [
        dash,
        { href: "/jobs/my",      label: "My Requests",    icon: ClipboardList },
        { href: "/jobs/post",    label: "Post Request",   icon: FilePlus },
        { href: "/documents",    label: "Documents",      icon: FileText },
        { href: "/messages",     label: "Messages",       icon: MessageSquare },
      ];
    case "SUPPORT_WORKER":
      return [
        dash,
        { href: "/jobs",         label: "Browse Jobs",    icon: Search },
        { href: "/jobs/my",      label: "My Jobs",        icon: Briefcase },
        { href: "/invoices",     label: "Invoices",       icon: Receipt },
        { href: "/availability", label: "Availability",   icon: Calendar },
        { href: "/documents",    label: "Documents",      icon: FileText },
        { href: "/messages",     label: "Messages",       icon: MessageSquare },
      ];
    case "PROVIDER":
      return [
        dash,
        { href: "/jobs",         label: "Browse Jobs",    icon: Search },
        { href: "/jobs/my",      label: "Team Jobs",      icon: Briefcase },
        { href: "/invoices",     label: "Invoices",       icon: Receipt },
        { href: "/team",         label: "My Team",        icon: Users },
        { href: "/documents",    label: "Documents",      icon: FileText },
        { href: "/messages",     label: "Messages",       icon: MessageSquare },
      ];
    case "COORDINATOR":
      return [
        dash,
        { href: "/participants", label: "My Participants", icon: UserCheck },
        { href: "/jobs/my",      label: "Posted Requests", icon: ClipboardList },
        { href: "/jobs/post",    label: "Post Request",    icon: FilePlus },
        { href: "/invoices",     label: "Invoices",        icon: Receipt },
        { href: "/documents",    label: "Documents",       icon: FileText },
        { href: "/messages",     label: "Messages",        icon: MessageSquare },
      ];
    case "PLAN_MANAGER":
      return [
        dash,
        { href: "/connections",  label: "Connections",    icon: Link2 },
        { href: "/invoices",     label: "Invoices",       icon: Receipt },
        { href: "/jobs",         label: "Marketplace",    icon: BarChart2 },
        { href: "/documents",    label: "Documents",      icon: FileText },
        { href: "/messages",     label: "Messages",       icon: MessageSquare },
      ];
    default:
      return [dash];
  }
}

const COMMON_BOTTOM: NavItem[] = [
  { href: "/profile",       label: "My Profile",    icon: User },
  { href: "/subscription",  label: "Subscription",  icon: CreditCard },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!user) return null;

  const items = navForRole(user.activeRole);

  function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
    return (
      <li>
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          onClick={onClick}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  }

  function SidebarContents({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">S</span>
            {(!collapsed || mobile) && <span className="truncate text-base font-semibold tracking-tight text-slate-900">Shiftify</span>}
          </div>
          {mobile ? (
            <button type="button" onClick={() => setMobileOpen(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(c => !c)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
        <nav className="flex flex-1 flex-col justify-between overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {items.map(item => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
          </ul>
          <ul className="space-y-0.5 border-t border-slate-100 pt-2">
            {COMMON_BOTTOM.map(item => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
          </ul>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "md:hidden fixed top-0 left-0 z-50 flex flex-col h-full w-64 bg-white border-r border-slate-200 transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContents mobile />
      </aside>

      <aside className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 overflow-hidden",
        collapsed ? "w-16" : "w-56",
      )}>
        <SidebarContents />
      </aside>
    </>
  );
}
