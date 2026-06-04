'use client';
// Multi-select grid for the 18 NDIS job categories.

import { JOB_CATEGORIES } from '@/lib/constants/categories';

interface Props {
  value:      string[];
  onChange:   (values: string[]) => void;
  label?:     string;
  error?:     string;
}

export function ServiceMultiSelect({ value, onChange, label, error }: Props) {
  function toggle(cat: string) {
    if (value.includes(cat)) {
      onChange(value.filter(c => c !== cat));
    } else {
      onChange([...value, cat]);
    }
  }

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {JOB_CATEGORIES.map((cat) => {
          const selected = value.includes(cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggle(cat.value)}
              style={{
                padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                border: selected ? '1.5px solid var(--clr-primary)' : '1.5px solid var(--clr-border)',
                background: selected ? 'rgba(79,70,229,0.07)' : '#fff',
                cursor: 'pointer', fontSize: 12, fontWeight: selected ? 700 : 500,
                color: selected ? 'var(--clr-primary)' : 'var(--clr-text)',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {selected && <i className="bi bi-check-circle-fill" style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />}
              {!selected && <i className="bi bi-circle" style={{ color: 'var(--clr-border)', flexShrink: 0 }} />}
              <span style={{ lineHeight: 1.3 }}>{cat.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, marginBottom: 0 }}>{error}</p>}
    </div>
  );
}
