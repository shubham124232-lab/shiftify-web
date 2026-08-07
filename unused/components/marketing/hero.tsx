import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-400 blur-3xl" />
      </div>

      <div className="container-page relative grid grid-cols-1 gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            2,400+ Active Support Workers Available Now
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Disability Support, <br />
            When Every <span className="text-emerald-300">Minute</span> Matters
          </h1>

          <p className="mt-6 max-w-xl text-base text-white/80">
            Australia&apos;s trusted NDIS marketplace connecting participants with verified
            support workers, providers, and coordinators — instantly. Emergency help
            available 24/7.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/jobs">
              <Button size="lg" variant="primary">Find Support Now</Button>
            </Link>
            <Link href="/#emergency">
              <Button size="lg" variant="secondary">Post Emergency Shift</Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
            <div className="flex items-center gap-1.5"><span>✓</span> NDIS Registered</div>
            <div className="flex items-center gap-1.5"><span>🛡️</span> Police Checked</div>
            <div className="flex items-center gap-1.5"><span>⏱️</span> 24/7 Support</div>
            <div className="flex items-center gap-1.5"><span>⭐</span> 4.9★ Rated</div>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-white/70">Available Nearby</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm">Support Workers</span>
              <span className="rounded-full bg-emergency-500 px-2 py-0.5 text-[10px] font-semibold uppercase">3 Emergency</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { initials: "SM", name: "Sarah M.", role: "Personal Care · 1.2km", status: "Available Now", rating: "4.9" },
                { initials: "DK", name: "David K.", role: "Daily Living · 2.1km", status: "In 30 min", rating: "4.8" },
                { initials: "PR", name: "Priya R.", role: "Overnight Care · 0.8km", status: "Available Now", rating: "5.0" },
              ].map((w) => (
                <div key={w.initials} className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-sm font-semibold">{w.initials}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{w.name}</div>
                    <div className="text-xs text-white/70">{w.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-300">{w.status}</div>
                    <div className="text-xs">★ {w.rating}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/80 backdrop-blur">
            <div className="flex items-center justify-between">
              <span>Avg Response</span>
              <span className="text-base font-semibold text-emerald-300">4 min ↑</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
