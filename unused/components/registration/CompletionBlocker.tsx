'use client';
// Shown on the final step when mandatory docs/fields are missing.
// Prevents form submission and lists what's required.

import { useRouter } from 'next/navigation';

export interface MissingItem {
  label:    string;
  action:   string;
  href?:    string;
}

interface Props {
  missing: MissingItem[];
}

export function CompletionBlocker({ missing }: Props) {
  const router = useRouter();
  if (missing.length === 0) return null;

  return (
    <div style={{
      background: '#FFF8F0', border: '1.5px solid #FED7AA',
      borderRadius: 12, padding: '16px 20px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F59E0B', fontSize: 16 }} />
        <strong style={{ fontSize: 14, color: '#92400E' }}>
          Complete these items before finishing
        </strong>
      </div>
      <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {missing.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#F59E0B', flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: '#78350F' }}>{item.label}</span>
            </div>
            {item.href && (
              <button
                type="button"
                onClick={() => router.push(item.href!)}
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--clr-primary)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textDecoration: 'underline', whiteSpace: 'nowrap',
                }}
              >
                {item.action}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
