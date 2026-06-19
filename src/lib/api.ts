// All API calls go through this module. Never use fetch/axios directly.
// Convention: api.get / api.post / api.patch / api.delete
// Tokens are stored in httpOnly cookies (set by the backend). All calls are credentialed.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function request<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

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
