"use client";

// Phase 2 — a request started before registering is kept on this device. Whatever path the person took
// (finished sign-up, verified later, logged in instead, closed the tab), this tells them it is still
// there and takes them to its review step. Posting is never automatic: they review, then press Post.

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { TIER_META } from "@/lib/types/posting";
import { clearGuestDraft, peekGuestDraft, peekResumableDraft, RESUME_WINDOW_MS, type GuestJobDraft } from "@/lib/store/guestJobDraft";
import { draftReviewPath, prepareAccountForDraft } from "@/lib/guestDraftResume";

export function ResumeDraftBanner() {
  const { activeRole, isAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [draft, setDraft] = useState<GuestJobDraft | null>(null);

  useEffect(() => {
    if (!isAuth) { setDraft(null); return; }
    setDraft(peekResumableDraft(activeRole));
    // An abandoned draft past its window is removed rather than left behind on a shared device.
    const raw = peekGuestDraft();
    if (raw && (!raw.savedAt || Date.now() - raw.savedAt > RESUME_WINDOW_MS)) clearGuestDraft();
  }, [isAuth, activeRole, pathname]);

  if (!draft || pathname.startsWith("/jobs/post")) return null;
  const label = TIER_META[draft.tier].label;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-200 bg-brand-50 px-5 py-2.5 text-sm text-slate-700">
      <span>
        You have an unfinished <strong>{label}</strong> request saved. Review it and press Post when you are ready — nothing is posted until you do.
      </span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          disabled={opening}
          className="font-semibold text-brand-700 hover:underline disabled:opacity-60"
          onClick={async () => { setOpening(true); await prepareAccountForDraft(draft); router.push(draftReviewPath(draft)); setOpening(false); }}
        >
          {opening ? "Opening…" : "Review and post"}
        </button>
        <button type="button" className="text-slate-500 hover:underline" onClick={() => { clearGuestDraft(); setDraft(null); }}>Discard</button>
      </span>
    </div>
  );
}
