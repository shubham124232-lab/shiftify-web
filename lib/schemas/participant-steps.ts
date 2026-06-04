// Per-step Zod schemas for Participant profile wizard (5 steps).

import { z } from 'zod';

export const participantStep1Schema = z.object({
  preferredName: z.string().optional(),
  ageGroup:      z.string().optional(),
  gender:        z.string().optional(),
});

export const participantStep2Schema = z.object({
  ndisNumber:            z.string().optional(),
  fundingManagementType: z.enum(['SELF', 'PLAN', 'NDIA'], { required_error: 'Funding type is required' }),
});

export const participantStep3Schema = z.object({
  primaryDisability:       z.string().optional(),
  mobilitySupportNeeds:    z.array(z.string()).optional(),
  communicationNeeds:      z.array(z.string()).optional(),
  behaviourSensoryNotes:   z.array(z.string()).optional(),
  medicalConsiderations:   z.array(z.string()).optional(),
  riskSafetyNotes:         z.string().max(2000).optional(),
  supportPreferences:      z.array(z.string()).optional(),
});

export const participantStep4Schema = z.object({
  emergencyContactName:         z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone:        z.string().min(8, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required'),
  seekingPlanManager:           z.boolean().optional(),
});

// Step 5: Optional document uploads + T&C
export const participantStep5Schema = z.object({
  termsAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
});

export type ParticipantStep1 = z.infer<typeof participantStep1Schema>;
export type ParticipantStep2 = z.infer<typeof participantStep2Schema>;
export type ParticipantStep3 = z.infer<typeof participantStep3Schema>;
export type ParticipantStep4 = z.infer<typeof participantStep4Schema>;
export type ParticipantStep5 = z.infer<typeof participantStep5Schema>;
