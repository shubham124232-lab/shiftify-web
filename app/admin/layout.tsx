"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/verification", label: "Verification Queue" },
  { href: "/admin/users", label: "All Users" },
  { href: "/admin/audit", label: "Audit Log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/admin");
    if (status === "authenticated" && user && user.activeRole !== "ADMIN") router.replace("/dashboard");
  }, [status, user, router]);

  if (status === "loading" || !user || user.activeRole !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        <Spinner /> <span className="ml-2">Loading admin console…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-200 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            S
          </span>
          <div>
            <div className="text-sm font-semibold text-white">Shiftify</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Admin Console</div>
          </div>
        </div>
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {ADMIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium",
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "bg-brand-600 text-white"
                      : "text-slate-300 hover:bg-slate-800",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-slate-800 p-3">
          <div className="text-xs text-slate-400">{user.email}</div>
          <div className="text-xs text-slate-500">{user.adminTier ?? "ADMIN"}</div>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={async () => { await logout(); router.replace("/login"); }}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
