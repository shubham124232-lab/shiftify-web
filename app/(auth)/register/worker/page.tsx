import Link from "next/link";

export default function WorkerRegisterPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Support Worker registration</h1>
      <p className="mt-2 text-sm text-slate-600">
        The full worker wizard arrives in Sub-phase 1B.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-800">Test worker</p>
        <p className="text-slate-600">bob.worker@shiftify.local / Password@123</p>
      </div>
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
        Go to login →
      </Link>
    </div>
  );
}
