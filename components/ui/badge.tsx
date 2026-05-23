import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "slate" | "brand" | "emerald" | "amber" | "rose" | "red" | "orange" | "violet" | "sky";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-brand-100 text-brand-800",
  emerald: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
  red: "bg-red-100 text-red-800",
  orange: "bg-orange-100 text-orange-800",
  violet: "bg-violet-100 text-violet-800",
  sky: "bg-sky-100 text-sky-800",
};

export function Badge({ className, tone = "slate", ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
