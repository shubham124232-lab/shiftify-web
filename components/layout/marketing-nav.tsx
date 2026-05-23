"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Shiftify</span>
        </Link>

        <nav className="hidden gap-7 text-sm font-medium text-slate-700 md:flex">
          <Link href="/#how-it-works" className="hover:text-brand-700">How It Works</Link>
          <Link href="/#services" className="hover:text-brand-700">Services</Link>
          <Link href="/jobs" className="hover:text-brand-700">Marketplace</Link>
          <Link href="/#about" className="hover:text-brand-700">About</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
