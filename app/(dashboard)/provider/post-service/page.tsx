"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  listingType: z.enum([
    "IMMEDIATE_INTAKE",
    "RECURRING_CAPACITY",
    "ONE_TIME_SLOT",
    "SHORT_TERM",
    "URGENT_FILL",
    "WAITLIST_OPENING",
    "ONGOING_REFERRALS",
  ], { required_error: "Select a listing type" }),
  title: z.string().min(5, "Title is required"),
  serviceCategory: z.string().min(1, "Service category is required"),
  description: z.string().min(10, "Please provide a description"),
  suburb: z.string().min(2, "Suburb is required"),
  serviceMode: z.enum(["IN_PERSON", "REMOTE", "BOTH"]).optional(),
  fundingTypes: z.array(z.string()).min(1, "Select at least one funding type"),
  acknowledgement: z.boolean().refine(v => v === true, { message: "You must confirm this information is accurate" }),
});
type FormData = z.infer<typeof schema>;

const SERVICE_CATEGORIES = [
  "Personal Care", "Community Access", "Domestic Assistance", "Transport Support",
  "Social / Recreational Support", "Daily Living Support", "Respite", "Overnight Support",
  "SIL Support", "Psychosocial Support", "Behaviour Support Assistance", "Complex Care",
  "Meal Support", "Medication Support", "Appointment Support", "Other",
];

const LISTING_TYPES = [
  { value: "IMMEDIATE_INTAKE",    label: "Immediate intake open",       desc: "We have capacity available now" },
  { value: "RECURRING_CAPACITY",  label: "Recurring service capacity",  desc: "Ongoing weekly/fortnightly intake" },
  { value: "URGENT_FILL",         label: "Urgent intake — fill now",    desc: "Urgent capacity opening" },
  { value: "ONE_TIME_SLOT",       label: "One-time service slot",       desc: "Specific date/time available" },
  { value: "ONGOING_REFERRALS",   label: "Ongoing open referrals",      desc: "Always accepting referrals" },
  { value: "WAITLIST_OPENING",    label: "Waitlist opening",            desc: "Priority spot on our waitlist" },
];

const FUNDING_TYPES = ["Self-managed", "Plan-managed", "NDIA-managed", "Private"];

const inp: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--clr-border)", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--clr-text)", marginBottom: 4 };

export default function PostServicePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fundingTypes: [] },
  });
  const { register, watch, setValue, formState: { errors } } = form;

  const listingType  = watch("listingType");
  const serviceMode  = watch("serviceMode");
  const fundingTypes = watch("fundingTypes") ?? [];

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      // TODO: POST /provider/listings when backend endpoint exists
      // For now, show success placeholder
      await api.post("/provider/listings", { ...data, listingCategory: "SERVICE" });
      router.push("/provider/listings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Post Service Availability"
        description="Advertise your current capacity and attract new referrals."
      />
      <div className="container-page py-8 max-w-2xl">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Step 1: Listing Type */}
            <Card>
              <CardHeader><CardTitle>Availability Type</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {LISTING_TYPES.map(opt => (
                  <label key={opt.value} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", cursor: "pointer",
                    border: `1.5px solid ${listingType === opt.value ? "var(--clr-primary)" : "var(--clr-border)"}`,
                    borderRadius: 10, background: listingType === opt.value ? "rgba(79,70,229,0.05)" : "#fff",
                  }}>
                    <input type="radio" value={opt.value} {...register("listingType")} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--clr-muted)" }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
                {errors.listingType && <p className="text-xs text-red-500 mt-1">{errors.listingType.message}</p>}
              </CardContent>
            </Card>

            {/* Step 2: Service Details */}
            <Card>
              <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label style={lbl}>Listing Title <span style={{ color: "#ef4444" }}>*</span></label>
                  <input {...register("title")} placeholder="e.g. Female Personal Care Capacity Available" style={{ ...inp, borderColor: errors.title ? "#ef4444" : undefined }} />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Service Category <span style={{ color: "#ef4444" }}>*</span></label>
                  <select {...register("serviceCategory")} style={{ ...inp, cursor: "pointer", borderColor: errors.serviceCategory ? "#ef4444" : undefined }}>
                    <option value="">Select category…</option>
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.serviceCategory && <p className="text-xs text-red-500 mt-1">{errors.serviceCategory.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                  <textarea {...register("description")} rows={4}
                    placeholder="Describe the support offered, typical participant fit, and anything applicants should know…"
                    style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical", borderColor: errors.description ? "#ef4444" : undefined }} />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Location & Mode */}
            <Card>
              <CardHeader><CardTitle>Location &amp; Delivery Mode</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label style={lbl}>Suburb / Region <span style={{ color: "#ef4444" }}>*</span></label>
                  <input {...register("suburb")} placeholder="e.g. Parramatta" style={{ ...inp, borderColor: errors.suburb ? "#ef4444" : undefined }} />
                  {errors.suburb && <p className="text-xs text-red-500 mt-1">{errors.suburb.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Delivery Mode</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: "IN_PERSON", label: "In-person" },
                      { value: "REMOTE",    label: "Remote" },
                      { value: "BOTH",      label: "Both" },
                    ].map(opt => (
                      <label key={opt.value} style={{
                        flex: 1, padding: "10px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                        border: `1.5px solid ${serviceMode === opt.value ? "var(--clr-primary)" : "var(--clr-border)"}`,
                        background: serviceMode === opt.value ? "rgba(79,70,229,0.07)" : "#fff",
                        fontSize: 12, fontWeight: 600,
                        color: serviceMode === opt.value ? "var(--clr-primary)" : "var(--clr-text)",
                      }}>
                        <input type="radio" value={opt.value} {...register("serviceMode")} style={{ display: "none" }} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Funding Types */}
            <Card>
              <CardHeader><CardTitle>Funding Types Accepted</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {FUNDING_TYPES.map(ft => {
                    const sel = fundingTypes.includes(ft);
                    return (
                      <label key={ft} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer",
                        border: `1.5px solid ${sel ? "var(--clr-primary)" : "var(--clr-border)"}`,
                        borderRadius: 8, background: sel ? "rgba(79,70,229,0.06)" : "#fff",
                      }}>
                        <input type="checkbox" checked={sel} style={{ display: "none" }}
                          onChange={() => setValue("fundingTypes", sel ? fundingTypes.filter(f => f !== ft) : [...fundingTypes, ft], { shouldValidate: true })} />
                        <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${sel ? "var(--clr-primary)" : "var(--clr-border)"}`,
                          background: sel ? "var(--clr-primary)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {sel && <i className="bi bi-check-lg" style={{ color: "#fff", fontSize: 9 }} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{ft}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.fundingTypes && <p className="text-xs text-red-500 mt-2">{errors.fundingTypes.message}</p>}
              </CardContent>
            </Card>

            {/* Acknowledgement */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer",
              border: `1.5px solid ${errors.acknowledgement ? "#ef4444" : "var(--clr-border)"}`,
              borderRadius: 10, background: "#fff",
            }}>
              <input type="checkbox" {...register("acknowledgement")} style={{ marginTop: 2 }} />
              <span style={{ fontSize: 13, color: "var(--clr-text)", lineHeight: 1.5 }}>
                I confirm this service availability information is accurate, and I will update this listing if our capacity changes.
                I agree to the Shiftify platform terms.
              </span>
            </label>
            {errors.acknowledgement && <p className="text-xs text-red-500">{errors.acknowledgement.message}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Publishing…" : "Publish Listing"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
}
