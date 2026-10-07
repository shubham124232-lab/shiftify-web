export function Testimonials() {
  return (
    <section className="container-page py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-brand-700">Testimonials</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Real People, Real Support
      </h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        Thousands of Australians trust Shiftify every day for critical disability support.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="text-xs font-semibold uppercase tracking-wider text-emergency-600">Emergency Support</div>
        <blockquote className="mt-4 text-lg text-slate-700">
          “My carer cancelled at 9pm and I panicked. Within 6 minutes of posting on Shiftify,
          a verified worker confirmed. Honestly a lifesaver — I don&apos;t know what I would
          have done without this platform.”
        </blockquote>
        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">DM</div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Deborah M.</div>
            <div className="text-xs text-slate-500">NDIS Participant · Melbourne, VIC</div>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
        </div>
      </div>
    </section>
  );
}
