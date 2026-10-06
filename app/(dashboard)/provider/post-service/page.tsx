"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

// ── Schema (Provider doc PR-CP01 — general service capacity) ────────────────────
const schema = z.object({
  acceptingStatus: z.enum(["YES", "LIMITED", "NO"], { required_error: "Tell participants whether you are accepting new referrals", invalid_type_error: "Tell participants whether you are accepting new referrals" }),
  serviceCategories: z.array(z.string()).min(1, "Select at least one service with current capacity"),
  suburb: z.string().min(2, "Add the main location you cover"),
  daysAvailable: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).min(1, "Select at least one day"),
  listingType: z.enum(["IMMEDIATE_INTAKE", "SHORT_TERM", "WAITLIST_OPENING"], { required_error: "Select when you can start", invalid_type_error: "Select when you can start" }),
  fundingTypes: z.array(z.string()).min(1, "Select at least one funding type"),
  responseExpectation: z.enum(["SAME_DAY", "WITHIN_48_HOURS", "WITHIN_A_WEEK"], { required_error: "Set how quickly you respond to enquiries", invalid_type_error: "Set how quickly you respond to enquiries" }),
  serviceMode: z.enum(["IN_PERSON", "REMOTE", "BOTH"]).optional(),
  notes: z.string().max(4000).optional(),
  acknowledgement: z.boolean().refine(v => v === true, { message: "You must confirm this information is accurate" }),
});
type FormData = z.infer<typeof schema>;

const ACCEPTING = [
  { value: "YES",     label: "Yes",     desc: "We are accepting new participants" },
  { value: "LIMITED", label: "Limited", desc: "Only some services, areas or times" },
  { value: "NO",      label: "No",      desc: "Not accepting new participants right now" },
];

const CAPACITY_TIMING = [
  { value: "IMMEDIATE_INTAKE", label: "Immediate capacity", desc: "We can start new participants now" },
  { value: "SHORT_TERM",       label: "Near-term capacity", desc: "We can start within the next few weeks" },
  { value: "WAITLIST_OPENING", label: "Waitlist",           desc: "Join our waitlist for a future start" },
];

const DAYS = [
  { value: "MON", label: "Mon" }, { value: "TUE", label: "Tue" }, { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" }, { value: "FRI", label: "Fri" }, { value: "SAT", label: "Sat" }, { value: "SUN", label: "Sun" },
] as const;

const RESPONSE_EXPECTATIONS = [
  { value: "SAME_DAY",        label: "Same day" },
  { value: "WITHIN_48_HOURS", label: "Within 48 hours" },
  { value: "WITHIN_A_WEEK",   label: "Within a week" },
];

const FUNDING_TYPES = ["Self-managed", "Plan-managed", "NDIA-managed", "Private"];

const inp: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--clr-border)", fontSize: 14, outline: "none", background: "var(--td-white)", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--clr-text)", marginBottom: 4 };

function chipStyle(on: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer",
    border: `1.5px solid ${on ? "var(--clr-primary)" : "var(--clr-border)"}`,
    borderRadius: 8, background: on ? "rgba(183,37,88,0.06)" : "var(--td-white)",
  };
}

function toggle<T extends string>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
}

function pillStyle(on: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "10px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer",
    border: `1.5px solid ${on ? "var(--clr-primary)" : "var(--clr-border)"}`,
    background: on ? "rgba(183,37,88,0.07)" : "var(--td-white)",
    fontSize: 12, fontWeight: 600,
    color: on ? "var(--clr-primary)" : "var(--clr-text)",
  };
}

