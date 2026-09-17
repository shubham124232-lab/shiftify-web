interface Item { label: string; text: string; color: string }

const items: Item[] = [
  { label: 'Rapid',        text: 'Support needed in the next 60 minutes',        color: 'var(--sf-rapid-core)'   },
  { label: 'Urgent',       text: 'Support needed in 1 to 4 hours',               color: 'var(--sf-urgent-core)'  },
  { label: 'Last-minute',  text: 'Support needed in 4 to 48 hours',              color: 'var(--sf-lastmin-core)' },
  { label: 'Routine',      text: 'One-time or recurring support beyond 48 hours', color: 'var(--sf-routine-core)' },
  { label: 'SIL / SDA',    text: 'Discover accommodation vacancies',             color: 'var(--sf-routine-core)' },
];

function Run({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="sf-ticker-run" aria-hidden={hidden || undefined}>
      {items.map((i) => (
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
  return (
    <div className="sf-ticker" role="region" aria-label="Timing lanes">
      <div className="sf-ticker-track">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
