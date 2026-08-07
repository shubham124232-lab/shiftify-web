const STATS = [
  { value: "47,000+", label: "Shifts Completed" },
  { value: "8,200+", label: "Verified Workers" },
  { value: "12,400+", label: "Participants" },
  { value: "4.9 / 5", label: "Platform Rating" },
  { value: "<4 min", label: "Emergency Match" },
  { value: "$2.1M+", label: "Worker Earnings" },
];

export function StatsBand() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-semibold text-brand-700">{s.value}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
