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
        <p className="m-0 mb-4 text-xs text-[#9095a0]">{crumb}</p>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-slate-900">{title}</h1>
            {description ? <p className="m-0 mt-2 max-w-[760px] text-sm text-[#69707e]">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">{actions}</div> : null}
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
