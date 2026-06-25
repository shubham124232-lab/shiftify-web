"use client";
// Support Coordinator Registration Wizard — 10 steps per spec doc
// Steps: Account → Professional Identity → Qualifications & Compliance →
//        Service Capability → Service Coverage → Availability & Capacity →
//        Plan Management Handling → Rates & Commercials → Profile & Trust → Declaration

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { setAccessToken } from "@/src/lib/token-store";

// ── Step schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  name:            z.string().min(2, "Full name required"),
  email:           z.string().email("Valid email required"),
  phone:           z.string().min(8, "Mobile number required"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  roleType:         z.enum(["INDEPENDENT", "AGENCY_EMPLOYED"], { required_error: "Select a role type" }),
  organisationName: z.string().optional(),
  abn:              z.string().min(11, "ABN must be 11 digits").max(20),
  ndisRegistered:   z.boolean(),
  ndisProviderNumber: z.string().optional(),
  yearsExperience:  z.string({ required_error: "Select years of experience" }),
});

const step3Schema = z.object({
  qualifications: z.array(z.string()).min(1, "Select at least one qualification"),
  policeCheckExpiry:   z.string().optional(),
  wwccNumber:          z.string().optional(),
  wwccExpiry:          z.string().optional(),
  ndisScreeningNumber: z.string().optional(),
  ndisScreeningExpiry: z.string().optional(),
  indemnityProvider:   z.string().optional(),
  indemnityPolicyNumber: z.string().optional(),
  indemnityExpiry:     z.string().optional(),
  publicLiabilityPolicyNumber: z.string().optional(),
  publicLiabilityExpiry:       z.string().optional(),
});

const step4Schema = z.object({
  supportCoordinationLevel:          z.array(z.string()).min(1, "Select at least one level"),
  participantComplexityExperience:   z.array(z.string()).optional(),
  servicesOfferedBeyondCoordination: z.array(z.string()).optional(),
});

const step5Schema = z.object({
  serviceAreas: z.array(z.string()).min(1, "Add at least one service area"),
  serviceMode:  z.enum(["IN_PERSON", "REMOTE", "BOTH"], { required_error: "Select service mode" }),
});

const step6Schema = z.object({
  currentCapacityStatus: z.enum(["ACCEPTING", "LIMITED", "NOT_ACCEPTING"], { required_error: "Select capacity status" }),
  maxParticipantLoad:    z.number().int().min(0).max(500).optional(),
  availabilityType:      z.string({ required_error: "Select availability type" }),
});

const step7Schema = z.object({
  participantTypesAccepted:  z.array(z.string()).min(1, "Select at least one participant type"),
  fundingTypeCompatibility:  z.array(z.string()).min(1, "Select at least one funding type"),
  billingMethodPreference:   z.string({ required_error: "Select billing preference" }),
});

const step8Schema = z.object({
  hourlyRate:    z.number().min(0).max(9999).optional(),
  travelCharges: z.string({ required_error: "Select travel charge option" }),
});

const step9Schema = z.object({
  bio:           z.string().max(2000).optional(),
  languages:     z.array(z.string()).optional(),
  gender:        z.string().optional(),
});

const step10Schema = z.object({
  termsAccepted:         z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  consentForVerification: z.boolean().optional(),
  ndisCodeAccepted:      z.literal(true, { errorMap: () => ({ message: "You must accept the NDIS Code of Conduct" }) }),
  privacyPolicyAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Privacy Policy" }) }),
});

const STEPS = 10;

// ── Option lists ──────────────────────────────────────────────────────────────

const QUALIFICATIONS = [
  "Certificate III Individual Support",
  "Certificate IV Disability",
  "Diploma Community Services",
  "Bachelor Social Work",
  "Other",
];
const COORD_LEVELS = [
  { value: "LEVEL_1", label: "Support Connection (Level 1)" },
  { value: "LEVEL_2", label: "Support Coordination (Level 2)" },
  { value: "LEVEL_3", label: "Specialist Support Coordination (Level 3)" },
];
const COMPLEXITY = [
  "Psychosocial Disability", "Autism", "Physical Disability",
  "Intellectual Disability", "Complex Behaviour", "High Medical Needs",
];
const EXTRA_SERVICES = [
  "Plan Reviews Support", "Crisis Management", "Housing Navigation (SIL/SDA)",
  "Provider Sourcing", "Capacity Building",
];
const PARTICIPANT_TYPES = ["Self-managed", "Plan-managed", "NDIA-managed"];
const FUNDING_TYPES     = ["SELF_MANAGED", "PLAN_MANAGED", "NDIA_MANAGED"];
const LANGUAGES = [
  "English", "Arabic", "Hindi", "Urdu", "Punjabi", "Mandarin", "Vietnamese", "Auslan", "Other",
];
const YEARS_EXP = ["0-1", "1-3", "3-5", "5+"];
const AVAILABILITY_TYPES = [
  { value: "BUSINESS_HOURS", label: "Business Hours Only" },
  { value: "FLEXIBLE",       label: "Flexible" },
  { value: "EMERGENCY_AVAILABLE", label: "Emergency Available" },
];

