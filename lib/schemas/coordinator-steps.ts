// Per-step Zod schemas for Support Coordinator profile wizard (9 steps).

import { z } from 'zod';

// Step 1 — Professional Identity
export const coordStep1Schema = z.object({
  roleType:           z.enum(['INDEPENDENT', 'AGENCY_EMPLOYED'], { required_error: 'Role type is required' }),
  organisationName:   z.string().optional(),
  abn:                z.string().optional(),
  ndisRegistered:     z.preprocess(v => v === 'true' ? true : v === 'false' ? false : v, z.boolean().optional()),
  ndisProviderNumber: z.string().optional(),
  yearsExperience:    z.string().min(1, 'Years of experience is required'),
}).superRefine((val, ctx) => {
  if (val.roleType === 'AGENCY_EMPLOYED' && !val.organisationName) {
    ctx.addIssue({ code: 'custom', path: ['organisationName'], message: 'Organisation name is required for agency coordinators' });
  }
});

// Step 2 — Qualification & Compliance
export const coordStep2Schema = z.object({
  qualifications:                   z.array(z.any()).optional(),
  policeCheckExpiry:                z.string().optional(),
  wwccNumber:                       z.string().optional(),
  wwccExpiry:                       z.string().optional(),
  ndisScreeningNumber:              z.string().optional(),
  ndisScreeningExpiry:              z.string().optional(),
  professionalIndemnityProviderName: z.string().optional(),
  professionalIndemnityPolicyNumber: z.string().optional(),
  professionalIndemnityExpiry:      z.string().optional(),
  publicLiabilityPolicyNumber:      z.string().optional(),
  publicLiabilityExpiry:            z.string().optional(),
});

// Step 3 — Service Capability
export const coordStep3Schema = z.object({
  supportCoordinationLevel:          z.array(z.string()).min(1, 'Select at least one level'),
  participantComplexityExperience:   z.array(z.string()).optional(),
  servicesOfferedBeyondCoordination: z.array(z.string()).optional(),
});

// Step 4 — Service Coverage
export const coordStep4Schema = z.object({
  serviceAreas:  z.array(z.string()).min(1, 'Add at least one service area'),
  serviceMode:   z.enum(['IN_PERSON', 'REMOTE', 'BOTH'], { required_error: 'Service mode is required' }),
});

// Step 5 — Availability & Capacity
export const coordStep5Schema = z.object({
  currentCapacityStatus: z.string().optional(),
  maxParticipantLoad:    z.number().int().min(0).max(500).optional(),
  availabilityType:      z.string().optional(),
});

// Step 6 — Plan Management Handling
export const coordStep6Schema = z.object({
  participantTypesAccepted: z.array(z.string()).optional(),
  fundingTypeCompatibility: z.array(z.string()).optional(),
  billingMethodPreference:  z.string().optional(),
});

// Step 7 — Rates & Commercials
export const coordStep7Schema = z.object({
  hourlyRate:    z.number().min(0).max(9999).optional(),
  travelCharges: z.string().optional(),
});

// Step 8 — Profile & Trust Layer
export const coordStep8Schema = z.object({
  bio:                z.string().max(2000).optional(),
  languages:          z.array(z.string()).optional(),
  gender:             z.string().optional(),
  profilePhoto:       z.string().optional(),
  seekingPlanManager: z.boolean().optional(),
});

// Step 9 — Platform Rules & Compliance
export const coordStep9Schema = z.object({
  termsAccepted:          z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  privacyPolicyAccepted:  z.boolean().refine(v => v === true, { message: 'You must accept the Privacy Policy' }),
  ndisCodeAccepted:       z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
  complianceDeclaration:  z.boolean().refine(v => v === true, { message: 'You must confirm the compliance declaration' }),
  consentForVerification: z.boolean().refine(v => v === true, { message: 'You must consent to document verification' }),
});

export type CoordStep1 = z.infer<typeof coordStep1Schema>;
export type CoordStep2 = z.infer<typeof coordStep2Schema>;
export type CoordStep3 = z.infer<typeof coordStep3Schema>;
export type CoordStep4 = z.infer<typeof coordStep4Schema>;
export type CoordStep5 = z.infer<typeof coordStep5Schema>;
export type CoordStep6 = z.infer<typeof coordStep6Schema>;
export type CoordStep7 = z.infer<typeof coordStep7Schema>;
export type CoordStep8 = z.infer<typeof coordStep8Schema>;
export type CoordStep9 = z.infer<typeof coordStep9Schema>;
