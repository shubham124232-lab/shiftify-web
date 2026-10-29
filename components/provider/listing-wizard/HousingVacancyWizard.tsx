"use client";

import { useEffect, useState } from "react";
import { api, http, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { WizardForm, opts, type StepDef, type Values } from "@/components/provider/listing-wizard/WizardForm";

// "List a housing vacancy" (approved Provider demo): seven steps — Vacancy type, Property and privacy, Vacancy and household,
// Support and suitability, Funding and enquiries, Listing package, Review. Same listing API as before; the extra details live in housingDetails.

const CATEGORY = [
  { v: "SIL", l: "SIL" }, { v: "SDA", l: "SDA" }, { v: "SIL_SDA", l: "SIL + SDA" }, { v: "RESPITE", l: "Respite" },
  { v: "MEDIUM_TERM", l: "MTA" }, { v: "SHORT_TERM", l: "STA" }, { v: "SUPPORTED_HOUSING", l: "Supported housing" }, { v: "OTHER", l: "ILO or other Home and Living" },
];
const AVAILABILITY = [
  { v: "AVAILABLE_NOW", l: "Available now" }, { v: "AVAILABLE_SOON", l: "From specific date" },
  { v: "FUTURE", l: "Future vacancy" }, { v: "EXPRESSION_OF_INTEREST", l: "Expression of interest" },
];
const PROPERTY_TYPES = opts(["House", "Apartment", "Villa", "Unit", "Shared house", "Specialist dwelling"]);
const FEATURES = opts(["Step-free access", "Accessible bathroom", "Wheelchair access", "Private ensuite", "Lift access", "Assistive technology", "Parking", "Near transport"]);
const PHOTO_VISIBILITY = opts(["Public approved photos", "Limited public photos", "After permitted enquiry"]);
const DURATION = opts(["Long-term", "Short-term", "Medium-term", "Respite"]);
const SUPPORT = opts(["Shared 24-hour rostered support", "Active overnight", "Sleepover support", "Drop-in support", "Individual support", "Support arranged separately"]);
const CONTINUITY = opts(["Small consistent team", "Dedicated team", "Rotating roster"]);
const CAPABILITIES = opts(["First Aid", "CPR", "Manual Handling", "Hoist", "Transport", "Medication competency", "Overnight Support", "Complex Care", "Behaviour Support", "NDIS screening", "WWCC", "Driver licence"]);
const SUITABLE_FOR = opts(["Physical Disability", "Psychosocial Disability", "Intellectual Disability", "Autism", "ABI", "High Support Needs", "Mental Health Support Needs"]);
const FUNDING = [
  { v: "SIL Funded", l: "SIL" }, { v: "SDA Funded", l: "SDA" }, { v: "Respite Funding", l: "Respite" },
  { v: "Private Contribution", l: "Private contribution" }, { v: "Mixed", l: "Discuss case by case" },
];
const ENQUIRY = opts(["Referral review", "Inspection", "Compatibility meeting", "Trial stay", "Enquiry first"]);
const ADDRESS_VISIBILITY = opts(["Suburb only", "Approximate region"]);
const STATES = opts(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
const TIERS = [{ v: "STANDARD", l: "Standard — $199" }, { v: "FEATURED", l: "Featured — $399" }];
const QUEUE_ACK = [{ v: "ACK", l: "I understand Featured position is disclosed before payment" }];

const clean = <T extends Record<string, unknown>>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => !(v === "" || v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) || (Array.isArray(v) && v.length === 0)))) as Partial<T>;

