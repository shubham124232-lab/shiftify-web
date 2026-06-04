// Per-step Zod schemas for Support Coordinator profile wizard (9 steps).

import { z } from 'zod';

export const coordStep1Schema = z.object({
  roleType:         z.enum(['INDEPENDENT', 'AGENCY_EMPLOYED'], { required_error: 'Role type is required' }),
  organisationName: z.string().optional(),
  abn:              z.string().optional(),
});

export const coordStep2Schema = z.object({
  ndisRegistered:     z.boolean().optional(),
  ndisProviderNumber: z.string().optional(),
});

export const coordStep3Schema = z.object({
  yearsExperience:                   z.string().min(1, 'Years of experience is required'),
  supportCoordinationLevel:          z.array(z.string()).min(1, 'Select at least one level'),
  participantComplexityExperience:   z.array(z.string()).optional(),
  servicesOfferedBeyondCoordination: z.array(z.string()).optional(),
});

export const coordStep4Schema = z.object({
  serviceAreas: z.array(z.string()).min(1, 'Add at least one service area'),
  serviceMode:  z.enum(['IN_PERSON', 'REMOTE', 'BOTH'], { required_error: 'Service mode is required' }),
  languages:    z.array(z.string()).optional(),
});

export const coordStep5Schema = z.object({
  currentCapacityStatus:    z.string().optional(),
  maxParticipantLoad:       z.number().int().min(0).max(500).optional(),
  participantTypesAccepted: z.array(z.string()).optional(),
  fundingTypeCompatibility: z.array(z.string()).optional(),
});

export const coordStep6Schema = z.object({
  billingMethodPreference: z.string().optional(),
  hourlyRate:              z.number().min(0).max(9999).optional(),
});

export const coordStep7Schema = z.object({
  bio:                 z.string().max(2000).optional(),
  seekingPlanManager:  z.boolean().optional(),
});

// Step 8: Document uploads — presence-based, handled in component
export const coordStep8Schema = z.object({
  docsAcknowledged: z.boolean().optional(),
});

// Step 9: Compliance declaration
export const coordStep9Schema = z.object({
  termsAccepted:    z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
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
