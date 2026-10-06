"use client";

// Public profile of a Support Worker or Provider (no contact details or documents). For a Provider it shows
// verification badge, capabilities and active capacity / Home and Living listings, each with an Enquire button
// (Provider doc PR-PF01 / PR-CP02). Enquiries are free for the Provider to receive and answer.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

const categoryLabel = (v: string) => JOB_CATEGORIES.find((c) => c.value === v)?.label ?? v;

interface Listing {
  id: string; listingCategory: "SERVICE" | "HOUSING"; title: string; description: string; suburb: string; state: string | null;
  acceptingStatus: string | null; serviceCategories: string[] | null; daysAvailable: string[] | null;
  responseExpectation: string | null; fundingTypes: string[] | null; vacancyCategory: string | null; listingExpiresAt: string | null;
}
interface ProfileFields {
  businessName?: string; businessDescription?: string; logoUrl?: string | null; verification?: string;
  currentCapacityStatus?: string | null; averageRating?: number; totalRatings?: number; rating?: number; totalReviews?: number;
  introSummary?: string | null; coreServices?: string[] | null; servicesOffered?: string[] | null; stateCoverage?: string[] | null;
  languages?: string[] | null; accessibilityCapabilities?: string[] | null; culturalCapabilities?: string[] | null;
  enquiryPreference?: string | null; suburb?: string | null; state?: string | null;
}
interface ProfileResponse {
  kind: "PROVIDER" | "SUPPORT_WORKER";
  user: { id: string; name: string; avatarUrl: string | null; phoneVerified: boolean };
  profile: ProfileFields | null;
  listings: Listing[];
}

const ACCEPTING: Record<string, string> = { YES: "Accepting new Participants", LIMITED: "Limited availability", NO: "Not accepting new Participants right now" };
const RESPONSE: Record<string, string> = { SAME_DAY: "Usually replies the same day", WITHIN_48_HOURS: "Usually replies within 48 hours", WITHIN_A_WEEK: "Usually replies within a week" };
const CONTACT: Record<string, string> = { IN_APP: "Messages in Shiftify", EMAIL: "Email", PHONE: "Phone" };

function Chips({ items, labels }: { items?: string[] | null; labels?: boolean }) {
  if (!items || items.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5">{items.map((i) => <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{labels ? categoryLabel(i) : i}</span>)}</div>;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enquiryFor, setEnquiryFor] = useState<string | null>(null); // listing id, or "profile" for a general enquiry
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    api.get<ProfileResponse>(`/public-profiles/${id}`).then(setData).catch((e: Error) => setError(e.message));
  }, [id]);

  async function sendEnquiry() {
    if (!body.trim() || !data) return;
    setSending(true); setError(null);
    try {
      await api.post("/direct-inquiries", {
        recipientUserId: data.user.id, body: body.trim(),
        ...(enquiryFor && enquiryFor !== "profile" ? { listingId: enquiryFor } : {}),
      });
      setSent("Enquiry sent. It is free for the provider to receive and answer.");
      setBody(""); setEnquiryFor(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the enquiry.");
    } finally { setSending(false); }
  }

  if (error && !data) return <div className="container-page py-10 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="container-page py-10 text-sm text-slate-500">Loading…</div>;

  const p: ProfileFields = data.profile ?? {};
  const isProvider = data.kind === "PROVIDER";
  const isSelf = user?.id === data.user.id;
  const title = isProvider ? (p.businessName || data.user.name) : data.user.name;

  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <button type="button" onClick={() => router.back()} className="text-sm text-slate-500 hover:underline">← Back</button>

      <Card>
        <CardContent className="flex items-start gap-4 py-5">
          {(isProvider ? p.logoUrl : data.user.avatarUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(isProvider ? p.logoUrl : data.user.avatarUrl) as string} alt={title} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-600">{title.charAt(0).toUpperCase()}</div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="m-0 text-xl font-bold text-slate-900">{title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                {isProvider ? p.verification : data.user.phoneVerified ? "Mobile verified" : "Mobile not verified"}
              </span>
              {isProvider && p.currentCapacityStatus && <span className="font-semibold text-slate-600">Capacity: {String(p.currentCapacityStatus).toLowerCase()}</span>}
              {((isProvider ? p.totalRatings : p.totalReviews) ?? 0) > 0 && (
                <span className="font-semibold text-slate-700">★ {Number(isProvider ? p.averageRating : p.rating).toFixed(1)} ({isProvider ? p.totalRatings : p.totalReviews})</span>
              )}
            </div>
            {!isProvider && p.suburb && <p className="m-0 text-sm text-slate-600">{p.suburb}{p.state ? `, ${p.state}` : ""}</p>}
          </div>
        </CardContent>
      </Card>

      {sent && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{sent}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          {(isProvider ? p.businessDescription : p.introSummary) && <p className="m-0">{isProvider ? p.businessDescription : p.introSummary}</p>}
          <div><div className="mb-1 text-xs font-semibold text-slate-500">Services</div><Chips labels items={isProvider ? p.coreServices : p.servicesOffered} /></div>
          {isProvider && (
            <>
              <div><div className="mb-1 text-xs font-semibold text-slate-500">Operating states</div><Chips items={p.stateCoverage} /></div>
              <div><div className="mb-1 text-xs font-semibold text-slate-500">Languages</div><Chips items={p.languages} /></div>
              <div><div className="mb-1 text-xs font-semibold text-slate-500">Accessibility</div><Chips items={p.accessibilityCapabilities} /></div>
              <div><div className="mb-1 text-xs font-semibold text-slate-500">Cultural capabilities</div><Chips items={p.culturalCapabilities} /></div>
              {p.enquiryPreference && <p className="m-0 text-xs text-slate-500">Preferred enquiry contact: {CONTACT[p.enquiryPreference] ?? p.enquiryPreference}</p>}
            </>
          )}
        </CardContent>
      </Card>

      {isProvider && (
        <Card>
          <CardHeader><CardTitle>Capacity and vacancies</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.listings.length === 0 && <p className="m-0 text-sm text-slate-500">No active capacity or vacancy listings.</p>}
            {data.listings.map((l) => (
              <div key={l.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">{l.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{l.listingCategory === "HOUSING" ? "Home and Living" : "Capacity"}</span>
                </div>
                <p className="m-0 mt-1 text-slate-600">{l.description}</p>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  {l.suburb}{l.state ? `, ${l.state}` : ""}
                  {l.acceptingStatus && ` · ${ACCEPTING[l.acceptingStatus] ?? l.acceptingStatus}`}
                  {l.responseExpectation && ` · ${RESPONSE[l.responseExpectation] ?? l.responseExpectation}`}
                </p>
                <Chips labels items={l.serviceCategories} />
                {!isSelf && <Button size="sm" className="mt-2" onClick={() => { setEnquiryFor(l.id); setSent(null); }}>Enquire about this {l.listingCategory === "HOUSING" ? "vacancy" : "capacity"}</Button>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isSelf && (
        <Card>
          <CardHeader><CardTitle>{enquiryFor && enquiryFor !== "profile" ? "Enquire about this listing" : "Send an enquiry"}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" rows={3} maxLength={2000}
              placeholder="Say who you are, what support you are looking for, and when." value={body}
              onChange={(e) => { setBody(e.target.value); if (!enquiryFor) setEnquiryFor("profile"); }} />
            <Button disabled={sending || !body.trim()} onClick={sendEnquiry}>{sending ? "Sending…" : "Send enquiry"}</Button>
            <p className="m-0 text-xs text-slate-500">Enquiries do not use any allowance. Please do not include private health details.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
