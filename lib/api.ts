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

let _accessToken: string | null = null;

export function setApiToken(token: string | null): void {
  _accessToken = token;
}

export function getApiToken(): string | null {
  return _accessToken;
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

  console.log("REQUEST URL:", config.url);
  console.log("TOKEN:", token);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

   console.log("FINAL HEADERS:", config.headers);
   
  return config;
});

// ─── Silent refresh ───────────────────────────────────────────────────────────

let _refreshing: Promise<string | null> | null = null;

async function silentRefresh(): Promise<string | null> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    try {
      const res = await axios.post<{ data: { accessToken: string } }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const token = res.data?.data?.accessToken ?? null;
      if (token) setApiToken(token);
      return token;
    } catch {
      setApiToken(null);
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
      const newToken = await silentRefresh();
      if (newToken) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return http(original);
      }
      // Refresh failed — force logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Normalise to ApiError
    const data = (error.response?.data as { error?: { code?: string; message?: string; details?: unknown } } | undefined)?.error;
    throw new ApiError(
      error.response?.status ?? 0,
      data?.code    ?? 'NETWORK_ERROR',
      data?.message ?? error.message,
      data?.details,
    );
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
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return http.put<Envelope<T>>(url, body, config).then((r) => r.data.data);
  },
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return http.patch<Envelope<T>>(url, body, config).then((r) => r.data.data);
  },
  del<T>(url: string, config?: AxiosRequestConfig) {
    return http.delete<Envelope<T>>(url, config).then((r) => r.data.data);
  },
};
