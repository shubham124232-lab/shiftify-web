// Left panel shown on the split-screen auth layout.
export function SideMarketingPanel() {
  return (
    <aside className="relative hidden h-full overflow-hidden bg-hero-gradient text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute -top-12 -left-12 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-pink-400 blur-3xl" />
      </div>

      <div className="relative z-10 px-12 pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Trusted NDIS Marketplace
        </span>
        <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight">
          Support when every minute matters
        </h1>
        <p className="mt-4 max-w-md text-sm text-white/80">
          Connecting participants, support workers, and providers across Australia —
          fast, safe, and NDIS compliant.
        </p>

        <ul className="mt-10 space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">checkmark</span>
            <div>
              <p className="font-semibold">NDIS Registered &amp; Compliant</p>
              <p className="text-white/70">Fully certified platform</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">shield</span>
            <div>
              <p className="font-semibold">Verified Support Workers</p>
              <p className="text-white/70">100% background checked</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">clock</span>
            <div>
              <p className="font-semibold">Emergency Response 24/7</p>
              <p className="text-white/70">Average 8-min response</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="relative z-10 px-12 pb-12">
        <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-8 text-center">
          <div>
            <div className="text-2xl font-semibold">12K+</div>
            <div className="text-xs text-white/70">Support Workers</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">98%</div>
            <div className="text-xs text-white/70">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">24/7</div>
            <div className="text-xs text-white/70">Emergency Cover</div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
          247 support requests active right now
        </div>
      </div>
    </aside>
  );
}
