'use client';

import { useHomeData, type HomeData } from './useHomeData';

interface Item { label: string; text: string; color: string }

const items: Item[] = [
  { label: 'Rapid',        text: 'Support needed in the next 60 minutes',        color: 'var(--sf-rapid-core)'   },
  { label: 'Urgent',       text: 'Support needed in 1 to 4 hours',               color: 'var(--sf-urgent-core)'  },
  { label: 'Last-minute',  text: 'Support needed in 4 to 48 hours',              color: 'var(--sf-lastmin-core)' },
  { label: 'Routine',      text: 'One-time or recurring support beyond 48 hours', color: 'var(--sf-routine-core)' },
  { label: 'SIL / SDA',    text: 'Discover accommodation vacancies',             color: 'var(--sf-routine-core)' },
];

function withCounts(data: HomeData | null): Item[] {
  if (!data) return items;
  const keys = ['RAPID', 'URGENT', 'LAST_MINUTE', 'ROUTINE'] as const;
  return items.map((i, idx) => {
    if (idx < 4) {
      const n = data.lanes[keys[idx]];
      return n > 0 ? { ...i, text: `${n} open now · ${i.text}` } : i;
    }
    return data.housing.liveCount > 0 ? { ...i, text: `${data.housing.liveCount} vacancies live · ${i.text}` } : i;
  });
}

function Run({ hidden = false, list }: { hidden?: boolean; list: Item[] }) {
  return (
    <div className="sf-ticker-run" aria-hidden={hidden || undefined}>
      {list.map((i) => (
        <span key={i.label} className="sf-ticker-item">
          <span className="sf-ticker-dot" style={{ background: i.color }} aria-hidden="true" />
          <b style={{ color: i.color }}>{i.label}</b>
          <em aria-hidden="true">·</em>
          {i.text}
        </span>
      ))}
    </div>
  );
}

/* The strip scrolls right to left forever; the second run is a copy that keeps
   the loop seamless. */
export default function LaneTicker() {
  const list = withCounts(useHomeData());
  return (
    <div className="sf-ticker" role="region" aria-label="Timing lanes">
      <div className="sf-ticker-track">
        <Run list={list} />
        <Run hidden list={list} />
      </div>
    </div>
  );
}
