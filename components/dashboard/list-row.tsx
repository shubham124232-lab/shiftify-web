import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardListRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  rightLabel?: string;
  href?: string;
}

export function DashboardListRow({ icon, title, subtitle, badge, rightLabel, href }: DashboardListRowProps) {
  const body = (
    <div className="flex items-center gap-3 py-3">
      {icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {badge}
        {rightLabel ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
            {rightLabel}
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="-mx-6 block border-b border-slate-100 px-6 last:border-0 hover:bg-slate-50/60">
        {body}
      </Link>
    );
  }
  return <div className="-mx-6 border-b border-slate-100 px-6 last:border-0">{body}</div>;
}
