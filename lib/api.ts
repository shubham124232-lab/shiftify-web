"use client";

// Fetch wrapper for the backend API.
// - Sends credentials (cookies) so the HttpOnly refresh cookie roundtrips.
// - Attaches the in-memory access token to Authorization.
// - On 401, attempts one silent refresh and retries the request.

import { getAccessToken, setAccessToken, clearAccessToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  formData?: FormData;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function doFetch(path: string, opts: ApiOptions, accessToken: string | null): Promise<Response> {
  const isFormData = !!opts.formData;
  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (opts.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    credentials: "include",
    body: isFormData
      ? opts.formData
      : opts.body
        ? JSON.stringify(opts.body)
        : undefined,
    signal: opts.signal,
  });
}

let refreshing: Promise<string | null> | null = null;

async function silentRefresh(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: { accessToken?: string } };
      const token = json?.data?.accessToken ?? null;
      if (token) setAccessToken(token);
      return token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  let token = getAccessToken();
  let res = await doFetch(path, opts, token);

  if (res.status === 401 && opts.auth !== false) {
    const newToken = await silentRefresh();
    if (newToken) {
      res = await doFetch(path, opts, newToken);
    }
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (res.status === 401) clearAccessToken();
    throw new ApiError(
      res.status,
      err?.code ?? "REQUEST_FAILED",
      err?.message ?? `Request failed (${res.status})`,
      err?.details,
    );
  }

  return ((json as { data?: T })?.data ?? null) as T;
}
