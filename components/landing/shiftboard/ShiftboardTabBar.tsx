'use client';

import { useEffect, useState } from 'react';
import { Bookmark, List, Map as MapIcon, SlidersHorizontal, type LucideIcon } from 'lucide-react';

// Sections the bar jumps to, in page order. Ids are set in ShiftboardBoard /
// SaveSearchCard.
const SECTIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'sf-sb-shifts',   label: 'Shifts', Icon: List },
  { id: 'sf-sb-map-card', label: 'Map',    Icon: MapIcon },
  { id: 'sf-sb-save',     label: 'Saved',  Icon: Bookmark },
];

// iOS-style bottom tab bar, shown on phones only (CSS). Hidden from wider
// layouts, where every section is already on screen.
export function ShiftboardTabBar({
  filtersOpen, activeFilters, onOpenFilters, onCloseFilters,
}: {
  filtersOpen: boolean;
  activeFilters: number;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
}) {
  const [current, setCurrent] = useState(SECTIONS[0].id);

  // Highlight whichever section is nearest the top of the viewport.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    onCloseFilters();
    setCurrent(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [shifts, map, saved] = SECTIONS;
  const tab = ({ id, label, Icon }: (typeof SECTIONS)[number]) => {
    const on = !filtersOpen && current === id;
    return (
      <button key={id} type="button" className={on ? 'on' : ''} aria-current={on ? 'true' : undefined} onClick={() => go(id)}>
        <Icon aria-hidden="true" strokeWidth={on ? 2.3 : 1.9} />
        {label}
      </button>
    );
  };

  return (
    <nav className="sf-sb-tabbar" aria-label="Shiftboard sections">
      {tab(shifts)}
      {tab(map)}
      <button
        type="button"
        className={filtersOpen ? 'on' : ''}
        aria-expanded={filtersOpen}
        aria-controls="sf-sb-filters"
        onClick={filtersOpen ? onCloseFilters : onOpenFilters}
      >
        <SlidersHorizontal aria-hidden="true" strokeWidth={filtersOpen ? 2.3 : 1.9} />
        {activeFilters > 0 && <span className="sf-sb-tabbar-badge" aria-label={`${activeFilters} active`}>{activeFilters}</span>}
        Filters
      </button>
      {tab(saved)}
    </nav>
  );
}