// ── Helper components ─────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${props.className ?? ""}`}
    />
  );
}

function MultiCheck({
  options,
  value,
  onChange,
}: {
  options: string[] | { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        const active = value.includes(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => toggle(v)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              active ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ── Wizard state (all steps merged into one flat object) ──────────────────────

type WizardData = {
  // step 1
  name: string; email: string; phone: string; password: string; confirmPassword: string;
  // step 2
  roleType: "INDEPENDENT" | "AGENCY_EMPLOYED"; organisationName?: string; abn: string;
  ndisRegistered: boolean; ndisProviderNumber?: string; yearsExperience: string;
  // step 3
  qualifications: string[]; policeCheckExpiry?: string; wwccNumber?: string; wwccExpiry?: string;
  ndisScreeningNumber?: string; ndisScreeningExpiry?: string;
  indemnityProvider?: string; indemnityPolicyNumber?: string; indemnityExpiry?: string;
  publicLiabilityPolicyNumber?: string; publicLiabilityExpiry?: string;
  // step 4
  supportCoordinationLevel: string[]; participantComplexityExperience: string[];
  servicesOfferedBeyondCoordination: string[];
  // step 5
  serviceAreas: string[]; serviceMode: "IN_PERSON" | "REMOTE" | "BOTH";
  // step 6
  currentCapacityStatus: "ACCEPTING" | "LIMITED" | "NOT_ACCEPTING";
  maxParticipantLoad?: number; availabilityType: string;
  // step 7
  participantTypesAccepted: string[]; fundingTypeCompatibility: string[]; billingMethodPreference: string;
  // step 8
  hourlyRate?: number; travelCharges: string;
  // step 9
  bio?: string; languages: string[]; gender?: string;
  // step 10
  termsAccepted: true; consentForVerification?: boolean; ndisCodeAccepted: true; privacyPolicyAccepted: true;
};

const SCHEMAS = [
  step1Schema, step2Schema, step3Schema, step4Schema, step5Schema,
  step6Schema, step7Schema, step8Schema, step9Schema, step10Schema,
];

export default function CoordinatorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<WizardData>>({
    qualifications: [], supportCoordinationLevel: [], participantComplexityExperience: [],
    servicesOfferedBeyondCoordination: [], serviceAreas: [], participantTypesAccepted: [],
    fundingTypeCompatibility: [], languages: [],
    ndisRegistered: false,
  });
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [areaInput, setAreaInput]   = useState("");

  const schema = SCHEMAS[step] as z.ZodTypeAny;

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: data as Record<string, unknown>,
  });

  const watchRole        = watch("roleType") as string | undefined;
  const watchNdis        = watch("ndisRegistered") as boolean | undefined;
  const watchCapacity    = watch("currentCapacityStatus") as string | undefined;

  function advance(stepData: Record<string, unknown>) {
    const merged = { ...data, ...stepData };
    setData(merged as Partial<WizardData>);
    reset(merged as Record<string, unknown>);
    setStep((s) => s + 1);
    setError(null);
  }

  async function submit(stepData: Record<string, unknown>) {
    const merged = { ...data, ...stepData } as WizardData;
    setData(merged);
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create account
      const reg = await api.post<{ accessToken: string }>("/auth/register", {
        name:     merged.name,
        email:    merged.email,
        phone:    merged.phone,
        password: merged.password,
        role:     "COORDINATOR",
      });
      setAccessToken(reg.accessToken);
      // 2. Save profile (all steps in one patch)
      await api.post("/users/me/profile/coordinator", {
        profileStep:                       9,
        roleType:                          merged.roleType,
        organisationName:                  merged.organisationName,
        abn:                               merged.abn,
        ndisRegistered:                    merged.ndisRegistered,
        ndisProviderNumber:                merged.ndisProviderNumber,
        yearsExperience:                   merged.yearsExperience,
        qualifications:                    merged.qualifications,
        supportCoordinationLevel:          merged.supportCoordinationLevel,
        participantComplexityExperience:   merged.participantComplexityExperience,
        servicesOfferedBeyondCoordination: merged.servicesOfferedBeyondCoordination,
        serviceAreas:                      merged.serviceAreas,
        serviceMode:                       merged.serviceMode,
        currentCapacityStatus:             merged.currentCapacityStatus,
        maxParticipantLoad:                merged.maxParticipantLoad,
        availabilityType:                  merged.availabilityType,
        participantTypesAccepted:          merged.participantTypesAccepted,
        fundingTypeCompatibility:          merged.fundingTypeCompatibility,
        billingMethodPreference:           merged.billingMethodPreference,
        hourlyRate:                        merged.hourlyRate,
        travelCharges:                     merged.travelCharges,
        bio:                               merged.bio,
        languages:                         merged.languages,
        gender:                            merged.gender,
        termsAccepted:                     merged.termsAccepted,
        ndisCodeAccepted:                  merged.ndisCodeAccepted,
        privacyPolicyAccepted:             merged.privacyPolicyAccepted,
        consentForVerification:            merged.consentForVerification,
      });
      router.push("/dashboard/coordinator");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  const onSubmit = step < STEPS - 1
    ? (d: Record<string, unknown>) => advance(d)
    : (d: Record<string, unknown>) => submit(d);

  const progress = Math.round(((step + 1) / STEPS) * 100);

  // ── Step content ────────────────────────────────────────────────────────────

  const stepTitles = [
    "Account Setup",
    "Professional Identity",
    "Qualifications & Compliance",
    "Service Capability",
    "Service Coverage",
    "Availability & Capacity",
    "Plan Management Handling",
    "Rates & Commercials",
    "Profile & Trust",
    "Declaration",
  ];

  function renderStep() {
    const e = errors as Record<string, { message?: string }>;

    if (step === 0) return (
      <div className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input {...register("name")} placeholder="Jane Smith" />
          <FieldError msg={e.name?.message} />
        </div>
        <div>
          <Label>Email Address</Label>
          <Input {...register("email")} type="email" placeholder="jane@example.com" />
          <FieldError msg={e.email?.message} />
        </div>
        <div>
          <Label>Mobile Number</Label>
          <Input {...register("phone")} type="tel" placeholder="+61 4xx xxx xxx" />
          <FieldError msg={e.phone?.message} />
        </div>
        <div>
          <Label>Password</Label>
          <Input {...register("password")} type="password" />
          <FieldError msg={e.password?.message} />
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input {...register("confirmPassword")} type="password" />
          <FieldError msg={e.confirmPassword?.message} />
        </div>
      </div>
    );

    if (step === 1) return (
      <div className="space-y-4">
        <div>
          <Label>Role Type</Label>
          <Select {...register("roleType")}>
            <option value="">Select role type</option>
            <option value="INDEPENDENT">Independent Support Coordinator</option>
            <option value="AGENCY_EMPLOYED">Agency-employed Support Coordinator</option>
          </Select>
          <FieldError msg={e.roleType?.message} />
        </div>
        {watchRole === "AGENCY_EMPLOYED" && (
          <div>
            <Label>Organisation Name</Label>
            <Input {...register("organisationName")} placeholder="Organisation name" />
          </div>
        )}
        <div>
          <Label>ABN (Australian Business Number)</Label>
          <Input {...register("abn")} placeholder="12 345 678 901" />
          <FieldError msg={e.abn?.message} />
        </div>
        <div>
          <Label>NDIS Provider Registration Status</Label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="true" {...register("ndisRegistered")} onChange={() => setValue("ndisRegistered", true)} />
              Registered NDIS Provider
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="false" {...register("ndisRegistered")} onChange={() => setValue("ndisRegistered", false)} />
              Unregistered Provider
            </label>
          </div>
        </div>
        {watchNdis && (
          <div>
            <Label>NDIS Provider Number</Label>
            <Input {...register("ndisProviderNumber")} placeholder="4050XXXXXX" />
          </div>
        )}
        <div>
          <Label>Years of Experience</Label>
          <Select {...register("yearsExperience")}>
            <option value="">Select experience</option>
            {YEARS_EXP.map((y) => <option key={y} value={y}>{y} years</option>)}
          </Select>
          <FieldError msg={e.yearsExperience?.message} />
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="space-y-5">
        <div>
          <Label>Relevant Qualifications (select all that apply)</Label>
          <MultiCheck
            options={QUALIFICATIONS}
            value={(data.qualifications as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, qualifications: v })); setValue("qualifications", v); }}
          />
          <FieldError msg={e.qualifications?.message} />
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Police Check</p>
          <div>
            <Label>Expiry Date</Label>
            <Input {...register("policeCheckExpiry")} type="date" />
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Working With Children Check (WWCC)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>WWCC Number</Label>
              <Input {...register("wwccNumber")} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input {...register("wwccExpiry")} type="date" />
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">NDIS Worker Screening Check</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Clearance Number</Label>
              <Input {...register("ndisScreeningNumber")} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input {...register("ndisScreeningExpiry")} type="date" />
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Professional Indemnity Insurance</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider Name</Label>
              <Input {...register("indemnityProvider")} />
            </div>
            <div>
              <Label>Policy Number</Label>
              <Input {...register("indemnityPolicyNumber")} />
            </div>
            <div className="col-span-2">
              <Label>Expiry Date</Label>
              <Input {...register("indemnityExpiry")} type="date" />
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Public Liability Insurance</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Policy Number</Label>
              <Input {...register("publicLiabilityPolicyNumber")} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input {...register("publicLiabilityExpiry")} type="date" />
            </div>
          </div>
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="space-y-5">
        <div>
          <Label>Support Coordination Level Offered</Label>
          <MultiCheck
            options={COORD_LEVELS}
            value={(data.supportCoordinationLevel as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, supportCoordinationLevel: v })); setValue("supportCoordinationLevel", v); }}
          />
          <FieldError msg={e.supportCoordinationLevel?.message} />
        </div>
        <div>
          <Label>Participant Complexity Experience</Label>
          <MultiCheck
            options={COMPLEXITY}
            value={(data.participantComplexityExperience as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, participantComplexityExperience: v })); setValue("participantComplexityExperience", v); }}
          />
        </div>
        <div>
          <Label>Services Offered Beyond Coordination (Optional)</Label>
          <MultiCheck
            options={EXTRA_SERVICES}
            value={(data.servicesOfferedBeyondCoordination as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, servicesOfferedBeyondCoordination: v })); setValue("servicesOfferedBeyondCoordination", v); }}
          />
        </div>
      </div>
    );

    if (step === 4) return (
      <div className="space-y-4">
        <div>
          <Label>Service Areas Covered (suburbs / postcodes)</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="e.g. Parramatta 2150"
              onKeyDown={(e) => {
                if (e.key === "Enter" && areaInput.trim()) {
                  e.preventDefault();
                  const areas = [...((data.serviceAreas as string[]) ?? []), areaInput.trim()];
                  setData((d) => ({ ...d, serviceAreas: areas }));
                  setValue("serviceAreas", areas);
                  setAreaInput("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (!areaInput.trim()) return;
                const areas = [...((data.serviceAreas as string[]) ?? []), areaInput.trim()];
                setData((d) => ({ ...d, serviceAreas: areas }));
                setValue("serviceAreas", areas);
                setAreaInput("");
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {((data.serviceAreas as string[]) ?? []).map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-medium">
                {a}
                <button
                  type="button"
                  onClick={() => {
                    const areas = ((data.serviceAreas as string[]) ?? []).filter((x) => x !== a);
                    setData((d) => ({ ...d, serviceAreas: areas }));
                    setValue("serviceAreas", areas);
                  }}
                  className="hover:text-purple-600"
                >x</button>
              </span>
            ))}
          </div>
          <FieldError msg={e.serviceAreas?.message} />
        </div>
        <div>
          <Label>Service Mode</Label>
          <Select {...register("serviceMode")}>
            <option value="">Select mode</option>
            <option value="IN_PERSON">In-person</option>
            <option value="REMOTE">Remote</option>
            <option value="BOTH">Both</option>
          </Select>
          <FieldError msg={e.serviceMode?.message} />
        </div>
      </div>
    );

    if (step === 5) return (
      <div className="space-y-4">
        <div>
          <Label>Current Capacity Status</Label>
          <Select {...register("currentCapacityStatus")}>
            <option value="">Select status</option>
            <option value="ACCEPTING">Accepting New Participants</option>
            <option value="LIMITED">Limited Capacity</option>
            <option value="NOT_ACCEPTING">Not Accepting</option>
          </Select>
          <FieldError msg={e.currentCapacityStatus?.message} />
        </div>
        {watchCapacity !== "NOT_ACCEPTING" && (
          <div>
            <Label>Max Participant Load (optional)</Label>
            <Input {...register("maxParticipantLoad", { valueAsNumber: true })} type="number" min={0} max={500} placeholder="e.g. 30" />
          </div>
        )}
        <div>
          <Label>Availability Type</Label>
          <Select {...register("availabilityType")}>
            <option value="">Select availability</option>
            {AVAILABILITY_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
          <FieldError msg={e.availabilityType?.message} />
        </div>
      </div>
    );

    if (step === 6) return (
      <div className="space-y-4">
        <div>
          <Label>Types of Participants They Work With</Label>
          <MultiCheck
            options={PARTICIPANT_TYPES}
            value={(data.participantTypesAccepted as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, participantTypesAccepted: v })); setValue("participantTypesAccepted", v); }}
          />
          <FieldError msg={e.participantTypesAccepted?.message} />
        </div>
        <div>
          <Label>Funding Type Compatibility</Label>
          <MultiCheck
            options={FUNDING_TYPES}
            value={(data.fundingTypeCompatibility as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, fundingTypeCompatibility: v })); setValue("fundingTypeCompatibility", v); }}
          />
          <FieldError msg={e.fundingTypeCompatibility?.message} />
        </div>
        <div>
          <Label>Billing Method Preference</Label>
          <Select {...register("billingMethodPreference")}>
            <option value="">Select billing method</option>
            <option value="DIRECT_INVOICE">Direct Invoice</option>
            <option value="THROUGH_PLAN_MANAGER">Through Plan Manager</option>
          </Select>
          <FieldError msg={e.billingMethodPreference?.message} />
        </div>
      </div>
    );

    if (step === 7) return (
      <div className="space-y-4">
        <div>
          <Label>Hourly Rate (optional)</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
            <Input {...register("hourlyRate", { valueAsNumber: true })} type="number" min={0} className="pl-7" placeholder="As per NDIS price guide if blank" />
          </div>
        </div>
        <div>
          <Label>Travel Charges</Label>
          <Select {...register("travelCharges")}>
            <option value="">Select option</option>
            <option value="INCLUDED">Included</option>
            <option value="CHARGED_SEPARATELY">Charged Separately</option>
          </Select>
          <FieldError msg={e.travelCharges?.message} />
        </div>
      </div>
    );

    if (step === 8) return (
      <div className="space-y-4">
        <div>
          <Label>Bio / About Me</Label>
          <textarea
            {...register("bio")}
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Tell participants and coordinators about your experience and approach..."
          />
        </div>
        <div>
          <Label>Languages Spoken</Label>
          <MultiCheck
            options={LANGUAGES}
            value={(data.languages as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, languages: v })); setValue("languages", v); }}
          />
        </div>
        <div>
          <Label>Gender (optional)</Label>
          <Select {...register("gender")}>
            <option value="">Prefer not to say</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="NON_BINARY">Non-binary</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </div>
    );

    if (step === 9) return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          By completing registration you confirm all information is accurate and you meet NDIS requirements.
        </p>
        <label className="flex items-start gap-3">
          <input type="checkbox" {...register("termsAccepted")} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600" />
          <span className="text-sm text-gray-700">I agree to the Platform Terms & Conditions</span>
        </label>
        <FieldError msg={e.termsAccepted?.message} />
        <label className="flex items-start gap-3">
          <input type="checkbox" {...register("ndisCodeAccepted")} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600" />
          <span className="text-sm text-gray-700">I confirm all information is accurate and I meet NDIS requirements to provide support coordination services</span>
        </label>
        <FieldError msg={e.ndisCodeAccepted?.message} />
        <label className="flex items-start gap-3">
          <input type="checkbox" {...register("privacyPolicyAccepted")} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600" />
          <span className="text-sm text-gray-700">I accept the Privacy Policy</span>
        </label>
        <FieldError msg={e.privacyPolicyAccepted?.message} />
        <label className="flex items-start gap-3">
          <input type="checkbox" {...register("consentForVerification")} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600" />
          <span className="text-sm text-gray-700">I consent to the platform verifying my documents if needed</span>
        </label>
      </div>
    );
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3">
            <span className="text-2xl">🟣</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Support Coordinator Registration</h1>
          <p className="mt-1 text-sm text-gray-500">Step {step + 1} of {STEPS} — {stepTitles[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-purple-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{stepTitles[step]}</h2>
          <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}>
            {renderStep()}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : step < STEPS - 1 ? "Next" : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-purple-600" : i < step ? "bg-purple-300" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
