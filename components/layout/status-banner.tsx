"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProfileProgress } from "@/lib/api/profile";

export function StatusBanner() {
  const { user, activeRole } = useAuth();
  const [wizardComplete, setWizardComplete] = useState<boolean | null>(null);
  const [nextStep,       setNextStep]       = useState<number>(3);

  const isParticipant = activeRole === "PARTICIPANT";
  const isPending     = !isParticipant && user?.status === "PENDING";

  useEffect(() => {
    if (!isPending) return;
    getProfileProgress()
      .then(p => { setWizardComplete(p.isComplete); setNextStep(p.nextStep); })
      .catch(() => setWizardComplete(true)); // fallback: show subscription banner
  }, [isPending]);

  if (!user) return null;

  if (isPending) {
    // While loading, show nothing (avoids flicker between the two states)
    if (wizardComplete === null) return null;

    if (!wizardComplete) {
      return (
        <div className="border-b border-blue-200 bg-blue-50 px-6 py-3 text-sm text-blue-900">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              Profile incomplete
            </span>
            <span>
              Complete your profile to activate your account.{" "}
              <a href={`/setup/profile/${nextStep}`} className="font-semibold underline">
                Continue setup
              </a>
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Subscription required
          </span>
          <span>
            Activate a plan to post and accept jobs.{" "}
            <a href="/subscription" className="font-semibold underline">Choose a plan</a>
          </span>
        </div>
      </div>
    );
  }

  if (user.status === "SUSPENDED") {
    return (
      <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-900">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
            Account suspended
          </span>
          <span>Your account has been suspended. Contact support for assistance.</span>
        </div>
      </div>
    );
  }

  if (user.status === "REJECTED") {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            Account rejected
          </span>
          <span>
            Your account application was rejected.{" "}
            <a href="/profile" className="font-medium underline">
              Contact support
            </a>{" "}
            for assistance.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
