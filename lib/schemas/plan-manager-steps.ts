// Per-step Zod schemas for Plan Manager profile wizard (14 steps).

import { z } from 'zod';

// Step 1 — Business Identity
export const pmStep1Schema = z.object({
  businessName:        z.string().min(2, 'Business name is required'),
  legalEntityName:     z.string().optional(),
  abn:                 z.string().optional(),
  businessStructure:   z.string().optional(),
  businessAddress:     z.string().optional(),
  businessSuburb:      z.string().optional(),
  businessPostcode:    z.string().optional(),
  businessState:       z.string().optional(),
  businessPhone:       z.string().optional(),
  businessEmail:       z.string().email().optional().or(z.literal('')),
  websiteUrl:          z.string().optional(),
  acn:                 z.string().optional(),
  trustName:           z.string().optional(),
  directorName:        z.string().optional(),
  directorPosition:    z.string().optional(),
  financeTeamEmail:    z.string().email().optional().or(z.literal('')),
  accountsPayablePhone: z.string().optional(),
  yearsInOperation:    z.string().optional(),
});

// Step 2 — NDIS Registration Status
export const pmStep2Schema = z.object({
  ndisRegistrationStatus:      z.string().optional(),
  ndisProviderNumber:          z.string().optional(),
  registrationExpiryDate:      z.string().optional(),
  approvedRegistrationGroups:  z.array(z.string()).optional(),
});

// Step 3 — Plan Management Capability
export const pmStep3Schema = z.object({
  servicesProvided:         z.array(z.string()).optional(),
  plansRecurringInvoices:   z.boolean().optional(),
  plansOnceOffInvoices:     z.boolean().optional(),
  providesBudgetStatements: z.boolean().optional(),
});

// Step 4 — Participant Scope
export const pmStep4Schema = z.object({
  participantTypesSupported:       z.array(z.string()).optional(),
  participantComplexityExperience: z.array(z.string()).optional(),
});

// Step 5 — Service Coverage
export const pmStep5Schema = z.object({
  serviceCoverageType:  z.string().optional(),
  serviceAreas:         z.array(z.string()).min(1, 'Add at least one service area'),
  stateCoverage:        z.array(z.string()).optional(),
  postcodesServed:      z.array(z.string()).optional(),
  timezone:             z.string().optional(),
  operatingHours:       z.string().optional(),
  invoiceTurnaroundTime: z.string().optional(),
});

// Step 6 — Payment Operations
export const pmStep6Schema = z.object({
  invoiceIntakeMethod:              z.array(z.string()).optional(),
  primaryInvoiceContactEmail:       z.string().email().optional().or(z.literal('')),
  accountsContactName:              z.string().optional(),
  paymentEnquiryContactName:       z.string().optional(),
  paymentEnquiryContactEmail:       z.string().email().optional().or(z.literal('')),
  paymentEnquiryContactPhone:       z.string().optional(),
  invoiceReferenceFormat:            z.string().optional(),
  acceptsRegisteredProvidersOnly:   z.boolean().optional(),
  requiresServiceDatesOnInvoices:   z.boolean().optional(),
  requiresSupportCategoryCode:      z.boolean().optional(),
});

// Step 7 — Compliance & Governance
export const pmStep7Schema = z.object({
  recordKeepingDeclaration:       z.boolean().optional(),
  conflictOfInterestDeclaration:  z.boolean().optional(),
  noMisuseOfFundsDeclaration:     z.boolean().optional(),
  taxComplianceDeclaration:       z.boolean().optional(),
  informationAccurateDeclaration: z.boolean().optional(),
  complaintsContactName:          z.string().optional(),
  complaintsContactEmail:         z.string().email().optional().or(z.literal('')),
  incidentEscalationContact:      z.string().optional(),
  privacyContact:                 z.string().optional(),
  recordsRetentionContact:        z.string().optional(),
});

// Step 8 — Staff / User Model
export const pmStep8Schema = z.object({
  organisationUserModel: z.string().optional(),
  staffAdminName:        z.string().optional(),
  staffAdminEmail:       z.string().email().optional().or(z.literal('')),
  staffSeatsRequired:    z.number().int().min(1).optional(),
});

// Step 9 — Participant Linking
export const pmStep9Schema = z.object({
  participantLinkingMethod:                z.array(z.string()).optional(),
  linkApprovalRequired:                    z.boolean().optional(),
  requiresServiceAgreementBeforeInvoicing: z.boolean().optional(),
});

// Step 10 — Provider Interaction
export const pmStep10Schema = z.object({
  invoiceAcceptanceRules:       z.array(z.string()).optional(),
  acceptsRecurringClaims:       z.boolean().optional(),
  acceptsOnceOffClaims:         z.boolean().optional(),
  allowsProviderPortalMessaging: z.boolean().optional(),
});

// Step 11 — Documents
export const pmStep11Schema = z.object({
  docsAcknowledged: z.boolean().optional(),
});

// Step 12 — Communication Preferences
export const pmStep12Schema = z.object({
  invoiceNotificationEmail:            z.string().email().optional().or(z.literal('')),
  complianceNoticesEmail:              z.string().email().optional().or(z.literal('')),
  smsAlertsEnabled:                    z.boolean().optional(),
  escalationContactForFailedPayments:  z.string().optional(),
});

// Step 13 — Commercial Setup
export const pmStep13Schema = z.object({
  subscriptionPlan:    z.string().optional(),
  billingContactName:  z.string().optional(),
  billingContactEmail: z.string().email().optional().or(z.literal('')),
  billingAddress:      z.string().optional(),
  gstRegistered:       z.boolean().optional(),
});

// Step 14 — Terms & Declaration (final)
export const pmStep14Schema = z.object({
  acceptingClients:                   z.boolean().optional(),
  termsAccepted:                      z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions' }),
  ndisCodeAccepted:                   z.boolean().refine(v => v === true, { message: 'You must accept the NDIS Code of Conduct' }),
  privacyPolicyAccepted:              z.boolean().refine(v => v === true, { message: 'You must accept the Privacy Policy' }),
  confirmAuthorityToRegister:         z.boolean().refine(v => v === true, { message: 'You must confirm authority to register' }),
  confirmDetailsAccurate:              z.boolean().refine(v => v === true, { message: 'You must confirm details are accurate' }),
  consentToVerification:              z.boolean().refine(v => v === true, { message: 'You must consent to verification' }),
  consentToParticipantLinkingControls: z.boolean().refine(v => v === true, { message: 'You must consent to participant linking controls' }),
  consentToInvoiceRoutingRules:       z.boolean().refine(v => v === true, { message: 'You must consent to invoice routing rules' }),
});

export type PmStep1  = z.infer<typeof pmStep1Schema>;
export type PmStep2  = z.infer<typeof pmStep2Schema>;
export type PmStep3  = z.infer<typeof pmStep3Schema>;
export type PmStep4  = z.infer<typeof pmStep4Schema>;
export type PmStep5  = z.infer<typeof pmStep5Schema>;
export type PmStep6  = z.infer<typeof pmStep6Schema>;
export type PmStep7  = z.infer<typeof pmStep7Schema>;
export type PmStep8  = z.infer<typeof pmStep8Schema>;
export type PmStep9  = z.infer<typeof pmStep9Schema>;
export type PmStep10 = z.infer<typeof pmStep10Schema>;
export type PmStep11 = z.infer<typeof pmStep11Schema>;
export type PmStep12 = z.infer<typeof pmStep12Schema>;
export type PmStep13 = z.infer<typeof pmStep13Schema>;
export type PmStep14 = z.infer<typeof pmStep14Schema>;
