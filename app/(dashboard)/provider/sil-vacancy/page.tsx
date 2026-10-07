"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, http, ApiError } from "@/lib/api";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

const schema = z.object({
  vacancyCategory: z.enum([
    "SIL", "SDA", "SIL_SDA", "RESPITE", "MEDIUM_TERM", "SHORT_TERM", "OTHER",
  ], { required_error: "Select a vacancy type" }),
  title: z.string().min(5, "Title is required"),
  suburb: z.string().min(2, "Suburb / location is required"),
  state: z.string().optional(),
  postcode: z.string().optional(),
  propertyType: z.string().optional(),
  vacancyCount: z.number().int().min(1).max(50).optional(),
  supportModel: z.string().optional(),
  description: z.string().min(10, "Description is required"),
  suitableFor: z.array(z.string()).optional(),
  fundingRoutes: z.array(z.string()).optional(),
  urgency: z.enum(["AVAILABLE_NOW", "AVAILABLE_SOON", "FUTURE", "EXPRESSION_OF_INTEREST"]).optional(),
  housingDetails: z.object({
    dwellingCategory: z.string().optional(),
    accessibilityFeatures: z.array(z.string()).optional(),
    vacancyDate: z.string().optional(),
    roomHousehold: z.string().optional(),
    rosterArrangement: z.string().optional(),
    compatibility: z.string().optional(),
    costs: z.string().optional(),
    requiredApprovals: z.string().optional(),
    inspectionProcess: z.string().optional(),
    photoUrls: z.array(z.string()).optional(),
  }).optional(),
  acknowledgement: z.boolean().refine(v => v === true, { message: "You must confirm the vacancy details are accurate" }),
});
type FormData = z.infer<typeof schema>;

const VACANCY_TYPES = [
  { value: "SIL",       label: "SIL vacancy",                          desc: "Supported Independent Living placement (registration required)" },
  { value: "SDA",       label: "SDA dwelling vacancy",                 desc: "Specialist Disability Accommodation (registration required)" },
  { value: "OTHER",     label: "ILO or other Home and Living option",  desc: "Individualised Living Options and other eligible arrangements" },
  { value: "RESPITE",   label: "Respite / STA vacancy",                desc: "Short-term accommodation or respite, where separately supported" },
];
const ACCESSIBILITY = ["Step-free entry", "Wheelchair-accessible bathroom", "Wide doorways", "Ceiling hoist", "Height-adjustable kitchen", "Assistive technology ready", "On-site overnight assistance"];
const DWELLING_CATEGORIES = ["Improved Liveability", "Fully Accessible", "Robust", "High Physical Support", "Not applicable / not SDA"];

const PROPERTY_TYPES = ["House", "Apartment", "Villa / Unit", "Shared House", "Individual Apartment", "Specialist Disability Accommodation", "Respite Property"];
const SUPPORT_MODELS = ["24/7 Support", "Sleepover Support", "Drop-in Support", "Rostered Active Support", "Shared Support Model", "Individual Support Available"];
const SUITABLE_FOR   = ["Physical Disability", "Psychosocial Disability", "Intellectual Disability", "Autism", "ABI", "High Support Needs", "Mental Health Support Needs"];
const FUNDING_ROUTES = ["SIL Funded", "SDA Funded", "Respite Funding", "Private Contribution", "Mixed", "Discuss on enquiry"];

const inp: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--clr-border)", fontSize: 14, outline: "none", background: "var(--td-white)", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--clr-text)", marginBottom: 4 };

