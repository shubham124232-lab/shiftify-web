"use client";
// NDIS Provider Registration Wizard — 13 steps per spec doc
// Steps: Account → Business Identity → Key Contacts → Compliance & Legal →
//        Services Offered → Service Coverage → Workforce Capability →
//        Capacity & Availability → Participant Handling → Pricing & Billing →
//        Platform Features → Profile & Branding → Agreements & Controls

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";

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
  businessName:      z.string().min(2, "Business name required"),
  legalEntityName:   z.string().optional(),
  abn:               z.string().min(11, "ABN must be 11 digits").max(20),
  businessStructure: z.enum(["SOLE_TRADER", "PARTNERSHIP", "COMPANY", "TRUST"], {
    required_error: "Select business structure",
  }),
  ndisRegistered:     z.boolean(),
  ndisProviderNumber: z.string().optional(),
  gstRegistered:      z.boolean(),
  yearsInOperation:   z.string({ required_error: "Select years in operation" }),
});

const step3Schema = z.object({
  primaryContactName:   z.string().min(1, "Primary contact name required"),
  primaryContactRole:   z.string().optional(),
  primaryContactPhone:  z.string().min(8, "Phone required"),
  primaryContactEmail:  z.string().email("Valid email required"),
  secondaryContactName:  z.string().optional(),
  secondaryContactRole:  z.string().optional(),
  secondaryContactPhone: z.string().optional(),
  secondaryContactEmail: z.string().email().optional().or(z.literal("")),
  accountsContactName:   z.string().optional(),
  accountsContactEmail:  z.string().email().optional().or(z.literal("")),
});

const step4Schema = z.object({
  publicLiabilityPolicyNumber:       z.string().min(1, "Policy number required"),
  publicLiabilityCoverageAmount:     z.string().optional(),
  publicLiabilityExpiryDate:         z.string().optional(),
  professionalIndemnityPolicyNumber: z.string().optional(),
  professionalIndemnityExpiryDate:   z.string().optional(),
  workersCompPolicyNumber:            z.string().optional(),
  workersCompExpiryDate:              z.string().optional(),
  ndisAuditStatus:                    z.string().optional(),
  complianceDeclaration:              z.literal(true, {
    errorMap: () => ({ message: "You must confirm compliance" }),
  }),
});

const step5Schema = z.object({
  coreServices:     z.array(z.string()).min(1, "Select at least one service"),
  offersSil:        z.boolean(),
  silType:          z.string().optional(),
  silSupportLevel:  z.string().optional(),
  silCurrentVacancies: z.boolean().optional(),
  offersSda:           z.boolean(),
  sdaDesignCategory:   z.array(z.string()).optional(),
  sdaVacancyCount:     z.number().int().min(0).optional(),
  sdaLocations:        z.array(z.string()).optional(),
});

const step6Schema = z.object({
  serviceAreas:  z.array(z.string()).min(1, "Add at least one service area"),
  serviceMode:   z.enum(["IN_PERSON", "REMOTE", "BOTH"], { required_error: "Select service mode" }),
});

const step7Schema = z.object({
  workforceSize:              z.string({ required_error: "Select workforce size" }),
  staffCapability:            z.array(z.string()).optional(),
  abilityToFillUrgentShifts:  z.boolean(),
  workforceHiringType:        z.string({ required_error: "Select hiring type" }),
});

const step8Schema = z.object({
  currentCapacityStatus:          z.string({ required_error: "Select capacity status" }),
  abilityToPostLiveAvailability:  z.boolean(),
});

const step9Schema = z.object({
  participantTypes:              z.array(z.string()).min(1, "Select at least one participant type"),
  participantComplexityAccepted: z.array(z.string()).optional(),
});

const step10Schema = z.object({
  pricingModel:        z.string({ required_error: "Select pricing model" }),
  travelCharges:       z.string({ required_error: "Select travel charge option" }),
  cancellationPolicy:  z.string().optional(),
  billingMethod:       z.string({ required_error: "Select billing method" }),
});

