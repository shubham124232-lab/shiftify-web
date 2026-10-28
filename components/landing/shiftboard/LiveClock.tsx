'use client';

import { useEffect, useState } from 'react';

// The visitor's own Australian zone when their browser is set to one;
// anyone outside Australia sees Sydney time.
function australianZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone?.startsWith('Australia/') ? zone : 'Australia/Sydney';
}

// ["5:36 PM", "AEST"] — en-AU gives the local abbreviation (AEST / AEDT / ACST / AWST…).
function formatClock(now: Date, timeZone: string): [string, string] {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return [`${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()}`, get('timeZoneName')];
}

export function LiveClock({ className }: { className?: string }) {
  // Rendered only after mount, so the server's clock never has to match the visitor's.
  const [label, setLabel] = useState<[string, string] | null>(null);

  useEffect(() => {
    const zone = australianZone();
    const update = () => setLabel(formatClock(new Date(), zone));
    update();

    // Tick on each minute boundary rather than every 60s from page load.
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      update();
      interval = setInterval(update, 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <p className={className} aria-live="off">
      {label ? (
        <time>
          <b>{label[0]}</b> <small>{label[1]}</small>
        </time>
      ) : ' '}
    </p>
  );
}
