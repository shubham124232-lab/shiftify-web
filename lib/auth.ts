"use client";

// Access token lives in memory only (lost on page reload — silent refresh
// via the HttpOnly refresh cookie gets a new one automatically).

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// Decode the JWT payload (no signature verification — used only for
// reading activeRole/roles that the backend already validated).
export function decodeAccessToken(): { activeRole?: string; roles?: string[]; sub?: string } | null {
  if (!accessToken) return null;
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    // atob requires standard base64; JWTs use base64url — swap - and _ back.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as { activeRole?: string; roles?: string[]; sub?: string };
  } catch {
    return null;
  }
}
