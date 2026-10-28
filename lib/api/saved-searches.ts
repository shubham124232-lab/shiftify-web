"use client";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedSearchFilters {
  suburb?: string;
  state?: string;
  category?: string;
  urgency?: string;
  shiftType?: string;
  fundingType?: string;
  isRecurring?: boolean;
}

export interface SavedSearch {
  id: string;
  label: string | null;
  filters: SavedSearchFilters;
  isActive: boolean;
  createdAt: string;
}

// ─── Calls ────────────────────────────────────────────────────────────────────

export function createSavedSearch(label: string | undefined, filters: SavedSearchFilters) {
  return api.post<{ savedSearch: SavedSearch }>("/saved-searches", { label, filters })
    .then((r) => r.savedSearch);
}

export function listSavedSearches() {
  return api.get<{ savedSearches: SavedSearch[] }>("/saved-searches")
    .then((r) => r.savedSearches);
}

export function updateSavedSearch(id: string, data: Partial<Pick<SavedSearch, "label" | "isActive">>) {
  return api.patch<{ savedSearch: SavedSearch }>(`/saved-searches/${id}`, data)
    .then((r) => r.savedSearch);
}

export function deleteSavedSearch(id: string) {
  return api.delete<{ deleted: true }>(`/saved-searches/${id}`);
}
