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
});

export const providerStep3Schema = z.object({
  primaryContactName:  z.string().min(1, 'Primary contact name is required'),
  primaryContactRole:  z.string().optional(),
  primaryContactPhone: z.string().min(8, 'Phone is required'),
  primaryContactEmail: z.string().email('Valid email required'),
});

export const providerStep4Schema = z.object({
  accountsContactName:  z.string().optional(),
  accountsContactEmail: z.string().email('Valid email required').optional().or(z.literal('')),
});

// Step 5: Logo upload — handled via file upload, schema is a pass-through
export const providerStep5Schema = z.object({
  logoUploaded: z.boolean().optional(),
});

export const providerStep6Schema = z.object({
  coreServices: z.array(z.string()).min(1, 'Select at least one service'),
  offersSil:    z.boolean().optional(),
  silDetails:   z.record(z.unknown()).optional(),
  offersSda:    z.boolean().optional(),
  sdaDetails:   z.record(z.unknown()).optional(),
});

export const providerStep7Schema = z.object({
  serviceAreas: z.array(z.string()).min(1, 'Add at least one service area'),
  serviceMode:  z.enum(['IN_PERSON', 'REMOTE', 'BOTH'], { required_error: 'Service mode is required' }),
});

export const providerStep8Schema = z.object({
  workforceSize:    z.string().optional(),
  participantTypes: z.array(z.string()).optional(),
});

export const providerStep9Schema = z.object({
  pricingModel:  z.string().optional(),
  billingMethod: z.string().optional(),
});

export const providerStep10Schema = z.object({
  businessDescription: z.string().max(3000).optional(),
  websiteUrl:          z.string().url().optional().or(z.literal('')),
});

// Step 11: Document uploads — presence-based, handled in component
export const providerStep11Schema = z.object({
  docsAcknowledged: z.boolean().optional(),
});

// Step 12: Compliance declaration
export const providerStep12Schema = z.object({
  termsAccepted:    z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
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
