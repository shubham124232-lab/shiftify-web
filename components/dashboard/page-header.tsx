import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  crumb?: string; // Provider breadcrumb header (no white band)
}

export function PageHeader({ title, description, actions, crumb }: PageHeaderProps) {
  if (crumb) {
    return (
      <div className="px-8 pt-6">
        <p className="m-0 text-xs text-slate-400">{crumb}</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {description ? <p className="m-0 mt-1.5 text-[15px] text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-6 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
