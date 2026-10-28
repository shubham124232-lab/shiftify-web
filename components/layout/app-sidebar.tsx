"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ClipboardList, FilePlus, Search, Briefcase,
  Users, MessageSquare, UserCheck, BarChart2, Bell, User,
  ChevronLeft, ChevronRight, FileText, Calendar, Link2, Receipt, Menu, X,
  CreditCard, Building2, Home, Star, ShieldCheck, Inbox,
  Radio, CalendarDays, Handshake, Bookmark, Target, CheckCircle2, GitBranch,
  Layers, Settings, Megaphone, BarChart3, UserCog, FolderOpen, Zap, Plus, Clock, Heart, LifeBuoy, Gift,
  LayoutGrid, MessageCircle, MapPin, Check, Sun,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboard, type ProviderDashboard } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

type NavBadge = "openRequests" | "newEnquiries";

interface NavItem { href: string; label: string; icon: LucideIcon; badge?: NavBadge; glyph?: string; }

interface NavGroup { title: string; items: NavItem[]; }

// `groups` (when present) is rendered with headings instead of the flat main/account lists.
interface RoleNav { main: NavItem[]; account: NavItem[]; groups?: NavGroup[]; }

const NOTIFICATIONS: NavItem = { href: "/notifications", label: "Notifications", icon: Bell };

