// Per-step Zod schemas for Provider profile wizard — 12 spec-aligned steps.

import { z } from 'zod';

// Step 1 — Business Identity (merged: name + ABN + structure + NDIS + GST + years)
export const providerStep1Schema = z.object({
  businessName:       z.string().min(2, 'Business name is required'),
  legalEntityName:    z.string().optional(),
  businessStructure:  z.string().optional(),
  yearsInOperation:   z.string().optional(),
  abn:                z.string().min(11, 'ABN must be 11 digits').max(20),
  gstRegistered:      z.boolean().optional(),
  ndisRegistered:     z.boolean().optional(),
  ndisProviderNumber: z.string().optional(),
  abnConfirmed:       z.boolean().optional(),
});

// Step 2 — Key Contacts (primary + secondary + billing in one step)
export const providerStep2Schema = z.object({
  primaryContactName:    z.string().min(1, 'Primary contact name is required'),
  primaryContactRole:    z.string().optional(),
  primaryContactPhone:   z.string().min(8, 'Phone is required'),
  primaryContactEmail:   z.string().email('Valid email required'),
  secondaryContactName:  z.string().optional(),
  secondaryContactRole:  z.string().optional(),
  secondaryContactPhone: z.string().optional(),
  secondaryContactEmail: z.string().email().optional().or(z.literal('')),
  accountsContactName:   z.string().optional(),
  accountsContactEmail:  z.string().email().optional().or(z.literal('')),
});

// Step 3 — Compliance & Legal
export const providerStep3Schema = z.object({
  publicLiabilityPolicyNumber:       z.string().optional(),
  publicLiabilityCoverageAmount:     z.string().optional(),
  publicLiabilityExpiryDate:         z.string().optional(),
  professionalIndemnityPolicyNumber: z.string().optional(),
  professionalIndemnityExpiryDate:   z.string().optional(),
  workersCompPolicyNumber:           z.string().optional(),
  workersCompExpiryDate:             z.string().optional(),
  ndisAuditStatus:                   z.string().optional(),
  complianceDeclaration:             z.boolean().optional(),
});

// Step 4 — Services Offered
export const providerStep4Schema = z.object({
  coreServices:        z.array(z.string()).min(1, 'Select at least one service'),
  offersSil:           z.boolean().optional(),
  silType:             z.string().optional(),
  silSupportLevel:     z.string().optional(),
  silCurrentVacancies: z.boolean().optional(),
  offersSda:           z.boolean().optional(),
  sdaDesignCategory:   z.array(z.string()).optional(),
  sdaVacancyCount:     z.number().int().min(0).optional(),
  sdaLocations:        z.array(z.string()).optional(),
});

// Step 5 — Service Coverage
export const providerStep5Schema = z.object({
  serviceAreas:      z.array(z.string()).min(1, 'Add at least one service area'),
  serviceMode:       z.enum(['IN_PERSON', 'REMOTE', 'BOTH'], { required_error: 'Service mode is required' }),
  multipleLocations: z.array(z.string()).optional(),
});

// Step 6 — Workforce Capability
export const providerStep6Schema = z.object({
  workforceSize:             z.string().optional(),
  staffCapability:           z.array(z.string()).optional(),
  abilityToFillUrgentShifts: z.boolean().optional(),
  workforceHiringType:       z.string().optional(),
});

// Step 7 — Capacity & Availability
export const providerStep7Schema = z.object({
  currentCapacityStatus:         z.string().optional(),
  abilityToPostLiveAvailability: z.boolean().optional(),
});

// Step 8 — Participant Handling
export const providerStep8Schema = z.object({
  participantTypes:              z.array(z.string()).optional(),
  participantComplexityAccepted: z.array(z.string()).optional(),
});

// Step 9 — Pricing & Billing
export const providerStep9Schema = z.object({
  pricingModel:       z.string().optional(),
  billingMethod:      z.string().optional(),
  travelCharges:      z.string().optional(),
  cancellationPolicy: z.string().max(1000).optional(),
});

// Step 10 — Platform Features
export const providerStep10Schema = z.object({
  canPostRequests:           z.boolean().optional(),
  canViewWorkerMarketplace:  z.boolean().optional(),
  canPostWorkerRequirements: z.boolean().optional(),
  canPostSilSdaVacancies:    z.boolean().optional(),
  seekingPlanManager:        z.boolean().optional(),
});

// Step 11 — Profile & Branding
export const providerStep11Schema = z.object({
  businessDescription: z.string().max(3000).optional(),
  websiteUrl:          z.string().url().optional().or(z.literal('')),
  socialLinks: z.object({
    facebook:  z.string().optional(),
    instagram: z.string().optional(),
    linkedin:  z.string().optional(),
  }).optional(),
});

// Step 12 — Agreements & Controls
export const providerStep12Schema = z.object({
  termsAccepted:            z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted:         z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
  privacyPolicyAccepted:    z.boolean().refine(v => v === true, { message: 'You must accept the Privacy Policy' }),
  serviceAgreementAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the Service Agreement' }),
  platformRulesAccepted:    z.boolean().refine(v => v === true, { message: 'You must accept the Platform Rules' }),
});

export type ProviderStep1  = z.infer<typeof providerStep1Schema>;
export type ProviderStep2  = z.infer<typeof providerStep2Schema>;
export type ProviderStep3  = z.infer<typeof providerStep3Schema>;
export type ProviderStep4  = z.infer<typeof providerStep4Schema>;
export type ProviderStep5  = z.infer<typeof providerStep5Schema>;
export type ProviderStep6  = z.infer<typeof providerStep6Schema>;
export type ProviderStep7  = z.infer<typeof providerStep7Schema>;
export type ProviderStep8  = z.infer<typeof providerStep8Schema>;
export type ProviderStep9  = z.infer<typeof providerStep9Schema>;
export type ProviderStep10 = z.infer<typeof providerStep10Schema>;
export type ProviderStep11 = z.infer<typeof providerStep11Schema>;
export type ProviderStep12 = z.infer<typeof providerStep12Schema>;
