"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS_NEED = [
  { n: 1, title: "Create Your Profile", body: "Tell us about your support needs, NDIS plan details, and location in minutes." },
  { n: 2, title: "Search & Browse", body: "Find verified workers filtered by service type, distance, availability, and reviews." },
  { n: 3, title: "Connect & Book", body: "Message workers directly, agree on details, and confirm shifts securely in-app." },
  { n: 4, title: "Get Support", body: "Your worker arrives, delivers care, and you rate the experience. Simple as that." },
];

const STEPS_GIVE = [
  { n: 1, title: "Build Your Profile", body: "Tell us your skills, certifications, availability, and the services you offer." },
  { n: 2, title: "Browse Open Shifts", body: "Find requests near you that match your skills and schedule." },
  { n: 3, title: "Apply & Accept", body: "Apply to requests or accept assignments and confirm bookings in-app." },
  { n: 4, title: "Deliver Support", body: "Show up, deliver great support, get paid. Build your reputation with reviews." },
];

export function HowItWorks() {
  const [tab, setTab] = useState<"need" | "give">("need");
  const steps = tab === "need" ? STEPS_NEED : STEPS_GIVE;

  return (
    <section id="how-it-works" className="container-page py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-brand-700">How It Works</p>
      <div className="mt-2 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Up and Running in Minutes
        </h2>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-card">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "need" ? "bg-brand-600 text-white" : "text-slate-600"}`}
            onClick={() => setTab("need")}
          >
            I Need Support
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "give" ? "bg-brand-600 text-white" : "text-slate-600"}`}
            onClick={() => setTab("give")}
          >
            I Give Support
          </button>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-slate-600">Two journeys, one simple platform.</p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-base font-semibold text-white">
              {s.n}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/register">
          <Button size="lg">{tab === "need" ? "Find My Support Now" : "Join as a Worker"}</Button>
        </Link>
      </div>
    </section>
  );
}
