import Link from "next/link";
import { SideMarketingPanel } from "@/components/layout/side-marketing-panel";
import { EmergencyFab } from "@/components/layout/emergency-fab";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <SideMarketingPanel />
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              S
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900">Shiftify</span>
          </Link>
          {/* Per-page CTA goes inside children */}
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
      <EmergencyFab />
    </div>
  );
}
