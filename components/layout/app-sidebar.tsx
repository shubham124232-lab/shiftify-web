"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ClipboardList, FilePlus, Search, Briefcase,
  Users, MessageSquare, UserCheck, BarChart2, Bell, User,
  ChevronLeft, ChevronRight, FileText, Calendar, Link2, Receipt, Menu, X,
  CreditCard, Building2, Home, Star, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

interface NavItem { href: string; label: string; icon: LucideIcon; }

function navForRole(role: string): NavItem[] {
  const dashHref = ROLE_DASHBOARD_PATHS[role as UserRole] ?? "/admin";
  const dash: NavItem = { href: dashHref, label: "Dashboard", icon: LayoutDashboard };
  switch (role) {
    case "PARTICIPANT":
      return [
        dash,
        { href: "/jobs/my",      label: "My Requests",    icon: ClipboardList },
        { href: "/jobs/post",    label: "Post Request",   icon: FilePlus },
        { href: "/live-dashboard", label: "Live Dashboard", icon: Search },
        { href: "/workers/available", label: "Browse Workers", icon: Search },
        { href: "/coordinators/available", label: "Browse Coordinators", icon: UserCheck },
        { href: "/coordinator-connections", label: "Coordinator Connections", icon: Link2 },
        { href: "/saved-professionals", label: "Saved",       icon: Star },
        { href: "/documents",    label: "Documents",      icon: FileText },
        { href: "/messages",     label: "Messages",       icon: MessageSquare },
      ];
    case "SUPPORT_WORKER":
      return [
        dash,
        { href: "/live-dashboard", label: "Live Dashboard", icon: Search },
        { href: "/jobs/my",      label: "My Jobs",        icon: Briefcase },
        { href: "/my-support",   label: "My Support",     icon: Calendar },
        { href: "/connections/my", label: "My Connections", icon: Link2 },
        { href: "/invoices",     label: "Invoices",       icon: Receipt },
        { href: "/availability", label: "Availability",   icon: Calendar },
        { href: "/connect-invites", label: "Direct Connect", icon: Link2 },
        { href: "/job-invites",  label: "Job Invitations", icon: Bell },
        { href: "/documents",    label: "Documents",      icon: FileText },
        { href: "/messages",     label: "Messages",       icon: MessageSquare },
        { href: "/help-safety",  label: "Help & Safety",  icon: ShieldCheck },
      ];
    case "PROVIDER":
      return [
        dash,
        { href: "/live-dashboard",            label: "Live Dashboard",       icon: Search },
        { href: "/provider/listings",         label: "My Listings",          icon: ClipboardList },
        { href: "/provider/post-service",     label: "Post Service",         icon: FilePlus },
        { href: "/provider/sil-vacancy",      label: "SIL / SDA Vacancy",   icon: Home },
        { href: "/workers/available",         label: "Browse Workers",       icon: UserCheck },
        { href: "/jobs/my",                   label: "Enquiries",            icon: Briefcase },
        { href: "/team",                      label: "My Team",              icon: Users },
        { href: "/provider/organisation",     label: "Organisation",         icon: Building2 },
        { href: "/job-invites",               label: "Job Invitations",      icon: Bell },
        { href: "/invoices",                  label: "Invoices",             icon: Receipt },
        { href: "/documents",                 label: "Documents",            icon: FileText },
        { href: "/messages",                  label: "Messages",             icon: MessageSquare },
      ];
    case "COORDINATOR":
      return [
        dash,
        { href: "/participants",         label: "Participant Cases",  icon: UserCheck },
        { href: "/coordinator-connections", label: "Connections",     icon: Link2 },
        { href: "/jobs/my",              label: "My Requests",        icon: ClipboardList },
        { href: "/jobs/post",            label: "Post Request",       icon: FilePlus },
        { href: "/jobs?urgent=1",        label: "Urgent Requests",    icon: BarChart2 },
        { href: "/live-dashboard",       label: "Live Dashboard",     icon: Search },
        { href: "/find",                 label: "Find Directly",      icon: Search },
        { href: "/workers/available",    label: "Browse Workers",     icon: Search },
        { href: "/saved-professionals",  label: "Saved",              icon: Star },
        { href: "/invoices",             label: "Invoices",           icon: Receipt },
        { href: "/documents",            label: "Documents",          icon: FileText },
        { href: "/messages",             label: "Messages",           icon: MessageSquare },
        { href: "/help-safety",          label: "Help & Safety",      icon: ShieldCheck },
      ];
    case "PLAN_MANAGER":
      return [
        dash,
        { href: "/load-board",   label: "Load Board",     icon: Search },
        { href: "/live-dashboard", label: "Live Dashboard", icon: Search },
        { href: "/referrals",    label: "My Referrals",   icon: ClipboardList },
        { href: "/connections",  label: "Connections",    icon: Link2 },
        { href: "/workers/available", label: "Browse Workers", icon: Search },
        { href: "/saved-professionals", label: "Saved",   icon: Star },
        { href: "/invoices",     label: "Invoices",       icon: Receipt },
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

  const items = navForRole(user.activeRole as string);

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
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
            isActive
              ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/25"
              : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <Icon className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600",
          )} />
          {!collapsed && <span className="truncate tracking-tight">{item.label}</span>}
        </Link>
      </li>
    );
  }

  function SidebarContents({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm shadow-brand-600/30">
              S
            </span>
            {(!collapsed || mobile) && (
              <span className="truncate text-xl font-extrabold tracking-tight text-slate-900">
                Shift<span className="text-brand-600">ify</span>
              </span>
            )}
          </div>
          {mobile ? (
            <button type="button" onClick={() => setMobileOpen(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(c => !c)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        <nav className="flex flex-1 flex-col justify-between overflow-y-auto p-3">
          <div>
            {(!collapsed || mobile) && (
              <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
            )}
            <ul className="space-y-1">
              {items.map(item => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
            </ul>
          </div>
          <div className="border-t border-slate-100 pt-3">
            {(!collapsed || mobile) && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account</p>
            )}
            <ul className="space-y-1">
              {COMMON_BOTTOM.map(item => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
            </ul>
          </div>
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
        "hidden md:flex flex-col shrink-0 border-r border-slate-200 bg-white shadow-[4px_0_24px_-12px_rgba(20,24,28,0.12)] transition-[width] duration-200 overflow-hidden",
        collapsed ? "w-16" : "w-56",
      )}>
        <SidebarContents />
      </aside>
    </>
  );
}
