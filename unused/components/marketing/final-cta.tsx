import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute -top-12 -left-12 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-400 blur-3xl" />
      </div>
      <div className="container-page relative py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
          Available 24/7 — Emergency Team On Standby
        </span>
        <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Support When Every Minute Matters
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/80">
          Whether it&apos;s an emergency or ongoing care, thousands of verified support workers are
          available across Australia right now.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/#emergency">
            <Button size="lg" variant="danger">Get Emergency Support Now</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="secondary">Create Free Account</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
