// Placeholder until 1B builds the full wizard.
import Link from "next/link";

export default function ParticipantRegisterPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Participant registration</h1>
      <p className="mt-2 text-sm text-slate-600">
        The full participant wizard arrives in Sub-phase 1B. For now, log in with one of the
        seeded test accounts to see the dashboard shells.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-800">Test participant</p>
        <p className="text-slate-600">alice.participant@shiftify.local / Password@123</p>
      </div>
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
        Go to login →
      </Link>
    </div>
  );
}
