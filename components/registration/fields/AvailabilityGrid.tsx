'use client';
// Weekly availability grid — day × time slot builder.
// Lets users add/remove HH:MM–HH:MM blocks for each day.

import { useState } from 'react';

export interface Slot {
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string;
  endTime:   string;
}

interface Props {
  value:    Slot[];
  onChange: (slots: Slot[]) => void;
  error?:   string;
}

const DAYS: { value: Slot['dayOfWeek']; label: string }[] = [
  { value: 'MON', label: 'Mon' },
  { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' },
  { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' },
  { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

export function AvailabilityGrid({ value, onChange, error }: Props) {
  const [activeDay, setActiveDay] = useState<Slot['dayOfWeek'] | null>(null);
  const [newStart, setNewStart]  = useState('09:00');
  const [newEnd,   setNewEnd]    = useState('17:00');

  function slotsForDay(day: Slot['dayOfWeek']): Slot[] {
    return value.filter(s => s.dayOfWeek === day);
  }

  function addSlot(day: Slot['dayOfWeek']) {
    if (newStart >= newEnd) {
      alert('End time must be after start time.');
      return;
    }
    const exists = value.some(s => s.dayOfWeek === day && s.startTime === newStart && s.endTime === newEnd);
    if (!exists) {
      onChange([...value, { dayOfWeek: day, startTime: newStart, endTime: newEnd }]);
    }
    setActiveDay(null);
  }

  function removeSlot(day: Slot['dayOfWeek'], start: string, end: string) {
    onChange(value.filter(s => !(s.dayOfWeek === day && s.startTime === start && s.endTime === end)));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {DAYS.map(({ value: day, label }) => {
          const slots   = slotsForDay(day);
          const hasSlot = slots.length > 0;
          const isOpen  = activeDay === day;
          return (
            <div key={day} style={{ flex: '1 1 auto', minWidth: 80 }}>
              <button
                type="button"
                onClick={() => setActiveDay(isOpen ? null : day)}
                style={{
                  width: '100%', padding: '8px 6px', borderRadius: 8,
                  border: hasSlot
                    ? '1.5px solid var(--clr-primary)'
                    : isOpen
                    ? '1.5px solid var(--clr-primary)'
                    : '1.5px solid var(--clr-border)',
                  background: hasSlot ? 'rgba(79,70,229,0.07)' : '#fff',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: hasSlot ? 'var(--clr-primary)' : 'var(--clr-text)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
                {hasSlot && (
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--clr-primary)', marginTop: 2 }}>
                    {slots.length} slot{slots.length > 1 ? 's' : ''}
                  </div>
                )}
              </button>

              {/* Existing slots for this day */}
              {slots.map(slot => (
                <div key={`${slot.startTime}-${slot.endTime}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 11, color: 'var(--clr-muted)', marginTop: 4,
                  background: 'var(--clr-surface)', borderRadius: 6, padding: '3px 8px',
                }}>
                  {slot.startTime}–{slot.endTime}
                  <button type="button" onClick={() => removeSlot(day, slot.startTime, slot.endTime)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, fontSize: 12 }}>
                    <i className="bi bi-x" />
                  </button>
                </div>
              ))}

              {/* Inline time picker when active */}
              {isOpen && (
                <div style={{
                  marginTop: 8, padding: 10, background: '#fff',
                  border: '1.5px solid var(--clr-primary)', borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <select value={newStart} onChange={e => setNewStart(e.target.value)}
                      style={{ flex: 1, height: 34, border: '1px solid var(--clr-border)', borderRadius: 6, fontSize: 12, padding: '0 6px' }}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--clr-muted)' }}>to</span>
                    <select value={newEnd} onChange={e => setNewEnd(e.target.value)}
                      style={{ flex: 1, height: 34, border: '1px solid var(--clr-border)', borderRadius: 6, fontSize: 12, padding: '0 6px' }}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => addSlot(day)}
                    style={{
                      width: '100%', height: 30,
                      background: 'var(--clr-primary)', color: '#fff',
                      border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                    + Add Slot
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 2, marginBottom: 0 }}>{error}</p>}
    </div>
  );
}
