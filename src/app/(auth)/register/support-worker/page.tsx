"use client";
// Support Worker Registration Wizard — 11 steps per spec doc.
// Steps: Account → Identity → Compliance → Employment → Skills → Availability →
//        Location → Rates → Preferences → Profile → Declaration

import { useState } from "react";
import { useForm, type UseFormRegister, type FieldErrors, type UseFormWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";

// ── Schemas per step ───────────────────────────────────────────────────────────

const step1Schema = z.object({
  // Account Setup — done at /register (first name, last name, email, password)
  // This step collects nothing new; wizard starts from Step 2 (identity) after account creation.
  // Kept as a placeholder so step indices align with spec numbering.
  _step1: z.literal(true).optional(),
});

const step2Schema = z.object({
  dob:         z.string().min(1, "Date of birth is required"),
  gender:      z.string().optional(),
  suburb:      z.string().min(1, "Suburb is required"),
  postcode:    z.string().min(4, "Postcode required").max(4),
  state:       z.enum(["NSW","VIC","QLD","SA","WA","TAS","NT","ACT"], { required_error: "State required" }),
  rightToWork: z.enum(["CITIZEN", "PR", "VISA_HOLDER"], { required_error: "Right to work status required" }),
  visaType:    z.string().optional(),
  visaExpiry:  z.string().optional(),
});

const step3Schema = z.object({
  ndisScreeningNumber: z.string().optional(),
  ndisScreeningExpiry: z.string().optional(),
  policeCheckIssueDate: z.string().optional(),
  policeCheckExpiry: z.string().optional(),
  wwccNumber: z.string().optional(),
  wwccExpiry: z.string().optional(),
  firstAidCertType: z.string().optional(),
  firstAidExpiry: z.string().optional(),
  cprExpiry: z.string().optional(),
  manualHandlingCompleted: z.boolean().optional(),
  driversLicenceType: z.enum(["C","R","HR","HC","MR"]).optional().or(z.literal("")),
  licenceExpiry: z.string().optional(),
  hasVehicle: z.boolean().optional(),
  insuranceValid: z.boolean().optional(),
});

const step4Schema = z.object({
  workType:                    z.enum(["CONTRACTOR","AGENCY"], { required_error: "Work type required" }),
  abn:                         z.string().optional(),
  gstRegistered:               z.boolean().optional(),
  publicLiabilityInsurance:    z.boolean().optional(),
  publicLiabilityPolicyNumber: z.string().optional(),
  publicLiabilityExpiry:       z.string().optional(),
  personalAccidentInsurance:   z.boolean().optional(),
});

const step5Schema = z.object({
  servicesOffered:      z.array(z.string()).min(1, "Select at least one service"),
  highIntensitySkills:  z.array(z.string()).optional(),
  experienceLevel:      z.enum(["BEGINNER","INTERMEDIATE","EXPERIENCED","EXPERT"], {
    required_error: "Experience level required",
  }),
  disabilityExperience: z.array(z.string()).optional(),
});

const step6Schema = z.object({
  availabilityType:         z.enum(["CASUAL","PART_TIME","FULL_TIME","ON_DEMAND"], {
    required_error: "Availability type required",
  }),
  availableDays:            z.array(z.string()).min(1, "Select at least one day"),
  timeBlocks:               z.array(z.string()).min(1, "Select at least one time block"),
  emergencyAvailability:    z.boolean().optional(),
  sleeperAvailability:      z.boolean().optional(),
});

const step7Schema = z.object({
  serviceAreaSuburbs: z.string().optional(),
  travelRadiusKm:     z.coerce.number().int().min(0).max(500).optional(),
  canTransportParticipants: z.boolean().optional(),
});

const step8Schema = z.object({
  hourlyRateType: z.enum(["FIXED","NDIS_PRICE_GUIDE","NEGOTIABLE"]).optional(),
  hourlyRate:     z.coerce.number().min(0).max(9999).optional(),
  weekendRate:    z.coerce.number().min(0).max(9999).optional(),
  nightRate:      z.coerce.number().min(0).max(9999).optional(),
  travelCharges:  z.enum(["NONE","INCLUDED","CHARGED_SEPARATELY"]).optional(),
});

const step9Schema = z.object({
  preferredParticipantType: z.array(z.string()).optional(),
  genderPreference:         z.string().optional(),
  languagesSpoken:          z.array(z.string()).optional(),
});

const step10Schema = z.object({
  bio:        z.string().max(2000).optional(),
  references: z.array(z.object({
    name:         z.string().max(100),
    relationship: z.string().max(60),
    phone:        z.string().optional(),
    email:        z.string().email().optional().or(z.literal("")),
  })).max(3).optional(),
});

const step11Schema = z.object({
  termsAccepted:        z.literal(true, { errorMap: () => ({ message: "You must accept the Terms & Conditions" }) }),
  ndisCodeAccepted:     z.literal(true, { errorMap: () => ({ message: "You must accept the NDIS Code of Conduct" }) }),
  privacyPolicyAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Privacy Policy" }) }),
  declarationStatement: z.literal(true, { errorMap: () => ({ message: "You must confirm the declaration" }) }),
});

const fullSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema)
  .merge(step8Schema)
  .merge(step9Schema)
  .merge(step10Schema)
  .merge(step11Schema.partial());

