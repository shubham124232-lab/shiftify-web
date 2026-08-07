const SERVICES = [
  { title: "Emergency Support", desc: "Immediate 24/7 crisis support with verified workers dispatched within minutes." },
  { title: "Personal Care", desc: "Bathing, grooming, dressing and personal hygiene support tailored to you." },
  { title: "Daily Living Support", desc: "Help with everyday tasks — meal prep, medication, and household routines." },
  { title: "Community Participation", desc: "Get out and about — social outings, events, and community connection." },
  { title: "Overnight Care", desc: "Awake or sleepover overnight support for safety and peace of mind." },
  { title: "Disability Transport", desc: "Accessible, reliable transport to appointments, shopping, and activities." },
  { title: "Domestic Assistance", desc: "Housekeeping, laundry, grocery assistance, and home maintenance." },
  { title: "Nursing & Complex Care", desc: "Skilled nursing for complex medical needs, wound care, and medication management." },
  { title: "Respite Care", desc: "Short-term relief for carers — planned or emergency, in-home or residential." },
  { title: "Support Coordination", desc: "Expert coordinators to navigate your NDIS plan and connect you to services." },
  { title: "Therapy & Allied Health", desc: "OT, physio, speech therapy, and psychology from qualified NDIS therapists." },
  { title: "SIL / SDA Accommodation", desc: "Supported independent living and specialist disability accommodation." },
];

export function ServicesGrid() {
  return (
    <section id="services" className="container-page py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-brand-700">NDIS Services</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Everything You Need, <br /> In One Place
      </h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        From daily assistance to complex care — Shiftify connects you to the right support, right now.
      </p>

      <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-brand-50 p-5 text-center">
          <div className="text-3xl font-semibold text-brand-700">12+</div>
          <div className="text-sm text-slate-600">Service Types</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-5 text-center">
          <div className="text-3xl font-semibold text-emerald-700">2,400+</div>
          <div className="text-sm text-slate-600">Verified Workers</div>
        </div>
        <div className="rounded-2xl bg-amber-50 p-5 text-center">
          <div className="text-3xl font-semibold text-amber-700">24/7</div>
          <div className="text-sm text-slate-600">Available Support</div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-elevated transition-shadow">
            <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
            <a href="#services" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">Learn more →</a>
          </div>
        ))}
      </div>
    </section>
  );
}
