import Link from "next/link";

interface UpgradePromptProps {
  message: string;
}

// Renders the backend's own SUBSCRIPTION_LIMIT / SUBSCRIPTION_REQUIRED message
// as a styled upgrade nudge instead of plain error text — the dollar amounts
// live only in pricing_plans.md / seed.ts, never duplicated here.
export function UpgradePrompt({ message }: UpgradePromptProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <span>⚡</span>
        <span>{message}</span>
      </div>
      <Link
        href="/subscription"
        className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
      >
        View plans
      </Link>
    </div>
  );
}
