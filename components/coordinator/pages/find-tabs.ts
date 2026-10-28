// Section tabs shared by the coordinator Find Support and Saved Workers & Providers pages.
export function FIND_TABS(active: "FIND" | "SAVED") {
  return [
    { label: "Workers & Providers", href: "/find", active: active === "FIND" },
    { label: "Saved professionals", href: "/saved-professionals", active: active === "SAVED" },
    { label: "Saved searches & alerts", href: "/jobs/alerts" },
  ];
}
