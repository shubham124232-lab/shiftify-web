import Link from "next/link";

export function EmergencyFab() {
  return (
    <Link
      href="/#emergency"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-emergency-600 px-4 py-3 text-sm font-semibold text-white shadow-elevated hover:bg-emergency-700"
    >
      <span className="text-base" aria-hidden>🆘</span>
      Emergency Support
    </Link>
  );
}
