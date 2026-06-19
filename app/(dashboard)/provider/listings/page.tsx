"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Placeholder listing data — replace with GET /provider/listings when backend endpoint exists.
const MOCK_LISTINGS = [
  { id: "l1", type: "SERVICE",    title: "Personal Care Capacity — South West Sydney",   status: "Live",   views: 42, enquiries: 6 },
  { id: "l2", type: "SIL",        title: "SIL Vacancy — 2 Beds Available in Liverpool",  status: "Live",   views: 18, enquiries: 3 },
  { id: "l3", type: "WORKFORCE",  title: "Urgent Support Worker Needed — Community Access", status: "Live", views: 31, enquiries: 8 },
  { id: "l4", type: "SERVICE",    title: "Overnight Support Capacity Open",              status: "Paused", views: 7,  enquiries: 1 },
];

const TYPE_BADGE: Record<string, string> = {
  SERVICE:   "bg-blue-100 text-blue-700",
  SIL:       "bg-purple-100 text-purple-700",
  SDA:       "bg-violet-100 text-violet-700",
  WORKFORCE: "bg-amber-100 text-amber-700",
};

const STATUS_BADGE: Record<string, string> = {
  Live:   "bg-emerald-100 text-emerald-700",
  Paused: "bg-slate-100 text-slate-500",
  Draft:  "bg-yellow-100 text-yellow-700",
  Filled: "bg-sky-100 text-sky-700",
};

const TABS = ["All", "Service", "SIL / SDA", "Workforce", "Drafts", "Paused", "Filled"];

export default function ProviderListingsPage() {
  return (
    <>
      <PageHeader
        title="My Listings"
        description="Manage your service availability, SIL/SDA vacancies, and workforce requests."
        actions={
          <div className="flex gap-2">
            <Link href="/provider/post-service"><Button>Post Service</Button></Link>
            <Link href="/provider/sil-vacancy"><Button variant="outline" size="sm">SIL/SDA Vacancy</Button></Link>
            <Link href="/provider/workforce"><Button variant="outline" size="sm">Workforce Request</Button></Link>
          </div>
        }
      />

      <div className="container-page py-8 space-y-6">
        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Active Listings ({MOCK_LISTINGS.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {MOCK_LISTINGS.map(l => (
                <li key={l.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{l.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE[l.type] ?? "bg-slate-100 text-slate-500"}`}>{l.type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[l.status] ?? "bg-slate-100 text-slate-500"}`}>{l.status}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    <p>{l.views} views</p>
                    <p>{l.enquiries} enquiries</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Pause</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400 text-center">
          Listing data is placeholder. Backend endpoint <code>/provider/listings</code> is pending.
        </p>
      </div>
    </>
  );
}
