'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface HomeData {
  lanes: Record<'RAPID' | 'URGENT' | 'LAST_MINUTE' | 'ROUTINE', number>;
  totalOpen: number;
  housing: {
    liveCount: number;
    featured: { id: string; title: string; suburb: string; state: string | null; vacancyCategory: string | null; vacancyCount: number | null; isFeatured: boolean }[];
  };
  platinumActive: number;
}

/* One request per page load, shared by every homepage section. */
let inflight: Promise<HomeData> | null = null;
function loadHome(): Promise<HomeData> {
  if (!inflight) {
    inflight = api.get<HomeData>('/public/home').catch((e) => { inflight = null; throw e; });
  }
  return inflight;
}

/* Live homepage figures. Returns null until loaded or when the API is down, so
   every consumer keeps its static copy as the fallback. */
export function useHomeData(): HomeData | null {
  const [data, setData] = useState<HomeData | null>(null);
  useEffect(() => {
    let alive = true;
    loadHome().then((d) => { if (alive) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return data;
}
