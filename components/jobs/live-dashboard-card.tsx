import Link from "next/link";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";
import { timeAgo, type Job } from "@/components/jobs/job-card";
import { cn } from "@/lib/utils";
import { MapPin, CalendarDays, Clock, Lock, CheckCircle2, SlidersHorizontal, Star, EyeOff } from "lucide-react";

const DAY = 86_400_000;

/** "Today, 24 May 2025" / "Tomorrow, 25 May 2025" / "Sun, 25 May 2025". */
function formatDay(d: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const at = new Date(d); at.setHours(0, 0, 0, 0);
  const dayPart = at.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const delta = Math.round((at.getTime() - today.getTime()) / DAY);
  if (delta === 0) return `Today, ${dayPart}`;
  if (delta === 1) return `Tomorrow, ${dayPart}`;
  return `${at.toLocaleDateString("en-AU", { weekday: "short" })}, ${dayPart}`;
}

/** Overnight shifts span two dates — show both, as "Sun, 25 May – Mon, 26 May 2025". */
function formatSchedule(startAt: string, endAt?: string | null): string {
  const start = new Date(startAt);
  if (!endAt) return formatDay(start);
  const end = new Date(endAt);
  if (start.toDateString() === end.toDateString()) return formatDay(start);
  const left = start.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  const right = end.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${left} – ${right}`;
}

function timeRange(startAt: string, endAt?: string | null): string | null {
  if (!endAt) return null;
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  return `${new Date(startAt).toLocaleTimeString("en-AU", opts)} – ${new Date(endAt).toLocaleTimeString("en-AU", opts)}`;
}

function MetaRow({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] leading-5 text-slate-600">
      <Icon className="h-[15px] w-[15px] shrink-0 text-slate-400" strokeWidth={1.75} />
      <span className="truncate">{children}</span>
    </div>
  );
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
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.ROUTINE;
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
  const applied = !!job.ownApplication;
  const isOwner = !!job.isOwnRequest;
  const range = timeRange(job.scheduledStartAt, job.scheduledEndAt);
  const hours = job.estimatedHours != null
    ? `${job.estimatedHours} ${Number(job.estimatedHours) === 1 ? "hour" : "hours"}`
    : null;
  const rate = job.budgetPerHour
    ? { amount: `$${Number(job.budgetPerHour).toFixed(2)}`, unit: "/ hr" }
    : job.budgetType === "TOTAL" && job.totalBudget
    ? { amount: `$${Number(job.totalBudget).toFixed(2)}`, unit: "total" }
    : null;
  const skills = [catLabel, ...(job.workerPreferences?.requiredQualifications ?? [])].filter(Boolean).slice(0, 3);

  // Every state here is real — who owns the request, whether this account may
  // apply, and whether it already has. There is no access/lock field on a job.
  const footer = isOwner
    ? { icon: SlidersHorizontal, title: "Your request", sub: "Manage applications", cta: "Manage", primary: false }
    : applied
    ? { icon: CheckCircle2, title: "Application sent", sub: "Awaiting response", cta: "View details", primary: false }
    : canApply
    ? { icon: CheckCircle2, title: "Open for applications", sub: "Apply or accept now", cta: "Apply now", primary: true }
    : { icon: Lock, title: "View only", sub: "Workers can apply", cta: "View details", primary: false };
  const FooterIcon = footer.icon;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift">
      <div className="flex flex-1 flex-col p-5">
        {/* Urgency is the only saturated colour above the footer. */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center rounded-md px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.07em] text-white"
            style={{ background: urg.solid }}
          >
            {job.urgency.replace("_", " ")}
          </span>
          <span className="shrink-0 pt-0.5 text-[11px] text-slate-400">{timeAgo(job.postedAt)}</span>
        </div>

        <Link
          href={`/jobs/${job.id}`}
          className="line-clamp-2 text-[16px] font-semibold leading-[1.35] tracking-[-0.011em] text-slate-900 decoration-slate-300 underline-offset-4 transition-colors hover:underline"
        >
          {job.title}
        </Link>

        <div className="mt-3.5 space-y-2">
          <MetaRow icon={MapPin}>{job.suburb}, {job.state}</MetaRow>
          <MetaRow icon={CalendarDays}>{formatSchedule(job.scheduledStartAt, job.scheduledEndAt)}</MetaRow>
          {(range || hours) && (
            <MetaRow icon={Clock}>
              <span className="tabular-nums">{range}</span>
              {range && hours && <span className="mx-1.5 text-slate-300">·</span>}
              {hours}
            </MetaRow>
          )}
        </div>

        {rate && (
          <div className="mt-4 flex items-baseline gap-1.5 border-t border-slate-100 pt-3.5">
            <span className="text-[17px] font-bold tabular-nums tracking-[-0.02em] text-slate-900">{rate.amount}</span>
            <span className="text-[13px] font-medium text-slate-500">{rate.unit}</span>
            <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.06em] text-slate-400">Indicative</span>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span
                  key={s}
                  className="inline-flex max-w-full items-center truncate rounded-md border border-[var(--td-chip-line)] bg-[var(--td-chip-soft)] px-2 py-[3px] text-[11px] font-medium text-[var(--td-chip-ink)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Keeps the footer flush with the bottom on shorter cards. */}
        <div className="flex-1" />
      </div>

      <div className="flex items-center gap-3 border-t border-brand-100 bg-brand-50/50 px-5 py-3.5">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 ring-1 ring-brand-100"
        >
          <FooterIcon className="h-[15px] w-[15px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-tight text-slate-900">{footer.title}</p>
          <p className="truncate text-[11px] leading-tight text-brand-700/70">{footer.sub}</p>
        </div>

        {canApply && (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onToggleSave}
              aria-label={job.saved ? "Remove from saved" : "Save job"}
              aria-pressed={job.saved}
              className="rounded-lg p-1.5 text-brand-400 transition-colors hover:bg-white hover:text-brand-700"
            >
              <Star className={cn("h-4 w-4", job.saved && "fill-current text-brand-600")} />
            </button>
            <button
              type="button"
              onClick={onToggleHide}
              aria-label="Hide job"
              className="rounded-lg p-1.5 text-brand-400 transition-colors hover:bg-white hover:text-brand-700"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => (footer.primary && !applied ? onApply() : onView())}
          disabled={applying}
          className={cn(
            "shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            footer.primary
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "border border-brand-200 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50",
          )}
        >
          {applying ? "Applying…" : footer.cta}
        </button>
      </div>
    </article>
  );
}
