import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { URGENCY_STYLE, FUNDING_LABELS } from "@/lib/constants/job-filters";
import { timeAgo, type Job } from "@/components/jobs/job-card";
import { MapPin, Calendar, Clock, Hourglass, DollarSign, Users } from "lucide-react";

function timeRange(startAt: string, endAt?: string | null): string | null {
  if (!endAt) return null;
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  return `${new Date(startAt).toLocaleTimeString("en-AU", opts)} – ${new Date(endAt).toLocaleTimeString("en-AU", opts)}`;
}

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
    ? `$${Number(job.budgetPerHour)}/hr (Indicative)`
    : job.budgetType === "TOTAL" && job.totalBudget
    ? `$${Number(job.totalBudget)} total`
    : null;
  const range = timeRange(job.scheduledStartAt, job.scheduledEndAt);
  const skills = [catLabel, ...(job.workerPreferences?.requiredQualifications ?? [])].filter(Boolean).slice(0, 3);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: urg.color }}>
              {job.urgency.replace("_", " ")}
            </span>
            {isOwner && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-brand-100 text-brand-700">
                Your Request
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
            {timeAgo(job.postedAt)}
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: urg.color }} />
          </span>
        </div>

        <Link href={`/jobs/${job.id}`} className="block text-base font-bold text-slate-900 hover:text-brand-600 leading-snug mb-2.5">
          {job.title}
        </Link>

        <div className="space-y-1.5 text-sm text-slate-600 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{job.suburb}, {job.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{new Date(job.scheduledStartAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          {range && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{range}</span>
            </div>
          )}
          {job.estimatedHours != null && (
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{job.estimatedHours} hours</span>
            </div>
          )}
          {rateStr && (
            <div className="flex items-center gap-2 font-semibold text-emerald-700">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>{rateStr}</span>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.fundingType && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
              {FUNDING_LABELS[job.fundingType] ?? job.fundingType}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5" />
          {applicantCount} application{applicantCount === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          {canApply && (
            <>
              <Button size="sm" variant="ghost" onClick={onToggleSave}>{job.saved ? "★" : "☆"}</Button>
              <Button size="sm" variant="ghost" onClick={onToggleHide}>Hide</Button>
            </>
          )}
          <button
            type="button"
            onClick={onView}
            className="h-8 px-4 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: urg.color }}
          >
            {isOwner ? "Manage" : "View Details"}
          </button>
          {canApply && (
            <Button size="sm" variant={applied ? "ghost" : "primary"} disabled={applied || applying} onClick={() => !applied && onApply()}>
              {applied ? "Applied" : applying ? "Applying…" : "Quick Apply"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
