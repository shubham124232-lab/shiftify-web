import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { URGENCY_STYLE, FUNDING_LABELS } from "@/lib/constants/job-filters";
import { timeAgo, type Job } from "@/components/jobs/job-card";
import { MapPin, Users, Clock } from "lucide-react";

export function LiveDashboardCard({ job, canApply, applying, onApply, onView, onToggleSave, onToggleHide }: {
  job: Job;
  canApply: boolean;
  applying: boolean;
  onApply: () => void;
  onView: () => void;
  onToggleSave: () => void;
  onToggleHide: () => void;
}) {
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.SCHEDULED;
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
  const applied = !!job.ownApplication;
  const isOwner = !!job.isOwnRequest;
  const applicantCount = job._count?.applications ?? 0;
  const rateStr = job.budgetPerHour
    ? `$${Number(job.budgetPerHour)}/hr`
    : job.budgetType === "TOTAL" && job.totalBudget
    ? `$${Number(job.totalBudget)} total`
    : null;

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:border-brand-300 transition-all"
      style={{ borderLeft: `4px solid ${urg.color}` }}
    >
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide" style={{ background: urg.bg, color: urg.color }}>
            {job.urgency.replace("_", " ")}
          </span>
          {isOwner && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-700">
              Your Request
            </span>
          )}
        </div>

        <Link href={`/jobs/${job.id}`} className="block text-sm font-semibold text-slate-900 hover:text-brand-600 leading-snug mb-1">
          {job.title}
        </Link>
        <p className="text-xs text-slate-500 mb-3">{catLabel}</p>

        <div className="space-y-1.5 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{job.suburb}, {job.state}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{applicantCount} applicant{applicantCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.isRecurring && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">Recurring</span>
          )}
          {job.fundingType && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
              {FUNDING_LABELS[job.fundingType] ?? job.fundingType}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2 border-t border-slate-100">
          <div>
            {rateStr && <p className="text-sm font-bold text-emerald-700">{rateStr}</p>}
            <p className="text-[11px] text-slate-400">{timeAgo(job.postedAt)}</p>
          </div>
        </div>
      </div>

      <div className={cn("flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-t border-slate-100", canApply ? "justify-between" : "justify-end")}>
        {canApply && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onToggleSave}>{job.saved ? "★ Saved" : "☆ Save"}</Button>
            <Button size="sm" variant="ghost" onClick={onToggleHide}>Hide</Button>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onView}>{isOwner ? "Manage" : "View"}</Button>
          {canApply && (
            <Button size="sm" variant={applied ? "ghost" : "primary"} disabled={applied || applying} onClick={() => !applied && onApply()}>
              {applied ? `Applied` : applying ? "Applying…" : "Quick Apply"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
