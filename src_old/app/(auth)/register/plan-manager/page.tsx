"use client";
// Plan Manager Registration Wizard
// Steps per spec doc: Role Type → Business Details → NDIS Registration →
// Capability → Participant Scope → Service Coverage → Payment Operations →
// Compliance → Staff Model → Participant Linking → Provider Interaction →
// Communication → Commercial → Terms & Declaration

import { useState } from "react";
import { useForm, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";

// ── Schemas per step ──────────────────────────────────────────────────────────

const step1Schema = z.object({
  pmRoleType: z.enum(["PLAN_MANAGER", "PM_ORG_ADMIN", "PM_STAFF_MEMBER"], {
    required_error: "Please select your role type",
  }),
});

const step2Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  legalEntityName: z.string().optional(),
  abn: z.string().min(11, "ABN must be 11 digits").max(20),
  acn: z.string().optional(),
  businessStructure: z.enum([
    "SOLE_TRADER", "PARTNERSHIP", "COMPANY", "TRUST",
  ]).optional(),
  trustName: z.string().optional(),
  directorName: z.string().optional(),
  directorPosition: z.string().optional(),
  businessAddress: z.string().min(1, "Address is required"),
  businessSuburb: z.string().min(1, "Suburb is required"),
  businessState: z.string().min(1, "State is required"),
  businessPostcode: z.string().min(4, "Postcode is required"),
  businessPhone: z.string().min(8, "Phone is required"),
  businessEmail: z.string().email("Valid email required"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  financeTeamEmail: z.string().email().optional().or(z.literal("")),
  accountsPayablePhone: z.string().optional(),
  yearsInOperation: z.string().optional(),
});

const step3Schema = z.object({
  ndisRegistrationStatus: z.enum([
    "REGISTERED", "IN_PROGRESS", "NOT_REGISTERED",
  ], { required_error: "NDIS registration status is required" }),
  ndisRegistered: z.boolean().optional(),
  ndisProviderNumber: z.string().optional(),
  registrationExpiryDate: z.string().optional(),
  approvedRegistrationGroups: z.array(z.string()).optional(),
});

const step4Schema = z.object({
  planTypesSupported: z.array(z.string()).min(1, "Select at least one plan type"),
  silSdaInvoicing: z.boolean().optional(),
  servicesProvided: z.array(z.string()).optional(),
  plansRecurringInvoices: z.boolean().optional(),
  plansOnceOffInvoices: z.boolean().optional(),
  providesBudgetStatements: z.boolean().optional(),
});

const step5Schema = z.object({
  participantTypesSupported: z.array(z.string()).optional(),
  participantComplexityExperience: z.array(z.string()).optional(),
});

const step6Schema = z.object({
  serviceCoverageType: z.enum([
    "AUSTRALIA_WIDE", "STATE_BASED", "REGION_BASED",
  ], { required_error: "Coverage type required" }),
  stateCoverage: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  operatingHours: z.string().optional(),
  invoiceTurnaroundTime: z.string().optional(),
});

const step7Schema = z.object({
  invoiceIntakeMethod: z.array(z.string()).optional(),
  primaryInvoiceContactEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  accountsContactName: z.string().optional(),
  paymentEnquiryContactName: z.string().optional(),
  paymentEnquiryContactEmail: z.string().email().optional().or(z.literal("")),
  paymentEnquiryContactPhone: z.string().optional(),
  invoiceReferenceFormat: z.string().optional(),
  remittanceAdvice: z.string().optional(),
  disputeHandlingContact: z.string().optional(),
  acceptsRegisteredProvidersOnly: z.boolean().optional(),
  requiresServiceDatesOnInvoices: z.boolean().optional(),
  requiresSupportCategoryCode: z.boolean().optional(),
});

const step8Schema = z.object({
  recordKeepingDeclaration: z.literal(true, {
    errorMap: () => ({ message: "You must confirm record keeping obligations" }),
  }),
  conflictOfInterestDeclaration: z.literal(true, {
    errorMap: () => ({ message: "You must confirm conflict of interest policy" }),
  }),
  noMisuseOfFundsDeclaration: z.literal(true, {
    errorMap: () => ({ message: "You must confirm funds usage policy" }),
  }),
  taxComplianceDeclaration: z.literal(true, {
    errorMap: () => ({ message: "You must confirm tax compliance" }),
  }),
  informationAccurateDeclaration: z.literal(true, {
    errorMap: () => ({ message: "You must confirm information accuracy" }),
  }),
  complaintsContactName: z.string().optional(),
  complaintsContactEmail: z.string().email().optional().or(z.literal("")),
  incidentEscalationContact: z.string().optional(),
  privacyContact: z.string().optional(),
  recordsRetentionContact: z.string().optional(),
});