// Role-specific navigation. Each role's menu follows its own latest journey document:
//   Support Worker      → SW v3.0 (31 Jul)       — "Navigation" table
//   Support Coordinator → SC Revised (31 Jul)    — "Recommended dashboard navigation"
//   Provider            → Provider journey PR-D04 (13 Aug)
//   Participant         → unchanged (no documented menu to follow)
// Pages that exist today but are not in a role's documented menu are kept after the
// documented items, unchanged — what to do with them is an open product decision.
function navForRole(role: string, managed = false): RoleNav {
  const dashHref = ROLE_DASHBOARD_PATHS[role as UserRole] ?? "/admin";
  const dash: NavItem = { href: dashHref, label: "Dashboard", icon: LayoutDashboard };
  const defaultAccount: NavItem[] = [
    { href: "/profile",       label: "My Profile",    icon: User },
    { href: "/subscription",  label: "Subscription",  icon: CreditCard },
    NOTIFICATIONS,
  ];
  switch (role) {
    case "PARTICIPANT":
      return {
        main: [
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
        ],
        account: defaultAccount,
      };
    case "SUPPORT_WORKER":
      // Pricing V2 §4.4 — a Provider-managed Team Member sees only personal offers,
      // assignments, calendar and assignment messages: no Live Shift Board, billing or Provider tools.
      if (managed) {
        return {
          main: [
            dash,
            { href: "/job-invites",  label: "Invitations",      icon: Bell },
            { href: "/my-support",   label: "My Support",       icon: Briefcase },
            { href: "/availability", label: "Availability",     icon: Calendar },
            { href: "/messages",     label: "Messages",         icon: MessageSquare },
            { href: "/help-safety",  label: "Help & Safety",    icon: ShieldCheck },
          ],
          account: [NOTIFICATIONS],
        };
      }
      return {
        main: [
          dash,
          // SW Journey §4 navigation — exactly these ten items. Live Dashboard, My Jobs and Invoices
          // are reached from the dashboard quick actions instead of the menu.
          { href: "/jobs",            label: "Find Work",           icon: Search },
          { href: "/job-invites",     label: "Invitations",         icon: Bell },
          { href: "/connections/my",  label: "My Connections",      icon: Link2 },
          { href: "/availability",    label: "Availability",        icon: Calendar },
          { href: "/my-support",      label: "My Support",          icon: Briefcase },
          { href: "/messages",        label: "Messages",            icon: MessageSquare },
          { href: "/profile",         label: "Profile & Documents", icon: User },
          { href: "/subscription",    label: "Membership",          icon: CreditCard },
          { href: "/help-safety",     label: "Help & Safety",       icon: ShieldCheck },
        ],
        account: [NOTIFICATIONS],
      };
    case "PROVIDER": {
      // Approved Provider demo (2026-10-09): 6 groups.
      const groups: NavGroup[] = [
        { title: "Workspace", items: [
          { ...dash, label: "My Dashboard", icon: LayoutGrid },
          { href: "/live-dashboard", label: "Live Shiftboard", icon: Zap },
        ] },
        { title: "Staffing", items: [
          { href: "/jobs/post",                    label: "Post a Shift",           icon: Plus },
          { href: "/jobs/my",                      label: "Staffing Requests",      icon: Briefcase, badge: "openRequests" },
          { href: "/provider/team-availability",       label: "Team Availability",      icon: Clock },
          { href: "/provider/offers-assignments",  label: "Offers and Assignments", icon: Calendar },
          { href: "/workers/available",            label: "Find External Workers",  icon: Search },
          { href: "/saved-professionals",          label: "Saved Workers",          icon: Heart },
        ] },
        { title: "Opportunities", items: [
          { href: "/jobs",                          label: "Browse Requests",          icon: Search },
          { href: "/provider/matched-requests",         label: "Matched Requests",         icon: Zap },
          { href: "/provider/saved-requests",           label: "Saved Requests",           icon: Heart },
          { href: "/provider/my-responses",             label: "My Responses",             icon: FileText },
          { href: "/provider/confirmed-starts", label: "Confirmed Service Starts", icon: Check },
        ] },
        { title: "Business", items: [
          { href: "/provider/services",                 label: "Services & Capacity",      icon: Briefcase },
          { href: "/provider/housing",                  label: "Housing Vacancies",        icon: Home },
          { href: "/provider/enquiries",   label: "Enquiries & Applications", icon: MessageCircle, badge: "newEnquiries" },
          { href: "/messages",                          label: "Messages",                 icon: MessageCircle },
          { href: "/provider/calendar",                  label: "Calendar",                 icon: Calendar },
        ] },
        { title: "Organisation", items: [
          { href: "/provider/organisation", label: "Organisation Profile",   icon: Building2 },
          { href: "/provider/branches",     label: "Branches",               icon: MapPin },
          { href: "/provider/service-lines",    label: "Service Lines",          icon: LayoutGrid },
          { href: "/provider/administrators", label: "Administrators",       icon: ShieldCheck },
          { href: "/provider/workforce",    label: "Internal Team",          icon: Users },
          { href: "/documents",             label: "Documents & Compliance", icon: FileText },
          { href: "/provider/reports",          label: "Reports",                icon: BarChart3 },
        ] },
        { title: "Account", items: [
          { href: "/subscription",          label: "Subscription & Billing", icon: CreditCard },
          { href: "/provider/promotions",       label: "Promotions",             icon: Star },
          NOTIFICATIONS,
          { href: "/provider/settings", label: "Settings & Help",       icon: Sun },
        ] },
        { title: "Help", items: [
          { href: "/provider/help", label: "Help & Tickets", icon: LifeBuoy, glyph: "⊕" },
          { href: "/provider/saved-searches", label: "Saved searches & alerts", icon: Star, glyph: "☆" },
          { href: "/provider/refer-and-earn", label: "Refer & Earn", icon: Gift, glyph: "↗" },
        ] },
      ];
      return { main: groups.flatMap((g) => g.items), account: [], groups };
    }
    case "COORDINATOR":
      // Support Coordinator workspace (approved SC demo): flat menu, then account pages.
      return {
        main: [
          dash,
          { href: "/live-dashboard",       label: "Live Shiftboard ↗",         icon: Radio },
          { href: "/participants",         label: "Participants",              icon: Users },
          { href: "/jobs/my",              label: "Requests & Responses",      icon: ClipboardList },
          { href: "/find",                 label: "Find Support",              icon: Search },
          { href: "/upcoming-support",     label: "Confirmed Support",         icon: ShieldCheck },
          { href: "/calendar",             label: "Calendar",                  icon: Calendar },
          { href: "/messages",             label: "Messages",                  icon: MessageSquare },
          { href: "/refer-and-earn",       label: "Refer & Earn",              icon: Gift },
        ],
        // "Account & tools" — a collapsible text-only group. Saved Workers & Providers lives under Find Support's tabs.
        account: [
          { href: "/profile",              label: "Profile & enquiries",       icon: User },
          { href: "/organisation-team",    label: "Organisation & team",       icon: Building2 },
          // Required documents are a submission gate for Coordinators, so Documents stays reachable.
          { href: "/documents",            label: "Documents",                 icon: FileText },
          { href: "/reports",              label: "Reports",                   icon: BarChart3 },
          { href: "/subscription",         label: "Subscription & billing",    icon: CreditCard },
          { href: "/add-ons",              label: "Add-ons",                   icon: Layers },
          { href: "/shift-blast",          label: "Shift Blast SMS",           icon: Megaphone },
          { href: "/action-history",       label: "Free action history",       icon: Clock },
          NOTIFICATIONS,
          { href: "/help-safety",          label: "Help & tickets",            icon: LifeBuoy },
          { href: "/settings",             label: "Settings",                  icon: Settings },
        ],
      };
    case "PLAN_MANAGER":
      return {
        main: [
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
        ],
        account: defaultAccount,
      };
    default:
      return { main: [dash], account: defaultAccount };
  }
}

