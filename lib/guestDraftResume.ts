// Phase 2 — shared by the register, verify-phone and login screens: once a person has an account for
// the role they started a request as, carry their saved request back to its review step.

import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { TIER_META } from "@/lib/types/posting";
import { peekResumableDraft, type GuestJobDraft } from "@/lib/store/guestJobDraft";

export function draftReviewPath(draft: GuestJobDraft): string {
  return `/jobs/post/${TIER_META[draft.tier].path}`;
}

// The suburb typed into the request becomes the account's default suburb, so a new participant is not
// blocked on "Add your suburb" right after verifying. Best-effort: the review step still shows any gap.
export async function carryDraftLocationToAccount(draft: GuestJobDraft): Promise<void> {
  const st = draft.state;
  if (draft.role !== "PARTICIPANT" || typeof st.suburb !== "string" || !st.suburb) return;
  try {
    await api.patch("/users/me", {
      defaultSuburb: st.suburb,
      ...(typeof st.state === "string" && st.state ? { defaultState: st.state } : {}),
      ...(typeof st.postcode === "string" && st.postcode ? { defaultPostcode: st.postcode } : {}),
    });
  } catch { /* best-effort prefill */ }
}

// Everything a new participant needs before the review step can post: the free account activated and the
// request's suburb saved on the account, then the gate state re-read so the dashboard layout lets them through.
export async function prepareAccountForDraft(draft: GuestJobDraft): Promise<void> {
  const { user } = useAuthStore.getState();
  if (draft.role === "PARTICIPANT" && user && user.status !== "ACTIVE") {
    try { await api.post("/subscriptions/activate", {}); } catch { /* the review step reports any gap */ }
  }
  await carryDraftLocationToAccount(draft);
  await useAuthStore.getState().refreshGateStatus();
}

// A publish call that never got an answer (connection dropped, timeout) may still have created the request.
// The same attempt id is re-sent on the next press, so pressing Post again is safe — say so.
export function postFailureMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 0
      ? "We couldn't confirm your request was posted. Press Post again — it will not be posted twice."
      : err.message;
  }
  return "Failed to post request.";
}

// Fresh draft for the role the account now acts as, or null.
export function resumableDraftFor(activeRole: string | null | undefined): GuestJobDraft | null {
  return peekResumableDraft(activeRole);
}