const step9Schema = z.object({
  organisationUserModel: z.enum(["SINGLE", "MULTI_USER"]).optional(),
  staffAdminName: z.string().optional(),
  staffAdminEmail: z.string().email().optional().or(z.literal("")),
  staffSeatsRequired: z.coerce.number().int().min(0).optional(),
});

const step10Schema = z.object({
  participantLinkingMethod: z.array(z.string()).optional(),
  linkApprovalRequired: z.boolean().optional(),
  requiresServiceAgreementBeforeInvoicing: z.boolean().optional(),
});

const step11Schema = z.object({
  invoiceAcceptanceRules: z.array(z.string()).optional(),
  acceptsRecurringClaims: z.boolean().optional(),
  acceptsOnceOffClaims: z.boolean().optional(),
  allowsProviderPortalMessaging: z.boolean().optional(),
});

const step12Schema = z.object({
  invoiceNotificationEmail: z.string().email().optional().or(z.literal("")),
  complianceNoticesEmail: z.string().email().optional().or(z.literal("")),
  escalationContactForFailedPayments: z.string().optional(),
  smsAlertsEnabled: z.boolean().optional(),
});

const step13Schema = z.object({
  subscriptionPlan: z.string().optional(),
  billingContactName: z.string().optional(),
  billingContactEmail: z.string().email().optional().or(z.literal("")),
  billingAddress: z.string().optional(),
  gstRegistered: z.boolean().optional(),
});

const step14Schema = z.object({
  acceptingClients: z.boolean().optional(),
  privacyPolicyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy" }),
  }),
  confirmAuthorityToRegister: z.literal(true, {
    errorMap: () => ({ message: "You must confirm authority to register" }),
  }),
  confirmDetailsAccurate: z.literal(true, {
    errorMap: () => ({ message: "You must confirm details are accurate" }),
  }),
  consentToVerification: z.literal(true, {
    errorMap: () => ({ message: "You must consent to verification" }),
  }),
  consentToParticipantLinkingControls: z.literal(true, {
    errorMap: () => ({ message: "You must consent to participant linking controls" }),
  }),
  consentToInvoiceRoutingRules: z.literal(true, {
    errorMap: () => ({ message: "You must consent to invoice routing rules" }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
  ndisCodeAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the NDIS Code of Conduct" }),
  }),
});

// Combined schema for the full form
const fullSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema)
  .merge(step8Schema.partial())
  .merge(step9Schema)
  .merge(step10Schema)
  .merge(step11Schema)
  .merge(step12Schema)
  .merge(step13Schema)
  .merge(step14Schema.partial());

type FullForm = z.infer<typeof fullSchema>;

// ── Step schemas in order ──────────────────────────────────────────────────────
const stepSchemas = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema.partial(),
  step9Schema,
  step10Schema,
  step11Schema,
  step12Schema,
  step13Schema,
  step14Schema.partial(),
];

const STEP_TITLES = [
  "Role Type",
  "Business Details",
  "NDIS Registration",
  "Capability",
  "Participant Scope",
  "Service Coverage",
  "Payment Operations",
  "Compliance & Governance",
  "Staff Model",
  "Participant Linking",
  "Provider Interaction",
  "Communication",
  "Commercial Setup",
  "Terms & Declaration",
];

const TOTAL_STEPS = STEP_TITLES.length;

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

