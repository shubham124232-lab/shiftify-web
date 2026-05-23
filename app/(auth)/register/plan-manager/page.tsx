import Link from "next/link";

export default function PlanManagerRegisterPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Plan Manager registration</h1>
      <p className="mt-2 text-sm text-slate-600">
        The full plan manager wizard arrives in Sub-phase 1B.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-800">Test plan manager</p>
        <p className="text-slate-600">pm@shiftify.local / Password@123</p>
      </div>
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
        Go to login →
      </Link>
    </div>
  );
}
