"use client";

// Tier picker — replaces the old flat 8-step wizard entirely (per the
// participant posting-journeys spec, 2026-08-12: this rebuild replaces the
// job-post flow, participant-posting only). Equivalent to spec screen C-04
// ("How quickly do you need support?"); C-01–C-03 (homepage entry, who-for,
// account creation) are unrelated pre-existing flows (/, /register) and are
// not part of this page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { TIER_META, type PostingTier } from "@/lib/types/posting";
import { WizardSidePanel } from "@/components/jobs/post/shared";
import { saveGuestRole, loadGuestRole, type GuestPostingRole } from "@/lib/store/guestJobDraft";

const TIER_ORDER: PostingTier[] = ["RAPID", "URGENT", "LAST_MINUTE", "ROUTINE"];

// Lane colours match the homepage timing lanes and the wizard side panel.
const TIER_ACCENT: Record<PostingTier, string> = {
  RAPID: "#FF2340",
  URGENT: "#FF8500",
  LAST_MINUTE: "#00A06A",
  ROUTINE: "#547FC4",
};

// Half-and-half shell shared by the picker screens: branded panel + choices.
function PickerShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-2 lg:items-stretch lg:gap-10">
        <WizardSidePanel tierLabel="Post a request" />
        <div className="mx-auto w-full max-w-2xl space-y-3">{children}</div>
      </div>
    </>
  );
}

const TIER_DESCRIPTIONS: Record<PostingTier, string> = {
  RAPID: "Shortest journey — essential information only, no long-form writing required.",
  URGENT: "Still fast, with a little more scheduling detail to reduce unsuitable responses.",
  LAST_MINUTE: "Fuller detail while remaining selection-led.",
  ROUTINE: "One-time or recurring — the most detailed journey, still mostly selections.",
};

// Provider only (Provider demo "Post a Shift"): how many free actions are left, and saved drafts to continue.
interface DraftJob { id: string; title: string; urgency: string; suburb: string; updatedAt?: string; createdAt: string }

function ProviderPostExtras() {
  const [allowance, setAllowance] = useState<{ applies: boolean; remaining: number; limit: number } | null>(null);
  const [drafts, setDrafts] = useState<DraftJob[] | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ allowance: { applies: boolean; remaining: number; limit: number } }>("/subscriptions/me/allowance"),
      api.get<{ capacity: unknown | null }>("/provider-org/capacity").catch(() => ({ capacity: null })),
    ])
      .then(([r, cap]) => setAllowance(cap.capacity ? null : r.allowance))
      .catch(() => setAllowance(null));
    api.get<{ jobs: (DraftJob & { status: string })[] }>("/jobs/my")
      .then((r) => setDrafts((r.jobs ?? []).filter((j) => j.status === "DRAFT")))
      .catch(() => setDrafts([]));
  }, []);

  return (
    <>
      <p className="m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        {allowance?.applies
          ? <><strong className="text-slate-900">{allowance.remaining} of {allowance.limit} free actions remaining.</strong> A successful external post uses 1 action. Internal checks and drafts are free.</>
          : "Publishing is included in your plan. Internal checks and drafts are free."}
      </p>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="m-0 text-sm font-semibold text-slate-900">Saved drafts</p>
        {drafts === null ? (
          <div className="mt-2 h-8 animate-pulse rounded-lg bg-slate-100" />
        ) : drafts.length === 0 ? (
          <p className="m-0 mt-1 text-sm text-slate-500">No saved drafts. You can save a request at any step and continue later.</p>
        ) : (
          <ul className="m-0 mt-2 list-none divide-y divide-slate-100 p-0">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800">{d.title}<span className="ml-2 text-xs font-normal text-slate-400">{d.suburb}</span></span>
                <Link href={`/jobs/${d.id}`} className="shrink-0 text-xs font-semibold text-brand-700 hover:underline">Continue</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function PostRequestTierPicker() {
  const router = useRouter();
  const { activeRole, isAuth } = useAuth();
  const [guestRole, setGuestRole] = useState<GuestPostingRole | null>(null);

  useEffect(() => {
    if (!isAuth) setGuestRole(loadGuestRole());
  }, [isAuth]);

  if (activeRole && !["PARTICIPANT", "COORDINATOR", "PROVIDER"].includes(activeRole)) {
    return (
      <>
        <PageHeader title="Post a Support Request" />
        <div className="px-5 py-8 text-sm text-slate-500">Only participants, support coordinators and providers can post requests.</div>
      </>
    );
  }

  // Guest, no role chosen yet — ask before showing the tier list.
  if (!isAuth && !guestRole) {
    return (
      <PickerShell title="Post a Support Request" description="Who is this request for?">
          <button
            type="button"
            onClick={() => { saveGuestRole("PARTICIPANT"); setGuestRole("PARTICIPANT"); }}
            className="w-full text-left border rounded-xl px-5 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40 border-slate-200"
          >
            <span className="text-base font-semibold text-slate-800">I need support myself</span>
            <p className="text-sm text-slate-500 mt-1">Posting as a participant.</p>
          </button>
          <button
            type="button"
            onClick={() => { saveGuestRole("COORDINATOR"); setGuestRole("COORDINATOR"); }}
            className="w-full text-left border rounded-xl px-5 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40 border-slate-200"
          >
            <span className="text-base font-semibold text-slate-800">I&apos;m posting for someone else</span>
            <p className="text-sm text-slate-500 mt-1">Posting as a support coordinator.</p>
          </button>
      </PickerShell>
    );
  }

  const isProvider = activeRole === "PROVIDER";
  return (
    <PickerShell
      title={isProvider ? "Post a Staffing Request" : "Post a Support Request"}
      description={isProvider ? "How soon do you need a worker?" : "How quickly do you need support?"}
    >
        {isProvider && <ProviderPostExtras />}
        {TIER_ORDER.map((tier) => {
          const meta = TIER_META[tier];
          return (
            <button
              key={tier}
              type="button"
              onClick={() => router.push(`/jobs/post/${meta.path}`)}
              style={{ borderLeftWidth: 4, borderLeftColor: TIER_ACCENT[tier] }}
              className={cn(
                "w-full text-left border rounded-xl px-5 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40",
                "border-slate-200",
              )}
            >
              <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-base font-semibold text-slate-800">{meta.label}</span>
                    <span className="text-xs font-medium text-brand-700 bg-brand-100 rounded-full px-3 py-1">{meta.timing}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{TIER_DESCRIPTIONS[tier]}</p>
              </div>
            </button>
          );
        })}
        <p className="text-xs text-slate-400 pt-2">
          If you are in immediate danger or need emergency medical help, call Triple Zero (000). Shiftify is not an emergency service.
        </p>
    </PickerShell>
  );
}
