// Guest job-post draft — cart-style persistence for a job request filled out
// before login/registration. Client-only (localStorage), no backend entity.
// See [[guest-draft-job-post-design]] memory for the full design.

import type { PostingTier } from "@/lib/types/posting";

const DRAFT_KEY = "shiftify_guest_job_draft";
const ROLE_KEY  = "shiftify_guest_job_role";
const ATTEMPT_KEY = "shiftify_job_post_attempt";

export type GuestPostingRole = "PARTICIPANT" | "COORDINATOR";

export interface GuestJobDraft {
  tier:  PostingTier;
  role:  GuestPostingRole;
  state: Record<string, unknown>;
  savedAt?: number;
}

// A draft saved just before signing up may be picked up by the newly signed-in account, but only
// while it is fresh — an old abandoned draft must never leak into a later logged-in posting session.
// A coordinator still has a profile to complete after verifying, so the saved request has to outlast that.
export const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;

export function saveGuestRole(role: GuestPostingRole): void {
  try { localStorage.setItem(ROLE_KEY, role); } catch { /* storage unavailable */ }
}

export function loadGuestRole(): GuestPostingRole | null {
  try {
    const v = localStorage.getItem(ROLE_KEY);
    return v === "PARTICIPANT" || v === "COORDINATOR" ? v : null;
  } catch { return null; }
}

export function saveGuestDraft(tier: PostingTier, role: GuestPostingRole, state: Record<string, unknown>): void {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ tier, role, state, savedAt: Date.now() })); } catch { /* storage unavailable */ }
}

// Returns the saved state only if it belongs to the given tier (a guest can
// only ever be mid-draft on one journey at a time).
export function loadGuestDraft(tier: PostingTier): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestJobDraft;
    if (parsed.savedAt && Date.now() - parsed.savedAt > RESUME_WINDOW_MS) return null;
    return parsed.tier === tier ? parsed.state : null;
  } catch { return null; }
}

// Signed-in read right after signup/login: the draft for this tier, if it is fresh and was started
// for the role the account is now acting as.
export function loadResumableDraft(tier: PostingTier, activeRole: string | null | undefined): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestJobDraft;
    if (parsed.tier !== tier) return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > RESUME_WINDOW_MS) return null;
    if (parsed.role !== activeRole) return null;
    return parsed.state;
  } catch { return null; }
}

// Signed-in landing after login: the fresh draft (any tier) that matches the role the account is acting as,
// so a returning user who chose "Log in" instead of "Sign up" is sent back to finish the request.
export function peekResumableDraft(activeRole: string | null | undefined): GuestJobDraft | null {
  const d = peekGuestDraft();
  if (!d || !d.savedAt || Date.now() - d.savedAt > RESUME_WINDOW_MS || d.role !== activeRole) return null;
  return d;
}

// Unscoped read — used post-login to know which tier/role to route back into.
export function peekGuestDraft(): GuestJobDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as GuestJobDraft) : null;
  } catch { return null; }
}

export function clearGuestDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(ROLE_KEY); localStorage.removeItem(ATTEMPT_KEY); } catch { /* storage unavailable */ }
}

// One id per posting attempt. It is sent with the publish call so a retry, a double click or a
// timeout-then-retry returns the request that already exists instead of creating a second one.
// It survives a reload (localStorage) and is dropped once the request is posted or discarded.
export function getPostAttemptId(): string {
  try {
    const existing = localStorage.getItem(ATTEMPT_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(ATTEMPT_KEY, id);
    return id;
  } catch { return crypto.randomUUID(); }
}

export function clearPostAttemptId(): void {
  try { localStorage.removeItem(ATTEMPT_KEY); } catch { /* storage unavailable */ }
}

// Where "Review and post" should send someone who has a fresh saved request for the role they are acting as.
export function resumeDraftPath(activeRole: string | null | undefined, tierPath: (t: PostingTier) => string): string | null {
  const d = peekResumableDraft(activeRole);
  return d ? `/jobs/post/${tierPath(d.tier)}` : null;
}
