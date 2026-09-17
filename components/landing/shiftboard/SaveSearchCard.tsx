'use client';

import { useEffect, useState } from 'react';
import { listSavedSearches, saveSearch, removeSavedSearch, type SavedShiftboardSearch } from '@/lib/store/savedShiftboardSearches';
import type { ShiftboardFilters } from '@/lib/types/shiftboard';

export function SaveSearchCard({ filters, onApply }: { filters: ShiftboardFilters; onApply: (f: ShiftboardFilters) => void }) {
  const [saved, setSaved] = useState<SavedShiftboardSearch[]>([]);
  const [label, setLabel] = useState('');

  // localStorage is per-viewer only — read after mount so this never runs
  // during SSR and never disagrees with a server-rendered empty state.
  useEffect(() => { setSaved(listSavedSearches()); }, []);

  const handleSave = () => {
    saveSearch(label, filters);
    setSaved(listSavedSearches());
    setLabel('');
  };

  const handleRemove = (id: string) => {
    removeSavedSearch(id);
    setSaved(listSavedSearches());
  };

  return (
    <div className="sf-shiftboard-save-card">
      <h3>Save this search</h3>
      <p>Get back to these filters quickly next time. Saved on this device.</p>
      <div className="sf-shiftboard-save-row">
        <input
          type="text"
          placeholder="Name this search"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="button" onClick={handleSave}>Save</button>
      </div>
      {saved.length > 0 && (
        <ul className="sf-shiftboard-save-list">
          {saved.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onApply(s.filters)}>{s.label}</button>
              <button type="button" aria-label={`Remove ${s.label}`} onClick={() => handleRemove(s.id)}>
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
