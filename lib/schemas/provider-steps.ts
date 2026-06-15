// Per-step Zod schemas for Provider profile wizard (12 steps).

import { z } from 'zod';

export const providerStep1Schema = z.object({
  businessName:      z.string().min(2, 'Business name is required'),
  legalEntityName:   z.string().optional(),
  businessStructure: z.string().optional(),
  yearsInOperation:  z.string().optional(),
});

export const providerStep2Schema = z.object({
  abn:                z.string().min(11, 'ABN must be 11 digits').max(20),
  gstRegistered:      z.boolean().optional(),
  ndisRegistered:     z.boolean().optional(),
  ndisProviderNumber: z.string().optional(),
  ndisAuditStatus:    z.string().optional(),
});

export const providerStep3Schema = z.object({
  primaryContactName:  z.string().min(1, 'Primary contact name is required'),
  primaryContactRole:  z.string().optional(),
  primaryContactPhone: z.string().min(8, 'Phone is required'),
  primaryContactEmail: z.string().email('Valid email required'),
});

export const providerStep4Schema = z.object({
  secondaryContactName:  z.string().optional(),
  secondaryContactRole:  z.string().optional(),
  secondaryContactPhone: z.string().optional(),
  secondaryContactEmail: z.string().email().optional().or(z.literal('')),
  accountsContactName:   z.string().optional(),
  accountsContactEmail:  z.string().email().optional().or(z.literal('')),
});

export const providerStep5Schema = z.object({
  logoUploaded: z.boolean().optional(),
});

export const providerStep6Schema = z.object({
  coreServices:         z.array(z.string()).min(1, 'Select at least one service'),
  offersSil:            z.boolean().optional(),
  silType:              z.string().optional(),
  silSupportLevel:      z.string().optional(),
  silCurrentVacancies:  z.boolean().optional(),
  silDetails:           z.record(z.unknown()).optional(),
  offersSda:            z.boolean().optional(),
  sdaDesignCategory:    z.array(z.string()).optional(),
  sdaVacancyCount:      z.number().int().min(0).optional(),
  sdaLocations:         z.array(z.string()).optional(),
  sdaDetails:           z.record(z.unknown()).optional(),
});

export const providerStep7Schema = z.object({
  serviceAreas:      z.array(z.string()).min(1, 'Add at least one service area'),
  serviceMode:       z.enum(['IN_PERSON', 'REMOTE', 'BOTH'], { required_error: 'Service mode is required' }),
  multipleLocations: z.array(z.string()).optional(),
});

export const providerStep8Schema = z.object({
  workforceSize:                  z.string().optional(),
  staffCapability:                z.array(z.string()).optional(),
  abilityToFillUrgentShifts:      z.boolean().optional(),
  workforceHiringType:            z.string().optional(),
  participantTypes:               z.array(z.string()).optional(),
  currentCapacityStatus:          z.string().optional(),
  abilityToPostLiveAvailability:  z.boolean().optional(),
  participantComplexityAccepted:  z.array(z.string()).optional(),
});

export const providerStep9Schema = z.object({
  pricingModel:       z.string().optional(),
  billingMethod:      z.string().optional(),
  travelCharges:      z.string().optional(),
  cancellationPolicy: z.string().max(1000).optional(),
});

export const providerStep10Schema = z.object({
  businessDescription:      z.string().max(3000).optional(),
  websiteUrl:               z.string().url().optional().or(z.literal('')),
  socialLinks:              z.object({
    facebook:  z.string().optional(),
    instagram: z.string().optional(),
    linkedin:  z.string().optional(),
  }).optional(),
  seekingPlanManager:       z.boolean().optional(),
  canPostRequests:          z.boolean().optional(),
  canViewWorkerMarketplace: z.boolean().optional(),
  canPostWorkerRequirements: z.boolean().optional(),
  canPostSilSdaVacancies:   z.boolean().optional(),
});

export const providerStep11Schema = z.object({
  publicLiabilityPolicyNumber:       z.string().optional(),
  publicLiabilityCoverageAmount:     z.string().optional(),
  professionalIndemnityPolicyNumber: z.string().optional(),
  workersCompPolicyNumber:           z.string().optional(),
  docsAcknowledged:                  z.boolean().optional(),
});

export const providerStep12Schema = z.object({
  termsAccepted:         z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted:      z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
  privacyPolicyAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the Privacy Policy' }),
  serviceAgreementAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the Service Agreement' }),
  platformRulesAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the Platform Rules' }),
  complianceDeclaration: z.boolean().refine(v => v === true, { message: 'You must confirm the compliance declaration' }),
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
