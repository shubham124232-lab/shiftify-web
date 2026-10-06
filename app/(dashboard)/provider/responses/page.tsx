"use client";

// Provider PR-D04 "Responses & Enquiries" — messages sent to the provider before
// any shift exists, plus a pointer to shift-specific invitations.

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";

interface Inquiry {
  id: string; body: string; createdAt: string; readAt: string | null;
  sender: { id: string; name: string };
}

export default function ProviderResponsesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ inquiries: Inquiry[] }>("/direct-inquiries/received")
      .then(r => setItems(r.inquiries ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    try {
      await api.patch(`/direct-inquiries/${id}/read`, {});
      setItems(prev => prev.map(i => i.id === id ? { ...i, readAt: new Date().toISOString() } : i));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    }
  }

  return (
    <>
      <PageHeader title="Responses & Enquiries" description="Enquiries sent to your organisation, and responses to your staffing requests." />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex gap-2 flex-wrap mb-5">
          <Link href="/jobs/my" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">
            Responses to my requests
          </Link>
          <Link href="/job-invites" className="h-8 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline inline-flex items-center">
            Job invitations
          </Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700 mb-4">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base font-semibold text-slate-700">No enquiries yet</p>
            <p className="text-sm text-slate-400 mt-1">Messages sent to your organisation will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map(i => (
              <div key={i.id} className={`bg-white border rounded-xl px-4.5 py-3.5 ${i.readAt ? "border-slate-200" : "border-indigo-300"}`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-bold text-slate-800">{i.sender.name}</span>
                  <span className="text-xs text-slate-400">{new Date(i.createdAt).toLocaleDateString("en-AU")}</span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{i.body}</p>
                {!i.readAt && (
                  <button type="button" onClick={() => markRead(i.id)} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
