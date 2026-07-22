"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { listLinkedParticipants, postReferral, type LinkedParticipant } from "@/lib/api/pm";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const URGENCY_OPTIONS = [
  { value: "SCHEDULED",   label: "Scheduled" },
  { value: "SAME_DAY",    label: "Same day" },
  { value: "EMERGENCY",   label: "Emergency" },
  { value: "REPLACEMENT", label: "Replacement" },
];

const FUNDING_TYPES = [
  { value: "SELF_MANAGED", label: "Self-managed" },
  { value: "PLAN_MANAGED", label: "Plan-managed" },
  { value: "NDIA_MANAGED", label: "NDIA-managed" },
  { value: "PRIVATE",      label: "Private" },
  { value: "MIXED",        label: "Mixed" },
  { value: "DISCUSS",      label: "To be discussed" },
];

const referralSchema = z.object({
  participantUserId: z.string().min(1, "Select a participant"),
  title:             z.string().min(3, "Title is too short").max(200),
  description:       z.string().min(10, "Add a bit more detail").max(5000),
  category:          z.string().min(1, "Select a category"),
  suburb:            z.string().min(2, "Suburb is required"),
  state:             z.string().min(1, "Select a state"),
  scheduledStartAt:  z.string().min(1, "Start date/time is required"),
  scheduledEndAt:    z.string().min(1, "End date/time is required"),
  urgency:           z.string().optional(),
  fundingType:       z.string().optional(),
  totalHours:        z.string().optional(),
});

type ReferralFormValues = z.infer<typeof referralSchema>;

export default function PostReferralPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<LinkedParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: { urgency: "SCHEDULED", fundingType: "PLAN_MANAGED" },
  });

  useEffect(() => {
    listLinkedParticipants()
      .then(setParticipants)
      .catch(() => setParticipants([]))
      .finally(() => setLoadingParticipants(false));
  }, []);

  async function onSubmit(values: ReferralFormValues) {
    setSubmitError(null);
    try {
      const job = await postReferral({
        participantUserId: values.participantUserId,
        title:             values.title,
        description:       values.description,
        category:          values.category,
        suburb:            values.suburb,
        state:             values.state,
        scheduledStartAt:  new Date(values.scheduledStartAt).toISOString(),
        scheduledEndAt:    new Date(values.scheduledEndAt).toISOString(),
        urgency:           values.urgency || undefined,
        fundingType:       values.fundingType || undefined,
        totalHours:        values.totalHours ? Number(values.totalHours) : undefined,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to post referral");
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <>
      <PageHeader
        title="Post a Referral"
        description="Post a support request on behalf of one of your linked participants."
      />
      <div className="container-page py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Referral details</CardTitle>
          </CardHeader>
          <CardContent>
            {submitError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className={labelClass}>Participant</label>
                <select className={inputClass} disabled={loadingParticipants} {...register("participantUserId")}>
                  <option value="">
                    {loadingParticipants ? "Loading participants…" : "Select a participant"}
                  </option>
                  {participants.map((p) => (
                    <option key={p.participant.id} value={p.participant.id}>
                      {p.participant.name}
                    </option>
                  ))}
                </select>
                {errors.participantUserId && <p className={errorClass}>{errors.participantUserId.message}</p>}
                {!loadingParticipants && participants.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    No linked participants yet — link a participant before posting a referral.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Title</label>
                <input className={inputClass} placeholder="e.g. Weekday morning personal care" {...register("title")} />
                {errors.title && <p className={errorClass}>{errors.title.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={4} {...register("description")} />
                {errors.description && <p className={errorClass}>{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={inputClass} {...register("category")}>
                    <option value="">Select category</option>
                    {JOB_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className={errorClass}>{errors.category.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Urgency</label>
                  <select className={inputClass} {...register("urgency")}>
                    {URGENCY_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Suburb</label>
                  <input className={inputClass} {...register("suburb")} />
                  {errors.suburb && <p className={errorClass}>{errors.suburb.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select className={inputClass} {...register("state")}>
                    <option value="">Select state</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className={errorClass}>{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Scheduled start</label>
                  <input type="datetime-local" className={inputClass} {...register("scheduledStartAt")} />
                  {errors.scheduledStartAt && <p className={errorClass}>{errors.scheduledStartAt.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheduled end</label>
                  <input type="datetime-local" className={inputClass} {...register("scheduledEndAt")} />
                  {errors.scheduledEndAt && <p className={errorClass}>{errors.scheduledEndAt.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Funding type</label>
                  <select className={inputClass} {...register("fundingType")}>
                    {FUNDING_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Total hours (optional)</label>
                  <input type="number" min={0} step="0.5" className={inputClass} {...register("totalHours")} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Posting…" : "Post Referral"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