function toPayload(v: Values) {
  return clean({
    vacancyCategory: v.vacancyCategory, title: v.title, branchId: v.branchId || undefined, ownerUserId: v.ownerUserId || undefined, urgency: v.urgency,
    propertyType: v.propertyType, suburb: v.suburb, state: v.state, postcode: v.postcode,
    vacancyCount: typeof v.vacancyCount === "number" ? v.vacancyCount : undefined, supportModel: v.support, description: v.description,
    suitableFor: v.suitableFor, fundingRoutes: v.fundingRoutes,
    housingDetails: clean({
      dwellingCategory: v.sda, accessibilityFeatures: v.features, vacancyDate: v.start, roomHousehold: v.household, compatibility: v.fit,
      costs: v.costs, inspectionProcess: v.intake, photoUrls: v.photos, privateAddress: v.privateAddress,
      bedrooms: typeof v.bedrooms === "number" ? v.bedrooms : undefined, bathrooms: typeof v.bathrooms === "number" ? v.bathrooms : undefined,
      photoVisibility: v.photoVisibility, placementDuration: v.duration, staffContinuity: v.model, relevantCapabilities: v.capabilities,
      assessment: v.assessment, addressVisibility: v.visibility, internalNotes: v.privateNotes, packageTier: v.tier,
    }),
  });
}

function fromListing(l: Record<string, any>): Values {
  const d = (l.housingDetails ?? {}) as Record<string, any>;
  return {
    vacancyCategory: l.vacancyCategory, title: l.title, branchId: l.branchId ?? "", ownerUserId: l.ownerUserId ?? "", urgency: l.urgency ?? "",
    propertyType: l.propertyType ?? "", suburb: l.suburb, state: l.state ?? "", postcode: l.postcode ?? "", privateAddress: d.privateAddress ?? "",
    bedrooms: d.bedrooms ?? "", bathrooms: d.bathrooms ?? "", features: d.accessibilityFeatures ?? [], sda: d.dwellingCategory ?? "", photos: d.photoUrls ?? [],
    photoVisibility: d.photoVisibility ?? "", vacancyCount: l.vacancyCount ?? "", start: d.vacancyDate ?? "", duration: d.placementDuration ?? "",
    household: d.roomHousehold ?? "", description: l.description ?? "", support: l.supportModel ?? "", model: d.staffContinuity ?? "",
    capabilities: d.relevantCapabilities ?? [], suitableFor: l.suitableFor ?? [], fit: d.compatibility ?? "", assessment: d.assessment ?? "",
    fundingRoutes: l.fundingRoutes ?? [], costs: d.costs ?? "", intake: d.inspectionProcess ?? "", visibility: d.addressVisibility ?? "", privateNotes: d.internalNotes ?? "",
    tier: d.packageTier ?? "STANDARD", ack: "",
  };
}

