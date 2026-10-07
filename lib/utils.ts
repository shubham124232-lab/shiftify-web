import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as AUD currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Truncate a string to maxLength, appending "…" if needed. */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/** Get two-letter initials from a full name. */
export function getInitials(name: string = ''): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Normalise a date value to YYYY-MM-DD string for the backend.
 * - Already YYYY-MM-DD → returned as-is
 * - ISO datetime string (e.g. "2000-01-02T00:00:00.000Z") → strips time part
 * - Date object → formats to YYYY-MM-DD
 * - Time strings (HH:MM) are NOT touched — pass them through a separate field.
 */
export function toDateString(val: unknown): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'string') {
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // ISO datetime — strip the time component
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val.slice(0, 10);
  }
  return undefined;
}

/**
 * Normalise a time value to HH:MM string for the backend.
 * Accepts "HH:MM", "HH:MM:SS", or "HH:MM:SS.sss" — always returns "HH:MM".
 * Date fields must NOT be passed here.
 */
export function toTimeString(val: unknown): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'string') {
    const m = val.match(/^(\d{2}:\d{2})(:\d{2})?/);
    if (m) return m[1];
  }
  return undefined;
}

const DATE_FIELDS = [
  // Worker
  'dob', 'visaExpiry',
  'publicLiabilityExpiry', 'personalAccidentExpiry',
  'ndisScreeningExpiry', 'policeCheckIssueDate', 'policeCheckExpiry',
  'wwccExpiry', 'firstAidExpiry', 'cprExpiry', 'driversLicenceExpiry',
  // Participant
  'ndisStartDate', 'ndisEndDate',
  // Provider
  'publicLiabilityExpiryDate', 'professionalIndemnityExpiryDate', 'workersCompExpiryDate',
  // Coordinator
  'professionalIndemnityExpiry',
  // Plan Manager
  'registrationExpiryDate',
] as const;

/**
 * Sanitise a wizard payload before sending to the backend.
 * Converts all known date fields to YYYY-MM-DD; leaves time fields (HH:MM) untouched.
 */
export function sanitiseDates(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  for (const field of DATE_FIELDS) {
    if (field in out) {
      const cleaned = toDateString(out[field]);
      if (cleaned !== undefined) out[field] = cleaned;
      else delete out[field];
    }
  }
  return out;
}

/**
 * Strip empty-string values from a payload before sending to the backend.
 *
 * React Hook Form defaults an untouched <select>/radio group to "" (never
 * undefined), but every optional Zod enum on the backend only excuses a
 * MISSING key — it still rejects "" because "" isn't one of the allowed
 * enum values. Left as-is, leaving any optional dropdown on ANY step of
 * ANY role's registration/edit form untouched produces a raw "Invalid enum
 * value" 422 the moment that field is submitted blank.
 *
 * Recurses one level into plain nested objects (e.g. `address`) since those
 * can carry their own optional enum-like string fields. Arrays and dates
 * are left alone — an empty array is a meaningful "nothing selected", not
 * a value to strip, and dates are handled separately by sanitiseDates.
 */
export function stripEmptyStrings<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === '') continue; // drop — same as "not sent"
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      out[key] = stripEmptyStrings(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/**
 * Full pre-submit cleanup used by every profile/registration form: normalise
 * dates, then drop any field left blank so optional enums never see "".
 * Use this instead of calling sanitiseDates directly for new call sites.
 */
export function sanitisePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return stripEmptyStrings(sanitiseDates(payload));
}