function Input({
  register,
  name,
  ...props
}: {
  register: UseFormRegister<FullForm>;
  name: keyof FullForm;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  return (
    <input
      {...register(name)}
      {...props}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function CheckboxField({
  register,
  name,
  label,
  errors,
}: {
  register: UseFormRegister<FullForm>;
  name: keyof FullForm;
  label: string;
  errors: FieldErrors<FullForm>;
}) {
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

function Step1({
  register,
  errors,
}: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">What is your role type?</h2>
      <p className="text-sm text-gray-500">
        Select the role that best describes how you operate as a Plan Manager on Shiftify.
      </p>
      {(["PLAN_MANAGER", "PM_ORG_ADMIN", "PM_STAFF_MEMBER"] as const).map((v) => (
        <label key={v} className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
          <input
            {...register("pmRoleType")}
            type="radio"
            value={v}
            className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {v === "PLAN_MANAGER"
                ? "Independent Plan Manager"
                : v === "PM_ORG_ADMIN"
                ? "Organisation Admin (Plan Management)"
                : "Staff Member of a Plan Management Organisation"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {v === "PLAN_MANAGER"
                ? "You manage participants independently under your own business."
                : v === "PM_ORG_ADMIN"
                ? "You are the primary administrator for a plan management organisation."
                : "You work as part of a team within a plan management organisation."}
            </p>
          </div>
        </label>
      ))}
      <FieldError message={errors.pmRoleType?.message as string | undefined} />
    </div>
  );
}

function Step2({
  register,
  errors,
  watch,
}: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
  watch: (name: keyof FullForm) => unknown;
}) {
  const structure = watch("businessStructure") as string | undefined;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Business / Trading Name *</Label>
          <Input register={register} name="businessName" placeholder="ABC Plan Management" />
          <FieldError message={errors.businessName?.message} />
        </div>
        <div>
          <Label>Legal Entity Name</Label>
          <Input register={register} name="legalEntityName" placeholder="ABC Pty Ltd" />
        </div>
        <div>
          <Label>ABN *</Label>
          <Input register={register} name="abn" placeholder="12 345 678 901" maxLength={20} />
          <FieldError message={errors.abn?.message} />
        </div>
        <div>
          <Label>ACN (if applicable)</Label>
          <Input register={register} name="acn" placeholder="123 456 789" />
        </div>
        <div>
          <Label>Business Structure</Label>
          <select
            {...register("businessStructure")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select structure</option>
            <option value="SOLE_TRADER">Sole Trader</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="COMPANY">Company</option>
            <option value="TRUST">Trust</option>
          </select>
        </div>
        {structure === "TRUST" && (
          <div>
            <Label>Trust Name</Label>
            <Input register={register} name="trustName" placeholder="Smith Family Trust" />
          </div>
        )}
        <div>
          <Label>Director / Principal Name</Label>
          <Input register={register} name="directorName" placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Director Position / Title</Label>
          <Input register={register} name="directorPosition" placeholder="Director" />
        </div>
        <div className="sm:col-span-2">
          <Label>Business Address *</Label>
          <Input register={register} name="businessAddress" placeholder="123 Main Street" />
          <FieldError message={errors.businessAddress?.message} />
        </div>
        <div>
          <Label>Suburb *</Label>
          <Input register={register} name="businessSuburb" placeholder="Melbourne" />
          <FieldError message={errors.businessSuburb?.message} />
        </div>
        <div>
          <Label>State *</Label>
          <select
            {...register("businessState")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select state</option>
            {["NSW","VIC","QLD","SA","WA","TAS","NT","ACT"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError message={errors.businessState?.message} />
        </div>
        <div>
          <Label>Postcode *</Label>
          <Input register={register} name="businessPostcode" placeholder="3000" maxLength={4} />
          <FieldError message={errors.businessPostcode?.message} />
        </div>
        <div>
          <Label>Business Phone *</Label>
          <Input register={register} name="businessPhone" type="tel" placeholder="03 9999 9999" />
          <FieldError message={errors.businessPhone?.message} />
        </div>
        <div>
          <Label>Business Email *</Label>
          <Input register={register} name="businessEmail" type="email" placeholder="accounts@example.com" />
          <FieldError message={errors.businessEmail?.message} />
        </div>
        <div>
          <Label>Website URL</Label>
          <Input register={register} name="websiteUrl" type="url" placeholder="https://example.com" />
        </div>
        <div>
          <Label>Finance Team Email</Label>
          <Input register={register} name="financeTeamEmail" type="email" placeholder="finance@example.com" />
        </div>
        <div>
          <Label>Accounts Payable Phone</Label>
          <Input register={register} name="accountsPayablePhone" type="tel" />
        </div>
        <div>
          <Label>Years in Operation</Label>
          <select
            {...register("yearsInOperation")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select</option>
            <option value="LESS_THAN_1">Less than 1 year</option>
            <option value="1_3">1–3 years</option>
            <option value="3_5">3–5 years</option>
            <option value="5_10">5–10 years</option>
            <option value="10_PLUS">10+ years</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Step3({
  register,
  errors,
  watch,
}: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
  watch: (name: keyof FullForm) => unknown;
}) {
  const ndisStatus = watch("ndisRegistrationStatus") as string | undefined;
  const REG_GROUPS = [
    "Support Coordination",
    "Specialist Support Coordination",
    "Plan Management",
    "Early Childhood",
    "Daily Activities",
    "Social and Civic Participation",
    "Health and Wellbeing",
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">NDIS Registration</h2>
      <div>
        <Label>NDIS Registration Status *</Label>
        <select
          {...register("ndisRegistrationStatus")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select status</option>
          <option value="REGISTERED">Registered NDIS Provider</option>
          <option value="IN_PROGRESS">Registration in Progress</option>
          <option value="NOT_REGISTERED">Not Registered</option>
        </select>
        <FieldError message={errors.ndisRegistrationStatus?.message as string | undefined} />
      </div>
      {ndisStatus === "REGISTERED" && (
        <>
          <div>
            <Label>NDIS Provider Number</Label>
            <Input register={register} name="ndisProviderNumber" placeholder="4050000000" />
          </div>
          <div>
            <Label>Registration Expiry Date</Label>
            <Input register={register} name="registrationExpiryDate" type="date" />
          </div>
          <div>
            <Label>Approved Registration Groups</Label>
            <div className="mt-2 space-y-2">
              {REG_GROUPS.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    {...register("approvedRegistrationGroups")}
                    type="checkbox"
                    value={g}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Step4({
  register,
  errors,
}: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
}) {
  const PLAN_TYPES = ["Plan-Managed", "Agency-Managed (NDIA)", "Self-Managed", "Mixed"];
  const SERVICES = [
    "Invoice processing",
    "Budget management",
    "Financial reporting",
    "Provider payments",
    "NDIS portal claims",
    "Budget statements",
    "Audit support",
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Plan Management Capability</h2>
      <div>
        <Label>Plan Types Supported *</Label>
        <div className="mt-2 space-y-2">
          {PLAN_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                {...register("planTypesSupported")}
                type="checkbox"
                value={t}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {t}
            </label>
          ))}
        </div>
        <FieldError message={errors.planTypesSupported?.message as string | undefined} />
      </div>
      <div>
        <Label>Services Provided</Label>
        <div className="mt-2 space-y-2">
          {SERVICES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                {...register("servicesProvided")}
                type="checkbox"
                value={s}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {s}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("silSdaInvoicing")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We handle SIL/SDA invoicing
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("plansRecurringInvoices")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We process recurring invoices
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("plansOnceOffInvoices")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We process once-off invoices
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("providesBudgetStatements")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We provide budget statements to participants
        </label>
      </div>
    </div>
  );
}

function Step5({ register }: { register: UseFormRegister<FullForm> }) {
  const PARTICIPANT_TYPES = [
    "Adults", "Children", "Older adults (65+)", "Complex needs", "Psychosocial",
    "Acquired brain injury", "Autism", "Intellectual disability", "Physical disability",
  ];
  const COMPLEXITY = [
    "Low complexity", "Moderate complexity", "High complexity",
    "Behaviours of concern", "Multiple providers",
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Participant Scope</h2>
      <div>
        <Label>Participant Types Supported</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PARTICIPANT_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input {...register("participantTypesSupported")} type="checkbox" value={t} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {t}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Participant Complexity Experience</Label>
        <div className="mt-2 space-y-2">
          {COMPLEXITY.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input {...register("participantComplexityExperience")} type="checkbox" value={c} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {c}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step6({
  register,
  errors,
  watch,
}: {
  register: UseFormRegister<FullForm>;
  errors: FieldErrors<FullForm>;
  watch: (name: keyof FullForm) => unknown;
}) {
  const coverageType = watch("serviceCoverageType") as string | undefined;
  const STATES = ["NSW","VIC","QLD","SA","WA","TAS","NT","ACT"];
  const TIMEZONES = ["AEST (UTC+10)", "AEST/AEDT (UTC+10/11)", "AWST (UTC+8)", "ACST (UTC+9:30)"];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Service Coverage</h2>
      <div>
        <Label>Coverage Type *</Label>
        <select {...register("serviceCoverageType")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select coverage</option>
          <option value="AUSTRALIA_WIDE">Australia-Wide</option>
          <option value="STATE_BASED">State-Based</option>
          <option value="REGION_BASED">Region-Based</option>
        </select>
        <FieldError message={errors.serviceCoverageType?.message as string | undefined} />
      </div>
      {coverageType === "STATE_BASED" && (
        <div>
          <Label>States Covered</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {STATES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input {...register("stateCoverage")} type="checkbox" value={s} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}
      {coverageType === "REGION_BASED" && (
        <div>
          <Label>Service Areas / Suburbs</Label>
          <input {...register("serviceAreas")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Melbourne CBD, Fitzroy, Richmond" />
          <p className="mt-1 text-xs text-gray-500">Comma-separated suburbs or regions</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Timezone</Label>
          <select {...register("timezone")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select timezone</option>
            {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label>Operating Hours</Label>
          <Input register={register} name="operatingHours" placeholder="Mon–Fri 9am–5pm AEST" />
        </div>
        <div>
          <Label>Invoice Turnaround Time</Label>
          <select {...register("invoiceTurnaroundTime")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select</option>
            <option value="SAME_DAY">Same day</option>
            <option value="1_2_DAYS">1–2 business days</option>
            <option value="3_5_DAYS">3–5 business days</option>
            <option value="1_WEEK">Up to 1 week</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Step7({ register, errors }: { register: UseFormRegister<FullForm>; errors: FieldErrors<FullForm> }) {
  const INTAKE_METHODS = [
    "Email invoice", "Provider portal upload", "NDIS portal", "Post/mail", "Fax",
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Payment Operations</h2>
      <div>
        <Label>Invoice Intake Methods</Label>
        <div className="mt-2 space-y-2">
          {INTAKE_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input {...register("invoiceIntakeMethod")} type="checkbox" value={m} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {m}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Primary Invoice Contact Email</Label>
          <Input register={register} name="primaryInvoiceContactEmail" type="email" placeholder="invoices@example.com" />
          <FieldError message={errors.primaryInvoiceContactEmail?.message as string | undefined} />
        </div>
        <div>
          <Label>Accounts Contact Name</Label>
          <Input register={register} name="accountsContactName" placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Payment Enquiry Contact Name</Label>
          <Input register={register} name="paymentEnquiryContactName" placeholder="John Doe" />
        </div>
        <div>
          <Label>Payment Enquiry Email</Label>
          <Input register={register} name="paymentEnquiryContactEmail" type="email" placeholder="payments@example.com" />
        </div>
        <div>
          <Label>Payment Enquiry Phone</Label>
          <Input register={register} name="paymentEnquiryContactPhone" type="tel" />
        </div>
        <div>
          <Label>Invoice Reference Format</Label>
          <Input register={register} name="invoiceReferenceFormat" placeholder="INV-YYYY-NNNN" />
        </div>
        <div className="sm:col-span-2">
          <Label>Remittance Advice Email / Portal</Label>
          <Input register={register} name="remittanceAdvice" placeholder="remittance@example.com or portal URL" />
        </div>
        <div className="sm:col-span-2">
          <Label>Dispute Handling Contact</Label>
          <Input register={register} name="disputeHandlingContact" placeholder="disputes@example.com" />
        </div>
      </div>
      <div className="space-y-2 border-t pt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("acceptsRegisteredProvidersOnly")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We only accept invoices from registered NDIS providers
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("requiresServiceDatesOnInvoices")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We require service dates on all invoices
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("requiresSupportCategoryCode")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We require support category/item codes on invoices
        </label>
      </div>
    </div>
  );
}

function Step8({ register, errors }: { register: UseFormRegister<FullForm>; errors: FieldErrors<FullForm> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Compliance & Governance</h2>
      <p className="text-sm text-gray-500">
        As an NDIS Plan Manager, you must confirm compliance with the following obligations:
      </p>
      <div className="space-y-3">
        <CheckboxField register={register} name="recordKeepingDeclaration" label="I confirm we maintain appropriate records per NDIS requirements." errors={errors} />
        <CheckboxField register={register} name="conflictOfInterestDeclaration" label="I confirm we have a documented conflict of interest policy." errors={errors} />
        <CheckboxField register={register} name="noMisuseOfFundsDeclaration" label="I confirm participant funds are used only for approved supports." errors={errors} />
        <CheckboxField register={register} name="taxComplianceDeclaration" label="I confirm we meet all ATO tax obligations including BAS/GST reporting." errors={errors} />
        <CheckboxField register={register} name="informationAccurateDeclaration" label="I confirm all information provided is accurate to the best of my knowledge." errors={errors} />
      </div>
      <div className="border-t pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Complaints Contact Name</Label>
          <Input register={register} name="complaintsContactName" placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Complaints Contact Email</Label>
          <Input register={register} name="complaintsContactEmail" type="email" placeholder="complaints@example.com" />
        </div>
        <div className="sm:col-span-2">
          <Label>Incident Escalation Contact</Label>
          <Input register={register} name="incidentEscalationContact" placeholder="Name, phone, email" />
        </div>
        <div>
          <Label>Privacy Contact</Label>
          <Input register={register} name="privacyContact" placeholder="privacy@example.com" />
        </div>
        <div>
          <Label>Records Retention Contact</Label>
          <Input register={register} name="recordsRetentionContact" placeholder="records@example.com" />
        </div>
      </div>
    </div>
  );
}

function Step9({ register }: { register: UseFormRegister<FullForm> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Staff / User Model</h2>
      <div>
        <Label>Organisation User Model</Label>
        <div className="mt-2 space-y-2">
          {(["SINGLE", "MULTI_USER"] as const).map((v) => (
            <label key={v} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-indigo-400 transition-colors">
              <input {...register("organisationUserModel")} type="radio" value={v} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {v === "SINGLE" ? "Single user (just me)" : "Multi-user (team access)"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {v === "SINGLE"
                    ? "You will be the only user accessing this account."
                    : "Multiple staff members will access the platform."}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Staff Admin Name</Label>
          <Input register={register} name="staffAdminName" placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Staff Admin Email</Label>
          <Input register={register} name="staffAdminEmail" type="email" placeholder="admin@example.com" />
        </div>
        <div>
          <Label>Staff Seats Required</Label>
          <Input register={register} name="staffSeatsRequired" type="number" min="0" placeholder="5" />
        </div>
      </div>
    </div>
  );
}

function Step10({ register }: { register: UseFormRegister<FullForm> }) {
  const LINKING_METHODS = [
    "Participant invites via platform",
    "Plan Manager sends invite link",
    "Manual linking by admin",
    "Service agreement upload",
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Participant Linking</h2>
      <div>
        <Label>Participant Linking Methods</Label>
        <div className="mt-2 space-y-2">
          {LINKING_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input {...register("participantLinkingMethod")} type="checkbox" value={m} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {m}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("linkApprovalRequired")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          Require my approval before a participant link is confirmed
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("requiresServiceAgreementBeforeInvoicing")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          Require a signed service agreement before processing invoices
        </label>
      </div>
    </div>
  );
}

function Step11({ register }: { register: UseFormRegister<FullForm> }) {
  const ACCEPTANCE_RULES = [
    "Valid NDIS registration required",
    "Service agreement must be on file",
    "Service dates must be specified",
    "Support category codes required",
    "No invoices older than 90 days",
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Provider Interaction</h2>
      <div>
        <Label>Invoice Acceptance Rules</Label>
        <div className="mt-2 space-y-2">
          {ACCEPTANCE_RULES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input {...register("invoiceAcceptanceRules")} type="checkbox" value={r} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {r}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2 border-t pt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("acceptsRecurringClaims")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We accept recurring claims / standing invoices
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("acceptsOnceOffClaims")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          We accept once-off claims
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("allowsProviderPortalMessaging")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          Providers may message us via the platform regarding invoices
        </label>
      </div>
    </div>
  );
}

function Step12({ register, errors }: { register: UseFormRegister<FullForm>; errors: FieldErrors<FullForm> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Communication Preferences</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Invoice Notification Email</Label>
          <Input register={register} name="invoiceNotificationEmail" type="email" placeholder="invoices@example.com" />
          <FieldError message={errors.invoiceNotificationEmail?.message as string | undefined} />
        </div>
        <div>
          <Label>Compliance Notices Email</Label>
          <Input register={register} name="complianceNoticesEmail" type="email" placeholder="compliance@example.com" />
          <FieldError message={errors.complianceNoticesEmail?.message as string | undefined} />
        </div>
        <div className="sm:col-span-2">
          <Label>Escalation Contact for Failed Payments</Label>
          <Input register={register} name="escalationContactForFailedPayments" placeholder="Name — phone — email" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input {...register("smsAlertsEnabled")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        Enable SMS alerts for critical notifications
      </label>
    </div>
  );
}

function Step13({ register, errors }: { register: UseFormRegister<FullForm>; errors: FieldErrors<FullForm> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Commercial Setup</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Billing Contact Name</Label>
          <Input register={register} name="billingContactName" placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Billing Contact Email</Label>
          <Input register={register} name="billingContactEmail" type="email" placeholder="billing@example.com" />
          <FieldError message={errors.billingContactEmail?.message as string | undefined} />
        </div>
        <div className="sm:col-span-2">
          <Label>Billing Address</Label>
          <Input register={register} name="billingAddress" placeholder="123 Main Street, Melbourne VIC 3000" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input {...register("gstRegistered")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        Our business is registered for GST
      </label>
    </div>
  );
}

function Step14({ register, errors }: { register: UseFormRegister<FullForm>; errors: FieldErrors<FullForm> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Terms & Declaration</h2>
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        Please read and confirm each of the following declarations before submitting your registration.
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register("acceptingClients")} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          I am currently accepting new participants / clients
        </label>
        <CheckboxField register={register} name="privacyPolicyAccepted" label="I have read and accept the Shiftify Privacy Policy." errors={errors} />
        <CheckboxField register={register} name="confirmAuthorityToRegister" label="I confirm I have authority to register this business on Shiftify." errors={errors} />
        <CheckboxField register={register} name="confirmDetailsAccurate" label="I confirm all information provided in this registration is accurate and complete." errors={errors} />
        <CheckboxField register={register} name="consentToVerification" label="I consent to Shiftify verifying the information provided with relevant authorities." errors={errors} />
        <CheckboxField register={register} name="consentToParticipantLinkingControls" label="I consent to the platform's participant linking controls and privacy protections." errors={errors} />
        <CheckboxField register={register} name="consentToInvoiceRoutingRules" label="I consent to invoice routing rules and automated processing procedures." errors={errors} />
        <CheckboxField register={register} name="termsAccepted" label="I accept the Shiftify Terms of Service." errors={errors} />
        <CheckboxField register={register} name="ndisCodeAccepted" label="I accept the NDIS Code of Conduct and commit to upholding its principles." errors={errors} />
      </div>
    </div>
  );
}

// ── Main wizard component ──────────────────────────────────────────────────────

export default function PlanManagerRegisterPage() {
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
      acceptsRecurringClaims: true,
      acceptsOnceOffClaims: true,
      linkApprovalRequired: true,
    },
  });

  const currentStepSchema = stepSchemas[step];

  const handleNext = async () => {
    // Get fields belonging to this step
    const stepFields = Object.keys(currentStepSchema.shape ?? {}) as (keyof FullForm)[];
    const valid = await trigger(stepFields);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const onSubmit = async (values: FullForm) => {
    setSubmitting(true);
    setServerError(null);
    try {
      // First ensure profile step is set
      await api.patch("/users/me/profile/plan-manager", {
        ...values,
        profileStep: TOTAL_STEPS,
      });
      router.push("/dashboard/plan-manager");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:  return <Step1 register={register} errors={errors} />;
      case 1:  return <Step2 register={register} errors={errors} watch={(n) => watch(n as keyof FullForm)} />;
      case 2:  return <Step3 register={register} errors={errors} watch={(n) => watch(n as keyof FullForm)} />;
      case 3:  return <Step4 register={register} errors={errors} />;
      case 4:  return <Step5 register={register} />;
      case 5:  return <Step6 register={register} errors={errors} watch={(n) => watch(n as keyof FullForm)} />;
      case 6:  return <Step7 register={register} errors={errors} />;
      case 7:  return <Step8 register={register} errors={errors} />;
      case 8:  return <Step9 register={register} />;
      case 9:  return <Step10 register={register} />;
      case 10: return <Step11 register={register} />;
      case 11: return <Step12 register={register} errors={errors} />;
      case 12: return <Step13 register={register} errors={errors} />;
      case 13: return <Step14 register={register} errors={errors} />;
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
          Your progress is saved automatically. You can return to complete your registration later.
        </p>
      </div>
    </div>
  );
}