export default function SilVacancyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<FormData | null>(null);
  const [registered, setRegistered] = useState<boolean | null>(null);
  useEffect(() => {
    api.get<{ user: { providerProfile?: { ndisRegistered?: boolean } | null } }>("/users/me")
      .then(r => setRegistered(!!r.user?.providerProfile?.ndisRegistered))
      .catch(() => setRegistered(null));
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { suitableFor: [], fundingRoutes: [] },
  });
  const { register, watch, setValue, formState: { errors } } = form;

  // PR-HL03 — reopen a saved or live listing (?edit=<id>) and change it in place.
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    if (!id) return;
    setEditId(id); setLoadingEdit(true);
    api.get<{ listings?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>("/provider/listings?category=HOUSING")
      .then((res) => {
        const rows = Array.isArray(res) ? res : (res.listings ?? []);
        const l = rows.find((r) => r.id === id) as (Record<string, any>) | undefined;
        if (!l) { setError("That listing could not be found."); return; }
        setEditStatus(String(l.status));
        form.reset({
          vacancyCategory: l.vacancyCategory, title: l.title, suburb: l.suburb, state: l.state ?? "", postcode: l.postcode ?? "",
          propertyType: l.propertyType ?? "", vacancyCount: l.vacancyCount ?? undefined, supportModel: l.supportModel ?? "",
          description: l.description, suitableFor: l.suitableFor ?? [], fundingRoutes: l.fundingRoutes ?? [], urgency: l.urgency ?? undefined,
          housingDetails: l.housingDetails ?? undefined, acknowledgement: true,
        } as FormData);
      })
      .catch(() => setError("Could not load that listing."))
      .finally(() => setLoadingEdit(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveChanges() {
    const ok = await form.trigger(["vacancyCategory", "title", "suburb", "description"]);
    if (!ok || !editId) return;
    setSubmitting(true); setError(null);
    try {
      const { acknowledgement: _ack, vacancyCount, ...rest } = form.getValues();
      const clean = Object.fromEntries(Object.entries({ ...rest, ...(Number.isFinite(vacancyCount) ? { vacancyCount } : {}) }).filter(([, v]) => v !== "" && v !== undefined));
      await api.patch(`/provider/listings/${editId}`, clean);
      router.push("/provider/listings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your changes.");
    } finally { setSubmitting(false); }
  }

  const vacancyCategory = watch("vacancyCategory");
  const suitableFor     = watch("suitableFor") ?? [];
  const fundingRoutes   = watch("fundingRoutes") ?? [];
  const accessibility   = watch("housingDetails.accessibilityFeatures") ?? [];
  const photos          = watch("housingDetails.photoUrls") ?? [];
  const [uploading, setUploading] = useState(false);
  async function addPhoto(file: File | undefined) {
    if (!file) return;
    if (photos.length >= 6) { setError("You can add up to 6 photos."); return; }
    setUploading(true); setError(null);
    try {
      const fd = new FormData(); fd.append("photo", file);
      const res = await http.post<{ data: { url: string } }>("/upload/listing-photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setValue("housingDetails.photoUrls", [...photos, res.data.data.url]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not upload that photo."); }
    finally { setUploading(false); }
  }
  const restricted      = vacancyCategory === "SIL" || vacancyCategory === "SDA";
  const blockedByRegistration = restricted && registered === false;

  // Pricing V2 §11 — confirm the package (property, 30-day dates, tier, market) before payment.
  function onSubmit(data: FormData) { setPending(data); }

  // PR-HL03: save without publishing; no package, dates or payment until the listing is published.
  async function saveDraft() {
    const ok = await form.trigger(["vacancyCategory", "title", "suburb", "description"]);
    if (!ok) return;
    setSubmitting(true); setError(null); setUpgradeMessage(null);
    try {
      const { vacancyCount, ...data } = form.getValues();
      // An untouched "Number of Vacancies" is NaN — leave it out rather than send null.
      await api.post("/provider/listings", { ...data, ...(Number.isFinite(vacancyCount) ? { vacancyCount } : {}), listingCategory: "HOUSING", saveAsDraft: true, acknowledgement: undefined });
      router.push("/provider/listings");
    } catch (e) {
      if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) setUpgradeMessage(e.message);
      else setError(e instanceof Error ? e.message : "Could not save the draft.");
    } finally { setSubmitting(false); }
  }

  async function confirmPublish() {
    if (!pending) return;
    const data = pending;
    setSubmitting(true);
    setError(null);
    setUpgradeMessage(null);
    try {
      await api.post("/provider/listings", { ...data, listingCategory: "HOUSING" });
      router.push("/provider/listings");
    } catch (e) {
      setPending(null);
      if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) {
        setUpgradeMessage(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Failed to post vacancy. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={editId ? "Edit Home and Living vacancy" : "Post a Home and Living vacancy"}
        description={editId ? "Update this listing. Changes apply to the same listing — no new package is started." : "Advertise open placements and attract suitable participants and coordinators."}
      />
      <div className="container-page py-8 max-w-2xl">
        {loadingEdit && <p className="text-sm text-slate-500 mb-4">Loading your listing…</p>}
        {blockedByRegistration && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-4">
            SIL and SDA listings can only be published by a Provider with a verified NDIS registration covering these supports. You can save this as a draft now and publish it once your registration is verified.
          </div>
        )}
        {pending && (
          <Card style={{ marginBottom: 16 }}>
            <CardHeader><CardTitle>Confirm your listing package</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-sm text-slate-700">
              <p className="m-0"><strong>Property:</strong> {pending.title} — {pending.suburb}</p>
              <p className="m-0"><strong>Package:</strong> Standard Listing — $199.00 for 30 days</p>
              <p className="m-0">
                <strong>Runs:</strong> {new Date().toLocaleDateString("en-AU")} to {new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-AU")} — it expires automatically unless renewed.
              </p>
              <p className="m-0"><strong>Market:</strong> {pending.suburb}{pending.state ? `, ${pending.state}` : ""} · standard board placement</p>
              <p className="text-xs text-slate-500 m-0">
                Upgrade to a Featured Listing ($399.00) from My Listings afterwards — your queue position is shown before you pay. Promotion does not imply SDA enrolment, NDIS registration or participant eligibility. Non-refundable once the 30 days have begun.
              </p>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" disabled={submitting} onClick={() => setPending(null)}>Back</Button>
                <Button type="button" disabled={submitting} onClick={confirmPublish}>{submitting ? "Publishing…" : "Confirm and pay $199.00"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Vacancy Type */}
            <Card>
              <CardHeader><CardTitle>Vacancy Type</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {VACANCY_TYPES.map(opt => (
                  <label key={opt.value} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", cursor: "pointer",
                    border: `1.5px solid ${vacancyCategory === opt.value ? "var(--clr-primary)" : "var(--clr-border)"}`,
                    borderRadius: 10, background: vacancyCategory === opt.value ? "rgba(183,37,88,0.05)" : "var(--td-white)",
                  }}>
                    <input type="radio" value={opt.value} {...register("vacancyCategory")} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--clr-muted)" }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
                {errors.vacancyCategory && <p className="text-xs text-red-500 mt-1">{errors.vacancyCategory.message}</p>}
              </CardContent>
            </Card>

            {/* Vacancy Details */}
            <Card>
              <CardHeader><CardTitle>Vacancy Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label style={lbl}>Listing Title <span style={{ color: "var(--td-pink)" }}>*</span></label>
                  <input {...register("title")} placeholder="e.g. SIL Vacancy Available in Liverpool" style={{ ...inp, borderColor: errors.title ? "var(--td-pink)" : undefined }} />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label style={lbl}>Suburb <span style={{ color: "var(--td-pink)" }}>*</span></label>
                    <input {...register("suburb")} placeholder="e.g. Liverpool" style={{ ...inp, borderColor: errors.suburb ? "var(--td-pink)" : undefined }} />
                    {errors.suburb && <p className="text-xs text-red-500 mt-1">{errors.suburb.message}</p>}
                  </div>
                  <div>
                    <label style={lbl}>State</label>
                    <select {...register("state")} style={{ ...inp, cursor: "pointer" }}>
                      <option value="">State</option>
                      {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={lbl}>Property Type</label>
                    <select {...register("propertyType")} style={{ ...inp, cursor: "pointer" }}>
                      <option value="">Select…</option>
                      {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Number of Vacancies</label>
                    <input type="number" {...register("vacancyCount", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })} min={1} max={20} placeholder="1" style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Support Model</label>
                  <select {...register("supportModel")} style={{ ...inp, cursor: "pointer" }}>
                    <option value="">Select…</option>
                    {SUPPORT_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Vacancy Description <span style={{ color: "var(--td-pink)" }}>*</span></label>
                  <textarea {...register("description")} rows={4}
                    placeholder="Describe what is available, the living arrangement, support included, who it suits, and any restrictions…"
                    style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical", borderColor: errors.description ? "var(--td-pink)" : undefined }} />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* PR-HL02 property, support and access details */}
            <Card>
              <CardHeader><CardTitle>Property and accessibility</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={lbl}>Dwelling category</label>
                    <select {...register("housingDetails.dwellingCategory")} style={{ ...inp, cursor: "pointer" }}>
                      <option value="">Select…</option>
                      {DWELLING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Vacancy date</label>
                    <input type="date" {...register("housingDetails.vacancyDate")} style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Accessibility features</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCESSIBILITY.map(opt => {
                      const sel = accessibility.includes(opt);
                      return (
                        <button key={opt} type="button"
                          onClick={() => setValue("housingDetails.accessibilityFeatures", sel ? accessibility.filter(a => a !== opt) : [...accessibility, opt])}
                          style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: `1.5px solid ${sel ? "var(--clr-primary)" : "var(--clr-border)"}`,
                            background: sel ? "rgba(183,37,88,0.1)" : "var(--td-white)",
                            color: sel ? "var(--clr-primary)" : "var(--clr-text)" }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Room and household information</label>
                  <textarea {...register("housingDetails.roomHousehold")} rows={2} placeholder="e.g. Private room with ensuite in a 3-person household" style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Roster arrangement</label>
                  <textarea {...register("housingDetails.rosterArrangement")} rows={2} placeholder="How support is rostered, e.g. shared 24/7 with one sleepover" style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Compatibility considerations and preferences</label>
                  <textarea {...register("housingDetails.compatibility")} rows={2} placeholder="Household mix, preferences, anything that affects suitability" style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Costs, approvals and inspection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label style={lbl}>Costs and funding</label>
                  <textarea {...register("housingDetails.costs")} rows={2} placeholder="Rent contribution, SDA/SIL funding arrangements, other costs" style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Required approvals</label>
                  <input {...register("housingDetails.requiredApprovals")} placeholder="e.g. NDIS plan approval, SDA eligibility" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Inspection / enquiry process</label>
                  <textarea {...register("housingDetails.inspectionProcess")} rows={2} placeholder="How interested people can enquire and arrange an inspection" style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>Photos (up to 6, JPG/PNG/WebP, 5 MB each)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {photos.map((u) => (
                      <div key={u} style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="Listing" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 8, border: "1px solid var(--clr-border)" }} />
                        <button type="button" aria-label="Remove photo" onClick={() => setValue("housingDetails.photoUrls", photos.filter((p) => p !== u))}
                          style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, border: 0, background: "#be123c", color: "#fff", cursor: "pointer", fontSize: 12 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || photos.length >= 6}
                    onChange={(e) => { void addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                  {uploading && <p className="text-xs text-slate-500 m-0 mt-1">Uploading…</p>}
                  <p className="text-xs text-slate-500 m-0 mt-1">Do not include participants, addresses on signs or other identifying details in photos.</p>
                </div>
              </CardContent>
            </Card>

            {/* Suitable For */}
            <Card>
              <CardHeader><CardTitle>Suitable Participant Profile</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SUITABLE_FOR.map(opt => {
                    const sel = suitableFor.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => setValue("suitableFor", sel ? suitableFor.filter(s => s !== opt) : [...suitableFor, opt])}
                        style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: `1.5px solid ${sel ? "var(--clr-primary)" : "var(--clr-border)"}`,
                          background: sel ? "rgba(183,37,88,0.1)" : "var(--td-white)",
                          color: sel ? "var(--clr-primary)" : "var(--clr-text)" }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Funding Routes */}
            <Card>
              <CardHeader><CardTitle>Funding Routes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {FUNDING_ROUTES.map(opt => {
                    const sel = fundingRoutes.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => setValue("fundingRoutes", sel ? fundingRoutes.filter(f => f !== opt) : [...fundingRoutes, opt])}
                        style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: `1.5px solid ${sel ? "var(--clr-primary)" : "var(--clr-border)"}`,
                          background: sel ? "rgba(183,37,88,0.1)" : "var(--td-white)",
                          color: sel ? "var(--clr-primary)" : "var(--clr-text)" }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Acknowledgement */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer",
              border: `1.5px solid ${errors.acknowledgement ? "var(--td-pink)" : "var(--clr-border)"}`,
              borderRadius: 10, background: "var(--td-white)",
            }}>
              <input type="checkbox" {...register("acknowledgement")} style={{ marginTop: 2 }} />
              <span style={{ fontSize: 13, color: "var(--clr-text)", lineHeight: 1.5 }}>
                I confirm vacancy details are accurate, I will update this listing if vacancy status changes,
                and I agree to Shiftify platform terms.
              </span>
            </label>
            {errors.acknowledgement && <p className="text-xs text-red-500">{errors.acknowledgement.message}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
              {editId ? (
                <Button type="button" className="flex-1" disabled={submitting || loadingEdit} onClick={saveChanges}>
                  {editStatus === "DRAFT" ? "Save draft changes" : "Save changes"}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" className="flex-1" disabled={submitting} onClick={saveDraft}>Save draft</Button>
                  <Button type="submit" className="flex-1" disabled={submitting || blockedByRegistration}>
                    Review package — $199 / 30 days
                  </Button>
                </>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
}
