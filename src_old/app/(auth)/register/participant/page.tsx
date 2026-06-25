"use client";
// Participant Registration Wizard
// Steps per spec: 1=Account, 2=Profile, 3=Location, 4=NDIS Funding, 5=Service Needs,
// 6=Preferences & Requirements, 7=Availability, 8=Consent & Agreements
// Final simplified flow: Account → Profile → Funding → Needs → Done → Dashboard

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";
import { setAccessToken } from "@/src/lib/token-store";

// ── Step schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  firstName:       z.string().min(1, "First name is required"),
  lastName:        z.string().min(1, "Last name is required"),
  email:           z.string().email("Valid email required"),
  phone:           z.string().min(8, "Mobile number is required"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  participantType: z.enum(["SELF", "PARENT", "GUARDIAN", "CARER", "NOMINEE"], {
    required_error: "Please select participant type",
  }),
  ageGroup: z.enum(["CHILD", "ADULT", "SENIOR"], {
    required_error: "Please select an age group",
  }),
  gender: z.string().optional(),
  preferredName: z.string().max(80).optional(),
});

const step3Schema = z.object({
  suburb:      z.string().min(2, "Suburb is required"),
  postcode:    z.string().min(4, "Postcode is required"),
  state:       z.string().min(2, "State is required"),
  fullAddress: z.string().max(300).optional(),
});

const step4Schema = z.object({
  fundingManagementType: z.enum(["SELF", "PLAN", "NDIA"], {
    required_error: "Plan management type is required",
  }),
  supportCoordinationFunding: z.enum(["NONE", "LEVEL_1", "LEVEL_2", "LEVEL_3"], {
    required_error: "Support coordination funding is required",
  }),
  ndisNumber:    z.string().max(20).optional(),
  ndisStartDate: z.string().optional(),
  ndisEndDate:   z.string().optional(),
});

const step5Schema = z.object({
  primarySupportNeeds: z.array(z.string()).min(1, "Select at least one support need"),
  preferredSupportType: z.enum(["ONE_TIME", "ONGOING", "BOTH"], {
    required_error: "Please select support type",
  }),
  primaryDisability: z.string().max(120).optional(),
});

const step6Schema = z.object({
  preferredWorkerGender: z.string().optional(),
  languagePreference:    z.string().optional(),
  culturalPreference:    z.string().optional(),
  skillsRequired:        z.array(z.string()).optional(),
});

const step7Schema = z.object({
  preferredDays: z.array(z.string()).optional(),
  preferredTime: z.string().optional(),
});

const step8Schema = z.object({
  termsAccepted:         z.literal(true, { errorMap: () => ({ message: "You must accept the Terms & Conditions" }) }),
  privacyPolicyAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Privacy Policy" }) }),
  ndisCodeAccepted:      z.boolean().optional(),
});

// ── Union type ────────────────────────────────────────────────────────────────

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;
type Step6Data = z.infer<typeof step6Schema>;
type Step7Data = z.infer<typeof step7Schema>;
type Step8Data = z.infer<typeof step8Schema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 8;

const SUPPORT_NEEDS_OPTIONS = [
  { value: "PERSONAL_CARE",     label: "Personal Care" },
  { value: "COMMUNITY_ACCESS",  label: "Community Access" },
  { value: "DOMESTIC_ASSISTANCE", label: "Domestic Assistance" },
  { value: "TRANSPORT",         label: "Transport" },
  { value: "THERAPY_SUPPORTS",  label: "Therapy Supports" },
  { value: "NURSING_CARE",      label: "Nursing Care" },
  { value: "BEHAVIOUR_SUPPORT", label: "Behaviour Support" },
  { value: "SIL",               label: "Supported Independent Living (SIL)" },
  { value: "SDA",               label: "Specialist Disability Accommodation (SDA)" },
];

