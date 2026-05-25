"use client";

import { useAuth } from "@/hooks/useAuth";

export function StatusBanner() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.status === "PENDING") {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Pending verification
          </span>
          <span>
            Your account is awaiting admin verification. You can view your profile but
            can&apos;t post or accept jobs until approved.
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

  if (user.status === "INACTIVE") {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            Inactive
          </span>
          <span>
            Your account is inactive.{" "}
            <a href="/profile" className="font-medium underline">
              Contact support
            </a>{" "}
            to reactivate.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
