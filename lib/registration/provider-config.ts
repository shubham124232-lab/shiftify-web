import type { StepConfig } from './types';
import {
  providerStep1Schema,  providerStep2Schema,  providerStep3Schema,
  providerStep4Schema,  providerStep5Schema,  providerStep6Schema,
  providerStep7Schema,  providerStep8Schema,  providerStep9Schema,
  providerStep10Schema, providerStep11Schema, providerStep12Schema,
} from '@/lib/schemas/provider-steps';

export const PROVIDER_STEPS: StepConfig[] = [
  { index:  0, title: 'Business Identity',      description: 'Business name, ABN, NDIS registration and structure',          icon: 'bi-building-fill',          schema: providerStep1Schema  },
  { index:  1, title: 'Key Contacts',           description: 'Primary, billing and secondary contacts',                      icon: 'bi-person-lines-fill',      schema: providerStep2Schema  },
  { index:  2, title: 'Compliance & Legal',     description: 'Insurance policies, NDIS audit status and document uploads',   icon: 'bi-shield-fill-check',      schema: providerStep3Schema  },
  { index:  3, title: 'Services Offered',       description: 'Core services, SIL and SDA accommodation',                    icon: 'bi-list-check',             schema: providerStep4Schema  },
  { index:  4, title: 'Service Coverage',       description: 'Service areas, branch locations and delivery mode',            icon: 'bi-map-fill',               schema: providerStep5Schema  },
  { index:  5, title: 'Workforce Capability',   description: 'Team size, staff skills and hiring model',                    icon: 'bi-people-fill',            schema: providerStep6Schema  },
  { index:  6, title: 'Capacity & Availability', description: 'Current capacity status and live availability posting',      icon: 'bi-calendar-check-fill',    schema: providerStep7Schema  },
  { index:  7, title: 'Participant Handling',   description: 'Participant types and complexity levels accepted',             icon: 'bi-heart-pulse-fill',       schema: providerStep8Schema  },
  { index:  8, title: 'Pricing & Billing',      description: 'Pricing model, travel charges and billing method',            icon: 'bi-cash-stack',             schema: providerStep9Schema  },
  { index:  9, title: 'Platform Features',      description: 'Choose which marketplace features to enable',                 icon: 'bi-grid-fill',              schema: providerStep10Schema },
  { index: 10, title: 'Profile & Branding',     description: 'Business description, logo, website and social links',        icon: 'bi-info-circle-fill',       schema: providerStep11Schema },
  { index: 11, title: 'Agreements',             description: 'Terms, privacy policy and NDIS code of conduct',              icon: 'bi-patch-check-fill',       schema: providerStep12Schema, isFinal: true },
];
