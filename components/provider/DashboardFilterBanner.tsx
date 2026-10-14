"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Provider dashboard tiles open their list page with ?filter=<key>. This banner says what the list is limited to
// and clears the filter (approved demo: "Showing: … · Clear dashboard filter"). The key is read after mount.
export function useDashboardFilter(): [string | null, () => void] {
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState<string | null>(null);
  useEffect(() => { setFilter(new URLSearchParams(window.location.search).get("filter")); }, []);
  return [filter, () => { setFilter(null); router.replace(pathname); }];
}

export function DashboardFilterBanner({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700">
      <span>Showing: {text}</span>
      <button type="button" onClick={onClear} className="font-semibold text-slate-500 hover:text-brand-600">Clear dashboard filter</button>
    </div>
  );
}
