"use client";
// In-memory holder for the short-lived JWT access token returned by the
// backend after register/login/refresh. Never persisted to localStorage —
// the refresh token (which can mint a new access token) lives in an
// httpOnly cookie instead.

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
