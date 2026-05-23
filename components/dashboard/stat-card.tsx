import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "danger";
}

const tones = {
  default: "text-slate-900",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-emergency-700",
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold", tones[tone])}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}