const DAYS_OPTIONS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full">
        <div
          className="h-1.5 bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const selectCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function ParticipantRegisterPage() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Accumulated data across steps
  const [wizardData, setWizardData] = useState<Partial<
    Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data & Step7Data & Step8Data
  >>({});

  // Step 1
  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: wizardData });
  // Step 2
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: wizardData });
  // Step 3
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: wizardData });
  // Step 4
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema), defaultValues: wizardData });
  // Step 5
  const form5 = useForm<Step5Data>({ resolver: zodResolver(step5Schema), defaultValues: { primarySupportNeeds: [], ...wizardData } });
  // Step 6
  const form6 = useForm<Step6Data>({ resolver: zodResolver(step6Schema), defaultValues: { skillsRequired: [], ...wizardData } });
  // Step 7
  const form7 = useForm<Step7Data>({ resolver: zodResolver(step7Schema), defaultValues: { preferredDays: [], ...wizardData } });
  // Step 8
  const form8 = useForm<Step8Data>({ resolver: zodResolver(step8Schema) });

  // ── Step submit handlers ───────────────────────────────────────────────────

  const advance = (data: Partial<Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data & Step7Data>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    setCurrentStep((s) => s + 1);
    setError(null);
  };

  const back = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    setError(null);
  };

  // ── Final submit (step 8) ──────────────────────────────────────────────────

  const finalSubmit = async (step8: Step8Data) => {
    const all = { ...wizardData, ...step8 };
    setSubmitting(true);
    setError(null);
    try {
      // 1. Register account
      interface RegisterResp {
        user: { id: string; name: string; email: string | null; phone: string | null; status: string; avatarUrl: string | null; roles: { role: string; isActiveDefault: boolean }[] };
        activeRole: string;
        accessToken: string;
      }
      const reg = await api.post<RegisterResp>("/auth/register", {
        name:     `${all.firstName} ${all.lastName}`,
        email:    all.email,
        phone:    all.phone,
        password: all.password,
        role:     "PARTICIPANT",
      });
      setAccessToken(reg.accessToken);

      // 2. Save profile (steps 2–8)
      await api.post("/profiles/participant", {
        profileStep:               8,
        participantType:           all.participantType,
        ageGroup:                  all.ageGroup,
        gender:                    all.gender,
        preferredName:             all.preferredName,
        suburb:                    all.suburb,
        postcode:                  all.postcode,
        state:                     all.state,
        fullAddress:               all.fullAddress,
        fundingManagementType:     all.fundingManagementType,
        supportCoordinationFunding: all.supportCoordinationFunding,
        ndisNumber:                all.ndisNumber,
        ndisStartDate:             all.ndisStartDate ? new Date(all.ndisStartDate).toISOString() : undefined,
        ndisEndDate:               all.ndisEndDate   ? new Date(all.ndisEndDate).toISOString()   : undefined,
        primarySupportNeeds:       all.primarySupportNeeds,
        preferredSupportType:      all.preferredSupportType,
        primaryDisability:         all.primaryDisability,
        preferredWorkerGender:     all.preferredWorkerGender,
        languagePreference:        all.languagePreference,
        culturalPreference:        all.culturalPreference,
        skillsRequired:            all.skillsRequired,
        preferredDays:             all.preferredDays,
        preferredTime:             all.preferredTime,
        termsAccepted:             all.termsAccepted,
        privacyPolicyAccepted:     all.privacyPolicyAccepted,
        ndisCodeAccepted:          all.ndisCodeAccepted ?? false,
      });

      setUser({
        id:         reg.user.id,
        name:       reg.user.name,
        email:      reg.user.email,
        phone:      reg.user.phone,
        status:     reg.user.status,
        activeRole: reg.activeRole,
        roles:      reg.user.roles,
        avatarUrl:  reg.user.avatarUrl,
      });

      router.push("/dashboard/participant");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Checkbox multi-select helper ───────────────────────────────────────────

  function MultiCheckbox({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string[];
    onChange: (v: string[]) => void;
  }) {
    const toggle = (v: string) =>
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  // ── Render steps ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Participant Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            NDIS participant marketplace — find and book support workers
          </p>
        </div>

        <ProgressBar step={currentStep} total={TOTAL_STEPS} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Step 1: Basic Account Setup ── */}
        {currentStep === 1 && (
          <form onSubmit={form1.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Basic Account Setup</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>First Name</Label>
                <input {...form1.register("firstName")} type="text" className={inputCls} placeholder="Jane" />
                <FieldError message={form1.formState.errors.firstName?.message} />
              </div>
              <div>
                <Label required>Last Name</Label>
                <input {...form1.register("lastName")} type="text" className={inputCls} placeholder="Smith" />
                <FieldError message={form1.formState.errors.lastName?.message} />
              </div>
            </div>
            <div>
              <Label required>Email Address</Label>
              <input {...form1.register("email")} type="email" autoComplete="email" className={inputCls} placeholder="you@example.com" />
              <FieldError message={form1.formState.errors.email?.message} />
            </div>
            <div>
              <Label required>Mobile Number</Label>
              <input {...form1.register("phone")} type="tel" className={inputCls} placeholder="04XX XXX XXX" />
              <FieldError message={form1.formState.errors.phone?.message} />
            </div>
            <div>
              <Label required>Password</Label>
              <input {...form1.register("password")} type="password" autoComplete="new-password" className={inputCls} placeholder="Minimum 8 characters" />
              <FieldError message={form1.formState.errors.password?.message} />
            </div>
            <div>
              <Label required>Confirm Password</Label>
              <input {...form1.register("confirmPassword")} type="password" autoComplete="new-password" className={inputCls} placeholder="Re-enter password" />
              <FieldError message={form1.formState.errors.confirmPassword?.message} />
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Continue
            </button>
            <p className="text-center text-xs text-gray-500">
              Already have an account?{" "}
              <a href="/login" className="text-indigo-600 hover:underline">Sign in</a>
            </p>
          </form>
        )}

        {/* ── Step 2: Participant Profile ── */}
        {currentStep === 2 && (
          <form onSubmit={form2.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Participant Profile</h2>
            <div>
              <Label required>Participant Type</Label>
              <select {...form2.register("participantType")} className={selectCls}>
                <option value="">Select type</option>
                <option value="SELF">Self</option>
                <option value="PARENT">Parent / Guardian</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="CARER">Carer</option>
                <option value="NOMINEE">Nominee</option>
              </select>
              <FieldError message={form2.formState.errors.participantType?.message} />
            </div>
            <div>
              <Label required>Participant Age Group</Label>
              <select {...form2.register("ageGroup")} className={selectCls}>
                <option value="">Select age group</option>
                <option value="CHILD">Child (0–17)</option>
                <option value="ADULT">Adult (18–64)</option>
                <option value="SENIOR">Senior (65+)</option>
              </select>
              <FieldError message={form2.formState.errors.ageGroup?.message} />
            </div>
            <div>
              <Label>Gender (Optional)</Label>
              <select {...form2.register("gender")} className={selectCls}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label>Preferred Name (Optional)</Label>
              <input {...form2.register("preferredName")} type="text" className={inputCls} placeholder="What should we call you?" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Continue</button>
            </div>
          </form>
        )}

        {/* ── Step 3: Location Details ── */}
        {currentStep === 3 && (
          <form onSubmit={form3.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Location Details</h2>
            <p className="text-sm text-gray-500">Used to match you with nearby support workers.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label required>Suburb</Label>
                <input {...form3.register("suburb")} type="text" className={inputCls} placeholder="e.g. Parramatta" />
                <FieldError message={form3.formState.errors.suburb?.message} />
              </div>
              <div>
                <Label required>Postcode</Label>
                <input {...form3.register("postcode")} type="text" className={inputCls} placeholder="2150" maxLength={4} />
                <FieldError message={form3.formState.errors.postcode?.message} />
              </div>
              <div>
                <Label required>State</Label>
                <select {...form3.register("state")} className={selectCls}>
                  <option value="">Select</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError message={form3.formState.errors.state?.message} />
              </div>
            </div>
            <div>
              <Label>Full Address (Optional — only shared after booking)</Label>
              <input {...form3.register("fullAddress")} type="text" className={inputCls} placeholder="Unit 2, 45 Smith Street" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Continue</button>
            </div>
          </form>
        )}

        {/* ── Step 4: NDIS Funding Details ── */}
        {currentStep === 4 && (
          <form onSubmit={form4.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">NDIS Funding Details</h2>
            <div>
              <Label required>Plan Management Type</Label>
              <select {...form4.register("fundingManagementType")} className={selectCls}>
                <option value="">Select plan management</option>
                <option value="SELF">Self-managed</option>
                <option value="PLAN">Plan-managed</option>
                <option value="NDIA">NDIA-managed</option>
              </select>
              <FieldError message={form4.formState.errors.fundingManagementType?.message} />
            </div>
            <div>
              <Label required>Support Coordination Funding</Label>
              <select {...form4.register("supportCoordinationFunding")} className={selectCls}>
                <option value="">Select support coordination</option>
                <option value="NONE">No Support Coordination Funding</option>
                <option value="LEVEL_1">Support Connection (Level 1)</option>
                <option value="LEVEL_2">Support Coordination (Level 2)</option>
                <option value="LEVEL_3">Specialist Support Coordination (Level 3)</option>
              </select>
              <FieldError message={form4.formState.errors.supportCoordinationFunding?.message} />
            </div>
            <div>
              <Label>NDIS Number (Optional)</Label>
              <input {...form4.register("ndisNumber")} type="text" className={inputCls} placeholder="43XXXXXXX" />
              <p className="mt-1 text-xs text-gray-400">Helps with trust and verification later</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan Start Date (Optional)</Label>
                <input {...form4.register("ndisStartDate")} type="date" className={inputCls} />
              </div>
              <div>
                <Label>Plan End Date (Optional)</Label>
                <input {...form4.register("ndisEndDate")} type="date" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Continue</button>
            </div>
          </form>
        )}

        {/* ── Step 5: Service Needs ── */}
        {currentStep === 5 && (
          <form onSubmit={form5.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Service Needs</h2>
            <div>
              <Label required>Primary Support Needs (select all that apply)</Label>
              {(() => {
                const val = form5.watch("primarySupportNeeds") ?? [];
                return (
                  <MultiCheckbox
                    options={SUPPORT_NEEDS_OPTIONS}
                    value={val}
                    onChange={(v) => form5.setValue("primarySupportNeeds", v, { shouldValidate: true })}
                  />
                );
              })()}
              <FieldError message={form5.formState.errors.primarySupportNeeds?.message} />
            </div>
            <div>
              <Label required>Preferred Support Type</Label>
              <select {...form5.register("preferredSupportType")} className={selectCls}>
                <option value="">Select support type</option>
                <option value="ONE_TIME">One-time support</option>
                <option value="ONGOING">Ongoing support</option>
                <option value="BOTH">Both</option>
              </select>
              <FieldError message={form5.formState.errors.preferredSupportType?.message} />
            </div>
            <div>
              <Label>Primary Disability / Support Context (Optional)</Label>
              <input {...form5.register("primaryDisability")} type="text" className={inputCls} placeholder="e.g. Autism, Physical disability" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Continue</button>
            </div>
          </form>
        )}

        {/* ── Step 6: Preferences & Requirements ── */}
        {currentStep === 6 && (
          <form onSubmit={form6.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Preferences &amp; Requirements</h2>
            <p className="text-sm text-gray-500">All fields optional — used to improve matching.</p>
            <div>
              <Label>Preferred Worker Gender</Label>
              <select {...form6.register("preferredWorkerGender")} className={selectCls}>
                <option value="">No preference</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="NON_BINARY">Non-binary preferred</option>
              </select>
            </div>
            <div>
              <Label>Language Preference</Label>
              <input {...form6.register("languagePreference")} type="text" className={inputCls} placeholder="e.g. English, Arabic, Hindi" />
            </div>
            <div>
              <Label>Cultural Preference</Label>
              <input {...form6.register("culturalPreference")} type="text" className={inputCls} placeholder="e.g. Same cultural background preferred" />
            </div>
            <div>
              <Label>Skills Required (Optional free text)</Label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Manual handling, First Aid — press Enter to add"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const val   = input.value.trim();
                    if (val) {
                      const existing = form6.getValues("skillsRequired") ?? [];
                      form6.setValue("skillsRequired", [...existing, val]);
                      input.value = "";
                    }
                  }
                }}
              />
              {/* Display tags */}
              {(() => {
                const tags = form6.watch("skillsRequired") ?? [];
                if (!tags.length) return null;
                return (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-700">
                        {tag}
                        <button
                          type="button"
                          onClick={() => form6.setValue("skillsRequired", tags.filter((_, j) => j !== i))}
                          className="hover:text-red-500"
                        >×</button>
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Continue</button>
            </div>
          </form>
        )}

        {/* ── Step 7: Availability ── */}
        {currentStep === 7 && (
          <form onSubmit={form7.handleSubmit(advance)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Availability</h2>
            <p className="text-sm text-gray-500">Light version — detailed scheduling happens after booking.</p>
            <div>
              <Label>Preferred Days (select all that apply)</Label>
              {(() => {
                const val = form7.watch("preferredDays") ?? [];
                return (
                  <MultiCheckbox
                    options={DAYS_OPTIONS.map((d) => ({ value: d.toUpperCase(), label: d }))}
                    value={val}
                    onChange={(v) => form7.setValue("preferredDays", v)}
                  />
                );
              })()}
            </div>
            <div>
              <Label>Preferred Time</Label>
              <select {...form7.register("preferredTime")} className={selectCls}>
                <option value="">Any time</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="OVERNIGHT">Overnight</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Continue</button>
            </div>
          </form>
        )}

        {/* ── Step 8: Consent & Agreements ── */}
        {currentStep === 8 && (
          <form onSubmit={form8.handleSubmit(finalSubmit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Consent &amp; Agreements</h2>
            <p className="text-sm text-gray-500">Please read and accept before creating your account.</p>
            <div className="space-y-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...form8.register("termsAccepted")}
                  className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I accept the{" "}
                  <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms &amp; Conditions</a>
                </span>
              </label>
              <FieldError message={form8.formState.errors.termsAccepted?.message} />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...form8.register("privacyPolicyAccepted")}
                  className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{" "}
                  <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</a>
                </span>
              </label>
              <FieldError message={form8.formState.errors.privacyPolicyAccepted?.message} />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...form8.register("ndisCodeAccepted")}
                  className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I acknowledge the NDIS Code of Conduct (optional at registration)
                </span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Creating account…" : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
