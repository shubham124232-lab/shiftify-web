// Saved searches for the PUBLIC (no-login) Live Shiftboard — client-only
// (localStorage), device-scoped, not synced. Distinct from the existing
// authenticated /saved-searches backend feature (SC-facing "Find directly"
// alerts), which is userId-scoped and unusable for an anonymous visitor.

import type { ShiftboardFilters } from '@/lib/types/shiftboard';

const KEY = 'shiftify_shiftboard_saved_searches';

export interface SavedShiftboardSearch {
  id: string;
  label: string;
  filters: ShiftboardFilters;
  savedAt: string;
}

export function listSavedSearches(): SavedShiftboardSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedShiftboardSearch[]) : [];
  } catch { return []; }
}

export function saveSearch(label: string, filters: ShiftboardFilters): void {
  try {
    const existing = listSavedSearches();
    const entry: SavedShiftboardSearch = {
      id: `${Date.now()}`,
      label: label.trim() || 'Saved search',
      filters,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, 10)));
  } catch { /* storage unavailable */ }
}

export function removeSavedSearch(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(listSavedSearches().filter((s) => s.id !== id)));
  } catch { /* storage unavailable */ }
}
