'use client';

import { useEffect, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { SHIFTBOARD_CATEGORY_FILTERS } from '@/lib/constants/job-filters';
import { listSavedSearches, saveSearch, removeSavedSearch, type SavedShiftboardSearch } from '@/lib/store/savedShiftboardSearches';
import type { ShiftboardFilters } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY } from './urgency';

// The card has a single button, so the saved entry is named from its filters.
function describeSearch(f: ShiftboardFilters): string {
  const parts = [
    f.suburb.trim() || (f.nearLat != null ? `Within ${f.radiusKm} km` : ''),
    f.urgency ? SHIFTBOARD_URGENCY[f.urgency].label : '',
    SHIFTBOARD_CATEGORY_FILTERS.find((c) => c.value === f.category)?.label ?? '',
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'All shifts';
}

export function SaveSearchCard({ filters, onApply }: { filters: ShiftboardFilters; onApply: (f: ShiftboardFilters) => void }) {
  const [saved, setSaved] = useState<SavedShiftboardSearch[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  // localStorage is per-viewer only — read after mount so this never runs
  // during SSR and never disagrees with a server-rendered empty state.
  useEffect(() => { setSaved(listSavedSearches()); }, []);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [justSaved]);

  const handleSave = () => {
    saveSearch(describeSearch(filters), filters);
    setSaved(listSavedSearches());
    setJustSaved(true);
  };

  const handleRemove = (id: string) => {
    removeSavedSearch(id);
    setSaved(listSavedSearches());
  };

  return (
    <div className="sf-sb-card sf-sb-save" id="sf-sb-save">
      <h2>
        <Heart aria-hidden="true" strokeWidth={2.2} />
        Save this search
      </h2>
      <p>Keep these filters on this device for your next visit.</p>
      <button type="button" className="sf-sb-outline-btn" onClick={handleSave} aria-live="polite">
        {justSaved ? 'Search saved' : 'Save search on this device'}
      </button>

      {saved.length > 0 && (
        <ul className="sf-sb-saved">
          {saved.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onApply(s.filters)}>{s.label}</button>
              <button type="button" aria-label={`Remove ${s.label}`} onClick={() => handleRemove(s.id)}>
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
