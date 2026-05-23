"use client";

import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";

// Shown at the top of every (app) page so users always know their account status.
export function StatusBanner() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.status === "PENDING") {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
        <div className="flex items-center gap-2">
          <Badge tone="amber">Pending verification</Badge>
          <span>
            Your account is awaiting admin verification. You can view your profile but
            can&apos;t post or accept jobs until approved.
          </span>
        </div>
      </div>
    );
  }

  if (user.status === "REJECTED") {
    return (
      <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-900">
        <div className="flex items-center gap-2">
          <Badge tone="rose">Application rejected</Badge>
          <span>{user.rejectionReason ?? "Please contact support to learn more."}</span>
        </div>
      </div>
    );
  }

  if (user.status === "SUSPENDED") {
    return (
      <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-900">
        <div className="flex items-center gap-2">
          <Badge tone="rose">Account suspended</Badge>
          <span>Your account has been suspended. Contact support for assistance.</span>
        </div>
      </div>
    );
  }

  // Guest reminder: show if email not yet verified and a guestUntil date is set
  if (!user.emailVerified && user.guestUntil) {
    const expiresAt = new Date(user.guestUntil);
    const daysLeft = Math.max(
      0,
      Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    return (
      <div className="border-b border-brand-200 bg-brand-50 px-6 py-3 text-sm text-brand-900">
        <div className="flex items-center gap-2">
          <Badge tone="brand">Guest access</Badge>
          <span>
            Your guest access expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}.{" "}
            <a href="/profile" className="font-medium underline">
              Verify your email
            </a>{" "}
            to keep your account active.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