export function HousingVacancyWizard({ listing, onClose, onDone }: { listing?: Record<string, any> | null; onClose: () => void; onDone: (message: string) => void }) {
  const { user } = useAuth();
  const editing = !!listing;
  const [values, setValues] = useState<Values>(() => (listing ? fromListing(listing) : { tier: "STANDARD", features: [], fundingRoutes: [], suitableFor: [], capabilities: [], photos: [] }));
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(editing);

  useEffect(() => {
    Promise.all([
      api.get<{ branches: { id: string; name: string; isActive?: boolean }[] }>("/provider-org/branches").catch(() => ({ branches: [] })),
      api.get<{ administrators: { user: { id: string; name: string } }[] }>("/provider-org/administrators").catch(() => ({ administrators: [] })),
    ]).then(([b, a]) => {
      const bl = (b.branches ?? []).filter((x) => x.isActive !== false);
      setBranches(bl);
      setOwners((a.administrators ?? []).map((x) => ({ id: x.user.id, name: x.user.name })));
      setValues((cur) => ({ ...cur, branchId: cur.branchId || bl[0]?.id || "", ownerUserId: cur.ownerUserId || (editing ? "" : user?.id ?? "") }));
    });
    api.get<{ user: { providerProfile?: { ndisRegistered?: boolean } | null } }>("/users/me")
      .then((r) => setRegistered(!!r.user?.providerProfile?.ndisRegistered)).catch(() => setRegistered(null));
  }, []);

  const restricted = values.vacancyCategory === "SIL" || values.vacancyCategory === "SDA";
  const blocked = restricted && registered === false;
  const ownerOpts = [...(user ? [{ v: user.id, l: `${user.name} (Owner)` }] : []), ...owners.map((o) => ({ v: o.id, l: o.name }))];

  const steps: StepDef[] = [
    { title: "Vacancy type", intro: "One package covers one property or placement listing for 30 days.", fields: [
      { key: "title", label: "Vacancy title", type: "text", required: true, placeholder: "e.g. SIL vacancy in Liverpool" },
      { key: "vacancyCategory", label: "Vacancy category", type: "select", options: CATEGORY, required: true },
      { key: "branchId", label: "Branch", type: "select", options: branches.map((b) => ({ v: b.id, l: b.name })) },
      { key: "ownerUserId", label: "Enquiry owner", type: "select", options: ownerOpts },
      { key: "urgency", label: "Availability", type: "select", options: AVAILABILITY },
    ] },
    { title: "Property and privacy", intro: "Keep resident identities and exact address out of the public listing.", fields: [
      { key: "propertyType", label: "Property type", type: "select", options: PROPERTY_TYPES, required: true },
      { key: "suburb", label: "Public suburb", type: "text", required: true, placeholder: "e.g. Liverpool" },
      { key: "state", label: "State", type: "select", options: STATES },
      { key: "postcode", label: "Postcode", type: "text" },
      { key: "privateAddress", label: "Private exact address", type: "text", hint: "Never shown publicly." },
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "bathrooms", label: "Bathrooms", type: "number" },
      { key: "features", label: "Accessibility and property features", type: "checks", options: FEATURES },
      { key: "sda", label: "SDA category / verified evidence reference", type: "text" },
      { key: "photos", label: "Property photos (up to 6, JPG/PNG/WebP, 5 MB each)", type: "photos", hint: "Do not include participants or identifying details in photos." },
      { key: "photoVisibility", label: "Photo visibility", type: "select", options: PHOTO_VISIBILITY },
    ] },
    { title: "Vacancy and household", intro: "Use non-identifying compatibility information.", fields: [
      { key: "vacancyCount", label: "Vacancies available", type: "number", required: true },
      { key: "start", label: "Vacancy available from", type: "date", required: true },
      { key: "duration", label: "Placement duration", type: "select", options: DURATION },
      { key: "household", label: "Household / environment summary", type: "textarea", required: true },
      { key: "description", label: "Vacancy description", type: "textarea", required: true, placeholder: "Describe what is available, the living arrangement and who it suits." },
    ] },
    { title: "Support and suitability", intro: "Dwelling and support arrangements remain distinct.", fields: [
      { key: "support", label: "Support model", type: "select", options: SUPPORT, required: true },
      { key: "model", label: "Staff continuity", type: "select", options: CONTINUITY },
      { key: "capabilities", label: "Relevant capabilities", type: "checks", options: CAPABILITIES },
      { key: "suitableFor", label: "Suitable participant profile", type: "checks", options: SUITABLE_FOR },
      { key: "fit", label: "Compatibility and suitability", type: "textarea", required: true },
      { key: "assessment", label: "Assessment / prerequisites", type: "textarea", required: true },
    ] },
    { title: "Funding and enquiries", intro: "Separate accommodation contributions from support service charges.", fields: [
      { key: "fundingRoutes", label: "Funding pathway", type: "checks", options: FUNDING, required: true },
      { key: "costs", label: "Rent / board / contribution information", type: "textarea", required: true },
      { key: "intake", label: "Enquiry process", type: "select", options: ENQUIRY },
      { key: "visibility", label: "Public address visibility", type: "select", options: ADDRESS_VISIBILITY },
      { key: "privateNotes", label: "Internal property / intake notes", type: "textarea" },
    ] },
    { title: "Listing package", intro: "Featured placement follows purchase order in the same area and category.", fields: [
      { key: "tier", label: "30-day package", type: "select", options: TIERS, required: true },
      { key: "ack", label: "Queue disclosure", type: "select", options: QUEUE_ACK, when: (v) => v.tier === "FEATURED", required: true },
    ] },
    { title: "Review vacancy", intro: "Eligibility review and payment are required before publication.", fields: [], review: true },
  ];

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    const photos: string[] = values.photos ?? [];
    if (photos.length >= 6) { setError("You can add up to 6 photos."); return; }
    setUploading(true); setError(null);
    try {
      const fd = new FormData(); fd.append("photo", file);
      const res = await http.post<{ data: { url: string } }>("/upload/listing-photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setValues((c) => ({ ...c, photos: [...(c.photos ?? []), res.data.data.url] }));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not upload that photo."); }
    finally { setUploading(false); }
  }

  const fail = (e: unknown, fallback: string) => setError(e instanceof ApiError || e instanceof Error ? e.message : fallback);

  async function save(asDraft: boolean) {
    if (!values.vacancyCategory || !values.title || !values.suburb || !values.description) {
      setError("A draft needs a vacancy category, title, suburb and description."); return;
    }
    setBusy(true); setError(null);
    try {
      const payload = toPayload(values);
      if (editing) {
        await api.patch(`/provider/listings/${listing!.id}`, payload);
        onDone(listing!.status === "DRAFT" ? "Draft changes saved." : "Vacancy updated.");
        return;
      }
      const res = await api.post<{ listing?: { id: string } } & { id?: string }>("/provider/listings", { ...payload, listingCategory: "HOUSING", acknowledgement: true, ...(asDraft ? { saveAsDraft: true } : {}) });
      const id = res.listing?.id ?? res.id;
      if (!asDraft && values.tier === "FEATURED" && id) {
        try { await api.post(`/provider/listings/${id}/featured`, {}); } catch { /* published as Standard; Featured can be added from the vacancy */ }
      }
      onDone(asDraft ? "Draft saved." : "Vacancy published for 30 days.");
    } catch (e) { fail(e, asDraft ? "Could not save the draft." : "Could not publish the vacancy."); }
    finally { setBusy(false); }
  }

  const rows: [string, string][] = [
    ["Vacancy", `${values.title ?? "—"} · ${CATEGORY.find((c) => c.v === values.vacancyCategory)?.l ?? "—"}`],
    ["Branch", branches.find((b) => b.id === values.branchId)?.name ?? "No branch"],
    ["Public location", [values.suburb, values.state, values.postcode].filter(Boolean).join(", ") || "—"],
    ["Property", [values.propertyType, values.bedrooms ? `${values.bedrooms} bedrooms` : null, values.bathrooms ? `${values.bathrooms} bathrooms` : null].filter(Boolean).join(" · ") || "—"],
    ["Vacancies", `${values.vacancyCount ?? "—"}${values.start ? ` · from ${values.start}` : ""}`],
    ["Support", [values.support, values.model].filter(Boolean).join(" · ") || "—"],
    ["Funding", (values.fundingRoutes ?? []).join(", ") || "—"],
    ["Package", `${TIERS.find((t) => t.v === values.tier)?.l ?? "Standard — $199"} · 30 days from publication`],
  ];

  return (
    <WizardForm
      title={editing ? "Edit housing vacancy" : "List a housing vacancy"}
      subtitle={editing ? "Edit existing record" : undefined}
      steps={editing ? steps.filter((s) => s.title !== "Listing package") : steps}
      values={values} setValues={setValues} onClose={onClose} busy={busy} error={error}
      onUploadPhoto={addPhoto} uploading={uploading}
      onSaveDraft={editing && listing!.status !== "DRAFT" ? undefined : () => void save(true)}
      submitLabel={editing ? "Save changes" : blocked ? "Registration required" : "Confirm and pay $199.00"}
      canSubmit={confirmed && !blocked}
      onSubmit={() => void save(false)}
      extra={blocked ? <div className="pd-notice mb-4">SIL and SDA listings can only be published by a Provider with a verified NDIS registration covering these supports. Save this as a draft now and publish it once your registration is verified.</div> : null}
      renderReview={() => (
        <div>
          {rows.map(([k, v]) => <div key={k} className="pd-review-row"><span>{k}</span><strong style={{ fontWeight: 600 }}>{v}</strong></div>)}
          <p className="pd-notice mt-4">Promotion does not imply SDA enrolment, NDIS registration or participant eligibility. Listing packages are non-refundable once published.</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e4e6ed] px-4 py-3 text-sm">
            <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>I confirm vacancy details are accurate, I will update this listing if vacancy status changes, and I agree to Shiftify platform terms.</span>
          </label>
        </div>
      )}
    />
  );
}
