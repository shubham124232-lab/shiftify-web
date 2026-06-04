'use client';
// Free-text tag input — type a value and press Enter or comma to add.
// Used for service areas, languages, etc.

import { useState, KeyboardEvent } from 'react';

interface Props {
  value:       string[];
  onChange:    (values: string[]) => void;
  placeholder?: string;
  label?:      string;
  error?:      string;
  maxItems?:   number;
}

export function TagInput({ value, onChange, placeholder = 'Type and press Enter', label, error, maxItems = 20 }: Props) {
  const [input, setInput] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag) || value.length >= maxItems) return;
    onChange([...value, tag]);
    setInput('');
  }

  function remove(tag: string) {
    onChange(value.filter(t => t !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 }}>
          {label}
        </label>
      )}
      <div style={{
        minHeight: 42, padding: '6px 10px',
        border: `1.5px solid ${error ? '#ef4444' : 'var(--clr-border)'}`,
        borderRadius: 'var(--btn-radius)', background: '#fff',
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        cursor: 'text',
      }}
        onClick={() => document.getElementById('tag-input-inner')?.focus()}
      >
        {value.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(79,70,229,0.1)', color: 'var(--clr-primary)',
            borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600,
          }}>
            {tag}
            <button type="button" onClick={() => remove(tag)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, color: 'var(--clr-primary)', lineHeight: 1,
              display: 'flex', alignItems: 'center',
            }}>
              <i className="bi bi-x" style={{ fontSize: 13 }} />
            </button>
          </span>
        ))}
        <input
          id="tag-input-inner"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => add(input)}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{
            flex: 1, minWidth: 80, border: 'none', outline: 'none',
            fontSize: 13, background: 'transparent', color: 'var(--clr-text)',
          }}
        />
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 3, marginBottom: 0 }}>{error}</p>}
      <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 3, marginBottom: 0 }}>
        Press Enter or comma to add each item
      </p>
    </div>
  );
}
