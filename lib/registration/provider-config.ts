import type { StepConfig } from './types';
import {
  providerStep1Schema,  providerStep2Schema,  providerStep3Schema,
  providerStep4Schema,  providerStep5Schema,  providerStep6Schema,
  providerStep7Schema,  providerStep8Schema,  providerStep9Schema,
  providerStep10Schema, providerStep11Schema, providerStep12Schema,
} from '@/lib/schemas/provider-steps';

export const PROVIDER_STEPS: StepConfig[] = [
  { index:  0, title: 'Business Identity',     description: 'Business name, legal entity and structure',                  icon: 'bi-building-fill',           schema: providerStep1Schema  },
  { index:  1, title: 'ABN & NDIS',            description: 'ABN, GST registration and NDIS provider details',             icon: 'bi-file-earmark-text-fill',  schema: providerStep2Schema  },
  { index:  2, title: 'Primary Contact',       description: 'Main point of contact for bookings and enquiries',            icon: 'bi-person-lines-fill',       schema: providerStep3Schema  },
  { index:  3, title: 'Accounts Contact',      description: 'Finance or billing contact details',                         icon: 'bi-envelope-fill',           schema: providerStep4Schema  },
  { index:  4, title: 'Logo Upload',           description: 'Upload your organisation logo',                              icon: 'bi-image-fill',              schema: providerStep5Schema  },
  { index:  5, title: 'Services & SIL/SDA',    description: 'Core services you offer including SIL and SDA',              icon: 'bi-list-check',              schema: providerStep6Schema  },
  { index:  6, title: 'Service Areas',         description: 'Where you operate and how you deliver services',             icon: 'bi-map-fill',                schema: providerStep7Schema  },
  { index:  7, title: 'Workforce & Clients',   description: 'Team size and the types of participants you support',        icon: 'bi-people-fill',             schema: providerStep8Schema  },
  { index:  8, title: 'Pricing & Billing',     description: 'Your pricing model and preferred billing method',            icon: 'bi-cash-stack',              schema: providerStep9Schema  },
  { index:  9, title: 'About Your Business',   description: 'Business description and website',                          icon: 'bi-info-circle-fill',        schema: providerStep10Schema },
  { index: 10, title: 'Compliance Documents',  description: 'Upload provider registration, insurance and certifications', icon: 'bi-shield-fill-check',       schema: providerStep11Schema },
  { index: 11, title: 'Declaration',           description: 'Agree to platform terms and NDIS code of conduct',          icon: 'bi-patch-check-fill',        schema: providerStep12Schema, isFinal: true },
];
