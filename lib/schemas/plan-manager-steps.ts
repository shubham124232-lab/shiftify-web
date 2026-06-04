// Per-step Zod schemas for Plan Manager profile wizard (2 steps).

import { z } from 'zod';

export const pmStep1Schema = z.object({
  businessName:       z.string().min(2, 'Business name is required'),
  abn:                z.string().optional(),
  ndisRegistered:     z.boolean().optional(),
  ndisProviderNumber: z.string().optional(),
  yearsInOperation:   z.string().optional(),
  serviceAreas:       z.array(z.string()).min(1, 'Add at least one service area'),
});

export const pmStep2Schema = z.object({
  acceptingClients:  z.boolean(),
  termsAccepted:     z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted:  z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
});

export type PmStep1 = z.infer<typeof pmStep1Schema>;
export type PmStep2 = z.infer<typeof pmStep2Schema>;