type FullForm = z.infer<typeof fullSchema>;

const stepSchemas = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema,
  step9Schema,
  step10Schema,
  step11Schema.partial(),
];

const STEP_TITLES = [
  "Identity",
  "Compliance & Legal",
  "Employment Setup",
  "Skills & Services",
  "Availability",
  "Location & Travel",
  "Rates & Pricing",
  "Participant Preferences",
  "Profile & Bio",
  "Declaration",
];

const TOTAL_STEPS = STEP_TITLES.length;

// ── Shared UI components ───────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function TextInput({
  register,
  name,
  ...props
}: { register: UseFormRegister<FullForm>; name: keyof FullForm } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  return (
    <input
      {...register(name)}
      {...props}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function SelectInput({
  register,
  name,
  children,
}: { register: UseFormRegister<FullForm>; name: keyof FullForm; children: React.ReactNode }) {
  return (
    <select
      {...register(name)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {children}
    </select>
  );
}

function CheckboxGroup({
  register,
  name,
  options,
}: { register: UseFormRegister<FullForm>; name: keyof FullForm; options: string[] }) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            {...register(name)}
            type="checkbox"
            value={opt}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function CheckboxSingle({
  register,
  name,
  label,
}: { register: UseFormRegister<FullForm>; name: keyof FullForm; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        {...register(name)}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  );
}

function RequiredCheckbox({
  register,
  name,
  label,
  errors,
}: { register: UseFormRegister<FullForm>; name: keyof FullForm; label: string; errors: FieldErrors<FullForm> }) {
  const err = errors[name];
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          {...register(name)}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
      {err && (
        <p className="ml-7 text-xs text-red-600">
          {typeof err.message === "string" ? err.message : "Required"}
        </p>
      )}
    </div>
  );
}

// ── Step renderers ─────────────────────────────────────────────────────────────

// Step 1 (index 0) — Identity Verification
function Step1({ register, errors, watch }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
  watch: UseFormWatch<FullForm>;
}) {
  const rightToWork = watch("rightToWork");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Identity Verification</h2>
      <p className="text-sm text-gray-500">This information helps verify your identity and working rights in Australia.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label required>Date of Birth</Label>
          <TextInput register={register} name="dob" type="date" />
          <FieldError message={errors.dob?.message} />
        </div>
        <div>
          <Label>Gender (Optional)</Label>
          <SelectInput register={register} name="gender">
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="other">Other</option>
          </SelectInput>
        </div>
        <div>
          <Label required>Suburb</Label>
          <TextInput register={register} name="suburb" placeholder="e.g. Parramatta" />
          <FieldError message={errors.suburb?.message} />
        </div>
        <div>
          <Label required>Postcode</Label>
          <TextInput register={register} name="postcode" placeholder="2150" maxLength={4} />
          <FieldError message={errors.postcode?.message} />
        </div>
        <div>
          <Label required>State</Label>
          <SelectInput register={register} name="state">
            <option value="">Select state</option>
            {["NSW","VIC","QLD","SA","WA","TAS","NT","ACT"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectInput>
          <FieldError message={errors.state?.message as string | undefined} />
        </div>
        <div className="sm:col-span-2">
          <Label required>Right to Work in Australia</Label>
          <div className="mt-2 space-y-2">
            {(["CITIZEN", "PR", "VISA_HOLDER"] as const).map((v) => (
              <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
                <input {...register("rightToWork")} type="radio" value={v} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-gray-900">
                  {v === "CITIZEN" ? "Australian Citizen" : v === "PR" ? "Permanent Resident" : "Visa Holder"}
                </span>
              </label>
            ))}
          </div>
          <FieldError message={errors.rightToWork?.message as string | undefined} />
        </div>
        {rightToWork === "VISA_HOLDER" && (
          <>
            <div>
              <Label required>Visa Type</Label>
              <TextInput register={register} name="visaType" placeholder="e.g. 482, 500, 820" />
            </div>
            <div>
              <Label required>Visa Expiry Date</Label>
              <TextInput register={register} name="visaExpiry" type="date" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Step 2 (index 1) — Compliance & Legal
function Step2({ register, errors, watch }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
  watch: UseFormWatch<FullForm>;
}) {
  const hasVehicle = watch("hasVehicle");
  const manualHandling = watch("manualHandlingCompleted");
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Compliance & Legal Documents</h2>
      <p className="text-sm text-gray-500">These documents are mandatory for NDIS support work. Upload them in the Documents section after registration.</p>

      {/* NDIS Worker Screening */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">NDIS Worker Screening Check (Mandatory)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Clearance Number</Label>
            <TextInput register={register} name="ndisScreeningNumber" placeholder="WC2400000000" />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <TextInput register={register} name="ndisScreeningExpiry" type="date" />
          </div>
        </div>
      </div>

      {/* Police Check */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Police Check</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Issue Date</Label>
            <TextInput register={register} name="policeCheckIssueDate" type="date" />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <TextInput register={register} name="policeCheckExpiry" type="date" />
          </div>
        </div>
      </div>

      {/* WWCC */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Working With Children Check (WWCC)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>WWCC Number</Label>
            <TextInput register={register} name="wwccNumber" placeholder="WWC0000000E" />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <TextInput register={register} name="wwccExpiry" type="date" />
          </div>
        </div>
      </div>

      {/* First Aid & CPR */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">First Aid & CPR</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>First Aid Certificate Type</Label>
            <SelectInput register={register} name="firstAidCertType">
              <option value="">Select type</option>
              <option value="HLTAID011">HLTAID011 (Provide First Aid)</option>
              <option value="HLTAID009">HLTAID009 (CPR Only)</option>
              <option value="OTHER">Other</option>
            </SelectInput>
          </div>
          <div>
            <Label>First Aid Expiry</Label>
            <TextInput register={register} name="firstAidExpiry" type="date" />
          </div>
          <div>
            <Label>CPR Expiry</Label>
            <TextInput register={register} name="cprExpiry" type="date" />
          </div>
        </div>
      </div>

      {/* Manual Handling */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Manual Handling Training</h3>
        <CheckboxSingle register={register} name="manualHandlingCompleted" label="I have completed manual handling training" />
      </div>

      {/* Driver's Licence */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Driver's Licence (if offering transport)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Licence Class</Label>
            <SelectInput register={register} name="driversLicenceType">
              <option value="">Not applicable</option>
              <option value="C">C — Car</option>
              <option value="R">R — Rider</option>
              <option value="HR">HR — Heavy Rigid</option>
              <option value="HC">HC — Heavy Combination</option>
              <option value="MR">MR — Medium Rigid</option>
            </SelectInput>
          </div>
          <div>
            <Label>Licence Expiry</Label>
            <TextInput register={register} name="licenceExpiry" type="date" />
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <CheckboxSingle register={register} name="hasVehicle" label="I have a registered vehicle" />
          {hasVehicle && (
            <CheckboxSingle register={register} name="insuranceValid" label="My vehicle has valid comprehensive insurance" />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 3 (index 2) — Employment Setup
function Step3({ register, errors, watch }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
  watch: UseFormWatch<FullForm>;
}) {
  const workType = watch("workType");
  const hasLiability = watch("publicLiabilityInsurance");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Employment Type & Setup</h2>
      <div>
        <Label required>Work Type</Label>
        <div className="mt-2 space-y-2">
          {(["CONTRACTOR","AGENCY"] as const).map((v) => (
            <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
              <input {...register("workType")} type="radio" value={v} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {v === "CONTRACTOR" ? "Independent Contractor" : "Agency-Employed"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {v === "CONTRACTOR"
                    ? "You operate as your own business. ABN required."
                    : "You are employed by an agency or provider."}
                </p>
              </div>
            </label>
          ))}
        </div>
        <FieldError message={errors.workType?.message as string | undefined} />
      </div>

      {workType === "CONTRACTOR" && (
        <div className="space-y-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Contractor Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>ABN</Label>
              <TextInput register={register} name="abn" placeholder="12 345 678 901" maxLength={20} />
            </div>
            <div className="flex items-center">
              <CheckboxSingle register={register} name="gstRegistered" label="Registered for GST" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Insurance</h4>
            <CheckboxSingle register={register} name="publicLiabilityInsurance" label="I have Public Liability Insurance" />
            {hasLiability && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 ml-6">
                <div>
                  <Label>Policy Number</Label>
                  <TextInput register={register} name="publicLiabilityPolicyNumber" placeholder="POL-123456" />
                </div>
                <div>
                  <Label>Policy Expiry</Label>
                  <TextInput register={register} name="publicLiabilityExpiry" type="date" />
                </div>
              </div>
            )}
            <CheckboxSingle register={register} name="personalAccidentInsurance" label="I have Personal Accident Insurance" />
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4 (index 3) — Skills & Services
function Step4({ register, errors }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  const SERVICES = [
    "Personal Care", "Showering / Hygiene", "Community Access", "Transport",
    "Domestic Assistance", "Medication Assistance", "Meal Preparation",
    "Overnight Support", "Behaviour Support", "High Intensity Supports",
    "Social Support", "Appointment Support", "Respite Support",
    "SIL Support", "Psychosocial Support",
  ];
  const HIGH_INTENSITY = [
    "PEG Feeding", "Catheter Care", "Bowel Care", "Diabetes Management",
    "Seizure Management", "Tracheostomy Care", "Complex Medication",
  ];
  const DISABILITY_EXP = [
    "Autism", "Psychosocial", "Physical Disability", "Intellectual Disability",
    "Complex Behaviour", "ABI", "Dementia", "Sensory Impairment", "Epilepsy",
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Skills & Services</h2>

      <div>
        <Label required>Services Offered</Label>
        <p className="text-xs text-gray-500 mb-2">Select all services you are able to provide</p>
        <CheckboxGroup register={register} name="servicesOffered" options={SERVICES} />
        <FieldError message={errors.servicesOffered?.message as string | undefined} />
      </div>

      <div>
        <Label>High Intensity Support Skills</Label>
        <p className="text-xs text-gray-500 mb-2">Select only if you have specific training and experience</p>
        <CheckboxGroup register={register} name="highIntensitySkills" options={HIGH_INTENSITY} />
      </div>

      <div>
        <Label required>Experience Level</Label>
        <div className="mt-2 space-y-2">
          {(["BEGINNER","INTERMEDIATE","EXPERIENCED","EXPERT"] as const).map((v) => (
            <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
              <input {...register("experienceLevel")} type="radio" value={v} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {v === "BEGINNER" ? "Beginner (0–1 yr)"
                    : v === "INTERMEDIATE" ? "Intermediate (1–3 yrs)"
                    : v === "EXPERIENCED" ? "Experienced (3–5 yrs)"
                    : "Expert (5+ yrs)"}
                </p>
              </div>
            </label>
          ))}
        </div>
        <FieldError message={errors.experienceLevel?.message as string | undefined} />
      </div>

      <div>
        <Label>Disability Experience</Label>
        <p className="text-xs text-gray-500 mb-2">Select all disability types you have experience supporting</p>
        <CheckboxGroup register={register} name="disabilityExperience" options={DISABILITY_EXP} />
      </div>
    </div>
  );
}

// Step 5 (index 4) — Availability
function Step5({ register, errors }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const TIME_BLOCKS = ["Morning (6am–12pm)","Afternoon (12pm–6pm)","Evening (6pm–10pm)","Overnight (10pm–6am)","Sleepover"];
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Availability</h2>

      <div>
        <Label required>Availability Type</Label>
        <div className="mt-2 space-y-2">
          {(["CASUAL","PART_TIME","FULL_TIME","ON_DEMAND"] as const).map((v) => (
            <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
              <input {...register("availabilityType")} type="radio" value={v} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-900">
                {v === "CASUAL" ? "Casual" : v === "PART_TIME" ? "Part-Time" : v === "FULL_TIME" ? "Full-Time" : "On-Demand"}
              </span>
            </label>
          ))}
        </div>
        <FieldError message={errors.availabilityType?.message as string | undefined} />
      </div>

      <div>
        <Label required>Available Days</Label>
        <CheckboxGroup register={register} name="availableDays" options={DAYS} />
        <FieldError message={errors.availableDays?.message as string | undefined} />
      </div>

      <div>
        <Label required>Time Availability</Label>
        <CheckboxGroup register={register} name="timeBlocks" options={TIME_BLOCKS} />
        <FieldError message={errors.timeBlocks?.message as string | undefined} />
      </div>

      <div className="space-y-2">
        <CheckboxSingle register={register} name="emergencyAvailability" label="Available for emergency / same-day shifts" />
        <CheckboxSingle register={register} name="sleeperAvailability" label="Available for sleepover support" />
      </div>
    </div>
  );
}

// Step 6 (index 5) — Location & Travel
function Step6({ register, errors }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Location & Travel</h2>
      <div>
        <Label>Service Areas (Suburbs / Postcodes)</Label>
        <textarea
          {...register("serviceAreaSuburbs")}
          rows={3}
          placeholder="Parramatta, 2150, Blacktown, 2148, Hills District"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Comma-separated suburbs or postcodes where you can work</p>
      </div>
      <div>
        <Label>Travel Radius (km)</Label>
        <SelectInput register={register} name="travelRadiusKm">
          <option value="">Select radius</option>
          <option value="5">5 km</option>
          <option value="10">10 km</option>
          <option value="15">15 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
          <option value="100">100 km</option>
          <option value="999">No strict limit</option>
        </SelectInput>
      </div>
      <div>
        <CheckboxSingle register={register} name="canTransportParticipants" label="I can transport participants in my insured vehicle" />
      </div>
    </div>
  );
}

// Step 7 (index 6) — Rates & Pricing
function Step7({ register, errors }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Rate & Pricing Preferences</h2>
      <div>
        <Label>Hourly Rate Preference</Label>
        <div className="mt-2 space-y-2">
          {(["FIXED","NDIS_PRICE_GUIDE","NEGOTIABLE"] as const).map((v) => (
            <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
              <input {...register("hourlyRateType")} type="radio" value={v} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-900">
                {v === "FIXED" ? "Fixed Rate" : v === "NDIS_PRICE_GUIDE" ? "As per NDIS Price Guide" : "Negotiable"}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Standard Hourly Rate ($)</Label>
          <TextInput register={register} name="hourlyRate" type="number" min="0" step="0.01" placeholder="45.00" />
        </div>
        <div>
          <Label>Weekend Rate ($)</Label>
          <TextInput register={register} name="weekendRate" type="number" min="0" step="0.01" placeholder="55.00" />
        </div>
        <div>
          <Label>Night Rate ($)</Label>
          <TextInput register={register} name="nightRate" type="number" min="0" step="0.01" placeholder="50.00" />
        </div>
      </div>
      <div>
        <Label>Travel Charges</Label>
        <SelectInput register={register} name="travelCharges">
          <option value="">Select</option>
          <option value="INCLUDED">Included in my rate</option>
          <option value="CHARGED_SEPARATELY">Charged separately</option>
          <option value="NONE">Not applicable</option>
        </SelectInput>
      </div>
    </div>
  );
}

// Step 8 (index 7) — Participant Preferences
function Step8({ register }: { register: UseFormRegister<FullForm> }) {
  const PARTICIPANT_TYPES = ["Children","Adults","Older Adults","High Needs","Behavioural"];
  const LANGUAGES = [
    "English","Arabic","Hindi","Urdu","Punjabi","Mandarin","Cantonese",
    "Vietnamese","Greek","Italian","Filipino","Korean","Auslan","Other",
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Participant Preferences</h2>
      <div>
        <Label>Preferred Participant Types (Optional)</Label>
        <CheckboxGroup register={register} name="preferredParticipantType" options={PARTICIPANT_TYPES} />
      </div>
      <div>
        <Label>Gender Preference for Participants (Optional)</Label>
        <SelectInput register={register} name="genderPreference">
          <option value="">No preference</option>
          <option value="male">Male participants</option>
          <option value="female">Female participants</option>
          <option value="no_preference">Open</option>
        </SelectInput>
      </div>
      <div>
        <Label>Languages Spoken</Label>
        <CheckboxGroup register={register} name="languagesSpoken" options={LANGUAGES} />
      </div>
    </div>
  );
}

// Step 9 (index 8) — Profile & Bio
function Step9({ register }: { register: UseFormRegister<FullForm> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Profile & Trust Layer</h2>
      <div>
        <Label>Bio / About Me</Label>
        <textarea
          {...register("bio")}
          rows={6}
          placeholder="Describe your experience, approach to support work, what makes you a great support worker..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Max 2,000 characters. This is shown to participants and coordinators.</p>
      </div>
      <div>
        <Label>References (Optional)</Label>
        <p className="text-xs text-gray-500 mb-3">Up to 3 professional references</p>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3 grid grid-cols-2 gap-3">
              <div className="col-span-2 text-xs font-medium text-gray-500 uppercase">Reference {i + 1}</div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input
                  {...register(`references.${i}.name` as any)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Relationship</label>
                <input
                  {...register(`references.${i}.relationship` as any)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Previous employer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone</label>
                <input
                  {...register(`references.${i}.phone` as any)}
                  type="tel"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="0400 000 000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  {...register(`references.${i}.email` as any)}
                  type="email"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 10 (index 9) — Declaration
function Step10({ register, errors }: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Platform Compliance & Declaration</h2>
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        Please read and confirm each of the following before submitting your registration.
      </div>
      <div className="space-y-3">
        <RequiredCheckbox
          register={register}
          name="termsAccepted"
          label="I accept the Shiftify Terms & Conditions."
          errors={errors}
        />
        <RequiredCheckbox
          register={register}
          name="ndisCodeAccepted"
          label="I accept the NDIS Code of Conduct and commit to upholding its principles."
          errors={errors}
        />
        <RequiredCheckbox
          register={register}
          name="privacyPolicyAccepted"
          label="I have read and accept the Shiftify Privacy Policy."
          errors={errors}
        />
        <RequiredCheckbox
          register={register}
          name="declarationStatement"
          label="I confirm all documents are valid and I am eligible to provide disability support services."
          errors={errors}
        />
      </div>
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800 mt-4">
        <p className="font-medium mb-1">What happens next?</p>
        <p>Your profile will be activated immediately. You can upload your compliance documents from your dashboard. Workers with complete compliance documents appear higher in search results.</p>
      </div>
    </div>
  );
}

// ── Main wizard component ──────────────────────────────────────────────────────

export default function SupportWorkerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<FullForm>({
    resolver: zodResolver(fullSchema),
    mode: "onBlur",
    defaultValues: {
      emergencyAvailability: false,
      sleeperAvailability: false,
      hasVehicle: false,
      insuranceValid: false,
      manualHandlingCompleted: false,
      publicLiabilityInsurance: false,
      personalAccidentInsurance: false,
      gstRegistered: false,
    },
  });

  const currentStepSchema = stepSchemas[step];

  const handleNext = async () => {
    const stepFields = Object.keys(
      "shape" in currentStepSchema ? (currentStepSchema as { shape: Record<string, unknown> }).shape : {},
    ) as (keyof FullForm)[];
    const valid = await trigger(stepFields.length > 0 ? stepFields : undefined);
    if (valid) {
      // Auto-save step progress
      const values = getValues();
      void saveStep(values, step + 1);
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }
  };

  const saveStep = async (values: Partial<FullForm>, nextStep: number) => {
    try {
      const payload = buildPayload(values, nextStep);
      await api.patch("/users/me/profile/worker", payload);
    } catch {
      // Silent — progress saved on final submit
    }
  };

  const buildPayload = (values: Partial<FullForm>, profileStep: number) => {
    const serviceAreas = values.serviceAreaSuburbs
      ? values.serviceAreaSuburbs.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const weekendNightRates =
      values.weekendRate || values.nightRate
        ? {
            weekendRate: values.weekendRate ? Number(values.weekendRate) : undefined,
            nightRate:   values.nightRate   ? Number(values.nightRate)   : undefined,
          }
        : undefined;

    // Convert dob string to ISO datetime
    const dob = values.dob ? new Date(values.dob).toISOString() : undefined;
    const visaExpiry = values.visaExpiry ? new Date(values.visaExpiry).toISOString() : undefined;
    const publicLiabilityExpiry = values.publicLiabilityExpiry
      ? new Date(values.publicLiabilityExpiry).toISOString()
      : undefined;

    return {
      profileStep,
      dob,
      gender: values.gender,
      suburb: values.suburb,
      postcode: values.postcode,
      state: values.state,
      rightToWork: values.rightToWork,
      visaType: values.visaType,
      visaExpiry,
      workType: values.workType,
      abn: values.abn,
      gstRegistered: values.gstRegistered,
      publicLiabilityInsurance: values.publicLiabilityInsurance,
      publicLiabilityPolicyNumber: values.publicLiabilityPolicyNumber,
      publicLiabilityExpiry,
      personalAccidentInsurance: values.personalAccidentInsurance,
      driversLicenceType: values.driversLicenceType || undefined,
      hasVehicle: values.hasVehicle,
      insuranceValid: values.insuranceValid,
      manualHandlingCompleted: values.manualHandlingCompleted,
      firstAidCertType: values.firstAidCertType,
      servicesOffered: values.servicesOffered,
      highIntensitySkills: values.highIntensitySkills,
      experienceLevel: values.experienceLevel,
      disabilityExperience: values.disabilityExperience,
      availabilityType: values.availabilityType,
      emergencyAvailability: values.emergencyAvailability,
      sleeperAvailability: values.sleeperAvailability,
      canTransportParticipants: values.canTransportParticipants,
      serviceAreas,
      travelRadiusKm: values.travelRadiusKm ? Number(values.travelRadiusKm) : undefined,
      hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : undefined,
      hourlyRateType: values.hourlyRateType,
      weekendNightRates,
      travelCharges: values.travelCharges,
      preferredParticipantType: values.preferredParticipantType,
      genderPreference: values.genderPreference,
      languagesSpoken: values.languagesSpoken,
      bio: values.bio,
      references: (values.references ?? []).filter((r) => r && r.name),
      termsAccepted: values.termsAccepted ?? false,
      ndisCodeAccepted: values.ndisCodeAccepted ?? false,
      privacyPolicyAccepted: values.privacyPolicyAccepted ?? false,
      declarationStatement: values.declarationStatement ?? false,
    };
  };

  const onSubmit = async (values: FullForm) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = buildPayload(values, TOTAL_STEPS);
      await api.patch("/users/me/profile/worker", payload);
      router.push("/dashboard/support-worker");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:  return <Step1 register={register} errors={errors} watch={watch} />;
      case 1:  return <Step2 register={register} errors={errors} watch={watch} />;
      case 2:  return <Step3 register={register} errors={errors} watch={watch} />;
      case 3:  return <Step4 register={register} errors={errors} />;
      case 4:  return <Step5 register={register} errors={errors} />;
      case 5:  return <Step6 register={register} errors={errors} />;
      case 6:  return <Step7 register={register} errors={errors} />;
      case 7:  return <Step8 register={register} />;
      case 8:  return <Step9 register={register} />;
      case 9:  return <Step10 register={register} errors={errors} />;
      default: return null;
    }
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step + 1} of {TOTAL_STEPS}: {STEP_TITLES[step]}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-2xl mx-auto flex gap-0">
          {STEP_TITLES.map((title, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                i === step
                  ? "border-indigo-600 text-indigo-600 font-medium"
                  : i < step
                  ? "border-transparent text-gray-500 hover:text-gray-700 cursor-pointer"
                  : "border-transparent text-gray-400 cursor-not-allowed"
              }`}
            >
              {i + 1}. {title}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                disabled={step === 0}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Back
              </button>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Submitting…" : "Submit Registration"}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your progress is saved automatically at each step. You can return to complete your registration later.
        </p>
      </div>
    </div>
  );
}