export default function ServicesCapacityPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { serviceCategories: [], daysAvailable: [], fundingTypes: [] },
  });
  const { register, watch, setValue, formState: { errors } } = form;

  const accepting    = watch("acceptingStatus");
  const timing       = watch("listingType");
  const response     = watch("responseExpectation");
  const serviceMode  = watch("serviceMode");
  const categories   = watch("serviceCategories") ?? [];
  const days         = watch("daysAvailable") ?? [];
  const fundingTypes = watch("fundingTypes") ?? [];

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError(null);
    setUpgradeMessage(null);
    try {
      const labels = data.serviceCategories.map(v => JOB_CATEGORIES.find(c => c.value === v)?.label ?? v);
      const acceptingLabel = ACCEPTING.find(a => a.value === data.acceptingStatus)?.label ?? "";
      const { notes, ...rest } = data;
      // Ordinary capacity updates do not consume a Provider Action (Provider doc PR-CP01).
      await api.post("/provider/listings", {
        ...rest,
        listingCategory: "SERVICE",
        serviceCategory: data.serviceCategories[0],
        title: `Service capacity — accepting new participants: ${acceptingLabel}`,
        description: notes?.trim() ? notes.trim() : `Current capacity for ${labels.join(", ")} in ${data.suburb}.`,
      });
      router.push("/provider/listings");
    } catch (e) {
      if (e instanceof ApiError && (e.code === "SUBSCRIPTION_LIMIT" || e.code === "SUBSCRIPTION_REQUIRED")) {
        setUpgradeMessage(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Failed to save capacity. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Services & Capacity"
        description="Tell participants, coordinators and plan managers what capacity you have. Updates are free and never use a Provider Action."
      />
      <div className="container-page py-8 max-w-2xl">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {upgradeMessage && <UpgradePrompt message={upgradeMessage} />}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <Card>
              <CardHeader><CardTitle>Accepting new participants?</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ACCEPTING.map(opt => (
                  <label key={opt.value} style={chipStyle(accepting === opt.value)}>
                    <input type="radio" value={opt.value} {...register("acceptingStatus")} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--clr-muted)" }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
                {errors.acceptingStatus && <p className="text-xs text-red-500 mt-1">{errors.acceptingStatus.message}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Services with current capacity</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {JOB_CATEGORIES.map(c => {
                    const on = categories.includes(c.value);
                    return (
                      <label key={c.value} style={chipStyle(on)}>
                        <input type="checkbox" checked={on} style={{ display: "none" }}
                          onChange={() => setValue("serviceCategories", toggle(categories, c.value), { shouldValidate: true })} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.serviceCategories && <p className="text-xs text-red-500 mt-2">{errors.serviceCategories.message}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Locations &amp; days</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label style={lbl}>Main suburb / region covered <span style={{ color: "var(--td-pink)" }}>*</span></label>
                  <input {...register("suburb")} placeholder="e.g. Parramatta" style={{ ...inp, borderColor: errors.suburb ? "var(--td-pink)" : undefined }} />
                  {errors.suburb && <p className="text-xs text-red-500 mt-1">{errors.suburb.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Days with capacity <span style={{ color: "var(--td-pink)" }}>*</span></label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {DAYS.map(d => {
                      const on = days.includes(d.value);
                      return (
                        <label key={d.value} style={{ ...chipStyle(on), padding: "8px 14px", fontSize: 12, fontWeight: 600 }}>
                          <input type="checkbox" checked={on} style={{ display: "none" }}
                            onChange={() => setValue("daysAvailable", toggle(days, d.value), { shouldValidate: true })} />
                          {d.label}
                        </label>
                      );
                    })}
                  </div>
                  {errors.daysAvailable && <p className="text-xs text-red-500 mt-1">{errors.daysAvailable.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Delivery mode</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: "IN_PERSON", label: "In-person" },
                      { value: "REMOTE",    label: "Remote" },
                      { value: "BOTH",      label: "Both" },
                    ].map(opt => (
                      <label key={opt.value} style={pillStyle(serviceMode === opt.value)}>
                        <input type="radio" value={opt.value} {...register("serviceMode")} style={{ display: "none" }} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>When can you start?</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {CAPACITY_TIMING.map(opt => (
                  <label key={opt.value} style={chipStyle(timing === opt.value)}>
                    <input type="radio" value={opt.value} {...register("listingType")} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--clr-muted)" }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
                {errors.listingType && <p className="text-xs text-red-500 mt-1">{errors.listingType.message}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Funding types accepted</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {FUNDING_TYPES.map(ft => {
                    const sel = fundingTypes.includes(ft);
                    return (
                      <label key={ft} style={chipStyle(sel)}>
                        <input type="checkbox" checked={sel} style={{ display: "none" }}
                          onChange={() => setValue("fundingTypes", toggle(fundingTypes, ft), { shouldValidate: true })} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{ft}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.fundingTypes && <p className="text-xs text-red-500 mt-2">{errors.fundingTypes.message}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Enquiries</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 m-0">
                  Participants, coordinators and plan managers can enquire through your profile. Answering a direct enquiry is free.
                </p>
                <div>
                  <label style={lbl}>We aim to respond <span style={{ color: "var(--td-pink)" }}>*</span></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {RESPONSE_EXPECTATIONS.map(opt => (
                      <label key={opt.value} style={pillStyle(response === opt.value)}>
                        <input type="radio" value={opt.value} {...register("responseExpectation")} style={{ display: "none" }} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {errors.responseExpectation && <p className="text-xs text-red-500 mt-1">{errors.responseExpectation.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Notes for enquirers (optional)</label>
                  <textarea {...register("notes")} rows={3}
                    placeholder="Typical participant fit, any limits on services, areas or times…"
                    style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                </div>
              </CardContent>
            </Card>

            <label style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer",
              border: `1.5px solid ${errors.acknowledgement ? "var(--td-pink)" : "var(--clr-border)"}`,
              borderRadius: 10, background: "var(--td-white)",
            }}>
              <input type="checkbox" {...register("acknowledgement")} style={{ marginTop: 2 }} />
              <span style={{ fontSize: 13, color: "var(--clr-text)", lineHeight: 1.5 }}>
                I confirm this capacity information is accurate, and I will update it if our capacity changes.
                I agree to the Shiftify platform terms.
              </span>
            </label>
            {errors.acknowledgement && <p className="text-xs text-red-500">{errors.acknowledgement.message}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Saving…" : "Save Capacity"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
}
