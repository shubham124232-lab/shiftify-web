import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { URGENCY_STYLE, SHIFT_TYPE_LABELS, FUNDING_LABELS } from "@/lib/constants/job-filters";

export interface Job {
  id: string;
  title: string;
  category: string;
  urgency: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
  estimatedHours: number | null;
  postedAt: string;
  applicationDeadlineAt?: string | null;
  status: string;
  isRecurring?: boolean;
  shiftType?: string;
  fundingType?: string;
  workerPreferences?: {
    workerType?: string;
    requiredQualifications?: string[];
    experienceLevel?: string;
  };
  budget?: { type: string; amount?: number };
  ownApplication?: { status: string } | null;
  featuredUntil?: string | null;
  matchSummary?: { met: string[]; missing: string[] };
  saved?: boolean;
  hidden?: boolean;
  postedByUserId?: string;
  isOwnRequest?: boolean;
  budgetPerHour?: number | null;
  totalBudget?: number | null;
  budgetType?: string | null;
  _count?: { applications: number };
}

export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Posted just now";
  if (mins < 60) return `Posted ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days} day${days !== 1 ? "s" : ""} ago`;
}

export function closesIn(dateStr: string): string | null {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs <= 0) return "Closes soon";
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `Closes in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Closes in ${days} day${days !== 1 ? "s" : ""}`;
}

export function JobCard({ job, canApply, applying, onApply, onView, onToggleSave, onToggleHide, showOwnerBadge }: {
  job: Job;
  canApply: boolean;
  applying: boolean;
  onApply: () => void;
  onView: () => void;
  onToggleSave: () => void;
  onToggleHide: () => void;
  showOwnerBadge?: boolean;
}) {
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.SCHEDULED;
  const isFeatured = !!job.featuredUntil && new Date(job.featuredUntil) > new Date();
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
  const applied = !!job.ownApplication;
  const qualsCount = job.workerPreferences?.requiredQualifications?.length ?? 0;
  const budgetStr = job.budget?.type === "HOURLY" && job.budget.amount
    ? `$${job.budget.amount}/hr`
    : job.budget?.type === "TOTAL" && job.budget.amount
    ? `$${job.budget.amount} total`
    : null;
  const isOwner = showOwnerBadge && job.isOwnRequest;

  return (
    <div className={cn("bg-white border rounded-2xl p-5 hover:border-brand-300 transition-colors", isFeatured ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200")}>
      <div className="flex gap-2 flex-wrap mb-3">
        {isOwner && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
            Your Request
          </span>
        )}
        {isFeatured && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            ⭐ Featured
          </span>
        )}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: urg.bg, color: urg.color }}>
          {job.urgency.replace("_", " ")}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {catLabel}
        </span>
        {job.shiftType && job.shiftType !== "STANDARD" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            {SHIFT_TYPE_LABELS[job.shiftType] ?? job.shiftType}
          </span>
        )}
        {job.isRecurring && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Recurring
          </span>
        )}
        {job.fundingType && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {FUNDING_LABELS[job.fundingType] ?? job.fundingType}
          </span>
        )}
      </div>

      <Link href={`/jobs/${job.id}`} className="block text-base font-semibold text-slate-900 hover:text-brand-600 mb-1.5 leading-snug">
        {job.title}
      </Link>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        <span>{job.suburb}, {job.state}</span>
        {job.estimatedHours && <span>{job.estimatedHours}h</span>}
        <span>{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
        {budgetStr && <span className="font-semibold text-emerald-700">{budgetStr}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-500">
          {timeAgo(job.postedAt)}
        </span>
        {job.applicationDeadlineAt && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-500">
            {closesIn(job.applicationDeadlineAt)}
          </span>
        )}
      </div>

      {job.matchSummary && (job.matchSummary.met.length > 0 || job.matchSummary.missing.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.matchSummary.met.map(label => (
            <span key={`met-${label}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              ✓ {label}
            </span>
          ))}
          {job.matchSummary.missing.map(label => (
            <span key={`missing-${label}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">
              ⚠ {label}
            </span>
          ))}
        </div>
      )}

      {qualsCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(job.workerPreferences?.requiredQualifications ?? []).slice(0, 3).map(q => (
            <span key={q} className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">{q}</span>
          ))}
          {qualsCount > 3 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">+{qualsCount - 3} more</span>}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-1">
        {canApply && (
          <>
            <Button size="sm" variant="ghost" onClick={onToggleSave}>{job.saved ? "★ Saved" : "☆ Save"}</Button>
            <Button size="sm" variant="ghost" onClick={onToggleHide}>Hide</Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={onView}>{isOwner ? "Manage" : "View"}</Button>
        {canApply && (
          <Button size="sm" variant={applied ? "ghost" : "outline"} disabled={applied || applying} onClick={() => !applied && onApply()}>
            {applied ? `Applied (${job.ownApplication!.status})` : applying ? "Applying..." : "Quick Apply"}
          </Button>
        )}
      </div>
    </div>
  );
}
