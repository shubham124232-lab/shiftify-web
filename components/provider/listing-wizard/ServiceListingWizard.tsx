"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { WizardForm, opts, type StepDef, type Values } from "@/components/provider/listing-wizard/WizardForm";

// "Post service or capacity" (approved Provider demo): Service and availability, Capability and continuity, Capacity and schedule,
// Service area and fit, Commercial and visibility, Review. Same listing API; the demo's extra answers live in serviceDetails.

const AVAILABILITY_TYPES = [
  { v: "IMMEDIATE_INTAKE", l: "Immediate intake" }, { v: "RECURRING_CAPACITY", l: "Recurring weekly slot" }, { v: "ONE_TIME_SLOT", l: "One-off service slot" },
  { v: "SHORT_TERM", l: "Temporary bridging" }, { v: "WAITLIST_OPENING", l: "Waitlist" }, { v: "ONGOING_REFERRALS", l: "Ongoing referrals" }, { v: "URGENT_FILL", l: "Specialist intake" },
];
const CAPABILITIES = opts(["First Aid", "CPR", "Manual Handling", "Hoist", "Transport", "Medication competency", "Overnight Support", "Complex Care", "Behaviour Support", "NDIS screening", "WWCC", "Driver licence"]);
const WORKFORCE = opts(["Dedicated worker where possible", "Small consistent team", "Rotating roster", "Backup team"]);
const INTENSITY = opts(["General support", "Personal care", "Complex support", "High intensity where verified"]);
const AGES = opts(["Children", "Teens", "Adults", "Older adults"]);
const DAYS = [
  { v: "MON", l: "Mon" }, { v: "TUE", l: "Tue" }, { v: "WED", l: "Wed" }, { v: "THU", l: "Thu" }, { v: "FRI", l: "Fri" }, { v: "SAT", l: "Sat" }, { v: "SUN", l: "Sun" },
];
const RECURRENCE = opts(["One-off", "Weekly", "Fortnightly", "Ongoing intake"]);
const URGENT_INTAKE = opts(["Case by case", "Yes", "No"]);
const DELIVERY = [
  { v: "Participant home", l: "Participant home" }, { v: "Community", l: "Community" }, { v: "Provider premises", l: "Provider premises" },
  { v: "Remote", l: "Remote" }, { v: "Hybrid", l: "Hybrid" },
];
const MODE: Record<string, "IN_PERSON" | "REMOTE" | "BOTH"> = { "Participant home": "IN_PERSON", Community: "IN_PERSON", "Provider premises": "IN_PERSON", Remote: "REMOTE", Hybrid: "BOTH" };
const STATES = opts(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
const FUNDING = opts(["Self-managed", "Plan-managed", "NDIA-managed", "Private"]);
const RATE_TYPE = opts(["Discuss first", "Show hourly rate", "Show range", "Quote after referral"]);
const TRAVEL = opts(["Included", "Additional", "Capped", "Discuss"]);
const INTAKE = opts(["Intake call", "Referral review", "Meet-and-greet", "Trial", "Service agreement"]);
const AUDIENCE = opts(["Participants and Coordinators", "Verified users", "Invitation only"]);
const RESPONSE = [{ v: "SAME_DAY", l: "Same day" }, { v: "WITHIN_48_HOURS", l: "Within 48 hours" }, { v: "WITHIN_A_WEEK", l: "Within a week" }];
const YESNO = opts(["Yes", "No"]);

const DETAIL_KEYS = ["capabilities", "workforceModel", "backup", "intensity", "ages", "schedule", "availableFrom", "availabilityEnd", "recurrence", "urgentIntake", "deliveryMode", "travelRadiusKm", "fit", "language", "limitations", "rateType", "rate", "travelCharges", "intakeProcess", "audience", "expiry", "autoPause", "privateNotes", "kind"] as const;

function toPayload(v: Values) {
  const details: Record<string, string | number | boolean | string[]> = {};
  for (const k of DETAIL_KEYS) {
    const x = v[k];
    if (x === "" || x === undefined || x === null || (Array.isArray(x) && x.length === 0) || (typeof x === "number" && Number.isNaN(x))) continue;
    details[k] = x;
  }
  const slots = typeof v.openSlots === "number" ? v.openSlots : undefined;
  const accepting = v.availabilityType === "WAITLIST_OPENING" ? "LIMITED" : slots === 0 ? "NO" : "YES";
  const out: Record<string, unknown> = {
    title: v.title, branchId: v.branchId || undefined, ownerUserId: v.ownerUserId || undefined, serviceCategory: v.serviceCategory,
    serviceCategories: v.serviceCategory ? [v.serviceCategory] : undefined, listingType: v.availabilityType, description: v.description,
    suburb: v.suburb, state: v.state || undefined, postcode: v.postcode || undefined, daysAvailable: v.days, openSlots: slots, acceptingStatus: accepting,
    serviceMode: v.deliveryMode ? MODE[v.deliveryMode] : undefined, fundingTypes: v.funding, responseExpectation: v.response || undefined,
    serviceDetails: details,
  };
  return Object.fromEntries(Object.entries(out).filter(([, x]) => x !== undefined && x !== ""));
}

function fromListing(l: Record<string, any>, kind: string): Values {
  const d = (l.serviceDetails ?? {}) as Record<string, any>;
  const autoTitle = typeof l.title === "string" && l.title.startsWith("Service capacity —");
  return {
    title: autoTitle ? "" : l.title, branchId: l.branchId ?? "", ownerUserId: l.ownerUserId ?? "", serviceCategory: l.serviceCategory ?? l.serviceCategories?.[0] ?? "",
    availabilityType: l.listingType ?? "", description: typeof l.description === "string" && l.description.startsWith("Current capacity for ") ? "" : l.description,
    suburb: l.suburb ?? "", state: l.state ?? "", postcode: l.postcode ?? "", days: l.daysAvailable ?? [], openSlots: l.openSlots ?? "", funding: l.fundingTypes ?? [],
    response: l.responseExpectation ?? "", kind, ...d,
  };
}

export function ServiceListingWizard({ listing, duplicate, kind = "service", onClose, onDone }: {
  listing?: Record<string, any> | null; duplicate?: boolean; kind?: "service" | "capacity"; onClose: () => void; onDone: (message: string) => void;
}) {
  const editing = !!listing && !duplicate;
  const { user } = useAuth();
  const [values, setValues] = useState<Values>(() => (listing ? fromListing(listing, kind) : { kind, days: [], capabilities: [], ages: [], funding: [], response: "WITHIN_48_HOURS", autoPause: "Yes" }));
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(editing);
  const draftKey = "shiftify_service_listing_draft";

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
    if (!listing) {
      try { const raw = localStorage.getItem(draftKey); if (raw) { setValues((c) => ({ ...c, ...JSON.parse(raw) })); setNotice("Your saved draft was restored."); } } catch { /* none */ }
    }
  }, [listing]);

  const steps: StepDef[] = [
    { title: "Service and availability", intro: "This advertises support you offer; it is not a workforce request.", fields: [
      { key: "title", label: "Listing title", type: "text", required: true, placeholder: "e.g. Personal care intake open" },
      { key: "branchId", label: "Branch", type: "select", options: branches.map((b) => ({ v: b.id, l: b.name })) },
      { key: "serviceCategory", label: "Service category", type: "select", options: JOB_CATEGORIES.map((c) => ({ v: c.value, l: c.label })), required: true },
      { key: "availabilityType", label: "Availability type", type: "select", options: AVAILABILITY_TYPES, required: true },
      { key: "ownerUserId", label: "Intake owner", type: "select", options: [...(user ? [{ v: user.id, l: `${user.name} (Owner)` }] : []), ...owners.map((o) => ({ v: o.id, l: o.name }))] },
    ] },
    { title: "Capability and continuity", intro: "Describe current organisational capability.", fields: [
      { key: "description", label: "Services, tasks and outcomes", type: "textarea", required: true },
      { key: "capabilities", label: "Capabilities", type: "checks", options: CAPABILITIES },
      { key: "workforceModel", label: "Workforce model", type: "select", options: WORKFORCE, required: true },
      { key: "backup", label: "Backup arrangements", type: "text" },
      { key: "intensity", label: "Support intensity", type: "select", options: INTENSITY },
      { key: "ages", label: "Suitable age groups", type: "checks", options: AGES, required: true },
    ] },
    { title: "Capacity and schedule", intro: "Publish usable times and quantities; waitlist is not immediate capacity.", fields: [
      { key: "openSlots", label: "Available slots / places", type: "number", required: true },
      { key: "days", label: "Days available", type: "checks", options: DAYS, required: true },
      { key: "schedule", label: "Days and usable time blocks", type: "textarea", required: true, placeholder: "e.g. Mon–Fri · morning and evening" },
      { key: "availableFrom", label: "Available from", type: "date", required: true },
      { key: "availabilityEnd", label: "Availability end date", type: "date" },
      { key: "recurrence", label: "Recurrence", type: "select", options: RECURRENCE },
      { key: "urgentIntake", label: "Last Min / urgent intake possible?", type: "select", options: URGENT_INTAKE },
    ] },
    { title: "Service area and fit", intro: "Describe relevant capability, access and intake limitations.", fields: [
      { key: "suburb", label: "Public region / suburbs", type: "text", required: true },
      { key: "state", label: "State", type: "select", options: STATES },
      { key: "deliveryMode", label: "Delivery mode", type: "select", options: DELIVERY },
      { key: "travelRadiusKm", label: "Travel radius km", type: "number" },
      { key: "fit", label: "Participant fit and intake criteria", type: "textarea", required: true },
      { key: "language", label: "Languages / accessibility capabilities", type: "text" },
      { key: "limitations", label: "Service limitations and safety requirements", type: "textarea" },
    ] },
    { title: "Commercial and visibility", intro: "Ordinary service and capacity publication is free of Provider action charges.", fields: [
      { key: "funding", label: "Funding accepted", type: "checks", options: FUNDING, required: true },
      { key: "rateType", label: "Rate display", type: "select", options: RATE_TYPE },
      { key: "rate", label: "Rate / range", type: "text" },
      { key: "travelCharges", label: "Travel charges", type: "select", options: TRAVEL },
      { key: "intakeProcess", label: "Intake process", type: "select", options: INTAKE },
      { key: "audience", label: "Who can enquire?", type: "select", options: AUDIENCE },
      { key: "response", label: "Response time", type: "select", options: RESPONSE },
      { key: "expiry", label: "Expiry date", type: "date" },
      { key: "autoPause", label: "Auto-pause at zero capacity", type: "select", options: YESNO },
      { key: "privateNotes", label: "Internal notes", type: "textarea" },
    ] },
    { title: "Review service listing", intro: "Preview the public details and confirm capacity is current.", fields: [], review: true },
  ];

  function saveDraft() {
    try { localStorage.setItem(draftKey, JSON.stringify(values)); setNotice("Draft saved on this device."); setError(null); }
    catch { setError("Could not save the draft on this device."); }
  }

  async function submit() {
    setBusy(true); setError(null);
    try {
      const body = toPayload(values);
      if (editing) await api.patch(`/provider/listings/${listing!.id}`, body);
      else await api.post("/provider/listings", { ...body, listingCategory: "SERVICE", acknowledgement: true });
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      onDone(editing ? "Listing updated." : "Service listing published. Ordinary service updates never use a Provider Action.");
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Could not save the listing.");
    } finally { setBusy(false); }
  }

  const label = (list: { v: string; l: string }[], v: unknown) => list.find((o) => o.v === v)?.l ?? (v ? String(v) : "—");
  const rows: [string, string][] = [
    ["Listing", values.title || "—"],
    ["Service", JOB_CATEGORIES.find((c) => c.value === values.serviceCategory)?.label ?? "—"],
    ["Availability", label(AVAILABILITY_TYPES, values.availabilityType)],
    ["Capacity", `${values.openSlots ?? "—"} places · ${(values.days ?? []).join(", ") || "no days set"}`],
    ["Schedule", values.schedule || "—"],
    ["Area", [values.suburb, values.state].filter(Boolean).join(", ") || "—"],
    ["Funding", (values.funding ?? []).join(", ") || "—"],
    ["Branch", branches.find((b) => b.id === values.branchId)?.name ?? "No branch"],
  ];

  return (
    <WizardForm
      title={editing ? "Edit service listing" : duplicate ? "Duplicate service listing" : kind === "capacity" ? "Post capacity slot" : "Post service listing"}
      subtitle={editing ? "Edit existing record" : undefined}
      steps={steps} values={values} setValues={setValues} onClose={onClose} busy={busy} error={error} notice={notice}
      onSaveDraft={editing ? undefined : saveDraft}
      submitLabel={editing ? "Save changes" : "Publish listing"} canSubmit={confirmed} onSubmit={() => void submit()}
      renderReview={() => (
        <div>
          {rows.map(([k, v]) => <div key={k} className="pd-review-row"><span>{k}</span><strong style={{ fontWeight: 600 }}>{v}</strong></div>)}
          <p className="pd-notice mt-4">Ordinary service and capacity updates do not consume Provider actions. Housing vacancies use a separate 30-day listing package.</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e4e6ed] px-4 py-3 text-sm">
            <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>I confirm this information is accurate and capacity is current.</span>
          </label>
        </div>
      )}
    />
  );
}
