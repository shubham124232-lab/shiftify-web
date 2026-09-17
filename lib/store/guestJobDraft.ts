// Guest job-post draft — cart-style persistence for a job request filled out
// before login/registration. Client-only (localStorage), no backend entity.
// See [[guest-draft-job-post-design]] memory for the full design.

import type { PostingTier } from "@/lib/types/posting";

const DRAFT_KEY = "shiftify_guest_job_draft";
const ROLE_KEY  = "shiftify_guest_job_role";

export type GuestPostingRole = "PARTICIPANT" | "COORDINATOR";

export interface GuestJobDraft {
  tier:  PostingTier;
  role:  GuestPostingRole;
  state: Record<string, unknown>;
}

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
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ tier, role, state })); } catch { /* storage unavailable */ }
}

// Returns the saved state only if it belongs to the given tier (a guest can
// only ever be mid-draft on one journey at a time).
export function loadGuestDraft(tier: PostingTier): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestJobDraft;
    return parsed.tier === tier ? parsed.state : null;
  } catch { return null; }
}

// Unscoped read — used post-login to know which tier/role to route back into.
export function peekGuestDraft(): GuestJobDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as GuestJobDraft) : null;
  } catch { return null; }
}

export function clearGuestDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(ROLE_KEY); } catch { /* storage unavailable */ }
}
