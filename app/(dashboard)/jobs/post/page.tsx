"use client";

// Tier picker — replaces the old flat 8-step wizard entirely (per the
// participant posting-journeys spec, 2026-08-12: this rebuild replaces the
// job-post flow, participant-posting only). Equivalent to spec screen C-04
// ("How quickly do you need support?"); C-01–C-03 (homepage entry, who-for,
// account creation) are unrelated pre-existing flows (/, /register) and are
// not part of this page.

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { TIER_META, type PostingTier } from "@/lib/types/posting";

const TIER_ORDER: PostingTier[] = ["RAPID", "URGENT", "LAST_MINUTE", "ROUTINE"];

const TIER_DESCRIPTIONS: Record<PostingTier, string> = {
  RAPID: "Shortest journey — essential information only, no long-form writing required.",
  URGENT: "Still fast, with a little more scheduling detail to reduce unsuitable responses.",
  LAST_MINUTE: "Fuller detail while remaining selection-led.",
  ROUTINE: "One-time or recurring — the most detailed journey, still mostly selections.",
};

export default function PostRequestTierPicker() {
  const router = useRouter();
  const { activeRole } = useAuth();

  if (activeRole && !["PARTICIPANT", "COORDINATOR"].includes(activeRole)) {
    return (
      <>
        <PageHeader title="Post a Support Request" />
        <div className="px-5 py-8 text-sm text-slate-500">Only participants and support coordinators can post support requests.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Post a Support Request" description="How quickly do you need support?" />
      <div className="mx-auto max-w-2xl px-5 py-6 space-y-3">
        {TIER_ORDER.map((tier) => {
          const meta = TIER_META[tier];
          return (
            <button
              key={tier}
              type="button"
              onClick={() => router.push(`/jobs/post/${meta.path}`)}
              className={cn(
                "w-full text-left border rounded-xl px-5 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40",
                "border-slate-200",
              )}
            >
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-800">{meta.label}</span>
                    <span className="text-xs font-medium text-brand-700 bg-brand-100 rounded-full px-3 py-1">{meta.timing}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{TIER_DESCRIPTIONS[tier]}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
        <p className="text-xs text-slate-400 pt-2">
          If you are in immediate danger or need emergency medical help, call Triple Zero (000). Shiftify is not an emergency service.
        </p>
      </div>
    </>
  );
}
