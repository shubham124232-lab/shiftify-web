"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { inp } from "@/components/jobs/post/shared";

const CATEGORIES = ["Account access", "Billing and plan", "Organisation and access", "Staffing requests", "Listings and enquiries", "Documents and compliance", "Something else"];
const IMPACTS = ["General question", "Minor problem", "Blocking my work", "Urgent"];
const label = "block text-sm font-semibold text-slate-900";

// Provider "Raise a ticket" (approved demo, doc P82). A reference number is returned so the case can be quoted to support.
export default function RaiseTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [relatedRef, setRelatedRef] = useState("");
  const [impact, setImpact] = useState(IMPACTS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ ticket: { reference: string } }>("/support-tickets", {
        subject: subject.trim(), category, impact, relatedRef: relatedRef.trim() || null, description: description.trim(),
      });
      setDone(r.ticket.reference);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not submit your ticket"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5 px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Raise a ticket</h1>
          <p className="m-0 mt-1.5 text-[15px] text-slate-500">Explain the issue so the support team can understand it.</p>
        </div>
        <Link href="/provider/help"><Button variant="outline">My tickets</Button></Link>
      </div>
      {done ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6">
          <p className="m-0 text-lg font-bold text-emerald-800">Ticket {done} submitted</p>
          <p className="m-0 mt-1 text-sm text-emerald-700">Quote this reference if you contact support. You can follow its status under My tickets.</p>
          <Button className="mt-4" onClick={() => router.push("/provider/help")}>Go to My tickets</Button>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <h2 className="m-0 border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-900">Issue details</h2>
          <div className="space-y-5 px-6 py-5">
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="grid gap-5 md:grid-cols-2">
              <label className={label}>Subject <span className="text-brand-600">*</span>
                <input className={`${inp} mt-1 w-full`} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} /></label>
              <label className={label}>Category
                <select className={`${inp} mt-1 w-full`} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className={label}>Related request / reference (optional)
                <input className={`${inp} mt-1 w-full`} value={relatedRef} onChange={(e) => setRelatedRef(e.target.value)} maxLength={100} /></label>
              <label className={label}>Impact
                <select className={`${inp} mt-1 w-full`} value={impact} onChange={(e) => setImpact(e.target.value)}>{IMPACTS.map((c) => <option key={c}>{c}</option>)}</select></label>
            </div>
            <label className={label}>What happened? <span className="text-brand-600">*</span>
              <textarea className={`${inp} mt-1 h-32 w-full py-2`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000}
                placeholder="Include the page, action and error message. Avoid unnecessary participant or health details." /></label>
            <Button disabled={busy || subject.trim().length < 3 || description.trim().length < 10} onClick={submit}>{busy ? "Submitting…" : "Submit ticket"}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
