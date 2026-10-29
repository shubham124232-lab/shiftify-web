"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";

const CATEGORIES = ["Account access", "Billing and plan", "Organisation and access", "Staffing requests", "Listings and enquiries", "Documents and compliance", "Something else"];
const IMPACTS = ["General question", "Minor problem", "Blocking my work", "Urgent"];

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
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Raise a ticket</h1>
            <p>Explain the issue so the support team can understand it.</p>
          </div>
          <div className="pd-buttons">
            <Link href="/provider/help" className="pd-btn">My tickets</Link>
          </div>
        </div>
        {done ? (
          <section className="pd-panel pd-panel-pad">
            <h2>Ticket {done} submitted</h2>
            <p className="pd-card-body">Quote this reference if you contact support. You can follow its status under My tickets.</p>
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => router.push("/provider/help")}>Go to My tickets</button>
          </section>
        ) : (
          <section className="pd-panel">
            <div className="pd-panel-head"><h2>Issue details</h2></div>
            <div className="pd-panel-body">
              {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
              <div className="pd-grid2" style={{ marginBottom: 0 }}>
                <label className="pd-form-field">Subject *
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} /></label>
                <label className="pd-form-field">Category
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label className="pd-form-field">Related request / reference (optional)
                  <input value={relatedRef} onChange={(e) => setRelatedRef(e.target.value)} maxLength={100} /></label>
                <label className="pd-form-field">Impact
                  <select value={impact} onChange={(e) => setImpact(e.target.value)}>{IMPACTS.map((c) => <option key={c}>{c}</option>)}</select></label>
              </div>
              <label className="pd-form-field">What happened? *
                <textarea style={{ minHeight: 128 }} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000}
                  placeholder="Include the page, action and error message. Avoid unnecessary participant or health details." /></label>
              <button type="button" className="pd-btn pd-btn-primary" disabled={busy || subject.trim().length < 3 || description.trim().length < 10} onClick={submit}>{busy ? "Submitting…" : "Submit ticket"}</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
