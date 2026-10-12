'use client';

import { useHomeData } from './useHomeData';

/* Live SIL / SDA vacancies — suburb level only. Renders nothing until there is
   real data, so the section keeps its static look otherwise. */
export default function LiveVacancies() {
  const data = useHomeData();
  const list = data?.housing.featured ?? [];
  if (!data || list.length === 0) return null;
  return (
    <div className="sf-livevac" role="region" aria-label="Live SIL and SDA vacancies">
      <p className="sf-livevac-head"><b>{data.housing.liveCount}</b> live {data.housing.liveCount === 1 ? 'vacancy' : 'vacancies'} right now</p>
      <ul className="sf-livevac-list">
        {list.map((l) => (
          <li key={l.id}>
            <a href="/sil-sda">
              <span className="sf-livevac-title">{l.title}</span>
              <span className="sf-livevac-loc">{l.suburb}{l.state ? `, ${l.state}` : ''}{l.vacancyCategory ? ` · ${l.vacancyCategory.replace('_', ' / ')}` : ''}{l.isFeatured ? ' · Featured' : ''}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
