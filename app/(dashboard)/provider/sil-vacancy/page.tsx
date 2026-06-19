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
  acknowledgement: z.boolean().refine(v => v === true, { message: "You must confirm the vacancy details are accurate" }),
});
type FormData = z.infer<typeof schema>;

const VACANCY_TYPES = [
  { value: "SIL",       label: "SIL Vacancy",               desc: "Supported Independent Living placement" },
  { value: "SDA",       label: "SDA Vacancy",               desc: "Specialist Disability Accommodation" },
  { value: "SIL_SDA",   label: "SIL + SDA Combined",        desc: "Accommodation with onsite support" },
  { value: "RESPITE",   label: "Respite Vacancy",           desc: "Short-term placement / relief" },
  { value: "MEDIUM_TERM", label: "Medium-Term Accommodation", desc: "Transitional arrangement" },
];

const PROPERTY_TYPES = ["House", "Apartment", "Villa / Unit", "Shared House", "Individual Apartment", "Specialist Disability Accommodation", "Respite Property"];
const SUPPORT_MODELS = ["24/7 Support", "Sleepover Support", "Drop-in Support", "Rostered Active Support", "Shared Support Model", "Individual Support Available"];
const SUITABLE_FOR   = ["Physical Disability", "Psychosocial Disability", "Intellectual Disability", "Autism", "ABI", "High Support Needs", "Mental Health Support Needs"];
const FUNDING_ROUTES = ["SIL Funded", "SDA Funded", "Respite Funding", "Private Contribution", "Mixed", "Discuss on enquiry"];

const inp: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--clr-border)", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--clr-text)", marginBottom: 4 };

export default function SilVacancyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { suitableFor: [], fundingRoutes: [] },
  });
  const { register, watch, setValue, formState: { errors } } = form;

  const vacancyCategory = watch("vacancyCategory");
  const suitableFor     = watch("suitableFor") ?? [];
  const fundingRoutes   = watch("fundingRoutes") ?? [];

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/provider/listings", { ...data, listingCategory: "HOUSING" });
      router.push("/provider/listings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post vacancy. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Post SIL / SDA Housing Vacancy"
        description="Advertise open placements and attract suitable participants and coordinators."
      />
      <div className="container-page py-8 max-w-2xl">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    borderRadius: 10, background: vacancyCategory === opt.value ? "rgba(79,70,229,0.05)" : "#fff",
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
                  <label style={lbl}>Listing Title <span style={{ color: "#ef4444" }}>*</span></label>
                  <input {...register("title")} placeholder="e.g. SIL Vacancy Available in Liverpool" style={{ ...inp, borderColor: errors.title ? "#ef4444" : undefined }} />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label style={lbl}>Suburb <span style={{ color: "#ef4444" }}>*</span></label>
                    <input {...register("suburb")} placeholder="e.g. Liverpool" style={{ ...inp, borderColor: errors.suburb ? "#ef4444" : undefined }} />
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
                    <input type="number" {...register("vacancyCount", { valueAsNumber: true })} min={1} max={20} placeholder="1" style={inp} />
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
                  <label style={lbl}>Vacancy Description <span style={{ color: "#ef4444" }}>*</span></label>
                  <textarea {...register("description")} rows={4}
                    placeholder="Describe what is available, the living arrangement, support included, who it suits, and any restrictions…"
                    style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical", borderColor: errors.description ? "#ef4444" : undefined }} />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
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
                          background: sel ? "rgba(79,70,229,0.1)" : "#fff",
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
                          background: sel ? "rgba(79,70,229,0.1)" : "#fff",
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
              border: `1.5px solid ${errors.acknowledgement ? "#ef4444" : "var(--clr-border)"}`,
              borderRadius: 10, background: "#fff",
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
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Publishing…" : "Publish Vacancy"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
}
