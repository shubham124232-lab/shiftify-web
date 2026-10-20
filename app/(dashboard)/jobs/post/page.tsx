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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { TIER_META, type PostingTier } from "@/lib/types/posting";
import { WizardSidePanel } from "@/components/jobs/post/shared";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import { RequestDetailDialog } from "@/components/provider/RequestDialogs";
import { Zap, Clock, CalendarDays, Timer, LayoutGrid, ShieldCheck } from "lucide-react";
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
function PickerShell({ title, description, children, plain }: { title: string; description: string; children: React.ReactNode; plain?: boolean }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      {plain ? (
        <div className="mx-auto w-full max-w-3xl space-y-3 px-5 py-6">{children}</div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <WizardSidePanel tierLabel="Post a request" />
          <div className="mx-auto w-full max-w-2xl space-y-3">{children}</div>
        </div>
      )}
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

function ProviderPostExtras({ children, onContinue }: { children?: React.ReactNode; onContinue?: (d: DraftJob) => void }) {
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
      {allowance?.applies && (
        <p className="pd-info-banner" style={{ background: "#fff5f9", borderColor: "#f4d5e2", color: "#9d2250" }}>
          <strong>{allowance.remaining} of {allowance.limit} free actions remaining.</strong>&nbsp;A successful external post uses 1 action. Internal checks and drafts are free.
        </p>
      )}
      {children}
      <section className="pd-panel">
        <div className="pd-panel-head"><h2>Saved drafts</h2></div>
        {drafts === null ? (
          <div className="pd-quiet-empty">Loading…</div>
        ) : drafts.length === 0 ? (
          <div className="pd-empty">
            <LayoutGrid />
            <h3>No saved drafts</h3>
            <p>You can save a request at any step and continue later.</p>
          </div>
        ) : (
          <div>
            {drafts.map((d) => (
              <div key={d.id} className="pd-task-row">
                <div><strong>{d.title}</strong><p>{d.suburb}</p></div>
                {onContinue
                  ? <button type="button" className="pd-btn pd-btn-sm" onClick={() => onContinue(d)}>Continue</button>
                  : <Link href={`/jobs/${d.id}`} className="pd-btn pd-btn-sm">Continue</Link>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const PROVIDER_LANES: Record<PostingTier, { title: string; timing: string; badge: string; cls: string; icon: React.ReactNode }> = {
  RAPID:       { title: "Rapid staffing",       timing: "Now–60 minutes",           badge: "Rapid",       cls: "pd-badge-rapid",       icon: <Zap /> },
  URGENT:      { title: "Urgent staffing",      timing: "Over 60 minutes–4 hours",  badge: "Urgent",      cls: "pd-badge-urgent",   icon: <Clock /> },
  LAST_MINUTE: { title: "Last Minute staffing", timing: "Over 4–48 hours",          badge: "Last Minute", cls: "pd-badge-last-minute", icon: <Timer /> },
  ROUTINE:     { title: "Routine staffing",     timing: "Beyond 48 hours or recurring", badge: "Routine", cls: "pd-badge-routine",     icon: <CalendarDays /> },
};

// Provider "Post a Shift": four lane cards; each opens the staffing wizard as a popup over this page.
function ProviderPostShift() {
  const [tier, setTier] = useState<PostingTier | null>(null);
  // A saved draft resumes in the same popup (prefilled); a posted request opens its record popup. Neither changes the URL.
  const [resume, setResume] = useState<DraftJob | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  return (
    <>
      <div className="pd-workspace">
        <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Post</div>
        <div className="pd-page-head">
          <div>
            <h1>Post a Shift</h1>
            <p>Start with timing, then choose internal or external distribution.</p>
          </div>
          <div className="pd-buttons" />
        </div>
        <ProviderPostExtras key={reload} onContinue={setResume}>
          <div className="pd-grid4">
            {TIER_ORDER.map((t) => {
              const l = PROVIDER_LANES[t];
              return (
                <div key={t} className="pd-record-card">
                  <span className={cn("pd-badge", l.cls)}>{l.icon}{l.badge}</span>
                  <span className="pd-icon-plain">{l.icon}</span>
                  <h2>{l.title}</h2>
                  <p className="pd-card-body">{l.timing}</p>
                  <button type="button" className="pd-btn pd-btn-primary" onClick={() => setTier(t)}>Start {TIER_META[t].label.replace(/ Support$/, "")} request</button>
                </div>
              );
            })}
          </div>
          <div className="pd-info-banner"><ShieldCheck width={18} height={18} className="shrink-0" />Ordinary matching, internal availability and urgent external distribution are core features. Payment does not change urgency or verification.</div>
        </ProviderPostExtras>
        <p className="m-0 text-xs text-slate-400">
          If you are in immediate danger or need emergency medical help, call Triple Zero (000). Shiftify is not an emergency service.
        </p>
        </div>
      </div>
      {tier && <ProviderStaffingWizard tier={tier} onClose={() => { setTier(null); setReload((n) => n + 1); }} onViewRequest={(id) => { setTier(null); setViewId(id); }} />}
      {resume && <ProviderStaffingWizard tier={resume.urgency as PostingTier} editJobId={resume.id}
        onClose={() => { setResume(null); setReload((n) => n + 1); }} onSaved={() => { setResume(null); setReload((n) => n + 1); }}
        onViewRequest={(id) => { setResume(null); setViewId(id); }} />}
      {viewId && <RequestDetailDialog jobId={viewId} own onClose={() => { setViewId(null); setReload((n) => n + 1); }} />}
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
  if (isProvider) return <ProviderPostShift />;
  return (
    <PickerShell
      title={isProvider ? "Post a Staffing Request" : "Post a Support Request"}
      description={isProvider ? "How soon do you need a worker?" : "How quickly do you need support?"}
      plain={isProvider}
    >
        {isProvider && <ProviderPostExtras />}
        {TIER_ORDER.map((tier) => {
          const meta = TIER_META[tier];
          return (
            <button
              key={tier}
              type="button"
              onClick={() => router.push(`/jobs/post/${meta.path}`)}
              style={isProvider ? undefined : { borderLeftWidth: 4, borderLeftColor: TIER_ACCENT[tier] }}
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
