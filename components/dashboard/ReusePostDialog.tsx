"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import type { JobSummary } from "@/lib/api/dashboard";

const PAGE_SIZE = 5;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Live", CONFIRMED: "Confirmed", COMPLETED: "Completed", DRAFT: "Draft", CANCELLED: "Cancelled", EXPIRED: "Expired",
};

function categoryLabel(value: string): string {
  return JOB_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// "Post again" picker: search previous posts, page through them, start a new draft from one.
export function ReusePostDialog({ posts, busyId, error, onPick, onClose }: {
  posts: JobSummary[];
  busyId: string | null;
  error: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) => `${p.title} ${categoryLabel(p.category)} ${p.suburb}`.toLowerCase().includes(needle));
  }, [posts, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Reuse a previous post"
        className="w-full max-w-[80vw] overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <h2 className="m-0 text-xl font-bold text-slate-900">Reuse a previous post</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 pt-4">
          <p className="m-0 mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Start a new draft with reusable service, rates and requirements. Dates, private care/location, offers, applications, confirmed workers and purchases are not copied. Review all details before publishing.
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Search by title, service or suburb"
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm"
            />
          </div>
          {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <ul className="m-0 min-h-[120px] list-none px-6 py-2">
          {rows.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">{posts.length === 0 ? "No previous posts yet." : "No posts match your search."}</li>
          ) : rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
              <div className="min-w-0">
                <p className="m-0 truncate text-base font-semibold text-slate-900">{p.title}</p>
                <p className="m-0 mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <span className="truncate">{categoryLabel(p.category)} · {p.suburb}</span>
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{STATUS_LABEL[p.status] ?? p.status}</span>
                </p>
              </div>
              <Button size="sm" variant="primary" className="shrink-0 whitespace-nowrap font-semibold" disabled={busyId !== null} onClick={() => onPick(p.id)}>
                {busyId === p.id ? "Creating…" : "Use as new draft"}
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Button size="sm" variant="outline" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
            <span>Page {current + 1} of {pages}</span>
            <Button size="sm" variant="outline" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</Button>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
