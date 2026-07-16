import Link from "next/link";

const ROLES = [
  {
    title: "Participants",
    body: "Find verified support workers instantly. Browse, book, and manage your NDIS support from one simple dashboard.",
    bullets: ["Search by service, location & availability", "Instant emergency shift requests", "NDIS plan budget tracking", "Secure messaging & scheduling"],
    cta: "Find Support",
  },
  {
    title: "Support Workers",
    body: "Build your own carer business. Set your hours, choose your clients, and grow your reputation on Shiftify.",
    bullets: ["Flexible shift scheduling", "Emergency shift alerts nearby", "NDIS-compliant invoicing", "Performance ratings & rewards"],
    cta: "Join as Worker",
  },
  {
    title: "Providers",
    body: "Grow your registered provider business. List services, recruit workers, and manage your team in one place.",
    bullets: ["Provider profile & marketplace listing", "Team management dashboard", "Bulk shift management", "Analytics & performance reports"],
    cta: "List as Provider",
  },
  {
    title: "Support Coordinators",
    body: "Coordinate support seamlessly across multiple participants. Manage plans, track budgets, and place workers fast.",
    bullets: ["Multi-participant dashboard", "Plan budget visibility", "Emergency escalation tools", "Compliance documentation"],
    cta: "Coordinator Access",
  },
  {
    title: "Plan Managers",
    body: "Simplify NDIS plan management. Handle invoices, payments, and reporting without the administrative chaos.",
    bullets: ["Automated NDIS invoicing", "Real-time budget tracking", "Participant expense reports", "Compliant payment processing"],
    cta: "Manage Plans",
  },
];

export function RoleCoverage() {
  return (
    <section id="about" className="container-page py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-brand-700">Who Uses Shiftify</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        One Platform, Every Role
      </h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        Shiftify is purpose-built for the entire NDIS ecosystem — from participants to plan managers.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">{r.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{r.body}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {r.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2"><span className="text-emerald-500">•</span> {b}</li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href="/register" className="inline-block text-sm font-semibold text-brand-700 hover:underline">
                {r.cta} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
