"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import {
  listSavedSearches,
  updateSavedSearch,
  deleteSavedSearch,
  type SavedSearch,
} from "@/lib/api/saved-searches";

const FILTER_LABELS: Record<string, string> = {
  suburb: "Suburb", state: "State", category: "Category", urgency: "Urgency",
  shiftType: "Shift type", fundingType: "Funding", isRecurring: "Recurring",
};

function filterValueLabel(key: string, value: unknown): string {
  if (key === "category") return JOB_CATEGORIES.find(c => c.value === value)?.label ?? String(value);
  if (key === "isRecurring") return value ? "Yes" : "No";
  return String(value);
}

function FilterChips({ filters }: { filters: SavedSearch["filters"] }) {
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return <span className="text-xs text-slate-400">Any job (no filters)</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">
          {FILTER_LABELS[k] ?? k}: {filterValueLabel(k, v)}
        </span>
      ))}
    </div>
  );
}

export default function JobAlertsPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listSavedSearches()
      .then(setSearches)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(search: SavedSearch) {
    setActionId(search.id);
    try {
      await updateSavedSearch(search.id, { isActive: !search.isActive });
      load();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Could not update this alert.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(search: SavedSearch) {
    setActionId(search.id);
    try {
      await deleteSavedSearch(search.id);
      load();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Could not delete this alert.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <PageHeader title="My Job Alerts" description="Get notified when a job matching a saved search is posted" />
      <div className="mx-auto max-w-3xl px-5 py-6 space-y-3">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No saved searches yet</p>
            <p className="text-sm text-slate-400 mt-1">Set filters on the job board and click &quot;Save this search&quot; to get notified.</p>
          </div>
        ) : (
          searches.map((s) => (
            <Card key={s.id}>
              <CardContent className="py-4 px-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900">{s.label || "Saved search"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <FilterChips filters={s.filters} />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" disabled={actionId === s.id} onClick={() => handleToggle(s)}>
                    {s.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={actionId === s.id} onClick={() => handleDelete(s)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
