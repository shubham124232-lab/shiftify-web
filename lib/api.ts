// Axios API client.
// – Request interceptor attaches in-memory Bearer token.
// – Response interceptor handles 401 → silent refresh → single retry.
// – useAuth store is NOT imported here to avoid circular deps;
//   token helpers come from the store's exported singletons below.

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Token store (accessed without importing Zustand) ─────────────────────────
// The auth store calls setApiToken / clearApiToken after login/logout/refresh.

let _accessToken:  string | null = null;
let _refreshToken: string | null = null;

export function setApiToken(token: string | null): void {
  _accessToken = token;
}

export function getApiToken(): string | null {
  return _accessToken;
}

export function setRefreshToken(token: string | null): void {
  _refreshToken = token;
}

export function getRefreshToken(): string | null {
  return _refreshToken;
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status:   number;
  code:     string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name    = 'ApiError';
    this.status  = status;
    this.code    = code;
    this.details = details;
  }
}

// ─── Friendly error messages ─────────────────────────────────────────────────
// Maps raw backend/Zod error codes to plain-English messages a user can act on.
// Anything we don't have a specific, trustworthy message for falls back to a
// generic "try again" — the real cause is always console.error'd separately
// so it's visible in devtools without ever being shown to the user raw.

interface ValidationDetail { path: string; message: string }

function friendlyMessage(status: number, code: string, raw: string, details?: unknown): string {
  if (status === 429) return 'Too many requests — please wait a moment and try again.';
  if (status === 0  ) return 'Could not reach the server. Please check your internet connection.';

  switch (code) {
    case 'VALIDATION_ERROR': {
      // Show the specific field error(s) — e.g. "Enter a valid phone number" —
      // instead of a vague generic line, so the user knows exactly what to fix.
      const list = Array.isArray(details) ? (details as ValidationDetail[]) : [];
      if (list.length > 0) {
        return list.map((d) => d.message).join(' ');
      }
      return 'Some information you entered is invalid. Please review your answers and try again.';
    }
    case 'CONFLICT_ERROR':
      // Conflict messages (e.g. "ABN already registered") are already human-readable.
      return raw;
    case 'NOT_FOUND':
      return 'We couldn\'t find what you were looking for. Please refresh the page and try again.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please log in again.';
    case 'FORBIDDEN':
      return 'You don\'t have permission to do that.';
    default:
      // Unknown/unexpected error shape — never show raw internals to the user.
      return status >= 500 || code === 'NETWORK_ERROR'
        ? 'Something went wrong. Please try again.'
        : raw;
  }
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export const http = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,          // sends HttpOnly refresh cookie on every request
  timeout:         15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach Bearer token ────────────────────────────────

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _accessToken;


  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

   
  return config;
});

// ─── Silent refresh ───────────────────────────────────────────────────────────

let _refreshing: Promise<string | null> | null = null;

// Distinguishes "the refresh token is genuinely dead" (server said so —
// safe and correct to force a re-login) from "we couldn't reach the server
// in time" (network hiccup / slow wake-from-idle — the session may still be
// fine, so don't boot the user out over it).
let _lastRefreshWasAuthRejected = false;

async function silentRefresh(): Promise<string | null> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    _lastRefreshWasAuthRejected = false;
    try {
      const res = await axios.post<{ data: { accessToken: string; refreshToken?: string } }>(
        `${BASE_URL}/auth/refresh`,
        // Send token in body as fallback for cross-site cookie environments
        _refreshToken ? { refreshToken: _refreshToken } : {},
        { withCredentials: true, timeout: 15_000 },
      );
      const token = res.data?.data?.accessToken ?? null;
      if (token) setApiToken(token);
      const rt = res.data?.data?.refreshToken ?? null;
      if (rt) setRefreshToken(rt);
      return token;
    } catch (err) {
      // Only a real 401/403 from the server means the refresh token itself
      // is invalid/expired. A timeout or network error just means we don't
      // know yet — leave the user where they are so they can retry.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        _lastRefreshWasAuthRejected = true;
        setApiToken(null);
      }
      return null;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
}

// ─── Response interceptor — 401 retry ─────────────────────────────────────────

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.url !== '/auth/refresh'
    ) {
      original._retry = true;

      // A stale connection after idle often fails once and works a moment
      // later, so retry the refresh silently a couple of times before
      // bothering the user with anything — most idle-timeout hiccups
      // resolve themselves here without the user ever seeing an error.
      let newToken: string | null = null;
      for (let attempt = 0; attempt < 3 && !newToken; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
        newToken = await silentRefresh();
        if (!newToken && _lastRefreshWasAuthRejected) break; // real auth failure — no point retrying
      }

      if (newToken) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return http(original);
      }
      // Only force a logout if the server actually rejected the refresh
      // token — a timeout/network error leaves the user on the current
      // page so they don't lose in-progress work over a slow connection.
      if (_lastRefreshWasAuthRejected && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Normalise to ApiError
    const status = error.response?.status ?? 0;
    const data   = (error.response?.data as { error?: { code?: string; message?: string; details?: unknown } } | undefined)?.error;
    const code   = data?.code ?? 'NETWORK_ERROR';
    const raw    = data?.message ?? error.message;
    const message = friendlyMessage(status, code, raw, data?.details);

    // Field-level validation errors (bad phone/email/etc.) are expected and
    // already shown to the user verbatim above — no need to log those. Any
    // unexpected error (network failure, 500, unknown shape) gets logged in
    // full so it's visible in devtools even though the user only sees the
    // generic "try again" message.
    if (code !== 'VALIDATION_ERROR' && code !== 'CONFLICT_ERROR') {
      console.error('[shiftify-api] request failed:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        code,
        message: raw,
        details: data?.details,
        error,
      });
    }

    throw new ApiError(status, code, message, data?.details);
  },
);

// ─── Typed helpers ────────────────────────────────────────────────────────────

type Envelope<T> = { data: T };

export const api = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return http.get<Envelope<T>>(url, config).then((r) => r.data.data);
  },
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return http.post<Envelope<T>>(url, body, config).then((r) => r.data.data);
  },
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return http.patch<Envelope<T>>(url, body, config).then((r) => r.data.data);
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return http.delete<Envelope<T>>(url, config).then((r) => r.data.data);
  },
  /** alias — some agent-written pages use api.del */
  del<T>(url: string, config?: AxiosRequestConfig) {
    return http.delete<Envelope<T>>(url, config).then((r) => r.data.data);
  },
  /** alias — some agent-written pages use api.put */
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return http.put<Envelope<T>>(url, body, config).then((r) => r.data.data);
  },
};
