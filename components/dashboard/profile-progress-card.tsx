"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Compact right-rail nudge shown alongside SetupBanner's detailed messaging —
// mirrors the same profileCompletion the layout gate already reads.
export function ProfileProgressCard() {
  const { profileCompletion } = useAuth();
  if (profileCompletion === null || profileCompletion >= 100) return null;
  const pct = Math.max(0, Math.min(100, profileCompletion));

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-base font-bold text-slate-900">Complete your profile</h3>
        <p className="mt-1 text-sm text-slate-500">Optional · Add details once and save time later</p>
        <p className="mt-4 text-2xl font-extrabold text-slate-900">{pct}% complete</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <Link href="/profile/edit" className="mt-5 block">
          <Button className="w-full">Continue profile</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
