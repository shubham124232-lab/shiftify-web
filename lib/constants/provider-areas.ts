// Provider workspace areas (approved Provider demo, 27 Oct): eight main menu entries plus three
// "Account & tools" entries. Secondary screens live inside their area and are reached from the
// segmented tabs under each page heading, so the menu itself stays short.

export interface ProviderAreaTab { label: string; href: string }

export interface ProviderArea {
  key: string;
  label: string;
  href: string;
  /** Account & tools group (collapsible) rather than the main Workspace list. */
  account?: boolean;
  /** Path prefixes that belong to this area; the first match wins in `providerAreaFor`. */
  routes: string[];
  tabs: ProviderAreaTab[];
}

export const PROVIDER_AREAS: ProviderArea[] = [
  { key: "dashboard", label: "My Dashboard", href: "/dashboard/provider", routes: ["/dashboard/provider"], tabs: [] },
  { key: "shiftboard", label: "Live Shiftboard", href: "/live-dashboard", routes: ["/live-dashboard"], tabs: [] },
  {
    key: "staffing", label: "Staffing", href: "/jobs/my",
    routes: ["/jobs/my", "/jobs/post", "/provider/offers-assignments"],
    tabs: [
      { label: "My requests", href: "/jobs/my" },
      { label: "Post a Shift", href: "/jobs/post" },
      { label: "Offers & assignments", href: "/provider/offers-assignments" },
    ],
  },
  {
    key: "team", label: "Workers & Team", href: "/provider/workforce",
    routes: ["/provider/workforce", "/team", "/workers/available", "/saved-professionals", "/provider/team-availability", "/provider/worker-portal"],
    tabs: [
      { label: "Internal team", href: "/provider/workforce" },
      { label: "Find external workers", href: "/workers/available" },
      { label: "Saved workers", href: "/saved-professionals" },
      { label: "Team availability", href: "/provider/team-availability" },
    ],
  },
  {
    key: "opportunities", label: "Find Opportunities", href: "/jobs",
    routes: ["/provider/matched-requests", "/provider/saved-requests", "/provider/my-responses", "/provider/responses", "/provider/confirmed-starts", "/jobs"],
    tabs: [
      { label: "Browse requests", href: "/jobs" },
      { label: "Matched", href: "/provider/matched-requests" },
      { label: "Saved", href: "/provider/saved-requests" },
      { label: "My responses", href: "/provider/my-responses" },
      { label: "Service starts", href: "/provider/confirmed-starts" },
    ],
  },
  {
    key: "services", label: "Services & Housing", href: "/provider/services",
    routes: ["/provider/services", "/provider/post-service", "/provider/listings", "/provider/housing", "/provider/sil-vacancy", "/provider/enquiries"],
    tabs: [
      { label: "Services & capacity", href: "/provider/services" },
      { label: "Housing vacancies", href: "/provider/housing" },
      { label: "Enquiries", href: "/provider/enquiries" },
    ],
  },
  { key: "calendar", label: "Calendar", href: "/provider/calendar", routes: ["/provider/calendar"], tabs: [] },
  { key: "messages", label: "Messages", href: "/messages", routes: ["/messages"], tabs: [] },
  {
    key: "organisation", label: "Organisation", href: "/provider/organisation", account: true,
    routes: ["/provider/organisation", "/provider/branches", "/provider/service-lines", "/provider/administrators", "/documents", "/provider/reports"],
    tabs: [
      { label: "Profile", href: "/provider/organisation" },
      { label: "Branches", href: "/provider/branches" },
      { label: "Service lines", href: "/provider/service-lines" },
      { label: "Administrators", href: "/provider/administrators" },
      { label: "Documents", href: "/documents" },
      { label: "Reports", href: "/provider/reports" },
    ],
  },
  {
    key: "billing", label: "Billing & Extras", href: "/subscription", account: true,
    routes: ["/subscription", "/payment", "/provider/promotions", "/provider/shift-blast", "/provider/refer-and-earn"],
    tabs: [
      { label: "Membership & billing", href: "/subscription" },
      { label: "Promotions", href: "/provider/promotions" },
      { label: "Shift Blast — SMS", href: "/provider/shift-blast" },
      { label: "Refer & Earn", href: "/provider/refer-and-earn" },
    ],
  },
  {
    key: "help", label: "Help & Settings", href: "/provider/settings", account: true,
    routes: ["/provider/settings", "/notifications", "/provider/saved-searches", "/provider/help"],
    tabs: [
      { label: "Settings", href: "/provider/settings" },
      { label: "Notifications", href: "/notifications" },
      { label: "Saved searches", href: "/provider/saved-searches" },
      { label: "Help & Tickets", href: "/provider/help" },
    ],
  },
];

const matches = (pathname: string, route: string) => pathname === route || pathname.startsWith(route + "/");

/** The area a path belongs to. `/jobs/<id>` opened from Staffing counts as Staffing when `ownJob` is set. */
export function providerAreaFor(pathname: string, ownJob = false): ProviderArea | undefined {
  if (ownJob) return PROVIDER_AREAS.find((a) => a.key === "staffing");
  return PROVIDER_AREAS.find((a) => a.routes.some((r) => matches(pathname, r)));
}

/** The tab to highlight: the longest tab href the path sits under. */
export function activeProviderTab(area: ProviderArea, pathname: string): string | undefined {
  return area.tabs
    .filter((t) => matches(pathname, t.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
