const ITEMS = [
  { title: "Verified Workers", body: "Every support worker undergoes identity verification, reference checks, and NDIS worker screening before joining." },
  { title: "NDIS Compliant", body: "Fully compliant with NDIS Quality and Safeguards Commission requirements. All providers are NDIS-registered." },
  { title: "Ratings & Reviews", body: "Transparent two-way reviews build accountability. See real feedback from real participants before you book." },
  { title: "Emergency Response", body: "Average emergency shift match in under 4 minutes. Our dedicated response team is on standby 24 hours a day." },
  { title: "Background Checked", body: "Police checks, Working with Children checks, and NDIS Worker Screening Clearance for every single worker." },
  { title: "Secure Messaging", body: "End-to-end encrypted messaging keeps your conversations private and your personal information safe." },
];

export function TrustSafety() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="container-page">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-700">NDIS Registered &amp; Verified Platform</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Your Safety Is Our Priority
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Shiftify&apos;s multi-layered safety framework means you can find support with confidence,
          knowing every worker is verified, insured, and NDIS-compliant.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="text-2xl font-semibold text-brand-700">8,200+</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Verified Workers</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="text-2xl font-semibold text-emerald-700">99.2%</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Safety Record</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="text-2xl font-semibold text-emergency-600">&lt;4 min</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Emergency Match</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="text-2xl font-semibold text-amber-600">4.9 ★</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Avg Rating</div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <div key={it.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <h3 className="text-base font-semibold text-slate-900">{it.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