const SIDEBAR_KEY = "shiftify_sidebar_collapsed";

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const [collapsedPref, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsedPref));
  }, [collapsedPref]);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // The job page reports whether the open request is the viewer's own (see jobs/[id]/page.tsx).
  const [ownJob, setOwnJob] = useState<{ id: string; owner: boolean } | null>(null);
  useEffect(() => {
    const h = (e: Event) => setOwnJob((e as CustomEvent<{ id: string; owner: boolean }>).detail);
    window.addEventListener("shiftify:job-owner", h);
    return () => window.removeEventListener("shiftify:job-owner", h);
  }, []);

  // Count badges on the Provider menu (open requests, new enquiries) come from the dashboard summary.
  const [badges, setBadges] = useState<Partial<Record<NavBadge, number>>>({});
  const isProvider = user?.activeRole === "PROVIDER";
  const isCoordinator = user?.activeRole === "COORDINATOR";
  // Provider and Coordinator workspaces share the flat demo menu style.
  const isWorkspace = isProvider || isCoordinator;
  // The workspace menus are always expanded (demo shell has no collapse control).
  const collapsed = isWorkspace ? false : collapsedPref;
  useEffect(() => {
    if (!isProvider) return;
    let cancelled = false;
    getDashboard()
      .then((d) => {
        const stats = (d as ProviderDashboard).stats;
        if (!cancelled && stats) setBadges({ openRequests: stats.openRequests, newEnquiries: stats.newEnquiries + (stats.newInquiries ?? 0) });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isProvider]);

  if (!user) return null;

  const nav = navForRole(user.activeRole as string, user.accountType === "MANAGED");
  const items = nav.main;

  // `compact`: the coordinator "Account & tools" rows — 12px text, no icon, indented.
  function NavLink({ item, onClick, compact = false }: { item: NavItem; onClick?: () => void; compact?: boolean }) {
    if (compact) {
      const active = pathname === item.href || !!pathname?.startsWith(item.href + "/");
      return (
        <li>
          <Link
            href={item.href}
            onClick={onClick}
            className={cn(
              "my-0.5 flex min-h-[35px] items-center rounded-lg py-2.5 pl-[25px] pr-3 text-xs",
              active ? "bg-[#fff0f5] font-bold text-[#c91355]" : "font-medium text-[#555a68] hover:bg-[#f8f8fa]",
            )}
          >
            {item.label}
          </Link>
        </li>
      );
    }
    const Icon = item.icon;
    // Only the most specific matching item is highlighted, so /jobs/my does not also light up /jobs.
    const jobId = pathname?.match(/^\/jobs\/([0-9a-f-]{36})$/i)?.[1];
    const viewingOwnJob = !!jobId && ownJob?.id === jobId && ownJob.owner;
    const matchesPath = (href: string) => (viewingOwnJob && href === "/jobs/my")
      || pathname === href || (href !== "/" && !!pathname?.startsWith(href + "/"));
    const isActive = (viewingOwnJob ? item.href === "/jobs/my" || (matchesPath(item.href) && item.href !== "/jobs") : matchesPath(item.href))
      && ![...nav.main, ...nav.account].some((o) => o.href.length > item.href.length && matchesPath(o.href));
    return (
      <li>
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          onClick={onClick}
          className={cn(
            "group relative flex items-center px-3 py-2.5 text-sm transition-all duration-150",
            isWorkspace ? "min-h-[44px] gap-[11px] rounded-lg" : "gap-3 rounded-xl font-medium",
            isActive
              ? isWorkspace
                ? "bg-[#fff0f5] font-bold text-[#c91355]"
                : "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/25"
              : isWorkspace
                ? "font-medium text-[#555a68] hover:bg-slate-50 hover:text-slate-900"
                : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          {item.glyph ? (
            <span className="grid h-[18px] w-[18px] shrink-0 place-items-center text-base leading-none">{item.glyph}</span>
          ) : (
          <Icon className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive ? (isWorkspace ? "text-[#c91355]" : "text-white") : isWorkspace ? "text-[#555a68]" : "text-slate-400 group-hover:text-brand-600",
          )} />
          )}
          {!collapsed && <span className={cn("tracking-tight", isWorkspace ? "whitespace-nowrap" : "truncate")}>{item.label}</span>}
          {!collapsed && !!item.badge && !!badges[item.badge] && (
            <span className={cn(
              "ml-auto px-1.5 font-bold",
              isWorkspace ? "rounded-[5px] bg-[#edf0f4] text-xs font-medium leading-5 text-[#555a68]" : "rounded-full text-[10px] leading-4",
              !isWorkspace && (isActive ? "bg-white/25 text-white" : "bg-brand-50 text-brand-700"),
            )}>{badges[item.badge]}</span>
          )}
        </Link>
      </li>
    );
  }

  function SidebarContents({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        {(!isWorkspace || mobile) && <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {(!collapsed || mobile)
              ? <img src="/images/logo-wordmark.png" alt="Shiftify" className="h-6 w-auto shrink-0" />
              : <img src="/images/logo-mark.png" alt="Shiftify" className="h-9 w-auto shrink-0" />}
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
        </div>}
        <nav className={cn("flex flex-1 flex-col justify-between overflow-y-auto", isWorkspace ? "px-3 pb-4 pt-6" : "p-3")}>
          {isCoordinator && (
            <Link
              href="/jobs/post"
              onClick={mobile ? () => setMobileOpen(false) : undefined}
              className="mb-5 flex min-h-[44px] items-center justify-center rounded-lg bg-[#c91355] px-3 text-sm font-bold text-white hover:bg-[#a90f47]"
            >
              Post Support Request
            </Link>
          )}
          {nav.groups ? (
            <div className={isProvider ? "space-y-6" : "space-y-3"}>
              {nav.groups.map((g) => (
                <div key={g.title}>
                  {(!collapsed || mobile) ? (
                    <p className={cn("px-3 uppercase", isProvider ? "m-0 mb-2 text-xs font-extrabold tracking-[1px] text-[#8a8d98]" : "pb-1 pt-1 text-[10px] font-semibold tracking-wider text-slate-400")}>{g.title}</p>
                  ) : (
                    <div className="mx-3 mb-1 border-t border-slate-100" />
                  )}
                  <ul className={isProvider ? "m-0 list-none space-y-0.5 p-0" : "space-y-1"}>
                    {g.items.map((item) => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
          <div>
            {(!collapsed || mobile) && !isCoordinator && (
              <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
            )}
            <ul className={isCoordinator ? "m-0 list-none space-y-0.5 p-0" : "space-y-1"}>
              {items.map(item => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
            </ul>
          </div>
          )}
          {isCoordinator ? (
            <details className="sc-account-tools" open>
              <summary><Sun className="h-[18px] w-[18px]" strokeWidth={1.7} /> Account &amp; tools</summary>
              <ul className="m-0 list-none p-0">
                {nav.account.map(item => <NavLink key={item.href} item={item} compact onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
              </ul>
            </details>
          ) : nav.account.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            {(!collapsed || mobile) && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account</p>
            )}
            <ul className="space-y-1">
              {nav.account.map(item => <NavLink key={item.href} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
            </ul>
          </div>
          )}
          {isCoordinator && (
            <>
              <Link href="/help-safety" className="mx-3 my-5 block text-[11px] text-[#9a1746]">Understand each feature ↗</Link>
              <p className="m-0 border-t border-[#e4e6ed] px-3 pt-4 text-[11px] leading-relaxed text-slate-500">
                Shiftify connects people and services. Service agreements and payments are arranged directly.
              </p>
            </>
          )}
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
        "hidden md:flex flex-col shrink-0 bg-white transition-[width] duration-200 overflow-hidden",
        isProvider
          ? "relative z-10 w-64 shadow-[15px_0_40px_rgba(0,0,0,0.067)]"
          : isCoordinator
          ? "w-64 border-r border-[#e4e6ed]"
          : cn("border-r border-slate-200 shadow-[4px_0_24px_-12px_rgba(20,24,28,0.12)]", collapsed ? "w-16" : "w-56"),
      )}>
        <SidebarContents />
      </aside>
    </>
  );
}