const step11Schema = z.object({
  canPostRequests:          z.boolean(),
  canViewWorkerMarketplace: z.boolean(),
  canPostWorkerRequirements: z.boolean(),
  canPostSilSdaVacancies:   z.boolean(),
});

const step12Schema = z.object({
  businessDescription: z.string().max(2000).optional(),
  websiteUrl:          z.string().url().optional().or(z.literal("")),
});

const step13Schema = z.object({
  termsAccepted:            z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  privacyPolicyAccepted:    z.literal(true, { errorMap: () => ({ message: "You must accept the privacy policy" }) }),
  serviceAgreementAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the service agreement" }) }),
  platformRulesAccepted:    z.literal(true, { errorMap: () => ({ message: "You must accept the platform rules" }) }),
  ndisCodeAccepted:         z.literal(true, { errorMap: () => ({ message: "You must accept the NDIS code" }) }),
});

const STEPS = 13;

const SCHEMAS = [
  step1Schema, step2Schema, step3Schema, step4Schema, step5Schema,
  step6Schema, step7Schema, step8Schema, step9Schema, step10Schema,
  step11Schema, step12Schema, step13Schema,
];

// ── Option lists ──────────────────────────────────────────────────────────────

const CORE_SERVICES = [
  "Personal Care", "Community Access", "Domestic Assistance",
  "Nursing Care", "Allied Health", "Behaviour Support", "Transport",
];
const SDA_CATEGORIES = [
  "Improved Liveability", "Fully Accessible", "High Physical Support", "Robust",
];
const STAFF_CAPABILITIES = [
  "Personal Care", "High Intensity Supports", "Nursing", "Behaviour Specialists",
];
const PARTICIPANT_TYPES = ["Self-managed", "Plan-managed", "NDIA-managed"];
const COMPLEXITY_ACCEPTED = ["Standard", "Complex", "High Risk"];

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
    <input {...props} className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${props.className ?? ""}`} />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select {...props} className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${props.className ?? ""}`} />
  );
}
function MultiCheck({ options, value, onChange }: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            value.includes(opt) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >{opt}</button>
      ))}
    </div>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type WizardData = Record<string, unknown> & {
  coreServices: string[];
  staffCapability: string[];
  sdaDesignCategory: string[];
  sdaLocations: string[];
  serviceAreas: string[];
  participantTypes: string[];
  participantComplexityAccepted: string[];
  offersSil: boolean;
  offersSda: boolean;
  ndisRegistered: boolean;
  gstRegistered: boolean;
  abilityToFillUrgentShifts: boolean;
  abilityToPostLiveAvailability: boolean;
  canPostRequests: boolean;
  canViewWorkerMarketplace: boolean;
  canPostWorkerRequirements: boolean;
  canPostSilSdaVacancies: boolean;
};

