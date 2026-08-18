import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface QuickAction {
  key: string;
  icon: LucideIcon;
  label: string;
  href: string;
  disabled?: boolean;
}

export function QuickActionsPanel({ actions, className }: { actions: QuickAction[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <ul>
          {actions.map((a) => {
            const Icon = a.icon;
            const row = (
              <>
                <span
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border " +
                    (a.disabled ? "border-slate-200 text-slate-300" : "border-brand-200 text-brand-600")
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={"flex-1 text-sm font-medium " + (a.disabled ? "text-slate-400" : "text-slate-700")}>
                  {a.label}
                </span>
                <ChevronRight className={"h-4 w-4 shrink-0 " + (a.disabled ? "text-slate-200" : "text-slate-300")} />
              </>
            );
            return (
              <li key={a.key}>
                {a.disabled ? (
                  <div className="-mx-6 flex cursor-not-allowed items-center gap-3 border-b border-slate-100 px-6 py-3 last:border-0">
                    {row}
                  </div>
                ) : (
                  <Link
                    href={a.href}
                    className="-mx-6 flex items-center gap-3 border-b border-slate-100 px-6 py-3 last:border-0 hover:bg-slate-50/60"
                  >
                    {row}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
