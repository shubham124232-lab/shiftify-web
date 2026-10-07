import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionTile {
  key: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  highlighted?: boolean;
  tone?: "brand" | "danger";
}

interface ActionTilesCardProps {
  title: string;
  tiles: ActionTile[];
  note?: string;
  className?: string;
}

export function ActionTilesCard({ title, tiles, note, className }: ActionTilesCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2",
            tiles.length === 3 && "xl:grid-cols-3",
            tiles.length >= 4 && "xl:grid-cols-4",
          )}
        >
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const danger = tile.tone === "danger";
            return (
              <div
                key={tile.key}
                className={cn(
                  "flex flex-col items-center rounded-2xl border p-3 text-center transition-colors",
                  tile.highlighted ? "border-brand-300 bg-brand-50/40" : "border-slate-200",
                )}
              >
                <span className={cn("mb-3 flex items-center justify-center", danger ? "text-red-600" : "text-brand-600")}>
                  <Icon className="h-14 w-14" strokeWidth={1.5} />
                </span>
                <h3 className="text-base font-bold text-slate-900">{tile.title}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{tile.subtitle}</p>
                <Link href={tile.href} className="mt-4 w-full">
                  <Button
                    size="sm"
                    variant={tile.highlighted ? "primary" : danger ? "danger" : "outline"}
                    className="w-full font-bold"
                  >
                    {tile.ctaLabel}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
        {note ? <p className="mt-4 text-xs text-slate-400">{note}</p> : null}
      </CardContent>
    </Card>
  );
}
