import type { ReactNode } from "react";

interface DashboardHeaderProps {
  name: string;
  /** When set, replaces the time-of-day greeting (e.g. "My Dashboard"). */
  title?: string;
  /** Small breadcrumb line above the title (e.g. "Provider / My Dashboard"). */
  breadcrumb?: string;
  description: string;
  actions?: ReactNode;
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ name, title, breadcrumb, description, actions }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {breadcrumb ? <p className="mb-1 text-xs text-slate-400">{breadcrumb}</p> : null}
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title ?? `${timeGreeting()}, ${name}`}
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
