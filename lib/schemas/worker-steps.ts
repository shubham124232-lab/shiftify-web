// Per-step Zod schemas for Support Worker profile wizard.
// Only the current step is validated before advancing.

import { z } from 'zod';

// Step 1 — Location & Identity
export const workerStep1Schema = z.object({
  // Suburb comes from User.defaultSuburb — saved via PATCH /users/me
  suburb:     z.string().min(2, 'Suburb is required'),
  state:      z.string().min(2, 'State is required'),
  dob:        z.string().optional(),
  gender:     z.string().optional(),
  // Profile photo is handled separately via file upload — not a form field
});

// Step 2 — Right to Work
export const workerStep2Schema = z.object({
  rightToWork: z.enum(['CITIZEN', 'PR', 'VISA_HOLDER'], { required_error: 'Right to work is required' }),
  visaType:   z.string().optional(),
  visaExpiry: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.rightToWork === 'VISA_HOLDER') {
    if (!val.visaType) ctx.addIssue({ code: 'custom', path: ['visaType'],   message: 'Visa type is required for visa holders' });
    if (!val.visaExpiry) ctx.addIssue({ code: 'custom', path: ['visaExpiry'], message: 'Visa expiry is required for visa holders' });
  }
});

// Step 3 — Work Type & Insurance
export const workerStep3Schema = z.object({
  workType:                  z.enum(['CONTRACTOR', 'AGENCY'], { required_error: 'Employment type is required' }),
  abn:                       z.string().optional(),
  gstRegistered:             z.boolean().optional(),
  publicLiabilityInsurance:  z.boolean().optional(),
  personalAccidentInsurance: z.boolean().optional(),
}).superRefine((val, ctx) => {
  if (val.workType === 'CONTRACTOR' && !val.abn) {
    ctx.addIssue({ code: 'custom', path: ['abn'], message: 'ABN is required for contractors' });
  }
});

// Step 4 — Services & Skills
export const workerStep4Schema = z.object({
  servicesOffered:      z.array(z.string()).min(1, 'Select at least one service'),
  subServices:          z.array(z.string()).optional(),
  highIntensitySkills:  z.array(z.string()).optional(),
  experienceLevel:      z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'], {
    required_error: 'Experience level is required',
  }),
  disabilityExperience: z.array(z.string()).optional(),
});

// Step 5 — Availability
export const workerStep5Schema = z.object({
  availabilityType:      z.enum(['CASUAL', 'PART_TIME', 'FULL_TIME', 'ON_DEMAND'], {
    required_error: 'Availability type is required',
  }),
  emergencyAvailability: z.boolean().optional(),
  availability:          z.array(z.object({
    dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime:   z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1, 'Add at least one availability slot'),
});

// Step 6 — Service Areas & Travel
export const workerStep6Schema = z.object({
  serviceAreas:  z.array(z.string()).min(1, 'Add at least one service area'),
  travelRadiusKm: z.number().int().min(0).max(500).optional(),
  hasVehicle:    z.boolean().optional(),
  vehicleDetails: z.object({
    make:   z.string().optional(),
    model:  z.string().optional(),
    year:   z.number().int().optional(),
    rego:   z.string().optional(),
    colour: z.string().optional(),
  }).optional(),
}).superRefine((val, ctx) => {
  if (val.hasVehicle && !val.vehicleDetails?.rego) {
    ctx.addIssue({ code: 'custom', path: ['vehicleDetails', 'rego'], message: 'Vehicle registration is required' });
  }
});

// Step 7 — Financials, Bio & Preferences
export const workerStep7Schema = z.object({
  hourlyRate:   z.number({ required_error: 'Hourly rate is required' }).min(1).max(9999),
  bio:          z.string().max(2000).optional(),
  preferences:  z.string().max(1000).optional(),
  isAvailableNow: z.boolean().optional(),
  seekingPlanManager: z.boolean().optional(),
});

// Step 8 — Document Uploads (validation is presence-based, done in component)
export const workerStep8Schema = z.object({
  // These fields just confirm the user has acknowledged the requirement
  docsAcknowledged: z.boolean().optional(),
});

// Step 9 — References & Compliance
export const workerStep9Schema = z.object({
  references: z.array(z.object({
    name:         z.string().min(1, 'Name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone:        z.string().optional(),
    email:        z.string().email().optional().or(z.literal('')),
  })).optional(),
  termsAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted: z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
});

// ─── Union type for all worker step data ─────────────────────────────────────

export type WorkerStep1 = z.infer<typeof workerStep1Schema>;
export type WorkerStep2 = z.infer<typeof workerStep2Schema>;
export type WorkerStep3 = z.infer<typeof workerStep3Schema>;
export type WorkerStep4 = z.infer<typeof workerStep4Schema>;
export type WorkerStep5 = z.infer<typeof workerStep5Schema>;
export type WorkerStep6 = z.infer<typeof workerStep6Schema>;
export type WorkerStep7 = z.infer<typeof workerStep7Schema>;
export type WorkerStep8 = z.infer<typeof workerStep8Schema>;
export type WorkerStep9 = z.infer<typeof workerStep9Schema>;
