"use client";

import Link from "next/link";

export interface ListingInquiry {
  id: string;
  listingId: string | null;
  body: string;
  status: string;
  createdAt: string;
  sender?: { id: string; name: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "New", RESPONDED: "Responded", FOLLOW_UP: "Follow-up", CONVERTED: "Converted", CLOSED: "Closed",
  QUALIFIED: "Qualified", INSPECTION: "Inspection", IN_PROGRESS: "In progress",
};

// Enquiries received about one listing (service capacity or housing vacancy).
export function ListingEnquiries({ inquiries }: { inquiries: ListingInquiry[] }) {
  if (inquiries.length === 0) {
    return <p className="m-0 text-sm text-slate-500">No enquiries on this listing yet.</p>;
  }
  return (
    <ul className="m-0 list-none divide-y divide-slate-100 p-0">
      {inquiries.map((q) => (
        <li key={q.id} className="flex items-start justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-slate-900">{q.sender?.name ?? "Enquirer"}</p>
            <p className="m-0 mt-0.5 line-clamp-2 text-xs text-slate-500">{q.body}</p>
            <p className="m-0 mt-0.5 text-xs text-slate-400">{new Date(q.createdAt).toLocaleDateString("en-AU")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{STATUS_LABEL[q.status] ?? q.status}</span>
            <Link href="/messages" className="text-xs font-semibold text-brand-600 hover:underline">Reply</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
