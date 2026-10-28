"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DashboardTab {
  key: string;
  label: string;
  count?: number;
  content: ReactNode;
}

interface DashboardTabCardProps {
  title: string;
  headerAction?: ReactNode;
  tabs: DashboardTab[];
}

export function DashboardTabCard({ title, headerAction, tabs }: DashboardTabCardProps) {
  const [active, setActive] = useState(tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {headerAction}
      </CardHeader>
      <div className="flex gap-5 border-b border-slate-100 px-6 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "relative -mb-px border-b-2 pb-3 text-sm font-semibold transition-colors",
              tab.key === activeTab?.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>
      <CardContent className="py-2">{activeTab?.content}</CardContent>
    </Card>
  );
}
