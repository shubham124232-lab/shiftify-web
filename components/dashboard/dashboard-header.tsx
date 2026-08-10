import type { ReactNode } from "react";

interface DashboardHeaderProps {
  name: string;
  description: string;
  actions?: ReactNode;
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ name, description, actions }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {timeGreeting()}, {name}
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