export default function ProviderRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<WizardData>>({
    coreServices: [], staffCapability: [], sdaDesignCategory: [], sdaLocations: [],
    serviceAreas: [], participantTypes: [], participantComplexityAccepted: [],
    offersSil: false, offersSda: false, ndisRegistered: false, gstRegistered: false,
    abilityToFillUrgentShifts: false, abilityToPostLiveAvailability: true,
    canPostRequests: true, canViewWorkerMarketplace: true,
    canPostWorkerRequirements: true, canPostSilSdaVacancies: false,
  });
  const [error, setError]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [areaInput, setAreaInput]   = useState("");
  const [sdaInput, setSdaInput]     = useState("");

  const schema = SCHEMAS[step] as z.ZodTypeAny;
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: data as Record<string, unknown>,
  });

  const watchNdis      = watch("ndisRegistered") as boolean;
  const watchSil       = watch("offersSil") as boolean;
  const watchSda       = watch("offersSda") as boolean;

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
      await api.post("/auth/register", {
        name:     merged.name,
        email:    merged.email,
        phone:    merged.phone,
        password: merged.password,
        role:     "PROVIDER",
      });
      await api.post("/users/me/profile/provider", {
        profileStep:                       12,
        businessName:                      merged.businessName,
        legalEntityName:                   merged.legalEntityName,
        abn:                               merged.abn,
        businessStructure:                 merged.businessStructure,
        ndisRegistered:                    merged.ndisRegistered,
        ndisProviderNumber:                merged.ndisProviderNumber,
        gstRegistered:                     merged.gstRegistered,
        yearsInOperation:                  merged.yearsInOperation,
        primaryContactName:                merged.primaryContactName,
        primaryContactRole:                merged.primaryContactRole,
        primaryContactPhone:               merged.primaryContactPhone,
        primaryContactEmail:               merged.primaryContactEmail,
        secondaryContactName:              merged.secondaryContactName,
        secondaryContactRole:              merged.secondaryContactRole,
        secondaryContactPhone:             merged.secondaryContactPhone,
        secondaryContactEmail:             merged.secondaryContactEmail,
        accountsContactName:               merged.accountsContactName,
        accountsContactEmail:              merged.accountsContactEmail,
        publicLiabilityPolicyNumber:       merged.publicLiabilityPolicyNumber,
        publicLiabilityCoverageAmount:     merged.publicLiabilityCoverageAmount,
        publicLiabilityExpiryDate:         merged.publicLiabilityExpiryDate,
        professionalIndemnityPolicyNumber: merged.professionalIndemnityPolicyNumber,
        professionalIndemnityExpiryDate:   merged.professionalIndemnityExpiryDate,
        workersCompPolicyNumber:           merged.workersCompPolicyNumber,
        workersCompExpiryDate:             merged.workersCompExpiryDate,
        ndisAuditStatus:                   merged.ndisAuditStatus,
        complianceDeclaration:             true,
        coreServices:                      merged.coreServices,
        offersSil:                         merged.offersSil,
        silType:                           merged.silType,
        silSupportLevel:                   merged.silSupportLevel,
        silCurrentVacancies:               merged.silCurrentVacancies,
        offersSda:                         merged.offersSda,
        sdaDesignCategory:                 merged.sdaDesignCategory,
        sdaVacancyCount:                   merged.sdaVacancyCount,
        sdaLocations:                      merged.sdaLocations,
        serviceAreas:                      merged.serviceAreas,
        serviceMode:                       merged.serviceMode,
        workforceSize:                     merged.workforceSize,
        staffCapability:                   merged.staffCapability,
        abilityToFillUrgentShifts:         merged.abilityToFillUrgentShifts,
        workforceHiringType:               merged.workforceHiringType,
        currentCapacityStatus:             merged.currentCapacityStatus,
        abilityToPostLiveAvailability:     merged.abilityToPostLiveAvailability,
        participantTypes:                  merged.participantTypes,
        participantComplexityAccepted:     merged.participantComplexityAccepted,
        pricingModel:                      merged.pricingModel,
        travelCharges:                     merged.travelCharges,
        cancellationPolicy:                merged.cancellationPolicy,
        billingMethod:                     merged.billingMethod,
        canPostRequests:                   merged.canPostRequests,
        canViewWorkerMarketplace:          merged.canViewWorkerMarketplace,
        canPostWorkerRequirements:         merged.canPostWorkerRequirements,
        canPostSilSdaVacancies:            merged.canPostSilSdaVacancies,
        businessDescription:               merged.businessDescription,
        websiteUrl:                        merged.websiteUrl,
        termsAccepted:                     merged.termsAccepted,
        privacyPolicyAccepted:             merged.privacyPolicyAccepted,
        serviceAgreementAccepted:          merged.serviceAgreementAccepted,
        platformRulesAccepted:             merged.platformRulesAccepted,
        ndisCodeAccepted:                  merged.ndisCodeAccepted,
      });
      router.push("/dashboard/provider");
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

  const stepTitles = [
    "Account Setup", "Business Identity", "Key Contacts",
    "Compliance & Legal", "Services Offered", "Service Coverage",
    "Workforce Capability", "Capacity & Availability", "Participant Handling",
    "Pricing & Billing", "Platform Features", "Profile & Branding", "Agreements",
  ];

  const e = errors as Record<string, { message?: string }>;

  function addArea() {
    if (!areaInput.trim()) return;
    const areas = [...((data.serviceAreas as string[]) ?? []), areaInput.trim()];
    setData((d) => ({ ...d, serviceAreas: areas }));
    setValue("serviceAreas", areas);
    setAreaInput("");
  }
  function removeArea(a: string) {
    const areas = ((data.serviceAreas as string[]) ?? []).filter((x) => x !== a);
    setData((d) => ({ ...d, serviceAreas: areas }));
    setValue("serviceAreas", areas);
  }
  function addSdaLocation() {
    if (!sdaInput.trim()) return;
    const locs = [...((data.sdaLocations as string[]) ?? []), sdaInput.trim()];
    setData((d) => ({ ...d, sdaLocations: locs }));
    setValue("sdaLocations", locs);
    setSdaInput("");
  }

  function renderStep() {
    if (step === 0) return (
      <div className="space-y-4">
        <div>
          <Label>Admin First Name + Last Name</Label>
          <Input {...register("name")} placeholder="Jane Smith" />
          <FieldError msg={e.name?.message} />
        </div>
        <div>
          <Label>Email Address</Label>
          <Input {...register("email")} type="email" />
          <FieldError msg={e.email?.message} />
        </div>
        <div>
          <Label>Mobile Number</Label>
          <Input {...register("phone")} type="tel" />
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
          <Label>Business / Trading Name</Label>
          <Input {...register("businessName")} />
          <FieldError msg={e.businessName?.message} />
        </div>
        <div>
          <Label>Legal Entity Name</Label>
          <Input {...register("legalEntityName")} />
        </div>
        <div>
          <Label>ABN</Label>
          <Input {...register("abn")} placeholder="12 345 678 901" />
          <FieldError msg={e.abn?.message} />
        </div>
        <div>
          <Label>Business Structure</Label>
          <Select {...register("businessStructure")}>
            <option value="">Select structure</option>
            <option value="SOLE_TRADER">Sole Trader</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="COMPANY">Company</option>
            <option value="TRUST">Trust</option>
          </Select>
          <FieldError msg={e.businessStructure?.message} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" {...register("ndisRegistered")} id="ndisReg" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="ndisReg" className="text-sm text-gray-700">Registered NDIS Provider</label>
        </div>
        {watchNdis && (
          <div>
            <Label>NDIS Provider Number</Label>
            <Input {...register("ndisProviderNumber")} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <input type="checkbox" {...register("gstRegistered")} id="gstReg" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="gstReg" className="text-sm text-gray-700">GST Registered</label>
        </div>
        <div>
          <Label>Years in Operation</Label>
          <Select {...register("yearsInOperation")}>
            <option value="">Select</option>
            <option value="0-1">0–1 years</option>
            <option value="1-3">1–3 years</option>
            <option value="3-5">3–5 years</option>
            <option value="5+">5+ years</option>
          </Select>
          <FieldError msg={e.yearsInOperation?.message} />
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Primary Contact Person</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input {...register("primaryContactName")} />
              <FieldError msg={e.primaryContactName?.message} />
            </div>
            <div>
              <Label>Role</Label>
              <Input {...register("primaryContactRole")} placeholder="Director / Manager / Admin" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("primaryContactPhone")} type="tel" />
              <FieldError msg={e.primaryContactPhone?.message} />
            </div>
            <div className="col-span-2">
              <Label>Email</Label>
              <Input {...register("primaryContactEmail")} type="email" />
              <FieldError msg={e.primaryContactEmail?.message} />
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Secondary Contact (Optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input {...register("secondaryContactName")} /></div>
            <div><Label>Role</Label><Input {...register("secondaryContactRole")} /></div>
            <div><Label>Phone</Label><Input {...register("secondaryContactPhone")} type="tel" /></div>
            <div><Label>Email</Label><Input {...register("secondaryContactEmail")} type="email" /></div>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Accounts / Billing Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input {...register("accountsContactName")} /></div>
            <div><Label>Email</Label><Input {...register("accountsContactEmail")} type="email" /></div>
          </div>
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Public Liability Insurance</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Policy Number</Label><Input {...register("publicLiabilityPolicyNumber")} /><FieldError msg={e.publicLiabilityPolicyNumber?.message} /></div>
            <div><Label>Coverage Amount</Label><Input {...register("publicLiabilityCoverageAmount")} placeholder="e.g. $10,000,000" /></div>
            <div><Label>Expiry Date</Label><Input {...register("publicLiabilityExpiryDate")} type="date" /></div>
          </div>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">Professional Indemnity Insurance</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Policy Number</Label><Input {...register("professionalIndemnityPolicyNumber")} /></div>
            <div><Label>Expiry Date</Label><Input {...register("professionalIndemnityExpiryDate")} type="date" /></div>
          </div>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">Workers Compensation Insurance</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Policy Number</Label><Input {...register("workersCompPolicyNumber")} /></div>
            <div><Label>Expiry Date</Label><Input {...register("workersCompExpiryDate")} type="date" /></div>
          </div>
        </div>
        <div>
          <Label>NDIS Audit Status (if Registered)</Label>
          <Select {...register("ndisAuditStatus")}>
            <option value="">Select</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="NOT_APPLICABLE">Not Applicable</option>
          </Select>
        </div>
        <label className="flex items-start gap-3 mt-2">
          <input type="checkbox" {...register("complianceDeclaration")} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
          <span className="text-sm text-gray-700">I confirm the organisation complies with NDIS Practice Standards.</span>
        </label>
        <FieldError msg={e.complianceDeclaration?.message} />
      </div>
    );

    if (step === 4) return (
      <div className="space-y-5">
        <div>
          <Label>Core Services</Label>
          <MultiCheck
            options={CORE_SERVICES}
            value={(data.coreServices as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, coreServices: v })); setValue("coreServices", v); }}
          />
          <FieldError msg={e.coreServices?.message} />
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" {...register("offersSil")} id="silCheck" className="h-4 w-4 rounded border-gray-300 text-blue-600" onChange={(ev) => { setValue("offersSil", ev.target.checked); setData((d) => ({ ...d, offersSil: ev.target.checked })); }} />
            <label htmlFor="silCheck" className="text-sm font-semibold text-gray-700">Supported Independent Living (SIL)</label>
          </div>
          {watchSil && (
            <div className="ml-6 space-y-3">
              <div>
                <Label>SIL Type</Label>
                <Select {...register("silType")}>
                  <option value="">Select</option>
                  <option value="SHARED">Shared Living</option>
                  <option value="INDIVIDUAL">Individual</option>
                </Select>
              </div>
              <div>
                <Label>Support Level</Label>
                <Select {...register("silSupportLevel")}>
                  <option value="">Select</option>
                  <option value="FULL_TIME">24/7</option>
                  <option value="DROP_IN">Drop-in</option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" {...register("silCurrentVacancies")} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                <label className="text-sm text-gray-700">Currently have vacancies</label>
              </div>
            </div>
          )}
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" {...register("offersSda")} id="sdaCheck" className="h-4 w-4 rounded border-gray-300 text-blue-600" onChange={(ev) => { setValue("offersSda", ev.target.checked); setData((d) => ({ ...d, offersSda: ev.target.checked })); }} />
            <label htmlFor="sdaCheck" className="text-sm font-semibold text-gray-700">Specialist Disability Accommodation (SDA)</label>
          </div>
          {watchSda && (
            <div className="ml-6 space-y-3">
              <div>
                <Label>SDA Design Category</Label>
                <MultiCheck
                  options={SDA_CATEGORIES}
                  value={(data.sdaDesignCategory as string[]) ?? []}
                  onChange={(v) => { setData((d) => ({ ...d, sdaDesignCategory: v })); setValue("sdaDesignCategory", v); }}
                />
              </div>
              <div>
                <Label>Number of Vacancies</Label>
                <Input {...register("sdaVacancyCount", { valueAsNumber: true })} type="number" min={0} />
              </div>
              <div>
                <Label>SDA Locations</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={sdaInput} onChange={(ev) => setSdaInput(ev.target.value)} placeholder="e.g. Liverpool 2170" />
                  <button type="button" onClick={addSdaLocation} className="rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {((data.sdaLocations as string[]) ?? []).map((l) => (
                    <span key={l} className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">{l}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (step === 5) return (
      <div className="space-y-4">
        <div>
          <Label>Service Areas (suburbs / postcodes)</Label>
          <div className="flex gap-2 mb-2">
            <Input value={areaInput} onChange={(ev) => setAreaInput(ev.target.value)} placeholder="e.g. Parramatta 2150" onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); addArea(); } }} />
            <button type="button" onClick={addArea} className="rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {((data.serviceAreas as string[]) ?? []).map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
                {a}
                <button type="button" onClick={() => removeArea(a)} className="hover:text-blue-600">x</button>
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

    if (step === 6) return (
      <div className="space-y-4">
        <div>
          <Label>Number of Support Workers</Label>
          <Select {...register("workforceSize")}>
            <option value="">Select size</option>
            <option value="1-10">1–10</option>
            <option value="10-50">10–50</option>
            <option value="50+">50+</option>
          </Select>
          <FieldError msg={e.workforceSize?.message} />
        </div>
        <div>
          <Label>Staff Capability</Label>
          <MultiCheck
            options={STAFF_CAPABILITIES}
            value={(data.staffCapability as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, staffCapability: v })); setValue("staffCapability", v); }}
          />
        </div>
        <div>
          <Toggle
            checked={Boolean(data.abilityToFillUrgentShifts)}
            onChange={(v) => { setData((d) => ({ ...d, abilityToFillUrgentShifts: v })); setValue("abilityToFillUrgentShifts", v); }}
            label="Ability to fill urgent shifts"
          />
        </div>
        <div>
          <Label>Internal Workforce vs External Hiring</Label>
          <Select {...register("workforceHiringType")}>
            <option value="">Select</option>
            <option value="INTERNAL">Internal Only</option>
            <option value="EXTERNAL">External Marketplace Hiring</option>
            <option value="BOTH">Both</option>
          </Select>
          <FieldError msg={e.workforceHiringType?.message} />
        </div>
      </div>
    );

    if (step === 7) return (
      <div className="space-y-4">
        <div>
          <Label>Current Capacity Status</Label>
          <Select {...register("currentCapacityStatus")}>
            <option value="">Select status</option>
            <option value="OPEN">Open for New Participants</option>
            <option value="LIMITED">Limited</option>
            <option value="FULL">Full</option>
          </Select>
          <FieldError msg={e.currentCapacityStatus?.message} />
        </div>
        <Toggle
          checked={Boolean(data.abilityToPostLiveAvailability)}
          onChange={(v) => { setData((d) => ({ ...d, abilityToPostLiveAvailability: v })); setValue("abilityToPostLiveAvailability", v); }}
          label="Ability to post live availability / vacancies / shifts"
        />
      </div>
    );

    if (step === 8) return (
      <div className="space-y-4">
        <div>
          <Label>Participant Types Accepted</Label>
          <MultiCheck
            options={PARTICIPANT_TYPES}
            value={(data.participantTypes as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, participantTypes: v })); setValue("participantTypes", v); }}
          />
          <FieldError msg={e.participantTypes?.message} />
        </div>
        <div>
          <Label>Participant Complexity Accepted</Label>
          <MultiCheck
            options={COMPLEXITY_ACCEPTED}
            value={(data.participantComplexityAccepted as string[]) ?? []}
            onChange={(v) => { setData((d) => ({ ...d, participantComplexityAccepted: v })); setValue("participantComplexityAccepted", v); }}
          />
        </div>
      </div>
    );

    if (step === 9) return (
      <div className="space-y-4">
        <div>
          <Label>Pricing Model</Label>
          <Select {...register("pricingModel")}>
            <option value="">Select</option>
            <option value="NDIS_PRICE_GUIDE">As per NDIS Price Guide</option>
            <option value="CUSTOM">Custom Pricing</option>
          </Select>
          <FieldError msg={e.pricingModel?.message} />
        </div>
        <div>
          <Label>Travel Charges</Label>
          <Select {...register("travelCharges")}>
            <option value="">Select</option>
            <option value="INCLUDED">Included</option>
            <option value="CHARGED_SEPARATELY">Charged Separately</option>
            <option value="DISCUSS">Discuss</option>
          </Select>
          <FieldError msg={e.travelCharges?.message} />
        </div>
        <div>
          <Label>Billing Method</Label>
          <Select {...register("billingMethod")}>
            <option value="">Select</option>
            <option value="DIRECT">Direct</option>
            <option value="VIA_PLAN_MANAGER">Via Plan Manager</option>
            <option value="PLATFORM">Platform (future)</option>
          </Select>
          <FieldError msg={e.billingMethod?.message} />
        </div>
        <div>
          <Label>Cancellation Policy</Label>
          <textarea
            {...register("cancellationPolicy")}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe your cancellation policy..."
          />
        </div>
      </div>
    );

    if (step === 10) return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Select which platform features your organisation will use:</p>
        <div className="space-y-3">
          <Toggle checked={Boolean(data.canPostRequests)} onChange={(v) => { setData((d) => ({ ...d, canPostRequests: v })); setValue("canPostRequests", v); }} label="Post service requests / shifts" />
          <Toggle checked={Boolean(data.canViewWorkerMarketplace)} onChange={(v) => { setData((d) => ({ ...d, canViewWorkerMarketplace: v })); setValue("canViewWorkerMarketplace", v); }} label="View worker marketplace" />
          <Toggle checked={Boolean(data.canPostWorkerRequirements)} onChange={(v) => { setData((d) => ({ ...d, canPostWorkerRequirements: v })); setValue("canPostWorkerRequirements", v); }} label="Post worker requirements" />
          <Toggle checked={Boolean(data.canPostSilSdaVacancies)} onChange={(v) => { setData((d) => ({ ...d, canPostSilSdaVacancies: v })); setValue("canPostSilSdaVacancies", v); }} label="Post SIL / SDA vacancies" />
        </div>
      </div>
    );

    if (step === 11) return (
      <div className="space-y-4">
        <div>
          <Label>Business Description</Label>
          <textarea
            {...register("businessDescription")}
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe your organisation, services, and what makes you stand out..."
          />
        </div>
        <div>
          <Label>Website (optional)</Label>
          <Input {...register("websiteUrl")} type="url" placeholder="https://yourorganisation.com.au" />
        </div>
      </div>
    );

    if (step === 12) return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">By completing registration you confirm your organisation meets all requirements.</p>
        {[
          { field: "termsAccepted", label: "I agree to the Platform Terms & Conditions" },
          { field: "privacyPolicyAccepted", label: "I accept the Privacy Policy" },
          { field: "serviceAgreementAccepted", label: "I acknowledge the Service Agreement terms" },
          { field: "platformRulesAccepted", label: "I agree to Platform Rules including: no off-platform payments; compliance with NDIS rules" },
          { field: "ndisCodeAccepted", label: "I confirm the organisation complies with the NDIS Code of Conduct and Practice Standards" },
        ].map(({ field, label }) => (
          <div key={field}>
            <label className="flex items-start gap-3">
              <input type="checkbox" {...register(field as Parameters<typeof register>[0])} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
            <FieldError msg={e[field]?.message} />
          </div>
        ))}
      </div>
    );
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
            <span className="text-2xl">🔵</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">NDIS Provider Registration</h1>
          <p className="mt-1 text-sm text-gray-500">Step {step + 1} of {STEPS} — {stepTitles[step]}</p>
        </div>

        <div className="mb-6">
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{stepTitles[step]}</h2>
          <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}>
            {renderStep()}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button type="button" onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Back
                </button>
              )}
              <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {submitting ? "Submitting..." : step < STEPS - 1 ? "Next" : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-blue-600" : i < step ? "bg-blue-300" : "bg-gray-300"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
