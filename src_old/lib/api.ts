// All API calls go through this module. Never use fetch/axios directly.
// Convention: api.get / api.post / api.patch / api.delete
// The refresh token lives in an httpOnly cookie (set by the backend). The
// short-lived access token is held in memory (lib/token-store.ts) and sent
// as a Bearer header on every call below.

import { getAccessToken, setAccessToken } from "./token-store";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function rawFetch(
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<Response> {
  const token = getAccessToken();
  return fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

// Exchanges the httpOnly refresh cookie for a new access token. Only ever
// called once per failed request, never recursively (it doesn't go through
// `request()`, so a 401 here just falls through as a normal failure).
async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  const token = (json as { data?: { accessToken?: string } })?.data?.accessToken ?? null;
  setAccessToken(token);
  return token;
}

async function request<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  let res = await rawFetch(method, path, body, headers);

  if (res.status === 401 && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawFetch(method, path, body, headers);
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message: string =
      (json as { error?: { message?: string } })?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (json as { data: T }).data;
}

const api = {
  get:    <T = unknown>(path: string) => request<T>("GET", path),
  post:   <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch:  <T = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
  put:    <T = unknown>(path: string, body?: unknown) => request<T>("PUT", path, body),
};

export default api;
