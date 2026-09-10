'use client';

import { useEffect, useState } from 'react';
import {
  IconTextSize, IconContrast, IconEasyRead, IconAuslan, IconTranslate,
} from './PremiumIcons';

/* Reading preferences live on the <html> element so every section picks them
   up, and they persist so a returning visitor keeps their setting. */
const TYPE_KEY = 'sf-type';
const CONTRAST_KEY = 'sf-contrast';

const sizes = [
  { key: 'base', label: 'A',   title: 'Default text size' },
  { key: 'lg',   label: 'A+',  title: 'Larger text' },
  { key: 'xl',   label: 'A++', title: 'Largest text' },
] as const;

type SizeKey = (typeof sizes)[number]['key'];

const links = [
  { Icon: IconEasyRead,  label: 'Easy Read',   href: '/easy-read',  hint: 'Plain language with pictures' },
  { Icon: IconAuslan,    label: 'Auslan',      href: '/auslan',     hint: 'Watch in Auslan' },
  { Icon: IconTranslate, label: 'Languages',   href: '/languages',  hint: 'Translated information' },
];

export default function AccessibilityBar() {
  const [size, setSize] = useState<SizeKey>('base');
  const [contrast, setContrast] = useState(false);

  /* Restore whatever was chosen last time. */
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem(TYPE_KEY) as SizeKey | null;
      if (savedSize && sizes.some((s) => s.key === savedSize)) setSize(savedSize);
      if (localStorage.getItem(CONTRAST_KEY) === '1') setContrast(true);
    } catch {
      /* storage blocked — the defaults are fine */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sf-type-lg', size === 'lg');
    root.classList.toggle('sf-type-xl', size === 'xl');
    try { localStorage.setItem(TYPE_KEY, size); } catch { /* ignore */ }
  }, [size]);

  useEffect(() => {
    document.documentElement.classList.toggle('sf-contrast', contrast);
    try { localStorage.setItem(CONTRAST_KEY, contrast ? '1' : '0'); } catch { /* ignore */ }
  }, [contrast]);

  return (
    <section className="sf-a11y" aria-label="Reading and accessibility options">
      <div className="sf-wrap sf-a11y-inner">

        <div className="sf-a11y-group">
          <span className="sf-a11y-label">
            <IconTextSize width={17} height={17} />
            Text size
          </span>
          <div className="sf-a11y-sizes" role="group" aria-label="Text size">
            {sizes.map((s) => (
              <button
                key={s.key}
                type="button"
                title={s.title}
                aria-pressed={size === s.key}
                className={`sf-a11y-size${size === s.key ? ' active' : ''}`}
                onClick={() => setSize(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-pressed={contrast}
          className={`sf-a11y-toggle${contrast ? ' active' : ''}`}
          onClick={() => setContrast((v) => !v)}
        >
          <IconContrast width={17} height={17} />
          High contrast
          <span className="sf-a11y-switch" aria-hidden="true"><span /></span>
        </button>

        <div className="sf-a11y-links">
          {links.map(({ Icon, label, href, hint }) => (
            <a key={label} href={href} className="sf-a11y-link" title={hint}>
              <Icon width={17} height={17} />
              {label}
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
